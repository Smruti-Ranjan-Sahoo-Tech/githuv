import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useGithubAuthStore, isTokenValid } from "../store/useGithubAuthStore"
import {
  getWorkspaceInfo,
  githubApiRequest,
} from "../helpers/extensionBridge"
import { receiveMessage, sendMessage } from "../helpers/postMessage"

export default function LoginPage() {
  const navigate = useNavigate()
  const { loginByGithub, userCode, verificationUri } = useGithubAuthStore()

  const [loading, setLoading] = useState(true)
  const [statusText, setStatusText] = useState("Loading...")
  const [error, setError] = useState<string | null>(null)
  const [showPasteToken, setShowPasteToken] = useState(false)
  const [pasteToken, setPasteToken] = useState("")

  const completeAuthFlow = async (token: string | null) => {
    setError(null)
    setLoading(true)

    if (token) {
      const ok = useGithubAuthStore.getState().receiveAuthToken(token)
      if (!ok) {
        setLoading(false)
        setError(useGithubAuthStore.getState().error ?? "Invalid auth token received")
        return
      }
    }

    const rawToken = useGithubAuthStore.getState().rawToken
    if (!rawToken) {
      setLoading(false)
      setError("Auth token not found")
      return
    }

    setStatusText("Checking workspace...")

    let workspace
    try {
      workspace = await getWorkspaceInfo()
    } catch {
      setLoading(false)
      setError("Failed to read workspace info")
      return
    }

    if (!workspace.isRepo || !workspace.repoOwner || !workspace.repoName) {
      setLoading(false)
      setError("Current workspace is not connected to a GitHub repository")
      return
    }

    setStatusText("Verifying repository access...")

    let currentUser: { login: string } | null = null
    try {
      currentUser = await githubApiRequest<{ login: string }>("/user", "GET", rawToken)
    } catch {
      setLoading(false)
      setError("Failed to fetch GitHub user info")
      return
    }

    if (!currentUser?.login) {
      setLoading(false)
      setError("Could not determine GitHub username")
      return
    }

    let isCollaborator = false
    try {
      await githubApiRequest(
        `/repos/${workspace.repoOwner}/${workspace.repoName}/collaborators/${currentUser.login}`,
        "GET",
        rawToken,
      )
      isCollaborator = true
    } catch {
      isCollaborator = false
    }

    if (!isCollaborator) {
      try {
        const repoData = await githubApiRequest<{ owner?: { login?: string } }>(
          `/repos/${workspace.repoOwner}/${workspace.repoName}`,
          "GET",
          rawToken,
        )
        if (repoData?.owner?.login === currentUser.login) {
          isCollaborator = true
        }
      } catch {
        // not the owner either
      }
    }

    if (!isCollaborator) {
      setLoading(false)
      setError(
        `You (${currentUser.login}) are not a collaborator of ${workspace.repoOwner}/${workspace.repoName}`,
      )
      return
    }

    navigate("/chat", {
      state: {
        roomId: currentUser.login,
        roomName: workspace.repoName,
        repoOwner: workspace.repoOwner,
        username: currentUser.login,
      },
    })
  }

  useEffect(() => {
    return receiveMessage((message) => {
      if (message.type === "authToken") {
        completeAuthFlow(message.payload.token)
      }
    })
  }, [])

  const autoLoginAttempted = useRef(false)

  useEffect(() => {
    if (autoLoginAttempted.current) return
    autoLoginAttempted.current = true

    const storedToken = useGithubAuthStore.getState().rawToken
    if (storedToken && isTokenValid()) {
      setLoading(true)
      setStatusText("Welcome back! Loading chat...")
      completeAuthFlow(null)
      return
    }

    const injectedToken = (window as unknown as Record<string, unknown>).__GITHUV_STORED_TOKEN__
    if (typeof injectedToken === "string" && injectedToken) {
      setLoading(true)
      setStatusText("Welcome back! Loading chat...")
      completeAuthFlow(injectedToken)
      return
    }

    setLoading(false)
  }, [])

  const handleBrowserLogin = () => {
    setError(null)
    setLoading(true)
    setStatusText("Waiting for you in the browser...")

    sendMessage({ type: "openClientAuth" })
  }

  const handleDeviceLogin = async () => {
    setError(null)
    setLoading(true)
    setStatusText("Opening GitHub in your browser...")

    const authSuccess = await loginByGithub(setStatusText)
    if (!authSuccess) {
      setLoading(false)
      setError(useGithubAuthStore.getState().error ?? "Authentication failed")
      return
    }

    completeAuthFlow(null)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d1117] p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#238636] to-[#2ea043] shadow-lg shadow-[#238636]/20">
            <svg className="h-7 w-7 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold">
            Githu<span className="text-3xl text-[#f85149]">V</span>
          </h1>
          <p className="mt-2 text-sm text-[#8b949e]">
            Connect your GitHub repository to chat with your codebase.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-[#f85149]/30 bg-[#f85149]/10 p-3 text-sm text-[#f85149]">
            {error}
          </div>
        )}

        {loading && statusText && (
          <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-4 text-center">
            <p className="text-xs text-[#8b949e]">{statusText}</p>
          </div>
        )}

        {userCode && (
          <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-4 text-center">
            <p className="text-xs text-[#8b949e] mb-1">Enter this code on GitHub:</p>
            <div className="select-all rounded-md bg-[#0d1117] px-4 py-2 font-mono text-lg font-bold tracking-widest text-[#f0883e]">
              {userCode}
            </div>
            <a
              href={verificationUri ?? "https://github.com/login/device"}
              target="_blank"
              className="mt-2 inline-block text-xs text-[#58a6ff] underline hover:text-[#58a6ff]/80"
              onClick={(e) => {
                e.preventDefault()
                window.open(verificationUri ?? "https://github.com/login/device", "_blank")
              }}
            >
              Open GitHub authorization page
            </a>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleBrowserLogin}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#238636] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#2ea043] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            {loading ? "Signing in..." : "Sign in with GitHub in browser"}
          </button>

          <button
            onClick={handleDeviceLogin}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#30363d] bg-[#21262d] px-4 py-2.5 text-sm font-semibold text-[#e6edf3] transition-all hover:border-[#8b949e] hover:bg-[#30363d] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {error ? "Retry" : "Sign in with device code"}
          </button>

          {showPasteToken ? (
            <div className="space-y-2">
              <textarea
                value={pasteToken}
                onChange={(e) => setPasteToken(e.target.value)}
                rows={3}
                placeholder="Paste the token from the browser page here..."
                className="w-full resize-none rounded-lg border border-[#30363d] bg-[#0d1117] px-3 py-2 font-mono text-xs text-[#e6edf3] placeholder-[#484f58] outline-none focus:border-[#58a6ff]"
              />
              <button
                onClick={() => {
                  if (!pasteToken.trim()) return
                  completeAuthFlow(pasteToken.trim())
                }}
                disabled={!pasteToken.trim() || loading}
                className="w-full rounded-lg border border-[#58a6ff]/40 bg-[#58a6ff]/10 px-4 py-2 text-sm font-semibold text-[#58a6ff] transition-colors hover:bg-[#58a6ff]/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Use token
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowPasteToken(true)}
              disabled={loading}
              className="w-full text-center text-xs text-[#8b949e] underline hover:text-[#58a6ff]"
            >
              Have a token? Paste it
            </button>
          )}
        </div>

        <p className="text-center text-[11px] text-[#484f58]">
          The browser sign-in opens the client login page and returns a token to
          this extension automatically.
        </p>
      </div>
    </div>
  )
}
