import type { ChatMessage as ChatMessageType } from "@shared/types"
import { sendMessage } from "../helpers/postMessage"

interface ChatMessageProps {
  message: ChatMessageType
  sender?: string
  currentUsername?: string
}

export default function ChatMessage({ message, sender, currentUsername }: ChatMessageProps) {
  const isUser = message.role === "user"
  const displaySender = sender ?? (isUser ? currentUsername : "Githuv")

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      sendMessage({ type: "copyText", payload: { text: message.content } })
    } catch {
      const textarea = document.createElement("textarea")
      textarea.value = message.content
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
    }
  }

  const handleInsert = () => {
    sendMessage({ type: "insertText", payload: { text: message.content } })
  }

  const handleSave = () => {
    sendMessage({ type: "saveChanges", payload: { content: message.content } })
  }

  return (
    <div className={`mb-3 flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm ${
          isUser
            ? "bg-[#238636] text-white"
            : "border border-[#30363d] bg-[#161b22] text-[#e6edf3]"
        }`}
      >
        {!isUser && displaySender && (
          <div className={`mb-0.5 text-xs font-semibold ${
            isUser ? "text-[#7ee787]" : "text-[#58a6ff]"
          }`}>
            {displaySender}
          </div>
        )}
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
            <button
              onClick={handleCopy}
              className="rounded px-1.5 py-0.5 text-[10px] text-[#8b949e] transition-colors hover:bg-[#30363d] hover:text-[#e6edf3]"
            >
              Copy
            </button>
            <button
              onClick={handleInsert}
              className="rounded px-1.5 py-0.5 text-[10px] text-[#8b949e] transition-colors hover:bg-[#30363d] hover:text-[#e6edf3]"
            >
              Insert
            </button>
            <button
              onClick={handleSave}
              className="rounded px-1.5 py-0.5 text-[10px] text-[#8b949e] transition-colors hover:bg-[#30363d] hover:text-[#e6edf3]"
            >
              Save
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
