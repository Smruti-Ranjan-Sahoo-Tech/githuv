import type { Task, TaskPriority, TaskStatus, TaskUserRef } from "@shared/types"
import { apiRequest } from "../helpers/api"
import { useGithubAuthStore } from "../store/useGithubAuthStore"

const chatBaseUrl: string =
  typeof window !== "undefined"
    ? (window as unknown as { __GITHUV_CHAT_URL__?: string }).__GITHUV_CHAT_URL__ ??
      "https://githuv-8icz.onrender.com"
    : "https://githuv-8icz.onrender.com"

const STATUSES: TaskStatus[] = ["todo", "in_progress", "done"]
const PRIORITIES: TaskPriority[] = ["low", "medium", "high"]

function repoKeyOf(task: Task): string {
  if (!task.repository) return ""
  return `${task.repository.owner}/${task.repository.name}`.toLowerCase()
}

function authHeaders(): Record<string, string> | null {
  const { rawToken } = useGithubAuthStore.getState()
  if (!rawToken) return null
  return { Authorization: `Bearer ${rawToken}` }
}

function normalizeUserRef(value: unknown): TaskUserRef | null {
  if (!value || typeof value !== "object") return null
  const raw = value as { userId?: unknown; username?: unknown; avatar?: unknown }
  if (typeof raw.userId !== "string" || !raw.userId) return null
  if (typeof raw.username !== "string" || !raw.username) return null
  return {
    userId: raw.userId,
    username: raw.username,
    avatar: typeof raw.avatar === "string" ? raw.avatar : null,
  }
}

function normalizeServerTask(value: unknown): Task | null {
  if (!value || typeof value !== "object") return null
  const raw = value as Record<string, unknown>

  const id = typeof raw.id === "string" && raw.id ? raw.id : null
  const title = typeof raw.title === "string" && raw.title.trim() ? raw.title : null
  const createdAt = typeof raw.createdAt === "string" ? raw.createdAt : null
  const updatedAt = typeof raw.updatedAt === "string" ? raw.updatedAt : null
  if (!id || !title || !createdAt || !updatedAt) return null

  const createdBy = normalizeUserRef(raw.createdBy) ?? {
    userId: "unknown",
    username: "unknown",
    avatar: null,
  }

  return {
    id,
    title,
    description: typeof raw.description === "string" ? raw.description : null,
    status: STATUSES.includes(raw.status as TaskStatus) ? (raw.status as TaskStatus) : "todo",
    priority: PRIORITIES.includes(raw.priority as TaskPriority)
      ? (raw.priority as TaskPriority)
      : "medium",
    tags: Array.isArray(raw.tags) ? raw.tags.filter((t): t is string => typeof t === "string") : [],
    assignee: normalizeUserRef(raw.assignee),
    dueDate: typeof raw.dueDate === "string" ? raw.dueDate : null,
    repository:
      raw.repository && typeof raw.repository === "object"
        ? (() => {
            const r = raw.repository as { owner?: unknown; name?: unknown; fullName?: unknown }
            if (
              typeof r.owner === "string" &&
              typeof r.name === "string" &&
              typeof r.fullName === "string"
            ) {
              return { owner: r.owner, name: r.name, fullName: r.fullName }
            }
            return null
          })()
        : null,
    createdBy,
    createdAt,
    updatedAt,
  }
}

/** Current open repository key (`owner/repo` lowercased), or "" when none. */
export function currentRepoKey(): string {
  const { repoSession } = useGithubAuthStore.getState()
  if (repoSession?.repoOwner && repoSession?.repoName) {
    return `${repoSession.repoOwner}/${repoSession.repoName}`.toLowerCase()
  }
  return ""
}

/** Current open repository ref with original casing, or null when none. */
export function currentRepoRef(): Task["repository"] {
  const { repoSession } = useGithubAuthStore.getState()
  if (repoSession?.repoOwner && repoSession?.repoName) {
    return {
      owner: repoSession.repoOwner,
      name: repoSession.repoName,
      fullName: `${repoSession.repoOwner}/${repoSession.repoName}`,
    }
  }
  return null
}

export interface TaskPullResult {
  tasks: Task[]
  deletedIds: string[]
}

/**
 * Pulls the repository's task board. The server returns tasks of that
 * repository plus `deletedIds` (soft-deleted tasks) so the client can drop
 * them locally instead of re-pushing them back.
 */
export async function pullServerTasks(repoKey?: string): Promise<TaskPullResult> {
  const headers = authHeaders()
  if (!headers) return { tasks: [], deletedIds: [] }
  const key = repoKey ?? currentRepoKey()
  const url = key ? `${chatBaseUrl}/api/tasks?repoKey=${encodeURIComponent(key)}` : `${chatBaseUrl}/api/tasks`
  try {
    const result = await apiRequest<{
      success?: boolean
      tasks?: unknown[]
      deletedIds?: unknown[]
    }>("GET", url, undefined, headers)
    const tasks = Array.isArray(result?.tasks)
      ? result.tasks.map(normalizeServerTask).filter((t): t is Task => t !== null)
      : []
    const deletedIds = Array.isArray(result?.deletedIds)
      ? result.deletedIds.filter((id): id is string => typeof id === "string")
      : []
    return { tasks, deletedIds }
  } catch {
    return { tasks: [], deletedIds: [] }
  }
}

/** Pushes a set of tasks to the server (upsert by task id per user). */
export async function pushServerTasks(tasks: Task[]): Promise<void> {
  const headers = authHeaders()
  if (!headers || !tasks.length) return
  try {
    await apiRequest(
      "POST",
      `${chatBaseUrl}/api/tasks/sync`,
      {
        tasks: tasks.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          tags: t.tags,
          assignee: t.assignee,
          dueDate: t.dueDate,
          repository: t.repository,
          repoKey: repoKeyOf(t),
          createdBy: t.createdBy,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        })),
      },
      headers
    )
  } catch {
    // offline — next sync (startup / next mutation) retries
  }
}

export async function pushServerTask(task: Task): Promise<void> {
  await pushServerTasks([task])
}

export async function deleteServerTask(id: string, repoKey?: string): Promise<void> {
  const headers = authHeaders()
  if (!headers) return
  const key = repoKey ?? currentRepoKey()
  const query = key ? `?repoKey=${encodeURIComponent(key)}` : ""
  try {
    await apiRequest("DELETE", `${chatBaseUrl}/api/tasks/${encodeURIComponent(id)}${query}`, undefined, headers)
  } catch {
    // offline — the deletion will sync whenever the task list is next pushed
  }
}
