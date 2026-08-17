import { io } from "socket.io-client"

export function connectWS(token?: string | null) {
    return io("http://localhost:4004", {
        transports: ["websocket"],
        auth: token ? { token } : undefined,
    });
}