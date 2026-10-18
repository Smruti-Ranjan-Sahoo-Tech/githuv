import { NavLink, Outlet } from "react-router-dom"

export default function AppShell() {
  return (
    <main className="flex h-screen overflow-hidden bg-[#0d1117] text-[#e6edf3]">
      <nav aria-label="Githuv navigation" className="flex w-14 shrink-0 flex-col items-center gap-2 border-r border-[#21262d] bg-[#0d1117] py-3">
        <span aria-hidden="true" className="mb-2 text-sm font-black italic text-[#e6edf3]">G<span className="text-[#f85149]">V</span></span>
        <NavLink to="/chat" aria-label="Chat" title="Chat" className={({ isActive }) => `flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${isActive ? "bg-[#1f6feb]/20 text-[#58a6ff]" : "text-[#8b949e] hover:bg-[#161b22] hover:text-[#e6edf3]"}`}>
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h6m-8 8 2.5-3H18a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v9a3 3 0 0 0 2 2.83V20Z" /></svg>
        </NavLink>
        <NavLink to="/repo" aria-label="Repository" title="Repository" className={({ isActive }) => `flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${isActive ? "bg-[#1f6feb]/20 text-[#58a6ff]" : "text-[#8b949e] hover:bg-[#161b22] hover:text-[#e6edf3]"}`}>
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Zm0 0A2.5 2.5 0 0 1 6.5 8H20" /></svg>
        </NavLink>
        <NavLink to="/tasks" aria-label="Tasks" title="Tasks" className={({ isActive }) => `flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${isActive ? "bg-[#1f6feb]/20 text-[#58a6ff]" : "text-[#8b949e] hover:bg-[#161b22] hover:text-[#e6edf3]"}`}>
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="m8 6 2 2 4-4M8 12l2 2 4-4M8 18l2 2 4-4M18 6h2M18 12h2M18 18h2" /></svg>
        </NavLink>
      </nav>
      <section className="min-w-0 flex-1 overflow-hidden"><Outlet /></section>
    </main>
  )
}
