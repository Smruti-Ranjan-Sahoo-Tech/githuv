import type { TaskUserRef, WorkspaceInfoPayload } from "@shared/types"
import { githubApiRequest } from "../../helpers/extensionBridge"
import { githubAvatarUrl, normalizeUserRef } from "../utils/taskUtils"

interface MemberServiceOptions {
  username?: string | null
  userId?: string | null
  rawToken?: string | null
  workspace?: WorkspaceInfoPayload | null
}

interface GithubUserLike {
  id?: number | string
  login?: string
  username?: string
  avatar_url?: string
}

/**
 * Assignee/member abstraction for tasks.
 *
 * The current logged-in user is always returned. When a repository is detected
 * and a GitHub token is available, the real repo collaborators are also
 * returned so a task can be assigned to an actual team member. Every failure
 * degrades gracefully to just the signed-in user instead of breaking the UI.
 */
export class MemberService {
  private static instance: MemberService

  static get(): MemberService {
    if (!MemberService.instance) {
      MemberService.instance = new MemberService()
    }
    return MemberService.instance
  }

  async getMembers(opts: MemberServiceOptions): Promise<TaskUserRef[]> {
    const currentUser = normalizeUserRef({
      userId: opts.userId ?? undefined,
      username: opts.username ?? undefined,
      avatar: opts.username ? githubAvatarUrl(opts.username) : undefined,
    })

    const members = new Map<string, TaskUserRef>()
    if (currentUser) members.set(currentUser.userId, currentUser)

    const { workspace, rawToken } = opts
    if (workspace?.isRepo && workspace.repoOwner && workspace.repoName && rawToken && currentUser) {
      try {
        const collaborators = await githubApiRequest<GithubUserLike[]>(
          `/repos/${workspace.repoOwner}/${workspace.repoName}/collaborators?per_page=100`,
          "GET",
          rawToken
        )
        for (const c of collaborators) {
          if (!c.login && !c.username) continue
          const login = c.login ?? c.username ?? ""
          const ref = normalizeUserRef({
            userId: c.id != null ? String(c.id) : login,
            username: login,
            avatar: c.avatar_url,
          })
          if (ref) members.set(ref.userId, ref)
        }
      } catch {
        // collaborators unavailable — fall back to the signed-in user
      }
    }

    return Array.from(members.values()).sort((a, b) => a.username.localeCompare(b.username))
  }
}