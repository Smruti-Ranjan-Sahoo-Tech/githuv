import crypto from "node:crypto";
import admin from "../../config/firebase/firebaseAdmin";
import {
    encryptSensitive,
    generateToken,
    generateVSCodeToken,
    verifyVSCodeToken,
} from "../../config/JWT/jwt.config";
import { User } from "../../models/user.model";
import { UserProfile } from "../../models/userProfile.model";

const githubApiHeaders = (accessToken: string) => ({
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
});

const VSCodeTokenExchangeTtlMs = 5 * 60 * 1000;
const VSCodeSessionTtlMs = 60 * 60 * 1000;
type PendingVSCodeToken = {
  token: string;
  expiresAt: number;
};
const pendingVSCodeTokens = new Map<string, PendingVSCodeToken>();
type VSCodeSession = {
    githubAccessToken: string;
    expiresAt: number;
};
const pendingVSCodeSessions = new Map<string, VSCodeSession>();

const createExchangeCode = () => crypto.randomBytes(24).toString("base64url");

const authCookieOptions = () => {
    const isProd = process.env.NODE_ENV === "production";
    return {
        httpOnly: true,
        sameSite: (isProd ? "none" : "lax") as "none" | "lax",
        secure: isProd,
        maxAge: 30 * 24 * 60 * 60 * 1000,
    };
};

const storePendingVSCodeToken = (token: string) => {
    const code = createExchangeCode();
    pendingVSCodeTokens.set(code, {
        token,
        expiresAt: Date.now() + VSCodeTokenExchangeTtlMs,
    });
    return code;
};

const storeVSCodeSession = (authToken: string, githubAccessToken: string) => {
    pendingVSCodeSessions.set(authToken, {
        githubAccessToken,
        expiresAt: Date.now() + VSCodeSessionTtlMs,
    });
};

const getVSCodeSession = (authToken: string) => {
    const session = pendingVSCodeSessions.get(authToken);
    if (!session) {
        return null;
    }
    if (session.expiresAt < Date.now()) {
        pendingVSCodeSessions.delete(authToken);
        return null;
    }
    return session.githubAccessToken;
};

const consumePendingVSCodeToken = (code: string) => {
    const entry = pendingVSCodeTokens.get(code);
    if (!entry) {
        return null;
    }

    pendingVSCodeTokens.delete(code);
    if (entry.expiresAt < Date.now()) {
        return null;
    }

    return entry.token;
};

export default class auth {
    static async login(req: any, res: any) {
        try {
            const { accessToken, githubAccessToken } = req.body;
            if (!accessToken || !githubAccessToken) {
                return res.status(400).json({ message: "Firebase access token and GitHub access token are required" });
            }
            const decodedToken = await admin
                .auth()
                .verifyIdToken(accessToken);

            const firebaseUID = decodedToken.uid;
            const response = await fetch("https://api.github.com/user", {
                headers: githubApiHeaders(githubAccessToken),
            });

            if (!response.ok) {
                return res.status(400).json({
                    message: "Failed to read GitHub profile",
                });
            }

            const githubUser: any = await response.json();
            const githubId = githubUser.id;
            const githubUsername = githubUser.login;

            const existingUser = await User.findOne({ firebaseUID });
            const user = existingUser ?? await User.create({
                firebaseUID,
                githubId,
                githubUsername,
                githubAccessToken: encryptSensitive(githubAccessToken),
            });

            if (existingUser) {
                existingUser.githubId = githubId;
                existingUser.githubUsername = githubUsername;
                existingUser.githubAccessToken = encryptSensitive(githubAccessToken);
                await existingUser.save();
            }
            await UserProfile.findOneAndUpdate(
                { firebaseUID },
                {
                    $set: { user: user._id },
                    $setOnInsert: {
                        firebaseUID,
                        currentStep: 1,
                        completedSteps: [],
                        onboardingCompleted: false,
                    },
                },
                {
                    upsert: true,
                    returnDocument: 'after',
                }
            );
            const token = generateToken({ githubUsername, githubId, firebaseUID })
            res.cookie("token", token, authCookieOptions());

            const profile = await UserProfile.findOne({ user: user._id });
            const safeUser = user.toObject ? user.toObject() : user;
            if (safeUser && typeof safeUser === "object") {
                delete safeUser.githubAccessToken;
            }

            res.status(200).json({
                message: "Login successful",
                user: safeUser,
                onboarding: profile,
            });

        } catch (error) {
            res.status(500).json({ message: "Login failed", error });
        }

    }

    static async session(req: any, res: any) {
        try {
            const { accessToken } = req.body;
            if (!accessToken) {
                return res.status(400).json({
                    message: "Firebase access token is required",
                });
            }

            const decodedToken = await admin.auth().verifyIdToken(accessToken);
            const firebaseUID = decodedToken.uid;

            const user = await User.findOne({ firebaseUID });
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            const token = generateToken({
                githubUsername: user.githubUsername,
                githubId: user.githubId,
                firebaseUID,
            });
            res.cookie("token", token, authCookieOptions());

            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(401).json({ message: "Unauthorized" });
        }
    }

    static async logout(_req: any, res: any) {
        const { maxAge, ...clearOptions } = authCookieOptions();
        void maxAge;
        res.clearCookie("token", clearOptions);
        return res.status(200).json({ success: true });
    }

    static async vscodeToken(req: any, res: any) {
        try {
            const { firebaseIdToken, githubAccessToken } = req.body;
            if (!firebaseIdToken || !githubAccessToken) {
                return res.status(400).json({ message: "Firebase ID token and GitHub access token are required" });
            }

            const decodedToken = await admin
                .auth()
                .verifyIdToken(firebaseIdToken);
            const uid = decodedToken.uid;

            let username: string | undefined;
            let githubId: number | undefined;
            try {
                const response = await fetch("https://api.github.com/user", {
                    headers: githubApiHeaders(githubAccessToken),
                });
                if (response.ok) {
                    const githubUser: any = await response.json();
                    username = githubUser.login;
                    githubId = githubUser.id;
                }
            } catch {
                username = undefined;
            }

            if (githubId && username) {
                await User.findOneAndUpdate(
                    { firebaseUID: uid },
                    {
                        $set: {
                            firebaseUID: uid,
                            githubId,
                            githubUsername: username,
                        },
                        $setOnInsert: {
                            currentStep: 1,
                            completedSteps: [],
                            onboardingCompleted: false,
                        },
                    },
                    {
                        upsert: true,
                        returnDocument: 'after',
                        runValidators: false,
                    }
                ).catch(() => null);
            }

            const token = generateVSCodeToken({
                uid,
                username,
                issuedAt: Date.now(),
            });

            storeVSCodeSession(token, githubAccessToken);
            const code = storePendingVSCodeToken(token);

            res.status(200).json({ code });
        } catch (error) {
            res.status(500).json({ message: "Failed to issue VS Code token", error });
        }
    }

    static async vscodeDeviceToken(req: any, res: any) {
        try {
            const { githubAccessToken } = req.body;
            if (!githubAccessToken) {
                return res.status(400).json({ message: "GitHub access token is required" });
            }

            const response = await fetch("https://api.github.com/user", {
                headers: githubApiHeaders(githubAccessToken),
            });
            if (!response.ok) {
                return res.status(400).json({ message: "Invalid GitHub access token" });
            }

            const githubUser: any = await response.json();
            await User.findOneAndUpdate(
                { firebaseUID: String(githubUser.id) },
                {
                    $set: {
                        firebaseUID: String(githubUser.id),
                        githubId: githubUser.id,
                        githubUsername: githubUser.login,
                    },
                    $setOnInsert: {
                        currentStep: 1,
                        completedSteps: [],
                        onboardingCompleted: false,
                    },
                },
                {
                    upsert: true,
                    returnDocument: 'after',
                    runValidators: false,
                }
            ).catch(() => null);

            const token = generateVSCodeToken({
                uid: String(githubUser.id),
                username: githubUser.login,
                issuedAt: Date.now(),
            });

            storeVSCodeSession(token, githubAccessToken);
            const code = storePendingVSCodeToken(token);

            res.status(200).json({ code });
        } catch (error) {
            res.status(500).json({ message: "Failed to issue VS Code token", error });
        }
    }

    static async vscodeTokenExchange(req: any, res: any) {
        try {
            const { code } = req.body;
            if (!code || typeof code !== "string") {
                return res.status(400).json({ message: "Exchange code is required" });
            }

            const token = consumePendingVSCodeToken(code);
            if (!token) {
                return res.status(404).json({ message: "Exchange code is invalid or expired" });
            }

            res.status(200).json({ token });
        } catch (error) {
            res.status(500).json({ message: "Failed to exchange VS Code token", error });
        }
    }

    static async vscodeGithubProxy(req: any, res: any) {
        try {
            const { token, endpoint, method = "GET", body } = req.body;
            if (!token || typeof endpoint !== "string" || !endpoint.startsWith("/")) {
                return res.status(400).json({ status: 400, data: { message: "Invalid request" } });
            }

            const decoded = verifyVSCodeToken(token);
            const githubAccessToken = decoded.githubAccessToken ?? getVSCodeSession(token);
            if (!githubAccessToken) {
                return res.status(401).json({ status: 401, data: { message: "GitHub session not found" } });
            }

            const headers: Record<string, string> = githubApiHeaders(githubAccessToken);
            const init: RequestInit = { method, headers };
            if (body !== undefined && method !== "GET" && method !== "HEAD") {
                headers["Content-Type"] = "application/json";
                init.body = JSON.stringify(body);
            }

            const response = await fetch(`https://api.github.com${endpoint}`, init);
            const contentType = response.headers.get("content-type") ?? "";
            const data = contentType.includes("application/json")
                ? await response.json()
                : await response.text();

            res.status(200).json({ status: response.status, data });
        } catch (error) {
            res.status(401).json({ status: 401, data: { message: "Invalid or expired auth token" } });
        }
    }
}
