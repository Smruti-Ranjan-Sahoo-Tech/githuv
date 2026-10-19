import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

export interface AuthedUser {
    uid: string;
    username?: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: AuthedUser;
        }
    }
}

/**
 * Verifies the VS Code JWT (Authorization: Bearer <token>) that the webview
 * already uses for the socket connection. Only routes that belong to a user
 * (e.g. tasks) are protected — chat history stays public like before.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const secret = process.env.JWT_SERVER_SECREAT;
    if (!secret) {
        res.status(500).json({ success: false, error: "Server is missing JWT_SERVER_SECREAT" });
        return;
    }

    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : undefined;
    if (!token) {
        res.status(401).json({ success: false, error: "Missing auth token" });
        return;
    }

    try {
        const payload = jwt.verify(token, secret, { algorithms: ["HS256"] }) as {
            uid?: string;
            username?: string;
        };
        if (!payload.uid) {
            throw new Error("missing uid");
        }
        req.user = { uid: payload.uid, username: payload.username };
        next();
    } catch {
        res.status(401).json({ success: false, error: "Invalid or expired auth token" });
    }
}
