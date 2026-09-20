import { Outlet } from "react-router-dom"

export default function AppShell() {
  return (
    <main className="h-screen overflow-hidden bg-[#0d1117] text-[#e6edf3]">
      <Outlet />
    </main>
  )
}