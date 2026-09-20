import { useEffect, useMemo, useState } from "react"
import type { TaskPriority, TaskStatus, TaskUserRef } from "@shared/types"
import { useTaskStore, type TaskInput } from "../store/taskStore"
import type { TaskContext } from "../services/taskService"
import {
  PRIORITY_LABELS,
  PRIORITY_ORDER,
  STATUS_LABELS,
  STATUS_ORDER,
  fromInputDate,
  parseTags,
  toInputDate,
} from "../utils/taskUtils"

interface TaskFormProps {
  members: TaskUserRef[]
  context: TaskContext
}

const inputCls =
  "w-full rounded-lg border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-[#e6edf3] placeholder-[#484f58] outline-none transition-colors focus:border-[#58a6ff]"
const labelCls = "mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[#8b949e]"

export default function TaskForm({ members, context }: TaskFormProps) {
  const editingTask = useTaskStore((s) => s.editingTask)
  const closeForm = useTaskStore((s) => s.closeForm)
  const createTask = useTaskStore((s) => s.createTask)
  const updateTask = useTaskStore((s) => s.updateTask)

  const isEdit = !!editingTask
  const baseMembers = useMemo(
    () => (members.length ? members : context.currentUser ? [context.currentUser] : []),
    [members, context.currentUser]
  )

  const [title, setTitle] = useState(editingTask?.title ?? "")
  const [description, setDescription] = useState(editingTask?.description ?? "")
  const [status, setStatus] = useState<TaskStatus>(editingTask?.status ?? "todo")
  const [priority, setPriority] = useState<TaskPriority>(editingTask?.priority ?? "medium")
  const [tagsInput, setTagsInput] = useState(editingTask?.tags.join(", ") ?? "")
  const [assigneeId, setAssigneeId] = useState(editingTask?.assignee?.userId ?? "")
  const [dueInput, setDueInput] = useState(toInputDate(editingTask?.dueDate))
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const memberOptions = useMemo(() => {
    if (!editingTask?.assignee) return baseMembers
    if (baseMembers.some((m) => m.userId === editingTask.assignee?.userId)) return baseMembers
    return [editingTask.assignee, ...baseMembers]
  }, [baseMembers, editingTask])

  useEffect(() => {
    if (isEdit && editingTask?.assignee) {
      setAssigneeId(editingTask.assignee.userId)
    }
  }, [isEdit, editingTask])

  const selectedAssignee = memberOptions.find((m) => m.userId === assigneeId) ?? null

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const cleanTitle = title.trim()
    if (!cleanTitle) {
      setError("Title is required")
      return
    }

    const input: TaskInput = {
      title: cleanTitle,
      description: description.trim() || null,
      status,
      priority,
      tags: parseTags(tagsInput),
      assignee: selectedAssignee,
      dueDate: fromInputDate(dueInput),
    }

    setSaving(true)
    setError(null)
    try {
      if (isEdit && editingTask) {
        await updateTask(editingTask.id, input)
      } else {
        await createTask(input, context)
      }
      closeForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save task")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={closeForm}
    >
      <div
        className="w-full max-w-lg rounded-lg border border-[#30363d] bg-[#161b22] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#e6edf3]">
            {isEdit ? "Edit Task" : "Create Task"}
          </h2>
          <button
            type="button"
            onClick={closeForm}
            className="rounded-md p-1 text-[#8b949e] transition-colors hover:bg-[#30363d] hover:text-[#e6edf3]"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls} htmlFor="task-title">
              Title *
            </label>
            <input
              id="task-title"
              className={inputCls}
              value={title}
              autoFocus
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Fix authentication bug"
            />
          </div>

          <div>
            <label className={labelCls} htmlFor="task-desc">
              Description
            </label>
            <textarea
              id="task-desc"
              rows={3}
              className={`${inputCls} resize-none`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="JWT refresh token is failing..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} htmlFor="task-priority">
                Priority
              </label>
              <select
                id="task-priority"
                className={inputCls}
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
              >
                {PRIORITY_ORDER.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABELS[p]}
                  </option>
                ))}
              </select>
            </div>
            {isEdit && (
              <div>
                <label className={labelCls} htmlFor="task-status">
                  Status
                </label>
                <select
                  id="task-status"
                  className={inputCls}
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                >
                  {STATUS_ORDER.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className={labelCls} htmlFor="task-tags">
              Tags
            </label>
            <input
              id="task-tags"
              className={inputCls}
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="bug, auth, high-priority"
            />
            <p className="mt-1 text-[10px] text-[#484f58]">Comma or space separated</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} htmlFor="task-assignee">
                Assignee
              </label>
              <select
                id="task-assignee"
                className={inputCls}
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
              >
                <option value="">Unassigned</option>
                {memberOptions.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.username}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="task-due">
                Due Date
              </label>
              <input
                id="task-due"
                type="date"
                className={inputCls}
                value={dueInput}
                onChange={(e) => setDueInput(e.target.value)}
              />
            </div>
          </div>

          {context.repository && (
            <div className="rounded-lg border border-[#30363d] bg-[#0d1117] px-3 py-2 text-[11px] text-[#8b949e]">
              Repository: <span className="text-[#58a6ff]">{context.repository.fullName}</span>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-[#f85149]/30 bg-[#f85149]/10 px-3 py-2 text-sm text-[#f85149]">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={closeForm}
              className="rounded-lg border border-[#30363d] px-4 py-2 text-sm text-[#8b949e] transition-colors hover:bg-[#30363d] hover:text-[#e6edf3]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="rounded-lg bg-[#238636] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2ea043] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}