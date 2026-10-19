import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import connectDB from "./src/config/database";
import { bulkUpsert, markDelivered, startCleanupScheduler } from "./src/controller/message.controller";
import routes from "./src/routes";
import { registerTaskSocket, taskRoom } from "./src/services/taskEvents";

dotenv.config();

const JWT_SECRET = process.env.JWT_SERVER_SECREAT;

interface VSCodeTokenPayload {
    uid: string;
    username?: string;
    issuedAt: number;
}

type ChatMessage = {
    id: string;
    sender: string;
    message: string;
    time: number;
    type: "user" | "system";
    imageUrl?: string;
    imagePublicId?: string;
    localImagePath?: string;
};

type JoinRoomPayload = {
    username: string;
    roomId: string;
};

type SendMessagePayload = {
    message: ChatMessage;
};

const app = express();
const server = createServer(app);

const PORT = 4004;

const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            if (!origin || /^(http:\/\/localhost:\d+|vscode-webview:\/\/)/.test(origin)) {
                return callback(null, true);
            }
            return callback(new Error("Not allowed by CORS"));
        },
        methods: ["GET", "POST"],
    },
});

registerTaskSocket(io);

// Middleware
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use("/api", routes);

// Require a signed JWT on every socket connection.
io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;

    if (!JWT_SECRET) {
        return next(new Error("Server is missing JWT_SERVER_SECREAT"));
    }
    if (!token) {
        return next(new Error("Missing auth token"));
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET, {
            algorithms: ["HS256"],
        }) as VSCodeTokenPayload;

        socket.data.username = payload.username ?? payload.uid;
        socket.data.uid = payload.uid;

        next();
    } catch {
        return next(new Error("Invalid or expired auth token"));
    }
});

io.on("connection", (socket) => {
    console.log(`✅ Connected: ${socket.id}`);

    // Join Room — history now comes from MongoDB
    socket.on("joinRoom", async ({ roomId }: JoinRoomPayload, ack?: (msgs: ChatMessage[]) => void) => {
        if (!socket.data.username || !roomId?.trim()) return;

        const username = socket.data.username as string;
        socket.data.roomId = roomId;

        socket.join(roomId);
        console.log(`${username} joined room ${roomId}`);

        // Send previous messages of this room from MongoDB
        const history = await getHistory(roomId);
        socket.emit("receive-message", history);

        if (typeof ack === "function") ack(history);

        // Notify others
        socket.to(roomId).emit("receive-message", {
            id: crypto.randomUUID(),
            sender: "System",
            message: `${username} joined the room`,
            time: Date.now(),
            type: "system",
        });
    });

    // Join a repository's task board — task mutations are broadcast here so
    // every user viewing that repository sees them live.
    socket.on("join-tasks", ({ repoKey }: { repoKey?: string }) => {
        const key = typeof repoKey === "string" ? repoKey.trim().toLowerCase() : "";
        if (!key) return;
        socket.join(taskRoom(key));
        console.log(`${socket.data.username} joined task room ${key}`);
    });

    // Send Message — broadcast first, persist to MongoDB after (local-first friendly)
    socket.on("send-message", async ({ message }: SendMessagePayload, ack?: (resp: { ok: boolean; persisted?: boolean; error?: string }) => void) => {
        const roomId = socket.data.roomId;

        if (!roomId) {
            if (typeof ack === "function") ack({ ok: false, error: "No room joined" });
            return;
        }

        let persisted = false;
        try {
            await bulkUpsert([
                {
                    id: message.id,
                    roomId,
                    sender: message.sender,
                    content: message.message,
                    type: message.type,
                    imageUrl: message.imageUrl,
                    imagePublicId: message.imagePublicId,
                    localImagePath: message.localImagePath,
                    delivered: false,
                    createdAt: message.time,
                },
            ]);
            persisted = true;
        } catch (err) {
            // DB may be temporarily down — still deliver to the room;
            // the webview's local-first sync will re-push to MongoDB later.
            console.warn("Message not persisted (MongoDB unavailable?):", err);
        }

        console.log(`[${roomId}] ${message.sender}: ${message.message}`);

        // Broadcast to everyone in room
        io.to(roomId).emit("receive-message", message);
        if (typeof ack === "function") ack({ ok: true, persisted });
    });

    // Receiving client confirms delivery -> MongoDB TTL drops from 2 months to 7 days
    socket.on("message-delivered", async (messageIds: string[]) => {
        const roomId = socket.data.roomId;
        if (!roomId || !Array.isArray(messageIds) || !messageIds.length) return;
        try {
            await markDelivered(messageIds);
            io.to(roomId).emit("message-delivered", messageIds);
        } catch (err) {
            console.error("Failed to mark delivered:", err);
        }
    });

    // Disconnect
    socket.on("disconnect", () => {
        console.log(`❌ Disconnected: ${socket.id}`);

        const username = socket.data.username;
        const roomId = socket.data.roomId;

        if (username && roomId) {
            io.to(roomId).emit("receive-message", {
                id: crypto.randomUUID(),
                sender: "System",
                message: `${username} left the room`,
                time: Date.now(),
                type: "system",
            });
        }
    });
});

async function getHistory(roomId: string): Promise<ChatMessage[]> {
    try {
        // direct DB read to avoid circular import from socket layer
        const { MessageModel } = await import("./src/model/message.model");
        const docs = await MessageModel.find({ roomId }).sort({ createdAt: -1 }).limit(500).lean();
        return docs.reverse().map((d) => ({
            id: d.id,
            sender: d.sender,
            message: d.content ?? "",
            time: new Date(d.createdAt).getTime(),
            type: (d.type === "system" ? "system" : "user") as "user" | "system",
            imageUrl: d.imageUrl ?? undefined,
            imagePublicId: d.imagePublicId ?? undefined,
            localImagePath: d.localImagePath ?? undefined,
        }));
    } catch {
        return [];
    }
}

// Routes
app.get("/", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "Socket.IO Server Running 🚀",
    });
});

app.get("/test", (_req, res) => {
    res.status(200).json({ status: "ok", service: "chat-service" });
});

// Start Server
server.listen(PORT, async () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    try {
        await connectDB();
        startCleanupScheduler();
    } catch (err) {
        console.error("⚠️ MongoDB unavailable — sockets will run without persistence:", err);
    }
});