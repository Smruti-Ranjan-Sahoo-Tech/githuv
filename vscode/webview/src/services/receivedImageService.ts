import type { ExtensionMessage } from "@shared/types"
import { sendMessage } from "../helpers/postMessage"
import { upsertMessage, type LocalMessage } from "../db/rxdb"

/**
 * WhatsApp-style received-image persistence. When a remote user shares an
 * image that is only stored on its sender (Cloudinary URL + a local copy on
 * their machine), the extension host downloads it and writes a permanent
 * local copy to <workspace>/.githuv/images/ so the receiver keeps the image
 * even after the 7-day CDN TTL.
 */

const pending = new Map<string, (path: string | null) => void>()
let requestId = 0

const listener = (event: MessageEvent<ExtensionMessage>) => {
  const msg = event.data
  if (msg.type !== "saveReceivedImageResult") return
  const resolve = pending.get(msg.payload.id)
  if (!resolve) return
  pending.delete(msg.payload.id)
  resolve(msg.payload.success && msg.payload.localImagePath ? msg.payload.localImagePath : null)
}

if (typeof window !== "undefined") {
  window.addEventListener("message", listener)
}

function fileNameFromMessage(msg: {
  id: string
  imageUrl?: string | null
  localImagePath?: string | null
}): string {
  const fromPath = msg.localImagePath?.split(/[\\/]/).pop()
  if (fromPath) return fromPath
  const fromUrl = msg.imageUrl?.split("/").pop()?.split("?")[0]
  if (fromUrl) return fromUrl
  return `img-${msg.id}.jpg`
}

export async function persistReceivedImage(msg: {
  id: string
  imageUrl?: string | null
  localImagePath?: string | null
}): Promise<string | null> {
  if (!msg.imageUrl) return null

  const id = `recv-${++requestId}`
  const imageUrl = msg.imageUrl
  return new Promise((resolve) => {
    pending.set(id, resolve)
    sendMessage({
      type: "saveReceivedImage",
      payload: { id, imageUrl, fileName: fileNameFromMessage(msg) },
    })
    window.setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id)
        resolve(null)
      }
    }, 30_000)
  })
}

/**
 * Ensures a permanently-saved local copy exists for a message's image, then
 * updates the stored message with the receiver's local path. Returns the
 * (possibly unchanged) message.
 */
export async function persistMessageImage(message: LocalMessage): Promise<LocalMessage> {
  if (!message.imageUrl || message.localImagePath) return message
  const localImagePath = await persistReceivedImage(message)
  if (!localImagePath) return message
  const updated: LocalMessage = { ...message, localImagePath }
  await upsertMessage(updated).catch(() => {})
  return updated
}

/**
 * Best-effort pass over a room's messages: saves a local copy of any image
 * that doesn't have one on this machine yet. Cheap when already saved — the
 * extension host skips the download if the file already exists.
 */
export async function persistRoomImageMessages(messages: LocalMessage[]): Promise<void> {
  for (const message of messages) {
    if (!message.imageUrl || message.localImagePath) continue
    void persistMessageImage(message)
  }
}