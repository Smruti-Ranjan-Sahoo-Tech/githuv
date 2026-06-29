import { useState, useRef, useEffect } from "react"
import type { ChatMessage as ChatMessageType } from "@shared/types"
import TopBar from "../components/TopBar"
import ChatMessage from "../components/ChatMessage"
import { sendMessage, receiveMessage } from "../helpers/postMessage"

let messageId = 0
function nextId() {
  return `msg-${++messageId}`
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessageType[]>([])
  const [input, setInput] = useState("")
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "connecting">("connected")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const cleanup = receiveMessage((msg) => {
      if (msg.type === "connectionStatus") {
        setConnectionStatus(msg.payload.status as typeof connectionStatus)
      }
    })
    return cleanup
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = () => {
    const text = input.trim()
    if (!text) return

    const userMessage: ChatMessageType = {
      id: nextId(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    sendMessage({ type: "sendMessage", payload: { text } })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <TopBar
        repoName="user/repository"
        avatarUrl="https://avatars.githubusercontent.com/u/0"
        connectionStatus={connectionStatus}
        onSettings={() => sendMessage({ type: "openSettings" })}
      />

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-[#8b949e]">Start a conversation about your codebase.</p>
          </div>
        )}
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-[#30363d] bg-[#161b22] px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your codebase..."
            rows={2}
            className="flex-1 resize-none rounded-lg border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-[#e6edf3] placeholder-[#8b949e] outline-none transition-colors focus:border-[#58a6ff]"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#238636] text-white transition-colors hover:bg-[#2ea043] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
