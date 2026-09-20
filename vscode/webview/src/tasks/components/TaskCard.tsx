import { useState } from "react"
import type { Task, TaskPriority, TaskStatus } from "@shared/types"
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
} from "../utils/taskUtils"
import { UserBadge } from "./UserBadge"

interface TaskCardProps {
  task: Task
}

function ConfirmedButton({
  label,
  confirmLabel,
  onConfirm,
  className,
  title,
}: {
  label: string
  confirmLabel: string
  onConfirm: () => void
  className?: string
  title?: string
}) {
  const [armed, setArmed] = useState(false)
  return (
    <button
      type="button"
      title={title}
      onClick={() => {
        if (!armed) {
          setArmed(true)
          return
        }
        onConfirm()
      }}
      onBlur={() => setArmed(false)}
      className={
        armed
          ? `rounded px-1.5 py-0.5 text-[10px] font-semibold transition-colors ${className ?? ""}`
          : `rounded px-1.5 py-0.5 text-[10px] transition-colors ${className ?? ""}`
      }
    >
      {armed ? confirmLabel : label}
    </button>
  )
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="cursor-pointer rounded border border-[#30363d] bg-[#0d1117] px-1.5 py-0.5 text-[10px] text-[#8b949e] outline-none transition-colors hover:border-[#58a6ff]"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

export default function TaskCard({ task }: TaskCardProps) {
  const openDetails = useTaskStore((s) => s.openDetails)
  const openEdit = useTaskStore((s) => s.openEdit)
  const updateTask = useTaskStore((s) => s.updateTask)
  const deleteTask = useTaskStore((s) => s.deleteTask)

  return (
    <div className="group rounded-lg border border-[#30363d] bg-[#161b22] p-3 transition-colors hover:border-[#58a6ff]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openDetails(task.id)}
              className="min-w-0 truncate text-left text-sm font-semibold text-[#e6edf3] transition-colors hover:text-[#58a6ff]"
            >
              {task.title}
            </button>
            <span
              className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-px text-[10px] font-medium ${PRIORITY_BADGE[task.priority]}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[task.priority]}`} />
              {PRIORITY_LABELS[task.priority]}
            </span>
          </div>

          {task.description && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#8b949e]">
              {task.description}
            </p>
          )}

          {task.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1">
              {task.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[#30363d] bg-[#21262d] px-1.5 py-px text-[10px] text-[#58a6ff]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#8b949e]">
            {task.assignee ? (
              <UserBadge user={task.assignee} />
            ) : (
              <span className="text-[10px] italic text-[#484f58]">Unassigned</span>
            )}
            <span
              className={`rounded-full border px-2 py-px text-[10px] font-medium ${STATUS_BADGE[task.status]}`}
            >
              {STATUS_LABELS[task.status]}
            </span>
            {task.dueDate && <span>Due {formatDate(task.dueDate)}</span>}
            {task.repository && (
              <span className="truncate text-[10px] text-[#484f58]">
                {task.repository.fullName}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <div className="flex gap-1">
            <Select
              value={task.status}
              onChange={(v) => void updateTask(task.id, { status: v as TaskStatus })}
              options={STATUS_ORDER.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
            />
            <Select
              value={task.priority}
              onChange={(v) => void updateTask(task.id, { priority: v as TaskPriority })}
              options={PRIORITY_ORDER.map((p) => ({ value: p, label: PRIORITY_LABELS[p] }))}
            />
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              title="Edit task"
              onClick={() => openEdit(task)}
              className="rounded p-1 text-[#8b949e] transition-colors hover:bg-[#30363d] hover:text-[#e6edf3]"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <ConfirmedButton
              label="🗑"
              confirmLabel="Confirm?"
              onConfirm={() => void deleteTask(task.id)}
              className="text-[#8b949e] hover:bg-[#f85149]/20 hover:text-[#f85149]"
              title="Delete task"
            />
          </div>
        </div>
      </div>
    </div>
  )
}