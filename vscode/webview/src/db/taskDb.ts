import { getDb } from "./rxdb"
import type { Task } from "../tasks/types/task"

export async function getAllTasks(): Promise<Task[]> {
  const d = await getDb()
  const docs = await d.collections.tasks.find({ sort: [{ createdAt: "desc" }] }).exec()
  return docs.map((doc) => doc.toJSON())
}

export async function upsertTask(task: Task): Promise<void> {
  const d = await getDb()
  await d.collections.tasks.upsert(task)
}

export async function upsertTasks(tasks: Task[]): Promise<void> {
  if (!tasks.length) return
  const d = await getDb()
  await d.collections.tasks.bulkUpsert(tasks)
}

export async function removeTask(id: string): Promise<void> {
  const d = await getDb()
  const doc = await d.collections.tasks.findOne(id).exec()
  if (doc) await doc.remove()
}

export async function watchTasks(callback: (tasks: Task[]) => void): Promise<() => void> {
  const d = await getDb()
  const query = d.collections.tasks.find({ sort: [{ createdAt: "desc" }] })
  const sub = query.$.subscribe({
    next: (docs) => callback(docs.map((doc) => doc.toJSON())),
  })
  return () => sub.unsubscribe()
}