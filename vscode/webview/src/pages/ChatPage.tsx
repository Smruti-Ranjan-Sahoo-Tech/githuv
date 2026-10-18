import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import ChatMessageComponent from "../components/ChatMessage";
import { Socket } from "socket.io-client";
import { connectWS } from "../config/WS";
import { useGithubAuthStore } from "../store/useGithubAuthStore";
import { sendMessage, receiveMessage } from "../helpers/postMessage";
import { uuid } from "../helpers/uuid";
import {
  watchRoomMessages,
  upsertMessage,
  upsertMessages,
  getRoomMessages,
  fromServerMessage,
  type LocalMessage,
} from "../db/rxdb";
import { pushSyncedMessages, syncRoom, confirmDelivered } from "../services/syncService";
import { restoreRoomMessages, archiveRoomMessages } from "../services/localArchive";
import { uploadImage } from "../services/imageService";
import { persistMessageImage, persistRoomImageMessages } from "../services/receivedImageService";
import type { ExtensionMessage } from "@shared/types";

type ChatState = {
  roomId?: string;
  roomName?: string;
  repoOwner?: string;
  username?: string;
};

const normalizeServerMessage = (
  raw: {
    id: string;
    sender: string;
    message: string;
    time: number;
    type: "user" | "system";
    imageUrl?: string;
    imagePublicId?: string;
    localImagePath?: string;
  },
  roomId: string
): LocalMessage => {
  const base = fromServerMessage({
    ...raw,
    content: raw.message ?? "",
    createdAt: raw.time,
  });
  return {
    ...base,
    roomId,
    imageUrl: raw.imageUrl ?? null,
    imagePublicId: raw.imagePublicId ?? null,
    localImagePath: raw.localImagePath ?? null,
  };
};

const ChatPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state as ChatState) ?? {};

  const session = useGithubAuthStore((s) => s.repoSession);

  const initialRoomId = state.roomId ?? session?.repoId ?? "";
  const initialUsername = state.username ?? session?.username ?? "";
  const initialRoomName = state.roomName ?? session?.repoName ?? "";

  const socketRef = useRef<Socket | null>(null);

  const [username, setUsername] = useState(initialUsername);
  const [roomId, setRoomId] = useState(initialRoomId);
  const [roomName] = useState(initialRoomName);

  const [text, setText] = useState("");
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [hasJoined, setHasJoined] = useState(!!initialRoomId);
  const [operationStatus, setOperationStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  const autoJoinedRef = useRef(false);
  const roomIdRef = useRef(roomId);

  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  const disposedRef = useRef(false);

  // The durable on-disk archive + the server (MongoDB) are the sources of
  // truth. On every mount, reconnect or join we restore the local archive,
  // push local unsynced messages and re-pull the full room history so
  // messages are never lost, even if the IndexedDB cache was reset.
  const refreshHistory = useCallback(async () => {
    if (!roomId) return;
    const fromDisk = await restoreRoomMessages(roomId);
    if (fromDisk.length && !disposedRef.current) setMessages(fromDisk);
    await syncRoom(roomId);
    const msgs = await getRoomMessages(roomId);
    void persistRoomImageMessages(msgs);
    if (!disposedRef.current) {
      setMessages(msgs);
      void archiveRoomMessages(roomId);
    }
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;

    let disposed = false;
    disposedRef.current = false;

    const token = useGithubAuthStore.getState().rawToken;
    const socket = connectWS(token);
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      if (roomId && username && !autoJoinedRef.current) {
        autoJoinedRef.current = true;
        socket.emit(
          "joinRoom",
          { username, roomId },
          (history: {
            id: string;
            sender: string;
            message: string;
            time: number;
            type: "user" | "system";
            imageUrl?: string;
            imagePublicId?: string;
            localImagePath?: string;
          }[]) => {
            if (disposed) return;
            const local = history.map((m) => normalizeServerMessage(m, roomId));
            void persistRoomImageMessages(local);
            void upsertMessages(local).then(() => refreshHistory());
          }
        );
        setHasJoined(true);
      }
      // Re-sync from the server on every (re)connect so the room never
      // appears to lose stored messages.
      void refreshHistory();
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("connect_error", () => {
      setIsConnected(false)
      setOperationStatus({ success: false, message: "Chat service unreachable – retrying…" })
    });

    socket.on("receive-message", (data: {
      id: string;
      sender: string;
      message: string;
      time: number;
      type: "user" | "system";
      imageUrl?: string;
      imagePublicId?: string;
      localImagePath?: string;
    } | Array<{
      id: string;
      sender: string;
      message: string;
      time: number;
      type: "user" | "system";
      imageUrl?: string;
      imagePublicId?: string;
      localImagePath?: string;
    }>) => {
      if (disposed) return;
      if (Array.isArray(data)) {
        const local = data.map((m) => normalizeServerMessage(m, roomId));
        void persistRoomImageMessages(local);
        void upsertMessages(local).then(() => archiveRoomMessages(roomId));
        return;
      }
      if (data.type === "system") {
        void upsertMessage(normalizeServerMessage(data, roomId)).then(() => archiveRoomMessages(roomId));
        return;
      }
      void persistMessageImage(normalizeServerMessage(data, roomId)).then((msg) => {
        void upsertMessage(msg).then(() => {
          void archiveRoomMessages(roomId);
          if (data.sender !== username) {
            void confirmDelivered(roomId, [data.id], socket);
          }
        });
      });
    });

    const cleanupListener = receiveMessage((message: ExtensionMessage) => {
      if (message.type === "operationResult") {
        setOperationStatus(message.payload);
      }
    });

    // Load stored room history on mount even when the chat service is down,
    // so the user always sees the messages already saved for this repo.
    void refreshHistory();

    return () => {
      disposed = true;
      disposedRef.current = true;
      socket.disconnect();
      cleanupListener();
    };
  }, [roomId, username, navigate, refreshHistory]);

  useEffect(() => {
    const sub = watchRoomMessages(roomId, setMessages).catch(() => () => {});
    return () => {
      void sub.then((unsub) => unsub());
    };
  }, [roomId]);

  useEffect(() => {
    if (!operationStatus) return;
    const timeout = window.setTimeout(() => {
      setOperationStatus(null);
    }, 3000);
    return () => window.clearTimeout(timeout);
  }, [operationStatus]);

  const handleJoinRoom = () => {
    if (!socketRef.current || !roomId.trim() || !username.trim()) return;
    autoJoinedRef.current = true;
    socketRef.current.emit("joinRoom", { username, roomId });
    setHasJoined(true);
    void refreshHistory();
  };

  const handleSubmit = useCallback(
    async (image?: { dataUrl: string; fileName: string; localPath: string; publicId: string; imageUrl: string }) => {
      const content = text.trim();
      if (!content && !image) return;

      const msgId = uuid();
      const currentRoom = roomIdRef.current;
      if (!currentRoom) return;

      const message: LocalMessage = {
        id: msgId,
        roomId: currentRoom,
        sender: username,
        role: "user",
        content,
        imageUrl: image?.imageUrl ?? null,
        imagePublicId: image?.publicId ?? null,
        localImagePath: image?.localPath ?? null,
        timestamp: Date.now(),
        synced: false,
        delivered: false,
        deliveredAt: null,
      };

      try {
        await upsertMessage(message);
        void archiveRoomMessages(currentRoom);
        void pushSyncedMessages();

        // Real-time broadcast
        if (socketRef.current?.connected) {
          socketRef.current.emit("send-message", {
            message: {
              id: msgId,
              sender: username,
              message: content,
              time: message.timestamp,
              type: "user" as const,
              imageUrl: image?.imageUrl,
              imagePublicId: image?.publicId,
              localImagePath: image?.localPath,
            },
          });
        }
      } catch (err) {
        setOperationStatus({ success: false, message: `Failed to send: ${err instanceof Error ? err.message : "Unknown error"}` });
      }

      setText("");
    },
    [text, username]
  );

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void handleSubmit();
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setOperationStatus({ success: false, message: "Only images are allowed" });
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result);
      setUploading(true);
      try {
        const result = await uploadImage(dataUrl, file.name, roomIdRef.current);
        if (!result.success || !result.imageUrl) {
          throw new Error(result.error ?? "Upload failed");
        }
        if (result.success) {
          await handleSubmit({
            dataUrl,
            fileName: file.name,
            localPath: result.localImagePath ?? "",
            publicId: result.publicId ?? "",
            imageUrl: result.imageUrl,
          });
        }
      } catch (err) {
        setOperationStatus({
          success: false,
          message: `Image upload failed: ${err instanceof Error ? err.message : "Unknown error"}`,
        });
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = () => {
    useGithubAuthStore.getState().logout();
    sendMessage({ type: "clearStoredToken" });
    navigate("/login");
  };

  return (
    <div className="flex h-full flex-col bg-[#0d1117] text-[#e6edf3]">
      <TopBar
        repoName={roomName || undefined}
        onSettings={() => sendMessage({ type: "openSettings" })}
        onLogout={handleLogout}
      />

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
            {uploading && <span className="ml-auto text-xs text-[#d29922]">Uploading image…</span>}
          </div>

          {operationStatus && (
            <div
              className={`border-b px-4 py-2 text-xs ${
                operationStatus.success
                  ? "border-[#1f4f2c] bg-[#102015] text-[#7ee787]"
                  : "border-[#5a1b1b] bg-[#1f1010] text-[#f85149]"
              }`}
            >
              {operationStatus.message}
            </div>
          )}

          <div className="chat-wallpaper flex-1 overflow-y-auto px-4 py-4">
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
                {msg.role === "system" ? (
                  <div className="text-center text-xs text-[#d29922]">{msg.content}</div>
                ) : (
                  <ChatMessageComponent
                    message={{
                      id: msg.id,
                      role: msg.role,
                      content: msg.content,
                      timestamp: msg.timestamp,
                      imageUrl: msg.imageUrl ?? undefined,
                      imageLocalPath: msg.localImagePath ?? undefined,
                    }}
                    sender={msg.sender}
                    delivered={msg.delivered}
                  />
                )}
              </div>
            ))}
          </div>

          <form
            onSubmit={handleFormSubmit}
            className="border-t border-[#21262d] bg-[#161b22] px-4 py-3"
          >
            <div className="flex gap-2">
              <label className="flex cursor-pointer items-center rounded-lg border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-[#8b949e] transition-colors hover:border-[#58a6ff] hover:text-[#58a6ff]">
                <span>📷</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImagePick}
                  disabled={uploading}
                />
              </label>
              <input
                className="flex-1 rounded-lg border border-[#30363d] bg-[#0d1117] px-4 py-2 text-sm text-[#e6edf3] placeholder-[#8b949e] outline-none transition-colors focus:border-[#58a6ff]"
                placeholder="Type a message..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <button
                className="rounded-lg bg-[#238636] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2ea043] disabled:cursor-not-allowed disabled:opacity-50"
                type="submit"
                disabled={(!text.trim() && !uploading) || uploading}
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
