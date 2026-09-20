import type { TaskPriority, TaskStatus } from "@shared/types"
import { useTaskStore } from "../store/taskStore"
import {
  PRIORITY_BADGE,
  PRIORITY_DOT,
  PRIORITY_LABELS,
  PRIORITY_ORDER,
  STATUS_BADGE,
  STATUS_LABELS,
  STATUS_ORDER,
  formatDate,
  formatDateTime,
} from "../utils/taskUtils"
import { UserBadge } from "./UserBadge"

export default function TaskDetails() {
  const selectedId = useTaskStore((s) => s.selectedId)
  const closeDetails = useTaskStore((s) => s.closeDetails)
  const tasks = useTaskStore((s) => s.tasks)
  const updateTask = useTaskStore((s) => s.updateTask)
  const deleteTask = useTaskStore((s) => s.deleteTask)
  const openEdit = useTaskStore((s) => s.openEdit)

  const task = tasks.find((t) => t.id === selectedId) ?? null

  if (!task) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={closeDetails}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg border border-[#30363d] bg-[#161b22] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1 rounded-full border border-[#f85149]/40 bg-[#f85149]/10 px-2 py-px text-[10px] font-medium text-[#f85149]">
              Task
            </div>
            <h2 className="mt-1.5 text-lg font-semibold leading-snug text-[#e6edf3]">{task.title}</h2>
          </div>
          <button
            type="button"
            onClick={closeDetails}
            className="rounded-md p-1 text-[#8b949e] transition-colors hover:bg-[#30363d] hover:text-[#e6edf3]"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {task.description ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#c9d1d9]">{task.description}</p>
        ) : (
          <p className="text-sm italic text-[#484f58]">No description</p>
        )}

        {task.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {task.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[#30363d] bg-[#21262d] px-2 py-px text-[10px] text-[#58a6ff]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#8b949e]">
              Status
            </label>
            <select
              value={task.status}
              onChange={(e) => void updateTask(task.id, { status: e.target.value as TaskStatus })}
              className={`w-full cursor-pointer rounded-lg border bg-[#0d1117] px-2.5 py-1.5 text-xs outline-none ${STATUS_BADGE[task.status]}`}
            >
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s} className="text-[#e6edf3]">
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#8b949e]">
              Priority
            </label>
            <select
              value={task.priority}
              onChange={(e) => void updateTask(task.id, { priority: e.target.value as TaskPriority })}
              className={`w-full cursor-pointer rounded-lg border bg-[#0d1117] px-2.5 py-1.5 text-xs outline-none ${PRIORITY_BADGE[task.priority]}`}
            >
              {PRIORITY_ORDER.map((p) => (
                <option key={p} value={p} className="text-[#e6edf3]">
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 space-y-2 text-xs text-[#8b949e]">
          <div className="flex items-center gap-2">
            <span className="w-20 shrink-0 text-[#484f58]">Assignee</span>
            {task.assignee ? (
              <UserBadge user={task.assignee} size="md" />
            ) : (
              <span className="text-[10px] italic text-[#484f58]">Unassigned</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="w-20 shrink-0 text-[#484f58]">Due Date</span>
            <span>{task.dueDate ? formatDate(task.dueDate) : "—"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-20 shrink-0 text-[#484f58]">Priority</span>
            <span className="inline-flex items-center gap-1">
              <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[task.priority]}`} />
              {PRIORITY_LABELS[task.priority]}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-20 shrink-0 text-[#484f58]">Repository</span>
            <span>{task.repository?.fullName ?? "—"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-20 shrink-0 text-[#484f58]">Created</span>
            <span className="flex items-center gap-1.5">
              <UserBadge user={task.createdBy} showName={false} />
              {task.createdBy.username} · {formatDateTime(task.createdAt)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-20 shrink-0 text-[#484f58]">Updated</span>
            <span>{formatDateTime(task.updatedAt)}</span>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-2 border-t border-[#21262d] pt-4">
          <button
            type="button"
            onClick={() => void deleteTask(task.id)}
            className="rounded-lg border border-[#f85149]/40 bg-[#f85149]/10 px-3 py-1.5 text-xs font-semibold text-[#f85149] transition-colors hover:bg-[#f85149]/20"
          >
            Delete Task
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={closeDetails}
              className="rounded-lg border border-[#30363d] px-3 py-1.5 text-xs text-[#8b949e] transition-colors hover:bg-[#30363d] hover:text-[#e6edf3]"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                closeDetails()
                openEdit(task)
              }}
              className="rounded-lg bg-[#238636] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#2ea043]"
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}