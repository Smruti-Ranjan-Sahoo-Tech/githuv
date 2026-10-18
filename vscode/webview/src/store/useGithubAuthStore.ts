import { create } from "zustand"
import type { WebviewAuthTokenPayload } from "@shared/types"
import { requestGithubAuth } from "../helpers/extensionBridge"
import { apiRequest } from "../helpers/api"

const githubAccessTokenKey = "githubAccessToken"
const webviewAuthKey = "githuv.auth.token"
const webviewRawTokenKey = "githuv.auth.rawToken"
const repoSessionKey = "githuv.auth.repoSession"

export interface RepoSession {
  repoOwner: string
  repoName: string
  repoId: string
  username: string
}

function getRepoSessionFromStorage(): RepoSession | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(repoSessionKey)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<RepoSession>
    if (!parsed.repoOwner || !parsed.repoName || !parsed.repoId || !parsed.username) return null
    return {
      repoOwner: parsed.repoOwner,
      repoName: parsed.repoName,
      repoId: parsed.repoId,
      username: parsed.username,
    }
  } catch {
    return null
  }
}

function base64UrlDecode(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/")
  const padding = normalized.length % 4
  const padded = padding ? normalized + "=".repeat(4 - padding) : normalized
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function parseStoredToken(): {
  authToken: WebviewAuthTokenPayload | null
  username: string | null
  rawToken: string | null
} {
  if (typeof window === "undefined") {
    return { authToken: null, username: null, rawToken: null }
  }

  const stored = localStorage.getItem(webviewAuthKey)
  if (!stored) {
    return { authToken: null, username: null, rawToken: null }
  }

  try {
    const payload = JSON.parse(stored) as WebviewAuthTokenPayload
    return {
      authToken: payload,
      username: payload.username ?? null,
      rawToken: localStorage.getItem(webviewRawTokenKey),
    }
  } catch {
    return { authToken: null, username: null, rawToken: null }
  }
}

const TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

export function isTokenValid(): boolean {
  const { authToken, rawToken } = parseStoredToken()
  if (!authToken || !rawToken) return false
  const age = Date.now() - (authToken.issuedAt ?? 0)
  return age < TOKEN_MAX_AGE_MS
}

const initial = parseStoredToken()

type GithubAuthState = {
  authToken: WebviewAuthTokenPayload | null
  username: string | null
  rawToken: string | null
  repoSession: RepoSession | null
  loading: boolean
  error: string | null
  userCode: string | null
  verificationUri: string | null

  initialLoginCheck: () => () => void
  loginByGithub: (onStatus?: (message: string) => void) => Promise<boolean>
  receiveAuthToken: (token: string) => boolean
  setRepoSession: (session: RepoSession | null) => void
  logout: () => Promise<boolean>
}

function clearLegacyTokens() {
  if (typeof window === "undefined") return
  localStorage.removeItem(githubAccessTokenKey)
}

export const useGithubAuthStore = create<GithubAuthState>((set) => ({
  authToken: initial.authToken,
  username: initial.username,
  rawToken: initial.rawToken,
  repoSession: getRepoSessionFromStorage(),
  loading: true,
  error: null,
  userCode: null,
  verificationUri: null,

  initialLoginCheck: () => {
    const fresh = parseStoredToken()
    clearLegacyTokens()

    set({
      loading: false,
      error: null,
      authToken: fresh.authToken,
      username: fresh.username,
      rawToken: fresh.rawToken,
      repoSession: getRepoSessionFromStorage(),
    })

    return () => {}
  },

  loginByGithub: async (onStatus) => {
    set({ loading: true, error: null, userCode: null, verificationUri: null, repoSession: null })

    try {
      localStorage.removeItem(webviewAuthKey)
      localStorage.removeItem(webviewRawTokenKey)
      localStorage.removeItem(repoSessionKey)
      clearLegacyTokens()

      const result = await requestGithubAuth((progress) => {
        onStatus?.(progress.message ?? "Authorizing with GitHub...")
        if (progress.userCode) {
          set({ userCode: progress.userCode, verificationUri: progress.verificationUri ?? null })
        }
      })

      if (!result.success || !result.accessToken) {
        throw new Error(result.error ?? "GitHub authentication failed.")
      }

      onStatus?.("Securing token...")

      const data = await apiRequest<{ code: string }>("POST", "/api/auth/vscode-token/device", {
        githubAccessToken: result.accessToken,
      })

      if (!data?.code) {
        throw new Error("The backend could not issue an exchange code.")
      }

      const exchange = await apiRequest<{ token: string }>("POST", "/api/auth/vscode-token/exchange", {
        code: data.code,
      })

      if (!exchange?.token) {
        throw new Error("The backend could not exchange the auth code.")
      }

      const payload = parsePayload(exchange.token)
      if (!payload) {
        throw new Error("Invalid auth token received.")
      }

      localStorage.setItem(
        webviewAuthKey,
        JSON.stringify({
          uid: payload.uid,
          username: payload.username,
          issuedAt: Date.now(),
        } satisfies WebviewAuthTokenPayload),
      )
      localStorage.setItem(webviewRawTokenKey, exchange.token)

      set({
        authToken: {
          uid: payload.uid,
          username: payload.username,
          issuedAt: Date.now(),
        },
        username: payload.username ?? null,
        rawToken: exchange.token,
        loading: false,
        error: null,
      })

      return true
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Something went wrong.",
      })

      return false
    }
  },

  receiveAuthToken: (token) => {
    if (token.startsWith("error:")) {
      set({ loading: false, error: token.replace(/^error:/, "") })
      return false
    }

    const payload = parsePayload(token)
    if (!payload) {
      set({
        loading: false,
        error: "Invalid auth token received.",
      })
      return false
    }

    clearLegacyTokens()
    localStorage.removeItem(repoSessionKey)
    localStorage.setItem(webviewAuthKey, JSON.stringify(payload))
    localStorage.setItem(webviewRawTokenKey, token)

    set({
      authToken: payload,
      username: payload.username ?? null,
      rawToken: token,
      repoSession: null,
      loading: false,
      error: null,
    })

    return true
  },

  setRepoSession: (session) => {
    if (typeof window !== "undefined") {
      if (session) {
        localStorage.setItem(repoSessionKey, JSON.stringify(session))
      } else {
        localStorage.removeItem(repoSessionKey)
      }
    }
    set({ repoSession: session })
  },

  logout: async () => {
    try {
      localStorage.removeItem(webviewAuthKey)
      localStorage.removeItem(webviewRawTokenKey)
      localStorage.removeItem(repoSessionKey)
      clearLegacyTokens()

      set({
        authToken: null,
        username: null,
        rawToken: null,
        repoSession: null,
        loading: false,
        error: null,
      })

      return true
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Something went wrong.",
      })

      return false
    }
  },
}))

function parsePayload(token: string): WebviewAuthTokenPayload | null {
  try {
    const segments = token.split(".")
    if (segments.length !== 3) {
      return null
    }

    const decoded = JSON.parse(base64UrlDecode(segments[1] as string)) as Record<string, unknown>
    if (!decoded.uid && !decoded.username) {
      return null
    }

    return {
      uid: typeof decoded.uid === "string" ? decoded.uid : "",
      username: typeof decoded.username === "string" ? decoded.username : undefined,
      issuedAt: typeof decoded.issuedAt === "number" ? decoded.issuedAt : Date.now(),
    }
  } catch {
    return null
  }
}
