import { useState } from "react"
import type { ChatMessage as ChatMessageType } from "@shared/types"
import { sendMessage } from "../helpers/postMessage"

const IMAGES_BASE_URI: string | undefined =
  typeof window !== "undefined" ? (window as unknown as { __GITHUV_IMAGES_URI__?: string }).__GITHUV_IMAGES_URI__ : undefined

function resolveImageSrc(message: ChatMessageType): string | undefined {
  if (message.imageLocalPath && IMAGES_BASE_URI) {
    const fileName = message.imageLocalPath.split(/[\\/]/).pop()
    if (fileName) {
      return `${IMAGES_BASE_URI.replace(/\/$/, "")}/${encodeURIComponent(fileName)}`
    }
  }
  return message.imageUrl ?? undefined
}

function githubAvatarUrl(login: string): string {
  return `https://github.com/${encodeURIComponent(login)}.png?size=64`
}

function Avatar({ login, align }: { login?: string; align: "left" | "right" }) {
  const [failed, setFailed] = useState(false)
  const safeLogin = login ?? ""
  const initials = (safeLogin || "?").slice(0, 2).toUpperCase()
  return (
    <div className={`flex shrink-0 flex-col items-center gap-1 ${align === "right" ? "order-2" : ""}`}>
      {failed || !safeLogin ? (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#30363d] text-[10px] font-semibold text-[#8b949e]">
          {initials}
        </div>
      ) : (
        <img
          src={githubAvatarUrl(safeLogin)}
          alt={safeLogin}
          title={safeLogin}
          onError={() => setFailed(true)}
          className="h-8 w-8 rounded-full border border-[#30363d] bg-[#161b22] object-cover"
        />
      )}
      </div>
  )
}

interface ChatMessageProps {
  message: ChatMessageType
  sender?: string
  delivered?: boolean
}

export default function ChatMessage({ message, sender, delivered }: ChatMessageProps) {
  const isUser = message.role === "user"
  const displaySender = sender ?? "Githuv"
  const imageSrc = resolveImageSrc(message)
  const [imageOpen, setImageOpen] = useState(false)

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
    <div className={`mb-3 flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && message.role !== "system" && <Avatar login={displaySender} align="left" />}
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm ${
          isUser
            ? "bg-[#238636] text-white"
            : "border border-[#30363d] bg-[#161b22] text-[#e6edf3]"
        }`}
      >
        {displaySender && (
          <div
            className={`mb-0.5 flex items-center gap-2 text-xs font-semibold ${
              isUser ? "justify-end text-[#7ee787]" : "text-[#58a6ff]"
            }`}
          >
            <span className={isUser ? "order-1" : "order-2"}>{displaySender}</span>
          </div>
        )}

        {imageSrc && (
          <>
            <img
              src={imageSrc}
              alt="Shared image"
              className="mb-1.5 max-h-64 w-full cursor-zoom-in rounded-md object-cover"
              onClick={() => setImageOpen(true)}
              onError={(e) => {
                const local = resolveImageSrc({ ...message, imageLocalPath: undefined })
                if (local) (e.currentTarget as HTMLImageElement).src = local
              }}
            />
            {imageOpen && (
              <div
                className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/80 p-6"
                onClick={() => setImageOpen(false)}
              >
                <img
                  src={imageSrc}
                  alt="Shared image"
                  className="max-h-full max-w-full rounded-md object-contain"
                />
              </div>
            )}
          </>
        )}

        {message.content && (
          <div className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</div>
        )}
        <div className={`mt-1 flex items-center gap-2 text-[10px] ${isUser ? "text-white/60" : "text-[#8b949e]"}`}>
          <span>
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {isUser && (
            <span className={delivered ? "text-[#7ee787]" : "text-[#d29922]"}>
              {delivered ? "✓✓ delivered" : "✓ sent"}
            </span>
          )}
        </div>
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
      {isUser && <Avatar login={displaySender} align="right" />}
    </div>
  )
}