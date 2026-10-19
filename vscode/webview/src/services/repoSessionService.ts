import { getWorkspaceInfo, githubApiRequest } from "../helpers/extensionBridge"
import {
  getStoredRepoSession,
  isTokenValid,
  useGithubAuthStore,
  type RepoSession,
} from "../store/useGithubAuthStore"
import type { WorkspaceInfoPayload } from "@shared/types"

export type EnsureSessionResult =
  | { ok: true; session: RepoSession; workspace: WorkspaceInfoPayload }
  | { ok: false; error: string }

type StatusCallback = (message: string) => void

interface RepoLookup {
  id: number
  owner?: { login?: string }
}

let inFlight: Promise<EnsureSessionResult> | null = null

/**
 * Resolves the chat room for the repository that is open in *this* VS Code
 * window and makes sure the auth store points at it.
 *
 * - Repository already visited before → the stored session is reused, so the
 *   matching chat (with its previous history) opens immediately.
 * - First visit → GitHub is asked for the repository id and the user's
 *   collaborator status, then the fresh session is stored per repository.
 *
 * Multiple windows with multiple repositories therefore never overwrite each
 * other's room.
 */
export function ensureRepoSession(onStatus?: StatusCallback): Promise<EnsureSessionResult> {
  if (inFlight) return inFlight
  inFlight = resolveSession(onStatus).finally(() => {
    inFlight = null
  })
  return inFlight
}

async function resolveSession(onStatus?: StatusCallback): Promise<EnsureSessionResult> {
  const { rawToken } = useGithubAuthStore.getState()
  if (!rawToken || !isTokenValid()) {
    return { ok: false, error: "Not signed in" }
  }

  onStatus?.("Checking workspace...")

  let workspace: WorkspaceInfoPayload
  try {
    workspace = await getWorkspaceInfo()
  } catch {
    return { ok: false, error: "Failed to read workspace info" }
  }

  if (!workspace.isRepo || !workspace.repoOwner || !workspace.repoName) {
    return { ok: false, error: "Current workspace is not connected to a GitHub repository" }
  }

  const cached = getStoredRepoSession(workspace.repoOwner, workspace.repoName)
  if (cached) {
    useGithubAuthStore.getState().setRepoSession(cached)
    return { ok: true, session: cached, workspace }
  }

  onStatus?.("Verifying repository access...")

  let currentUser: { login: string } | null = null
  try {
    currentUser = await githubApiRequest<{ login: string }>("/user", "GET", rawToken)
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to fetch GitHub user info",
    }
  }

  if (!currentUser?.login) {
    return { ok: false, error: "Could not determine GitHub username" }
  }

  const repoPath = `/repos/${workspace.repoOwner}/${workspace.repoName}`

  let isCollaborator = false
  try {
    await githubApiRequest(`${repoPath}/collaborators/${currentUser.login}`, "GET", rawToken)
    isCollaborator = true
  } catch {
    isCollaborator = false
  }

  let repoData: RepoLookup | null = null
  try {
    repoData = await githubApiRequest<RepoLookup>(repoPath, "GET", rawToken)
    if (repoData?.owner?.login?.toLowerCase() === currentUser.login.toLowerCase()) {
      isCollaborator = true
    }
  } catch {
    repoData = null
  }

  if (!isCollaborator) {
    return {
      ok: false,
      error: `You (${currentUser.login}) are not a collaborator of ${workspace.repoOwner}/${workspace.repoName}`,
    }
  }

  // Rooms are keyed by the stable numeric repository id so renames never
  // orphan the history.
  if (!repoData?.id) {
    try {
      repoData = await githubApiRequest<RepoLookup>(repoPath, "GET", rawToken)
    } catch {
      repoData = null
    }
  }

  const repoId = repoData?.id ? String(repoData.id) : null
  if (!repoId) {
    return { ok: false, error: "Could not determine the repository ID for the chat room." }
  }

  const session: RepoSession = {
    repoOwner: workspace.repoOwner,
    repoName: workspace.repoName,
    repoId,
    username: currentUser.login,
  }
  useGithubAuthStore.getState().setRepoSession(session)

  return { ok: true, session, workspace }
}
