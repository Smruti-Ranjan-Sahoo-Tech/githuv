import { Routes, Route, Navigate } from "react-router-dom"
import LoginPage from "./pages/LoginPage"
import ChatPage from "./pages/ChatPage"
import LetterPage from "./pages/LetterPage"
import RepoPage from "./pages/RepoPage"
import TasksPage from "./pages/TasksPage"
import AppShell from "./components/AppShell"
import { useGithubAuthStore } from "./store/useGithubAuthStore"
import { getViewRoute } from "./helpers/viewContext"

export default function App() {
  const rawToken = useGithubAuthStore((s) => s.rawToken)

  // Native VS Code views replace the old in-webview sidebar: each view only
  // ever renders its own page. While signed out, the whole webview shows the
  // login screen so the user can authenticate from any view.
  if (!rawToken) {
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