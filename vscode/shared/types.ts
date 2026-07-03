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

export type WebviewMessage =
  | { type: "navigate"; payload: { path: string } }
  | { type: "auth"; payload: { code: string } }
  | { type: "sendMessage"; payload: { text: string } }
  | { type: "openSettings" }
  | { type: "updateConnectionStatus"; payload: { status: string } }
  | { type: "apiRequest"; payload: ApiRequestPayload }

export type ExtensionMessage =
  | { type: "connectionStatus"; payload: { status: string } }
  | { type: "navigate"; payload: { path: string } }
  | { type: "apiResponse"; payload: ApiResponsePayload }
