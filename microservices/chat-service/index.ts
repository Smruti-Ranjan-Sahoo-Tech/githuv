import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";

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

// Middleware
app.use(cors());
app.use(express.json());

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

// Store messages by room
const roomMessages: Record<string, ChatMessage[]> = {};

io.on("connection", (socket) => {
    console.log(`✅ Connected: ${socket.id}`);

    // Join Room
    socket.on("joinRoom", ({ roomId }: JoinRoomPayload) => {
        if (!socket.data.username || !roomId?.trim()) return;

        const username = socket.data.username as string;
        socket.data.roomId = roomId;
        
        socket.join(roomId);
        
        console.log(`${username} joined room ${roomId}`);
        
        // Send previous messages of this room
        socket.emit("receive-message", roomMessages[roomId] ?? []);

        // Notify others
        socket.to(roomId).emit("receive-message", {
            id: crypto.randomUUID(),
            sender: "System",
            message: `${username} joined the room`,
            time: Date.now(),
            type: "system",
        });
    });

    // Send Message
    socket.on("send-message", ({ message }: SendMessagePayload) => {
        const roomId = socket.data.roomId;
        
        if (!roomId) return;
        
        if (!roomMessages[roomId]) {
            roomMessages[roomId] = [];
        }

        roomMessages[roomId].push(message);

        console.log(
            `[${roomId}] ${message.sender}: ${message.message}`
        );

        // Broadcast to everyone in room
        io.to(roomId).emit("receive-message", message);
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

// Routes
app.get("/", (_, res) => {
    res.status(200).json({
        success: true,
        message: "Socket.IO Server Running 🚀",
    });
});

// Start Server
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
