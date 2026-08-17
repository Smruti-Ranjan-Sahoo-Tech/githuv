export interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: number
}

export interface AuthResponse {
  success: boolean
  token?: string
  error?: string
}

export interface LetterResponse {
  success: boolean
  data?: unknown
  error?: string
}

export interface ApiRequestPayload {
  id: string
  method: string
  path: string
  headers?: Record<string, string>
  body?: unknown
}

export interface ApiResponsePayload {
  id: string
  status: number
  data?: unknown
  error?: string
}

export interface WorkspaceInfoPayload {
  isRepo: boolean
  repoName?: string
  repoOwner?: string
  remoteUrl?: string
  folderPath?: string
}

export interface GithubApiRequestPayload {
  id: string
  endpoint: string
  method: string
  token: string
  body?: unknown
}

export interface GithubApiResponsePayload {
  id: string
  status: number
  data?: unknown
  error?: string
}

export interface GithubAuthRequestPayload {
  id: string
}

export interface GithubAuthProgressPayload {
  id: string
  message?: string
  userCode?: string
  verificationUri?: string
}

export interface GithubAuthResponsePayload {
  id: string
  success: boolean
  accessToken?: string
  error?: string
}

export interface WebviewAuthTokenPayload {
  uid: string
  username?: string
  displayName?: string
  email?: string
  avatarUrl?: string
  issuedAt: number
}

export type WebviewMessage =
  | { type: "navigate"; payload: { path: string } }
  | { type: "auth"; payload: { code: string } }
  | { type: "sendMessage"; payload: { text: string } }
  | { type: "openSettings" }
  | { type: "updateConnectionStatus"; payload: { status: string } }
  | { type: "apiRequest"; payload: ApiRequestPayload }
  | { type: "getWorkspaceInfo" }
  | { type: "githubApiRequest"; payload: GithubApiRequestPayload }
  | { type: "githubAuthRequest"; payload: GithubAuthRequestPayload }
  | { type: "openClientAuth" }
  | { type: "clearStoredToken" }

export type ExtensionMessage =
  | { type: "connectionStatus"; payload: { status: string } }
  | { type: "navigate"; payload: { path: string } }
  | { type: "apiResponse"; payload: ApiResponsePayload }
  | { type: "workspaceInfo"; payload: WorkspaceInfoPayload }
  | { type: "githubApiResponse"; payload: GithubApiResponsePayload }
  | { type: "githubAuthProgress"; payload: GithubAuthProgressPayload }
  | { type: "githubAuthResponse"; payload: GithubAuthResponsePayload }
  | { type: "authToken"; payload: { token: string } }
