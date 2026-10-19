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

function Avatar({ login }: { login?: string }) {
  const [failed, setFailed] = useState(false)
  const safeLogin = login ?? ""
  const initials = (safeLogin || "?").slice(0, 2).toUpperCase()
  if (failed || !safeLogin) {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#30363d] text-[10px] font-semibold text-[#8b949e]">
        {initials}
      </div>
    )
  }
  return (
    <img
      src={githubAvatarUrl(safeLogin)}
      alt={safeLogin}
      title={safeLogin}
      onError={() => setFailed(true)}
      className="h-8 w-8 shrink-0 rounded-full border border-[#30363d] bg-[#161b22] object-cover"
    />
  )
}

interface ChatMessageProps {
  message: ChatMessageType
  sender?: string
  delivered?: boolean
  /** True when the current user wrote this message — right-aligned like WhatsApp. */
  isMine?: boolean
}

export default function ChatMessage({ message, sender, delivered, isMine }: ChatMessageProps) {
  const displaySender = sender ?? "Githuv"
  // Fall back to the legacy role-based guess for callers that do not pass it.
  const mine = isMine ?? message.role === "user"
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
    <div className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
      {!mine && <Avatar login={displaySender} />}

      <div
        className={`max-w-[80%] px-3.5 py-2 text-sm shadow-sm ${
          mine
            ? "rounded-2xl rounded-br-md bg-[#238636] text-white"
            : "rounded-2xl rounded-bl-md border border-[#30363d] bg-[#161b22] text-[#e6edf3]"
        }`}
      >
        {!mine && (
          <div className="mb-0.5 text-xs font-semibold text-[#58a6ff]">{displaySender}</div>
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

        <div
          className={`mt-1 flex items-center justify-end gap-1.5 text-[10px] ${
            mine ? "text-white/70" : "text-[#8b949e]"
          }`}
        >
          <span>
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {mine && (
            <span className={delivered ? "text-[#b8f7c6]" : "text-[#d9eadb]"}>
              {delivered ? "✓✓" : "✓"}
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
    </div>
  )
}
