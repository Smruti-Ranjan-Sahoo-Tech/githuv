import { Routes, Route, Navigate } from "react-router-dom"
import LoginPage from "./pages/LoginPage"
import ChatPage from "./pages/ChatPage"
import LetterPage from "./pages/LetterPage"
import RepoPage from "./pages/RepoPage"
import TasksPage from "./pages/TasksPage"
import AppShell from "./components/AppShell"
import { isTokenValid, useGithubAuthStore } from "./store/useGithubAuthStore"
import { getViewRoute } from "./helpers/viewContext"

export default function App() {
  const rawToken = useGithubAuthStore((s) => s.rawToken)
  const repoSession = useGithubAuthStore((s) => s.repoSession)

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
