import { io } from "socket.io-client"

const FALLBACK_CHAT_URL = "https://githuv-8icz.onrender.com"

function chatUrl(): string {
    if (typeof window !== "undefined") {
        const injected = (window as { __GITHUV_CHAT_URL__?: string }).__GITHUV_CHAT_URL__
        if (injected) return injected
    }
    return FALLBACK_CHAT_URL
}

export function connectWS(token?: string | null) {
    return io(chatUrl(), {
        transports: ["websocket", "polling"],
        auth: token ? { token } : undefined,
    });
}
