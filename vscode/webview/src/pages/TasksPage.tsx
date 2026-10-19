import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import TopBar from "../components/TopBar"
import { useGithubAuthStore } from "../store/useGithubAuthStore"
import { sendMessage } from "../helpers/postMessage"
import { useTaskStore } from "../tasks/store/taskStore"
import { getTaskContext, type TaskContext } from "../tasks/services/taskService"
import { MemberService } from "../tasks/services/memberService"
import TaskFilters from "../tasks/components/TaskFilters"
import TaskList from "../tasks/components/TaskList"
import TaskForm from "../tasks/components/TaskForm"
import TaskDetails from "../tasks/components/TaskDetails"
import type { TaskUserRef } from "@shared/types"

export default function TasksPage() {
  const navigate = useNavigate()
  const username = useGithubAuthStore((s) => s.username)
  const rawToken = useGithubAuthStore((s) => s.rawToken)
  const authToken = useGithubAuthStore((s) => s.authToken)

  const init = useTaskStore((s) => s.init)
  const refresh = useTaskStore((s) => s.refresh)
  const refreshing = useTaskStore((s) => s.refreshing)
  const refreshRepoScope = useTaskStore((s) => s.refreshRepoScope)
  const openCreate = useTaskStore((s) => s.openCreate)
  const formOpen = useTaskStore((s) => s.formOpen)
  const selectedId = useTaskStore((s) => s.selectedId)
  const filters = useTaskStore((s) => s.filters)
  const setFilters = useTaskStore((s) => s.setFilters)
  const totalTasks = useTaskStore((s) => s.tasks.length)

  const [context, setContext] = useState<TaskContext | null>(null)
  const [members, setMembers] = useState<TaskUserRef[]>([])

  useEffect(() => {
    if (!rawToken || !username) {
      navigate("/login")
      return
    }
    void init()
    void refreshRepoScope()
  }, [rawToken, username, navigate, init, refreshRepoScope])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const ctx = await getTaskContext()
      if (cancelled) return
      setContext(ctx)

      const workspace = ctx.repository
        ? {
            isRepo: true,
            repoOwner: ctx.repository.owner,
            repoName: ctx.repository.name,
          }
        : null

      const ms = await MemberService.get().getMembers({
        username,
        userId: authToken?.uid,
        rawToken,
        workspace,
      })
      if (!cancelled) setMembers(ms)
    })()
    return () => {
      cancelled = true
    }
  }, [username, authToken?.uid, rawToken])

  const handleLogout = useCallback(() => {
    useGithubAuthStore.getState().logout()
    sendMessage({ type: "clearStoredToken" })
    navigate("/login")
  }, [navigate])

  const repoName = useMemo(() => {
    const session = useGithubAuthStore.getState().repoSession
    if (session?.repoOwner && session.repoName) {
      return `${session.repoOwner}/${session.repoName}`
    }
    return context?.repository?.fullName
  }, [context])

  return (
    <div className="flex h-full flex-col bg-[#0d1117] text-[#e6edf3]">
      <TopBar repoName={repoName} onSettings={handleLogout} />

      <div className="flex items-center justify-between gap-3 border-b border-[#21262d] bg-[#161b22] px-4 py-3">
        <div>
          <h1 className="text-base font-semibold text-[#e6edf3]">Tasks</h1>
          <p className="text-[11px] text-[#8b949e]">
            {totalTasks === 0 ? "No tasks" : `${totalTasks} task${totalTasks === 1 ? "" : "s"}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={refreshing}
            title="Refresh tasks"
            className="flex items-center gap-1.5 rounded-lg border border-[#30363d] px-3 py-1.5 text-sm font-semibold text-[#8b949e] transition-colors hover:border-[#58a6ff] hover:text-[#58a6ff] disabled:opacity-50"
          >
            <svg
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-lg bg-[#238636] px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#2ea043]"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Create Task
          </button>
        </div>
      </div>

      <div className="border-b border-[#21262d] bg-[#161b22] px-4 pb-2 pt-3">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#484f58]">
            🔍
          </span>
          <input
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            placeholder="Search tasks..."
            className="w-full rounded-lg border border-[#30363d] bg-[#0d1117] py-2 pl-9 pr-3 text-sm text-[#e6edf3] placeholder-[#484f58] outline-none transition-colors focus:border-[#58a6ff]"
          />
        </div>
      </div>

      <TaskFilters />

      <TaskList />

      {formOpen && context && <TaskForm members={members} context={context} />}
      {selectedId && <TaskDetails />}
    </div>
  )
}