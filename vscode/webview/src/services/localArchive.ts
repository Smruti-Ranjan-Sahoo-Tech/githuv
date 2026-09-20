import type { SavedChatMessage } from "@shared/types"
import { sendMessage, receiveMessage } from "../helpers/postMessage"
import { upsertMessages, getRoomMessages, type LocalMessage } from "../db/rxdb"

let savedMessagesResolver: ((messages: SavedChatMessage[]) => void) | null = null

const savedMessagesListener = receiveMessage((message) => {
  if (message.type === "savedMessages") {
    savedMessagesResolver?.(message.payload.messages)
    savedMessagesResolver = null
  }
})

/**
 * Loads the durable on-disk archive (.githuv/messages-<roomId>.json) back into
 * the local message store. Returns the restored messages so the UI can show
 * them immediately, before the server pull completes.
 */
export async function restoreRoomMessages(roomId: string): Promise<LocalMessage[]> {
  const messages = await new Promise<SavedChatMessage[]>((resolve) => {
    savedMessagesResolver = resolve
    sendMessage({ type: "getSavedMessages", payload: { roomId } })
    // Never block the room load on the extension host responding.
    window.setTimeout(() => {
      if (savedMessagesResolver === resolve) {
        savedMessagesResolver = null
        resolve([])
      }
    }, 1500)
  })

  const local: LocalMessage[] = messages.map((m) => ({
    id: m.id,
    roomId,
    sender: m.sender ?? (m.role === "system" ? "System" : "Githuv"),
    role: m.role,
    content: m.content,
    imageUrl: m.imageUrl ?? null,
    imagePublicId: m.imagePublicId ?? null,
    localImagePath: m.localImagePath ?? m.imageLocalPath ?? null,
    timestamp: m.timestamp,
    synced: true,
    delivered: true,
    deliveredAt: null,
  }))

  await upsertMessages(local)
  return local
}

let archiveTimer: number | undefined

/**
 * Persists the current room history to the local file archive (debounced).
 * Safely callable after any message change.
 */
export async function archiveRoomMessages(roomId: string): Promise<void> {
  if (typeof window !== "undefined") {
    window.clearTimeout(archiveTimer)
    archiveTimer = window.setTimeout(() => {
      void writeArchive(roomId)
    }, 600)
  } else {
    void writeArchive(roomId)
  }
}

async function writeArchive(roomId: string) {
  try {
    const messages = await getRoomMessages(roomId)
    if (!messages.length) return
    const saved: SavedChatMessage[] = messages.map((m) => ({
      id: m.id,
      roomId: m.roomId,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
      sender: m.sender,
      imageUrl: m.imageUrl ?? undefined,
      imagePublicId: m.imagePublicId ?? undefined,
      localImagePath: m.localImagePath ?? undefined,
    }))
    sendMessage({ type: "saveMessages", payload: { roomId, messages: saved } })
  } catch {
    // offline cache write failed — server remains the source of truth
  }
}