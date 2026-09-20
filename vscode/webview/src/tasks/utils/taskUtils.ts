import type { Task, TaskPriority, TaskStatus, TaskUserRef } from "@shared/types"

export const STATUS_ORDER: TaskStatus[] = ["todo", "in_progress", "done"]

export const PRIORITY_ORDER: TaskPriority[] = ["low", "medium", "high"]

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "Todo",
  in_progress: "In Progress",
  done: "Done",
}

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
}

export const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: "text-[#8b949e]",
  in_progress: "text-[#d29922]",
  done: "text-[#3fb950]",
}

export const STATUS_BADGE: Record<TaskStatus, string> = {
  todo: "border-[#30363d] bg-[#161b22] text-[#8b949e]",
  in_progress: "border-[#d29922]/40 bg-[#d29922]/10 text-[#d29922]",
  done: "border-[#3fb950]/40 bg-[#3fb950]/10 text-[#3fb950]",
}

export const PRIORITY_BADGE: Record<TaskPriority, string> = {
  high: "border-[#f85149]/40 bg-[#f85149]/10 text-[#f85149]",
  medium: "border-[#d29922]/40 bg-[#d29922]/10 text-[#d29922]",
  low: "border-[#30363d] bg-[#21262d] text-[#8b949e]",
}

export const PRIORITY_DOT: Record<TaskPriority, string> = {
  high: "bg-[#f85149]",
  medium: "bg-[#d29922]",
  low: "bg-[#8b949e]",
}

export function githubAvatarUrl(login: string): string {
  return `https://github.com/${encodeURIComponent(login)}.png?size=64`
}

export function formatDate(iso: string | null): string {
  if (!iso) return ""
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return ""
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString([], { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

export function initialsOf(user: TaskUserRef | null | undefined): string {
  return (user?.username ?? "?").slice(0, 2).toUpperCase()
}

export function normalizeUserRef(user: Partial<TaskUserRef> | null | undefined): TaskUserRef | null {
  if (!user || !user.userId || !user.username) return null
  return {
    userId: user.userId,
    username: user.username,
    avatar: user.avatar ?? githubAvatarUrl(user.username),
  }
}

export function parseTags(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(/[,#\s]+/)
        .map((t) => t.trim().replace(/^#/, ""))
        .filter(Boolean)
    )
  )
}

export function uniqueTags(tasks: Task[]): string[] {
  return Array.from(new Set(tasks.flatMap((t) => t.tags))).sort((a, b) =>
    a.localeCompare(b)
  )
}

export function uniqueAssignees(tasks: Task[]): TaskUserRef[] {
  const map = new Map<string, TaskUserRef>()
  for (const t of tasks) {
    if (t.assignee && !map.has(t.assignee.userId)) {
      map.set(t.assignee.userId, t.assignee)
    }
  }
  return Array.from(map.values()).sort((a, b) => a.username.localeCompare(b.username))
}

export function toInputDate(iso: string | null | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function fromInputDate(value: string): string | null {
  if (!value) return null
  const d = new Date(`${value}T12:00:00`)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}