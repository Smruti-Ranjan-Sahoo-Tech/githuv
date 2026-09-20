import type { Task } from "@shared/types"
import { sendMessage, receiveMessage } from "../../helpers/postMessage"
import { getWorkspaceInfo } from "../../helpers/extensionBridge"
import { useGithubAuthStore } from "../../store/useGithubAuthStore"
import { githubAvatarUrl, normalizeUserRef } from "../utils/taskUtils"
import { upsertTasks, removeTask } from "../../db/taskDb"

export interface TaskContext {
  currentUser: {
    userId: string
    username: string
    avatar: string | null
  } | null
  repository: {
    owner: string
    name: string
    fullName: string
  } | null
}

/**
 * Builds the default context for a new task: the current authenticated member
 * is always used as creator, and the detected GitHub repository (if any) is
 * attached automatically so the user never has to type it manually.
 */
export async function getTaskContext(): Promise<TaskContext> {
  const { username, authToken, rawToken } = useGithubAuthStore.getState()

  let repository: TaskContext["repository"] = null
  try {
    const ws = await getWorkspaceInfo()
    if (ws.isRepo && ws.repoOwner && ws.repoName) {
      repository = {
        owner: ws.repoOwner,
        name: ws.repoName,
        fullName: `${ws.repoOwner}/${ws.repoName}`,
      }
    }
  } catch {
    // repository detection is best-effort — tasks still work without it
  }

  const currentUser = normalizeUserRef({
    userId: authToken?.uid ?? rawToken ?? username ?? undefined,
    username: username ?? undefined,
    avatar: username ? githubAvatarUrl(username) : undefined,
  })

  return { currentUser, repository }
}

// ---------------------------------------------------------------------------
// Durable on-disk archive (.githuv/tasks.json), mirroring the chat message
// archive pattern. IndexedDB is the primary store; this file keeps tasks after
// the webview is recreated so persistence survives an extension reload.
// ---------------------------------------------------------------------------

let savedTasksResolver: ((tasks: Task[]) => void) | null = null

const savedTasksListener = receiveMessage((message) => {
  if (message.type === "savedTasks") {
    savedTasksResolver?.(message.payload.tasks)
    savedTasksResolver = null
  }
})

export async function restoreTasksFromDisk(): Promise<Task[]> {
  const tasks = await new Promise<Task[]>((resolve) => {
    savedTasksResolver = resolve
    sendMessage({ type: "getSavedTasks" })
    window.setTimeout(() => {
      if (savedTasksResolver === resolve) {
        savedTasksResolver = null
        resolve([])
      }
    }, 1500)
  })
  if (tasks.length) {
    await upsertTasks(tasks)
  }
  return tasks
}

let archiveTimer: number | undefined

export function archiveTasks(tasks: Task[]): void {
  if (typeof window !== "undefined") {
    window.clearTimeout(archiveTimer)
    archiveTimer = window.setTimeout(() => {
      sendMessage({ type: "saveTasks", payload: { tasks } })
    }, 400)
  } else {
    sendMessage({ type: "saveTasks", payload: { tasks } })
  }
}

export async function deleteTaskPermanently(id: string): Promise<void> {
  await removeTask(id)
}

// Keep the listener referenced so bundlers never tree-shake it.
void savedTasksListener