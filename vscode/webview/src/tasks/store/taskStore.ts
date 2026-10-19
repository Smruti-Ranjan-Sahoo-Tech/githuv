import { create } from "zustand"
import type { Task, TaskPriority, TaskStatus, TaskUserRef } from "@shared/types"
import { uuid } from "../../helpers/uuid"
import { getAllTasks, removeTask, upsertTask, upsertTasks, watchTasks } from "../../db/taskDb"
import {
  archiveTasks,
  deleteTaskPermanently,
  restoreTasksFromDisk,
  type TaskContext,
} from "../services/taskService"
import {
  currentRepoKey,
  currentRepoRef,
  deleteServerTask,
  pullServerTasks,
  pushServerTask,
  pushServerTasks,
} from "../../services/taskSyncService"
import { connectWS } from "../../config/WS"
import { useGithubAuthStore } from "../../store/useGithubAuthStore"

export type StatusFilter = "all" | TaskStatus
export type PriorityFilter = "all" | TaskPriority

export interface TaskInput {
  title: string
  description?: string | null
  status?: TaskStatus
  priority?: TaskPriority
  tags?: string[]
  assignee?: TaskUserRef | null
  dueDate?: string | null
  repository?: TaskContext["repository"]
  createdBy?: TaskUserRef
}

interface TaskFilters {
  status: StatusFilter
  priority: PriorityFilter
  tag: string | null
  assignee: string | null
  search: string
}

interface TaskStore {
  tasks: Task[]
  loading: boolean
  refreshing: boolean
  error: string | null
  initialized: boolean
  /** `owner/repo` the store is scoped to ("" = no repo open, null = not resolved yet). */
  repoScope: string | null

  selectedId: string | null
  formOpen: boolean
  editingTask: Task | null

  filters: TaskFilters

  init: () => Promise<void>
  refresh: () => Promise<void>
  refreshRepoScope: () => Promise<void>
  createTask: (input: TaskInput, context: TaskContext) => Promise<Task>
  updateTask: (id: string, patch: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>

  openDetails: (id: string) => void
  closeDetails: () => void
  openCreate: () => void
  openEdit: (task: Task) => void
  closeForm: () => void

  setFilters: (patch: Partial<TaskFilters>) => void
  clearFilters: () => void
}

const defaultFilters: TaskFilters = {
  status: "all",
  priority: "all",
  tag: null,
  assignee: null,
  search: "",
}

export function filterTasks(tasks: Task[], filters: TaskFilters): Task[] {
  const q = filters.search.trim().toLowerCase()
  return tasks.filter((t) => {
    if (filters.status !== "all" && t.status !== filters.status) return false
    if (filters.priority !== "all" && t.priority !== filters.priority) return false
    if (filters.tag && !t.tags.includes(filters.tag)) return false
    if (filters.assignee && t.assignee?.userId !== filters.assignee) return false
    if (q) {
      const haystack = [t.title, t.description ?? "", ...t.tags].join(" ").toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  loading: false,
  refreshing: false,
  error: null,
  initialized: false,
  repoScope: null,

  selectedId: null,
  formOpen: false,
  editingTask: null,

  filters: { ...defaultFilters },

  init: async () => {
    if (get().initialized) return
    set({ loading: true, error: null, repoScope: currentRepoKey() })
    try {
      const fromDisk = await restoreTasksFromDisk()
      const local = await getAllTasks()
      let merged = mergeTasks(fromDisk, local)
      // Legacy tasks (created before tasks were repository-specific) are
      // adopted into the currently open repository so they never bleed into
      // other repositories.
      merged = await adoptUnscopedTasks(merged, get().repoScope)
      if (merged.length) await upsertTasks(merged)
      const scoped = merged.filter((t) => inScope(t, get().repoScope))
      set({ tasks: scoped, loading: false, initialized: true })

      watchCleanup?.()
      watchCleanup = await watchTasks((tasks) => {
        set({ tasks: tasks.filter((t) => inScope(t, get().repoScope)) })
        archiveTasks(tasks)
      })

      watchTaskRoom(get().repoScope)

      // Durable cloud sync: pull anything saved from other machines, then
      // push anything this machine has that the server does not know about.
      // Only tasks of the open repository take part.
      void syncWithServer(scoped).catch(() => {})
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load tasks",
      })
    }
  },

  refresh: async () => {
    if (get().refreshing) return
    set({ refreshing: true })
    try {
      await syncWithServer(get().tasks)
    } finally {
      set({ refreshing: false })
    }
  },

  refreshRepoScope: async () => {
    const scope = currentRepoKey()
    if (scope === get().repoScope) return
    set({ repoScope: scope })
    watchTaskRoom(scope)
    if (!get().initialized) return
    try {
      const all = await getAllTasks()
      const scoped = (await adoptUnscopedTasks(all, scope)).filter((t) => inScope(t, scope))
      set({ tasks: scoped })
      void syncWithServer(scoped).catch(() => {})
    } catch {
      // keep whatever is currently shown
    }
  },

  createTask: async (input, context) => {
    if (!input.title.trim()) {
      throw new Error("Title is required")
    }
    const now = new Date().toISOString()
    const task: Task = {
      id: uuid(),
      title: input.title.trim(),
      description: input.description?.trim() ? input.description.trim() : null,
      status: input.status ?? "todo",
      priority: input.priority ?? "medium",
      tags: Array.from(new Set(input.tags?.map((t) => t.trim().replace(/^#/, "")).filter(Boolean) ?? [])),
      assignee: input.assignee ?? null,
      dueDate: input.dueDate ?? null,
      repository: input.repository ?? context.repository,
      createdBy: input.createdBy ?? context.currentUser ?? {
        userId: "unknown",
        username: "unknown",
        avatar: null,
      },
      createdAt: now,
      updatedAt: now,
    }
    await upsertTask(task)
    void pushServerTask(task)
    return task
  },

  updateTask: async (id, patch) => {
    const existing = get().tasks.find((t) => t.id === id)
    if (!existing) return
    const updated: Task = {
      ...existing,
      ...patch,
      // Editing a legacy task (created before tasks were repository-specific)
      // inside a repository adopts it into that repository.
      repository: patch.repository ?? existing.repository ?? currentRepoRef(),
      updatedAt: new Date().toISOString(),
    }
    await upsertTask(updated)
    void pushServerTask(updated)
  },

  deleteTask: async (id) => {
    await deleteTaskPermanently(id)
    void deleteServerTask(id)
    if (get().selectedId === id) set({ selectedId: null })
  },

  openDetails: (id) => set({ selectedId: id }),
  closeDetails: () => set({ selectedId: null }),
  openCreate: () => set({ formOpen: true, editingTask: null }),
  openEdit: (task) => set({ formOpen: true, editingTask: task }),
  closeForm: () => set({ formOpen: false, editingTask: null }),

  setFilters: (patch) => set({ filters: { ...get().filters, ...patch } }),
  clearFilters: () => set({ filters: { ...defaultFilters } }),
}))

function mergeTasks(a: Task[], b: Task[]): Task[] {
  const map = new Map<string, Task>()
  for (const t of [...a, ...b]) map.set(t.id, t)
  return Array.from(map.values()).sort((x, y) => (x.createdAt < y.createdAt ? 1 : -1))
}

function taskRepoKey(task: Task): string {
  if (!task.repository) return ""
  return `${task.repository.owner}/${task.repository.name}`.toLowerCase()
}

/**
 * Strict repository scoping: with a repository open only its own tasks are
 * shown — tasks of any other repository never appear.
 */
function inScope(task: Task, scope: string | null): boolean {
  if (scope === null) return true
  return taskRepoKey(task) === scope
}

/** Attaches the open repository to legacy tasks that have none. */
async function adoptUnscopedTasks(tasks: Task[], scope: string | null): Promise<Task[]> {
  const ref = scope ? currentRepoRef() : null
  if (!ref) return tasks
  const adopted: Task[] = []
  const mapped = tasks.map((t) => {
    if (t.repository) return t
    const next = { ...t, repository: ref }
    adopted.push(next)
    return next
  })
  if (adopted.length) await upsertTasks(adopted)
  return mapped
}

/**
 * Reconciles the local board with the server: drops locally deleted tasks
 * (server tombstones), pulls new/updated tasks from other users, and pushes
 * anything local that the server does not have yet. Newest `updatedAt` wins.
 */
async function syncWithServer(local: Task[]): Promise<void> {
  const key = currentRepoKey()
  const { tasks: server, deletedIds } = await pullServerTasks(key)

  const deleted = new Set(deletedIds)
  if (deleted.size) {
    const localIds = new Set(local.map((t) => t.id))
    for (const id of deleted) {
      if (localIds.has(id)) await removeTask(id)
    }
  }
  const liveLocal = deleted.size ? local.filter((t) => !deleted.has(t.id)) : local

  const serverById = new Map(server.map((t) => [t.id, t]))
  const localById = new Map(liveLocal.map((t) => [t.id, t]))

  const toLocal: Task[] = []
  const toServer: Task[] = []

  const ids = new Set([...localById.keys(), ...serverById.keys()])
  for (const id of ids) {
    const mine = localById.get(id)
    const remote = serverById.get(id)
    if (!mine && remote) {
      toLocal.push(remote)
    } else if (mine && !remote) {
      toServer.push(mine)
    } else if (mine && remote) {
      if (remote.updatedAt > mine.updatedAt) toLocal.push(remote)
      else if (mine.updatedAt > remote.updatedAt) toServer.push(mine)
    }
  }

  if (toLocal.length) await upsertTasks(toLocal)
  if (toServer.length) await pushServerTasks(toServer)
}

let watchCleanup: (() => void) | undefined
let taskSocketCleanup: (() => void) | undefined
let taskChangeTimer: number | undefined

/**
 * Subscribes to the repository's task room so the board auto-refreshes the
 * moment any user of this repository creates, edits or deletes a task.
 */
function watchTaskRoom(scope: string | null): void {
  taskSocketCleanup?.()
  taskSocketCleanup = undefined
  if (!scope) return

  const token = useGithubAuthStore.getState().rawToken
  if (!token) return

  const socket = connectWS(token)
  const join = () => socket.emit("join-tasks", { repoKey: scope })
  const onChanged = () => {
    if (taskChangeTimer) window.clearTimeout(taskChangeTimer)
    taskChangeTimer = window.setTimeout(() => {
      taskChangeTimer = undefined
      void useTaskStore.getState().refresh()
    }, 300)
  }

  socket.on("connect", join)
  socket.on("tasks-changed", onChanged)

  taskSocketCleanup = () => {
    if (taskChangeTimer) {
      window.clearTimeout(taskChangeTimer)
      taskChangeTimer = undefined
    }
    socket.off("connect", join)
    socket.off("tasks-changed", onChanged)
    socket.disconnect()
  }
}