import type { Socket } from "socket.io-client"
import { apiRequest } from "../helpers/api"
import {
  queryUnsynced,
  markMessageSynced,
  upsertMessages,
  markMessageDelivered,
  fromServerMessage,
  type LocalMessage,
} from "../db/rxdb"

const chatBaseUrl: string =
  typeof window !== "undefined"
    ? (window as unknown as { __GITHUV_CHAT_URL__?: string }).__GITHUV_CHAT_URL__ ?? "http://localhost:4004"
    : "http://localhost:4004"

/**
 * Local-first sync: pushes every unsynced RxDB message up to the chat
 * microservice (MongoDB). Safe to call repeatedly; failed pushes keep the
 * message flagged `synced: false` so the next run retries it.
 */
export async function pushSyncedMessages(): Promise<void> {
  const unsynced = await queryUnsynced().catch(() => [] as LocalMessage[])
  if (!unsynced.length) return

  let pushed = 0
  try {
    const result = await apiRequest<{ success?: boolean; upserted?: number }>(
      "POST",
      `${chatBaseUrl}/api/messages/sync`,
      {
        messages: unsynced.map((m) => ({
          id: m.id,
          roomId: m.roomId,
          sender: m.sender,
          content: m.content,
          type: m.role,
          imageUrl: m.imageUrl ?? undefined,
          imagePublicId: m.imagePublicId ?? undefined,
          localImagePath: m.localImagePath ?? undefined,
          delivered: m.delivered,
          deliveredAt: m.deliveredAt ?? undefined,
          createdAt: m.timestamp,
        })),
      }
    )
    if (result?.success) {
      pushed = result.upserted ?? unsynced.length
    }
  } catch {
    // offline — local-first, retry on next call
  }

  if (pushed > 0) {
    for (const m of unsynced.slice(0, pushed)) {
      await markMessageSynced(m.id).catch(() => {})
    }
  }
}

export async function pullMessages(roomId: string): Promise<LocalMessage[]> {
  try {
    const result = await apiRequest<{ success?: boolean; messages?: unknown[] }>(
      "GET",
      `${chatBaseUrl}/api/messages/${encodeURIComponent(roomId)}`
    )
    const list = Array.isArray(result?.messages) ? result.messages : []
    const local = list.map((raw) => {
      const m = fromServerMessage({
        id: (raw as { id?: string }).id ?? "",
        sender: (raw as { sender?: string }).sender ?? "Githuv",
        content: (raw as { content?: string }).content ?? "",
        createdAt: (raw as { createdAt?: number | string }).createdAt,
        type: (raw as { type?: string }).type,
        imageUrl: (raw as { imageUrl?: string | null }).imageUrl,
        imagePublicId: (raw as { imagePublicId?: string | null }).imagePublicId,
        localImagePath: (raw as { localImagePath?: string | null }).localImagePath,
      })
      if (m.roomId !== roomId) {
        m.roomId = roomId
      }
      return m
    })
    // Additive merge only -- local messages that are not in the server list are
    // preserved so nothing the user has ever written is ever deleted.
    await upsertMessages(local)
    return local
  } catch {
    // offline — local-first, keep going
    return []
  }
}

/**
 * Best-effort full refresh of a room's history:
 * 1. push any local unsynced messages up to the server, then
 * 2. pull the complete server history back down (additive).
 * Returns the latest server-side list for the room.
 */
export async function syncRoom(roomId: string): Promise<LocalMessage[]> {
  await pushSyncedMessages()
  return pullMessages(roomId)
}

/**
 * Confirms a set of message ids as delivered so the server can shorten the
 * MongoDB TTL from 2 months to 7 days. Uses the Socket.IO `message-delivered`
 * event (which the server broadcasts back to the room) plus a REST fallback.
 */
export async function confirmDelivered(
  roomId: string,
  messageIds: string[],
  socket?: Socket | null
): Promise<void> {
  const ids = messageIds.filter(Boolean)
  if (!ids.length) return

  for (const id of ids) {
    await markMessageDelivered(id).catch(() => {})
  }

  if (socket?.connected) {
    socket.emit("message-delivered", ids)
  }

  try {
    await apiRequest("POST", `${chatBaseUrl}/api/messages/delivered`, { messageIds: ids })
  } catch {
    // offline — the socket event will re-confirm when reconnected
  }
}