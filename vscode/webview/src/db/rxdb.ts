import {
  createRxDatabase,
  addRxPlugin,
  type RxCollection,
  type RxDatabase,
  type RxJsonSchema,
} from "rxdb"
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie"
import { getRxStorageMemory } from "rxdb/plugins/storage-memory"
import { RxDBMigrationSchemaPlugin } from "rxdb/plugins/migration-schema"
import type { Task } from "../tasks/types/task"
import { taskSchema } from "./taskSchema"

addRxPlugin(RxDBMigrationSchemaPlugin)

export type MessageRole = "user" | "assistant" | "system"

export interface LocalMessage {
  id: string
  roomId: string
  sender: string
  role: MessageRole
  content: string
  imageUrl: string | null
  imagePublicId: string | null
  localImagePath: string | null
  timestamp: number
  synced: boolean
  delivered: boolean
  deliveredAt: number | null
}

const messageSchema: RxJsonSchema<LocalMessage> = {
  title: "messages",
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 100 },
    roomId: { type: "string", maxLength: 1024 },
    sender: { type: "string", maxLength: 255 },
    role: { type: "string", maxLength: 20 },
    content: { type: "string" },
    imageUrl: { type: ["string", "null"], default: null },
    imagePublicId: { type: ["string", "null"], default: null },
    localImagePath: { type: ["string", "null"], default: null },
    timestamp: { type: "number", minimum: 0, maximum: 99999999999999, multipleOf: 1 },
    synced: { type: "boolean", default: false },
    delivered: { type: "boolean", default: false },
    deliveredAt: { type: ["number", "null"], default: null },
  },
  required: ["id", "roomId", "sender", "role", "content", "timestamp", "synced", "delivered"],
  indexes: ["roomId", ["roomId", "timestamp"]],
}

type MessageCollection = RxCollection<LocalMessage, {}, {}, any>
type TaskCollection = RxCollection<Task, {}, {}, any>

let dbPromise: Promise<RxDatabase> | null = null
const DB_NAME = "githuv-chat"

const hasIndexedDB = (): boolean =>
  typeof indexedDB !== "undefined" && typeof indexedDB.open === "function"

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function openDb(storage: ReturnType<typeof getRxStorageDexie> | ReturnType<typeof getRxStorageMemory>): Promise<RxDatabase> {
  const database = await createRxDatabase<{
    messages: MessageCollection
    tasks: TaskCollection
  }>({
    name: DB_NAME,
    storage,
    multiInstance: false,
  })
  if (!database.collections.messages) {
    await database.addCollections({ messages: { schema: messageSchema } })
  }
  if (!database.collections.tasks) {
    await database.addCollections({ tasks: { schema: taskSchema } })
  }
  return database as unknown as RxDatabase
}

function createDb(): Promise<RxDatabase> {
  if (!hasIndexedDB()) {
    // No IndexedDB in this runtime (e.g. restricted webview). The server
    // (MongoDB) is the source of truth, so an in-memory cache still lets the
    // user read and write chat history for the current session.
    return openDb(getRxStorageMemory())
  }

  // The server stores all messages, so the local IndexedDB is only a cache.
  // Never delete it automatically -- if the cache is corrupted we simply
  // rebuild an empty one and re-pull history from the server.
  return openDb(getRxStorageDexie()).catch(async (err) => {
    console.error("[githuv] RxDB dexie bootstrap failed, retrying…:", err)
    await delay(250)
    return openDb(getRxStorageDexie()).catch(async (err2) => {
      // IndexedDB unusable (blocked/private mode). Fall back to memory for
      // this session; history will still be re-pulled from the server.
      console.error("[githuv] IndexedDB unusable, falling back to memory storage:", err2)
      return openDb(getRxStorageMemory())
    })
  })
}

export async function getDb(): Promise<RxDatabase> {
  if (!dbPromise) {
    dbPromise = createDb().catch((err) => {
      // Never cache a rejected promise: a later call (e.g. after a webview
      // reload or once IndexedDB becomes available) should be able to retry.
      dbPromise = null
      throw err
    })
  }
  return dbPromise
}

export async function upsertMessage(message: LocalMessage): Promise<void> {
  return upsertMessages([message])
}

export async function upsertMessages(messages: LocalMessage[]): Promise<void> {
  if (!messages.length) return
  const d = await getDb()
  await d.collections.messages.bulkUpsert(messages)
}

export async function getRoomMessages(roomId: string): Promise<LocalMessage[]> {
  const d = await getDb()
  const docs = await d.collections.messages
    .find({ selector: { roomId }, sort: [{ timestamp: "asc" }] })
    .exec()
  return docs.map((doc) => doc.toJSON())
}

export async function queryUnsynced(): Promise<LocalMessage[]> {
  const d = await getDb()
  const docs = await d.collections.messages
    .find({ selector: { synced: false }, sort: [{ timestamp: "asc" }] })
    .exec()
  return docs.map((doc) => doc.toJSON())
}

export async function markMessageSynced(id: string): Promise<void> {
  const d = await getDb()
  const doc = await d.collections.messages.findOne(id).exec()
  if (doc) await doc.incrementalPatch({ synced: true })
}

export async function markMessageDelivered(id: string): Promise<void> {
  const d = await getDb()
  const doc = await d.collections.messages.findOne(id).exec()
  if (doc) await doc.incrementalPatch({ delivered: true, deliveredAt: Date.now() })
}

export async function watchRoomMessages(
  roomId: string,
  callback: (messages: LocalMessage[]) => void
): Promise<() => void> {
  const d = await getDb()
  const query = d.collections.messages.find({
    selector: { roomId },
    sort: [{ timestamp: "asc" }],
  })
  const sub = query.$.subscribe({
    next: (docs) => callback(docs.map((doc) => doc.toJSON())),
  })
  return () => sub.unsubscribe()
}

export function fromServerMessage(msg: {
  id: string
  sender: string
  message?: string
  content?: string
  time?: number
  createdAt?: number | string
  type?: string
  imageUrl?: string | null
  imagePublicId?: string | null
  localImagePath?: string | null
}): LocalMessage {
  const timestamp = (msg.time ?? new Date(msg.createdAt ?? Date.now()).getTime()) as number
  const role: MessageRole =
    msg.type === "system" ? "system" : msg.sender?.toLowerCase() === "githuv" ? "assistant" : "user"
  return {
    id: msg.id,
    roomId: "",
    sender: msg.sender,
    role,
    content: msg.message ?? msg.content ?? "",
    imageUrl: msg.imageUrl ?? null,
    imagePublicId: msg.imagePublicId ?? null,
    localImagePath: msg.localImagePath ?? null,
    timestamp,
    synced: true,
    delivered: true,
    deliveredAt: null,
  }
}