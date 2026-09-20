import { useMemo } from "react"
import { filterTasks, useTaskStore } from "../store/taskStore"
import TaskCard from "./TaskCard"

export default function TaskList() {
  const tasks = useTaskStore((s) => s.tasks)
  const filters = useTaskStore((s) => s.filters)
  const loading = useTaskStore((s) => s.loading)
  const error = useTaskStore((s) => s.error)

  const visible = useMemo(() => filterTasks(tasks, filters), [tasks, filters])

  if (loading && tasks.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <span className="text-sm text-[#8b949e]">Loading tasks…</span>
      </div>
    )
  }

  if (error && tasks.length === 0) {
    return (
      <div className="mx-4 mt-4 rounded-lg border border-[#f85149]/30 bg-[#f85149]/10 p-3 text-sm text-[#f85149]">
        {error}
      </div>
    )
  }

  if (visible.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <div className="text-center">
          <p className="text-sm text-[#8b949e]">
            {tasks.length === 0 ? "No tasks yet." : "No tasks match your filters."}
          </p>
          <p className="mt-1 text-xs text-[#484f58]">
            {tasks.length === 0 ? "Create your first task to get started." : "Try adjusting your search or filters."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2 px-4 py-4">
      {visible.length < tasks.length && (
        <p className="text-[11px] text-[#484f58]">
          Showing {visible.length} of {tasks.length} tasks
        </p>
      )}
      {visible.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  )
}