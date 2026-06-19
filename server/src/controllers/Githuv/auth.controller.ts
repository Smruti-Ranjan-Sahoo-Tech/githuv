import admin from "../../config/firebase/firebaseAdmin";
import { generateToken } from "../../config/JWT/jwt.config";
import { User } from "../../models/user.model";
import { UserProfile } from "../../models/userProfile.model";

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
                headers: {
                    Authorization: `Bearer ${githubAccessToken}`,
                    Accept: "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                },
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
                githubAccessToken
            });

            if (existingUser) {
                existingUser.githubId = githubId;
                existingUser.githubUsername = githubUsername;
                existingUser.githubAccessToken = githubAccessToken;
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
            res.cookie("token", token, {
                httpOnly: true,
                sameSite: "lax",
                secure: false,
                maxAge: 30 * 24 * 60 * 60 * 1000,
            });

            const profile = await UserProfile.findOne({ user: user._id });

            res.status(200).json({
                message: "Login successful",
                user,
                onboarding: profile,
            });

        } catch (error) {
            res.status(500).json({ message: "Login failed", error });
        }

    }
}
