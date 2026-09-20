import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import TopBar from "../components/TopBar"
import { useGithubAuthStore } from "../store/useGithubAuthStore"
import { getWorkspaceInfo, githubApiRequest, openExternal } from "../helpers/extensionBridge"
import { sendMessage } from "../helpers/postMessage"
import type { WorkspaceInfoPayload } from "@shared/types"

type Tab = "pulls" | "issues" | "commits"

interface PullRequest {
  number: number
  title: string
  state: "open" | "closed"
  draft?: boolean
  user?: { login?: string; avatar_url?: string }
  created_at?: string
  updated_at?: string
  html_url?: string
  head?: { ref?: string }
  base?: { ref?: string }
}

interface Issue {
  number: number
  title: string
  state: "open" | "closed"
  pull_request?: unknown
  user?: { login?: string; avatar_url?: string }
  created_at?: string
  labels?: { name?: string; color?: string }[]
  comments?: number
  html_url?: string
}

interface Commit {
  sha: string
  commit?: {
    message?: string
    author?: { name?: string; date?: string }
  }
  author?: { login?: string; avatar_url?: string } | null
  html_url?: string
}

const tabs: { id: Tab; label: string }[] = [
  { id: "pulls", label: "Pull Requests" },
  { id: "issues", label: "Issues" },
  { id: "commits", label: "Commits" },
]

const fmt = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
    : ""

function ExternalIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  )
}

export default function RepoPage() {
  const navigate = useNavigate()
  const username = useGithubAuthStore((s) => s.username)
  const rawToken = useGithubAuthStore((s) => s.rawToken)

  const [tab, setTab] = useState<Tab>("pulls")
  const [workspace, setWorkspace] = useState<WorkspaceInfoPayload | null>(null)
  const [data, setData] = useState<PullRequest[] | Issue[] | Commit[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)

  const owner = workspace?.repoOwner
  const repo = workspace?.repoName

  const loadRepo = useCallback(async () => {
    const ws = await getWorkspaceInfo()
    setWorkspace(ws)
    return ws
  }, [])

  const fetchTab = useCallback(
    async (t: Tab, ws: WorkspaceInfoPayload | null = workspace) => {
      if (!ws?.repoOwner || !ws.repoName || !rawToken) return
      setLoading(true)
      setError(null)
      try {
        const path = "/repos/{owner}/{repo}"
          .replace("{owner}", ws.repoOwner)
          .replace("{repo}", ws.repoName)

        let endpoint: string
        switch (t) {
          case "pulls":
            endpoint = `${path}/pulls?state=all&per_page=50&sort=updated`
            break
          case "issues":
            endpoint = `${path}/issues?state=all&per_page=50&sort=updated`
            break
          case "commits":
            endpoint = `${path}/commits?per_page=50`
            break
        }

        const result = await githubApiRequest<unknown>(endpoint, "GET", rawToken)
        const list = Array.isArray(result) ? result : []
        setData(list as PullRequest[] | Issue[] | Commit[])
        setLastRefreshed(new Date())
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch repository data")
        setData(null)
      } finally {
        setLoading(false)
      }
    },
    [rawToken, workspace]
  )

  useEffect(() => {
    if (!rawToken || !username) {
      navigate("/login")
      return
    }
    let cancelled = false
    void loadRepo().then((ws) => {
      if (!cancelled) void fetchTab(tab, ws)
    })
    return () => {
      cancelled = true
    }
  }, [rawToken, username, navigate])

  useEffect(() => {
    if (workspace) void fetchTab(tab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const handleLogout = () => {
    useGithubAuthStore.getState().logout()
    sendMessage({ type: "clearStoredToken" })
    navigate("/login")
  }

  const openItem = (url?: string) => {
    if (url) openExternal(url)
  }

  const visibleIssues = (Array.isArray(data) ? data : []).filter((d) => !(d as Issue).pull_request)

  return (
    <div className="flex h-full flex-col bg-[#0d1117] text-[#e6edf3]">
      <TopBar repoName={workspace?.isRepo ? `${workspace.repoOwner}/${workspace.repoName}` : undefined} onSettings={handleLogout} />

      <div className="flex items-center gap-2 border-b border-[#21262d] bg-[#161b22] px-4 py-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              tab === t.id
                ? "bg-[#238636] text-white"
                : "text-[#8b949e] hover:bg-[#30363d] hover:text-[#e6edf3]"
            }`}
          >
            {t.label}
          </button>
        ))}

        <button
          onClick={() => void fetchTab(tab)}
          disabled={loading}
          className="ml-auto rounded-lg border border-[#30363d] px-3 py-1 text-xs font-semibold text-[#8b949e] transition-colors hover:border-[#58a6ff] hover:text-[#58a6ff] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {error && (
          <div className="mb-3 rounded-lg border border-[#f85149]/30 bg-[#f85149]/10 p-3 text-sm text-[#f85149]">
            {error}
          </div>
        )}

        {lastRefreshed && (
          <p className="mb-3 text-[11px] text-[#484f58]">
            Updated {lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}

        {loading && !data && (
          <div className="flex h-40 items-center justify-center">
            <span className="text-sm text-[#8b949e]">Loading…</span>
          </div>
        )}

        {!loading && data && tab === "pulls" && (
          <PullList items={data as PullRequest[]} onOpen={openItem} />
        )}

        {!loading && tab === "issues" && (
          <>
            {visibleIssues.length === 0 ? (
              <Empty label="No issues" />
            ) : (
              <ul className="space-y-2">
                {(visibleIssues as Issue[]).map((issue) => (
                  <li
                    key={issue.number}
                    onClick={() => openItem(issue.html_url)}
                    className="cursor-pointer rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2.5 transition-colors hover:border-[#58a6ff]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {issue.user && <AuthorAvatar url={issue.user.avatar_url} login={issue.user.login} />}
                          <span className="text-xs font-semibold text-[#58a6ff]">{issue.user?.login}</span>
                          <span
                            className={`inline-block h-2 w-2 shrink-0 rounded-full ${
                              issue.state === "open" ? "bg-[#3fb950]" : "bg-[#f85149]"
                            }`}
                          />
                        </div>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className={`text-sm font-medium ${issue.pull_request ? "text-[#8b949e]" : "text-[#e6edf3]"}`}>
                            {issue.title}
                          </span>
                          {issue.labels?.map((l) => l.name).filter(Boolean).length ? (
                            <span className="text-[10px] text-[#8b949e]">
                              {issue.labels?.map((l) => l.name).join(", ")}
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1 text-[11px] text-[#8b949e]">
                          #{issue.number}
                          {issue.pull_request ? " · pull request" : ""}
                          {issue.comments ? ` · ${issue.comments} comments` : ""} · {fmt(issue.created_at)}
                        </div>
                      </div>
                      <ExternalIcon />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {!loading && data && tab === "pulls" && (data as PullRequest[]).length === 0 && <Empty label="No pull requests" />}

        {!loading && tab === "commits" && (
          <>
            {!data || (data as Commit[]).length === 0 ? (
              <Empty label="No commits" />
            ) : (
              <ul className="space-y-2">
                {(data as Commit[]).map((commit) => {
                  const shortSha = commit.sha?.slice(0, 7) ?? ""
                  return (
                    <li
                      key={commit.sha}
                      onClick={() => openItem(commit.html_url)}
                      className="cursor-pointer rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2.5 transition-colors hover:border-[#58a6ff]"
                    >
                      <div className="flex items-center gap-3">
                        <AuthorAvatar url={commit.author?.avatar_url} login={commit.author?.login} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[#58a6ff]">
                              {commit.author?.login ?? commit.commit?.author?.name ?? "Unknown"}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-sm text-[#e6edf3]">
                            {commit.commit?.message?.split("\n")[0] || "Commit"}
                          </p>
                          <div className="mt-0.5 text-[11px] text-[#8b949e]">
                            {fmt(commit.commit?.author?.date)}
                          </div>
                        </div>
                        <code className="shrink-0 font-mono text-[11px] text-[#58a6ff]">
                          {shortSha}
                        </code>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function AuthorAvatar({ url, login }: { url?: string; login?: string }) {
  const [failed, setFailed] = useState(false)
  if (url && !failed) {
    return <img src={url} alt={login ?? ""} onError={() => setFailed(true)} className="h-6 w-6 shrink-0 rounded-full" />
  }
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#30363d] text-[10px] text-[#8b949e]">
      {(login ?? "?").slice(0, 2).toUpperCase()}
    </span>
  )
}

function PullList({ items, onOpen }: { items: PullRequest[]; onOpen: (url?: string) => void }) {
  return (
    <ul className="space-y-2">
      {items.map((pr) => (
        <li
          key={pr.number}
          onClick={() => onOpen(pr.html_url)}
          className="cursor-pointer rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2.5 transition-colors hover:border-[#58a6ff]"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <AuthorAvatar url={pr.user?.avatar_url} login={pr.user?.login} />
                <span className="text-xs font-semibold text-[#58a6ff]">{pr.user?.login}</span>
                <span
                  className={`inline-block h-2 w-2 shrink-0 rounded-full ${
                    pr.state === "open" ? "bg-[#3fb950]" : "bg-[#f85149]"
                  }`}
                />
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="text-sm font-medium text-[#e6edf3]">{pr.title}</span>
                {pr.draft && (
                  <span className="rounded-full border border-[#8b949e] px-1.5 py-px text-[10px] text-[#8b949e]">
                    Draft
                  </span>
                )}
              </div>
              <div className="mt-1 text-[11px] text-[#8b949e]">
                #{pr.number}
                {pr.head?.ref && pr.base?.ref ? ` · ${pr.head.ref} → ${pr.base.ref}` : ""} ·{" "}
                {fmt(pr.updated_at)}
              </div>
            </div>
            <ExternalIcon />
          </div>
        </li>
      ))}
    </ul>
  )
}

function Empty({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[#30363d] p-8 text-center">
      <p className="text-sm text-[#8b949e]">{label} found.</p>
    </div>
  )
}