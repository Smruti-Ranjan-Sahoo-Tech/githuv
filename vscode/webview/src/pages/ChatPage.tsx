import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import { Socket } from "socket.io-client";
import { connectWS } from "../config/WS";
import { useGithubAuthStore } from "../store/useGithubAuthStore";
import { sendMessage } from "../helpers/postMessage";

type ChatMessage = {
  id: string;
  sender: string;
  message: string;
  time: number;
  type: "user" | "system";
};

interface ChatState {
  roomId?: string;
  roomName?: string;
  repoOwner?: string;
  username?: string;
}

const formatTime = (timestamp: number) =>
  new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const ChatPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state as ChatState) ?? {};

  const socketRef = useRef<Socket | null>(null);

  const [username, setUsername] = useState(state.username ?? "Lucifer");
  const [roomId, setRoomId] = useState(state.roomId ?? "");
  const [roomName] = useState(state.roomName ?? "");

  const [text, setText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  const autoJoinedRef = useRef(false);

  useEffect(() => {
    const token = useGithubAuthStore.getState().rawToken;
    const socket = connectWS(token);
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);

      if (roomId && username && !autoJoinedRef.current) {
        autoJoinedRef.current = true;
        socket.emit("joinRoom", { username, roomId });
        setHasJoined(true);
      }
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("connect_error", () => {
      useGithubAuthStore.getState().logout();
      sendMessage({ type: "clearStoredToken" });
      navigate("/login");
    });

    socket.on("receive-message", (data: ChatMessage | ChatMessage[]) => {
      if (Array.isArray(data)) {
        setMessages(data);
      } else {
        setMessages((prev) => [...prev, data]);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleJoinRoom = () => {
    if (!socketRef.current || !roomId.trim() || !username.trim()) return;
    setMessages([]);
    socketRef.current.emit("joinRoom", { username, roomId });
    setHasJoined(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!text.trim()) return;

    socketRef.current?.emit("send-message", {
      message: {
        id: crypto.randomUUID(),
        sender: username,
        message: text,
        time: Date.now(),
        type: "user",
      },
    });

    setText("");
  };

  const handleLogout = () => {
    useGithubAuthStore.getState().logout();
    sendMessage({ type: "clearStoredToken" });
    navigate("/login");
  };

  return (
    <div className="flex h-screen flex-col bg-[#0d1117] text-[#e6edf3]">
      <TopBar
        repoName={roomName || undefined}
        onSettings={handleLogout}
      />

      {/* Room controls */}
      {!hasJoined ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm space-y-4 p-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold">Join Chat Room</h2>
              {roomName && (
                <p className="mt-1 text-sm text-[#8b949e]">
                  Repository: <span className="text-[#58a6ff]">{roomName}</span>
                </p>
              )}
            </div>
            <input
              className="w-full rounded border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-[#e6edf3] placeholder-[#8b949e] outline-none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
            />
            <input
              className="w-full rounded border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-[#e6edf3] placeholder-[#8b949e] outline-none"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Room ID"
            />
            <button
              onClick={handleJoinRoom}
              disabled={!username.trim() || !roomId.trim()}
              className="w-full rounded-lg bg-[#238636] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2ea043] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Join Room
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Room header */}
          <div className="flex items-center gap-2 border-b border-[#21262d] bg-[#161b22] px-4 py-2">
            <div className="flex items-center gap-1.5 text-xs text-[#8b949e]">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  isConnected ? "bg-[#3fb950]" : "bg-[#f85149]"
                }`}
              />
              <span>{isConnected ? "Connected" : "Disconnected"}</span>
            </div>
            <span className="text-[#21262d]">|</span>
            <span className="text-xs text-[#8b949e]">
              Room: <span className="text-[#e6edf3]">{roomName || roomId}</span>
            </span>
            <span className="text-xs text-[#8b949e]">
              as <span className="text-[#58a6ff]">{username}</span>
            </span>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-[#8b949e]">No messages yet.</p>
                  <p className="mt-1 text-xs text-[#484f58]">Start chatting!</p>
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className="mb-4 animate-fade-in">
                {msg.type === "system" ? (
                  <div className="text-center text-xs text-[#d29922]">{msg.message}</div>
                ) : (
                  <div className={`flex ${msg.sender === username ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-lg px-4 py-2 text-sm ${
                        msg.sender === username
                          ? "bg-[#238636] text-white"
                          : "border border-[#30363d] bg-[#161b22] text-[#e6edf3]"
                      }`}
                    >
                      <div
                        className={`mb-0.5 text-xs font-semibold ${
                          msg.sender === username ? "text-[#7ee787]" : "text-[#58a6ff]"
                        }`}
                      >
                        {msg.sender}
                      </div>
                      <div className="whitespace-pre-wrap break-words leading-relaxed">
                        {msg.message}
                      </div>
                      <div
                        className={`mt-1 text-[10px] ${
                          msg.sender === username ? "text-[#7ee787]/60" : "text-[#8b949e]"
                        }`}
                      >
                        {formatTime(msg.time)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Input area */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-[#21262d] bg-[#161b22] px-4 py-3"
          >
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg border border-[#30363d] bg-[#0d1117] px-4 py-2 text-sm text-[#e6edf3] placeholder-[#8b949e] outline-none transition-colors focus:border-[#58a6ff]"
                placeholder="Type a message..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <button
                className="rounded-lg bg-[#238636] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2ea043] disabled:cursor-not-allowed disabled:opacity-50"
                type="submit"
                disabled={!text.trim()}
              >
                Send
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default ChatPage;
