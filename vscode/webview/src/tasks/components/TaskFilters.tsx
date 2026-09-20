import { useTaskStore } from "../store/taskStore"
import { uniqueAssignees, uniqueTags } from "../utils/taskUtils"
import type { TaskUserRef } from "@shared/types"
import { UserBadge } from "./UserBadge"

const STATUS_PILLS: { value: "all" | "todo" | "in_progress" | "done"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
]

const PRIORITY_OPTIONS = [
  { value: "all", label: "All priorities" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
]

function Select({
  value,
  onChange,
  children,
}: {
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="cursor-pointer rounded-lg border border-[#30363d] bg-[#161b22] px-2.5 py-1.5 text-xs text-[#8b949e] outline-none transition-colors hover:border-[#58a6ff] focus:border-[#58a6ff]"
    >
      {children}
    </select>
  )
}

export default function TaskFilters() {
  const filters = useTaskStore((s) => s.filters)
  const setFilters = useTaskStore((s) => s.setFilters)
  const clearFilters = useTaskStore((s) => s.clearFilters)
  const tasks = useTaskStore((s) => s.tasks)

  const tags = uniqueTags(tasks)
  const assignees = uniqueAssignees(tasks)
  const hasActiveFilters =
    filters.status !== "all" ||
    filters.priority !== "all" ||
    filters.tag !== null ||
    filters.assignee !== null ||
    filters.search.trim() !== ""

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-[#21262d] bg-[#161b22] px-4 pb-3 pt-2">
      <div className="flex items-center gap-1">
        {STATUS_PILLS.map((pill) => (
          <button
            key={pill.value}
            type="button"
            onClick={() => setFilters({ status: pill.value })}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filters.status === pill.value
                ? "bg-[#238636] text-white"
                : "text-[#8b949e] hover:bg-[#30363d] hover:text-[#e6edf3]"
            }`}
          >
            {pill.label}
          </button>
        ))}
      </div>

      <Select value={filters.priority} onChange={(v) => setFilters({ priority: v as never })}>
        {PRIORITY_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>

      <Select value={filters.tag ?? "all"} onChange={(v) => setFilters({ tag: v === "all" ? null : v })}>
        <option value="all">All tags</option>
        {tags.map((tag) => (
          <option key={tag} value={tag}>
            #{tag}
          </option>
        ))}
      </Select>

      <Select
        value={filters.assignee ?? "all"}
        onChange={(v) => setFilters({ assignee: v === "all" ? null : v })}
      >
        <option value="all">All assignees</option>
        {assignees.map((a) => (
          <option key={a.userId} value={a.userId}>
            {a.username}
          </option>
        ))}
      </Select>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="rounded-lg px-2.5 py-1.5 text-xs text-[#58a6ff] transition-colors hover:bg-[#58a6ff]/10"
        >
          Clear filters
        </button>
      )}

      <MemberHint assignees={assignees} />
    </div>
  )
}

function MemberHint({ assignees }: { assignees: TaskUserRef[] }) {
  if (assignees.length <= 1) return null
  return (
    <span className="ml-auto hidden items-center gap-1.5 lg:flex">
      {assignees.slice(0, 4).map((a) => (
        <UserBadge key={a.userId} user={a} showName={false} />
      ))}
    </span>
  )
}