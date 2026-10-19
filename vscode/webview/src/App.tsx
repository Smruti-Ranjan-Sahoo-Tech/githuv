import { useEffect, useState } from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import LoginPage from "./pages/LoginPage"
import ChatPage from "./pages/ChatPage"
import LetterPage from "./pages/LetterPage"
import RepoPage from "./pages/RepoPage"
import TasksPage from "./pages/TasksPage"
import AppShell from "./components/AppShell"
import { isTokenValid, useGithubAuthStore } from "./store/useGithubAuthStore"
import { getViewRoute } from "./helpers/viewContext"
import { ensureRepoSession } from "./services/repoSessionService"

function BootScreen({ statusText }: { statusText: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d1117] p-4">
      <div
        role="status"
        aria-live="polite"
        className="w-full max-w-sm rounded-lg border border-[#30363d] bg-[#161b22] p-6 text-center"
      >
        <span
          aria-hidden="true"
          className="mx-auto mb-3 block h-5 w-5 animate-spin rounded-full border-2 border-[#30363d] border-t-[#58a6ff]"
        />
        <p className="text-xs text-[#8b949e]">{statusText}</p>
      </div>
    </div>
  )
}

export default function App() {
  const rawToken = useGithubAuthStore((s) => s.rawToken)
  const repoSession = useGithubAuthStore((s) => s.repoSession)

  const [bootstrapped, setBootstrapped] = useState(false)
  const [statusText, setStatusText] = useState("Restoring your repository chat...")

  // Reconcile the stored sessions with the repository that is open in this
  // window before any route renders, so the chat that opens always belongs to
  // this repository (and restores its previous history).
  useEffect(() => {
    if (!rawToken || !isTokenValid()) {
      setBootstrapped(true)
      return
    }
    if (useGithubAuthStore.getState().repoSession) {
      setBootstrapped(true)
      return
    }

    let cancelled = false
    void ensureRepoSession((message) => {
      if (!cancelled) setStatusText(message)
    }).finally(() => {
      if (!cancelled) setBootstrapped(true)
    })

    return () => {
      cancelled = true
    }
  }, [rawToken])

  if (!bootstrapped && rawToken && isTokenValid()) {
    return <BootScreen statusText={statusText} />
  }

  // Do not mount ChatPage until auth restoration and repository verification
  // have both completed. A token alone does not provide a room or username.
  if (!rawToken || !repoSession || !isTokenValid()) {
    return <LoginPage />
  }

  const viewRoute = getViewRoute()
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/repo" element={<RepoPage />} />
      </Route>
      <Route path="/letter" element={<LetterPage />} />
      <Route path="*" element={<Navigate to={viewRoute} replace />} />
    </Routes>
  )
}
