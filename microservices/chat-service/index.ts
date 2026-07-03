import cors from "cors";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

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
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
    },
});

// Middleware
app.use(cors());
app.use(express.json());

// Store messages by room
const roomMessages: Record<string, ChatMessage[]> = {};

io.on("connection", (socket) => {
    console.log(`✅ Connected: ${socket.id}`);

    // Join Room
    socket.on("joinRoom", ({ username, roomId }: JoinRoomPayload) => {
        if (!username?.trim() || !roomId?.trim()) return;
        
        socket.data.username = username;
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