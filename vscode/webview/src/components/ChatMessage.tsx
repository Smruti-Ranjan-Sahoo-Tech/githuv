import type { ChatMessage as ChatMessageType } from "@shared/types"

interface ChatMessageProps {
  message: ChatMessageType
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user"

  return (
    <div className={`mb-3 flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm ${
          isUser
            ? "bg-[#238636] text-white"
            : "border border-[#30363d] bg-[#161b22] text-[#e6edf3]"
        }`}
      >
        <div className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</div>
        {message.timestamp > 0 && (
          <div className={`mt-1 text-[10px] ${isUser ? "text-white/60" : "text-[#8b949e]"}`}>
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}
        {message.role === "assistant" && (
          <div className="mt-2 flex gap-2 border-t border-[#30363d]/50 pt-2">
            <button className="rounded px-1.5 py-0.5 text-[10px] text-[#8b949e] transition-colors hover:bg-[#30363d] hover:text-[#e6edf3]">
              Copy
            </button>
            <button className="rounded px-1.5 py-0.5 text-[10px] text-[#8b949e] transition-colors hover:bg-[#30363d] hover:text-[#e6edf3]">
              Insert
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
