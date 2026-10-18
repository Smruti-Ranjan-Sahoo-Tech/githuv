import { useState } from "react"
import { useNavigate } from "react-router-dom"

interface TopBarProps {
  repoName?: string
  avatarUrl?: string
  connectionStatus?: "connected" | "disconnected" | "connecting"
  onSettings?: () => void
  onLogout?: () => void
}

const statusColors = {
  connected: "bg-[#3fb950]",
  disconnected: "bg-[#f85149]",
  connecting: "bg-[#d29922]",
}

export default function TopBar({ repoName, avatarUrl, connectionStatus, onSettings, onLogout }: TopBarProps) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="relative flex items-center justify-between border-b border-[#21262d] bg-[#161b22] px-4 py-2.5">
      <span className="text-lg font-black italic tracking-tight">
        Githu<span className="text-[#f85149]">V</span>
      </span>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Open navigation menu"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="rounded-md p-1.5 text-[#8b949e] transition-colors hover:bg-[#30363d] hover:text-[#e6edf3]"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        {menuOpen && (
          <div role="menu" className="absolute right-3 top-11 z-20 min-w-40 overflow-hidden rounded-lg border border-[#30363d] bg-[#161b22] py-1 shadow-xl">
            <button
              role="menuitem"
              onClick={() => { setMenuOpen(false); navigate(-1) }}
              className="block w-full px-3 py-2 text-left text-sm text-[#e6edf3] hover:bg-[#21262d]"
            >
              ← Back
            </button>
            <button
              role="menuitem"
              onClick={() => { setMenuOpen(false); onSettings?.() }}
              className="block w-full px-3 py-2 text-left text-sm text-[#e6edf3] hover:bg-[#21262d]"
            >
              VS Code Settings
            </button>
            <button
              role="menuitem"
              onClick={() => { setMenuOpen(false); onLogout?.() }}
              className="block w-full px-3 py-2 text-left text-sm text-[#f85149] hover:bg-[#21262d]"
            >
              Sign out
            </button>
          </div>
        )}
        {avatarUrl && (
          <img
            src={avatarUrl}
            alt="User avatar"
            className="h-6 w-6 rounded-full"
          />
        )}
      </div>
    </div>
  )
}
