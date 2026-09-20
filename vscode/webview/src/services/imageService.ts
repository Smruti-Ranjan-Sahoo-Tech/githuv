import { sendMessage } from "../helpers/postMessage"
import type { ExtensionMessage, UploadImageResultPayload } from "@shared/types"

const pending = new Map<string, { resolve: (v: UploadImageResultPayload) => void; reject: (e: Error) => void }>()
let uploadId = 0

const listener = (event: MessageEvent<ExtensionMessage>) => {
  const msg = event.data
  if (msg.type !== "uploadImageResult") return
  const p = pending.get(msg.payload.id)
  if (!p) return
  pending.delete(msg.payload.id)
  if (msg.payload.success) p.resolve(msg.payload)
  else p.reject(new Error(msg.payload.error ?? "Image upload failed"))
}

if (typeof window !== "undefined") {
  window.addEventListener("message", listener)
}

/**
 * Uploads an image picked in the chat UI. The extension host streams it to
 * Cloudinary (temporary, 7-day TTL) and writes a permanent local copy to
 * `<workspace>/.githuv/images/`.
 */
export function uploadImage(dataUrl: string, fileName: string, roomId: string): Promise<UploadImageResultPayload> {
  return new Promise((resolve, reject) => {
    const id = `${++uploadId}`
    pending.set(id, { resolve, reject })
    sendMessage({
      type: "uploadImage",
      payload: { id, roomId, dataUrl, fileName },
    })
    setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id)
        reject(new Error("Image upload timed out"))
      }
    }, 60_000)
  })
}