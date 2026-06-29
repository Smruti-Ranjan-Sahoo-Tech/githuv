import type { ChatMessage as ChatMessageType } from "@shared/types"

interface ChatMessageProps {
  message: ChatMessageType
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user"

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
          isUser
            ? "bg-[#238636] text-white"
            : "bg-[#161b22] text-[#e6edf3] border border-[#30363d]"
        }`}
      >
        <div className="whitespace-pre-wrap">{message.content}</div>
        {message.role === "assistant" && (
          <div className="mt-1 text-xs text-[#8b949e]">
            <span className="italic">Markdown rendering placeholder</span>
          </div>
        )}
      </div>
    </div>
  )
}
