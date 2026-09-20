import { useState } from "react"
import type { TaskUserRef } from "@shared/types"
import { initialsOf } from "../utils/taskUtils"

interface UserBadgeProps {
  user?: TaskUserRef | null
  size?: "sm" | "md"
  showName?: boolean
}

export function UserBadge({ user, size = "sm", showName = true }: UserBadgeProps) {
  const [failed, setFailed] = useState(false)

  const dims = size === "md" ? "h-8 w-8" : "h-6 w-6"
  const text = size === "md" ? "text-xs" : "text-[10px]"

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`relative inline-flex shrink-0 ${dims}`}>
        {user?.avatar && !failed ? (
          <img
            src={user.avatar}
            alt={user.username}
            onError={() => setFailed(true)}
            className={`${dims} rounded-full border border-[#30363d] bg-[#0d1117] object-cover`}
          />
        ) : (
          <span
            className={`${dims} inline-flex items-center justify-center rounded-full border border-[#30363d] bg-[#21262d] ${text} font-semibold text-[#8b949e]`}
          >
            {initialsOf(user)}
          </span>
        )}
      </span>
      {showName && user && (
        <span className="max-w-28 truncate text-[11px] text-[#8b949e]">{user.username}</span>
      )}
    </span>
  )
}