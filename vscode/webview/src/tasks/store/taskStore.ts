import { create } from "zustand"
import type { Task, TaskPriority, TaskStatus, TaskUserRef } from "@shared/types"
import { uuid } from "../../helpers/uuid"
import { getAllTasks, upsertTask, upsertTasks, watchTasks } from "../../db/taskDb"
import {
  archiveTasks,
  deleteTaskPermanently,
  restoreTasksFromDisk,
  type TaskContext,
} from "../services/taskService"

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
  error: string | null
  initialized: boolean

  selectedId: string | null
  formOpen: boolean
  editingTask: Task | null

  filters: TaskFilters

  init: () => Promise<void>
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
  error: null,
  initialized: false,

  selectedId: null,
  formOpen: false,
  editingTask: null,

  filters: { ...defaultFilters },

  init: async () => {
    if (get().initialized) return
    set({ loading: true, error: null })
    try {
      const fromDisk = await restoreTasksFromDisk()
      const local = await getAllTasks()
      const merged = mergeTasks(fromDisk, local)
      if (merged.length) await upsertTasks(merged)
      set({ tasks: merged, loading: false, initialized: true })

      watchCleanup?.()
      watchCleanup = await watchTasks((tasks) => {
        set({ tasks })
        archiveTasks(tasks)
      })
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load tasks",
      })
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
      repository: input.repository ?? null,
      createdBy: input.createdBy ?? context.currentUser ?? {
        userId: "unknown",
        username: "unknown",
        avatar: null,
      },
      createdAt: now,
      updatedAt: now,
    }
    await upsertTask(task)
    return task
  },

  updateTask: async (id, patch) => {
    const existing = get().tasks.find((t) => t.id === id)
    if (!existing) return
    const updated: Task = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    }
    await upsertTask(updated)
  },

  deleteTask: async (id) => {
    await deleteTaskPermanently(id)
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

let watchCleanup: (() => void) | undefined