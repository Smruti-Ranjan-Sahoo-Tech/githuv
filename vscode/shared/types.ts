export interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: number
  imageUrl?: string
  imageLocalPath?: string
}

export interface LocalChatMessage extends ChatMessage {
  roomId: string
  sender: string
  /** RxDB sync fields */
  synced: boolean
  delivered: boolean
  deliveredAt?: number
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

export interface CopyTextPayload {
  text: string
}

export interface InsertTextPayload {
  text: string
}

export interface SaveChangesPayload {
  filePath?: string
  content: string
}

export interface SavedChatMessage {
  id: string
  roomId: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: number
  sender?: string
  imageUrl?: string
  imagePublicId?: string
  imageLocalPath?: string
  localImagePath?: string
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

export interface UploadImagePayload {
  id: string
  roomId: string
  dataUrl: string
  fileName: string
}

export interface UploadImageResultPayload {
  id: string
  success: boolean
  imageUrl?: string
  publicId?: string
  localImagePath?: string
  error?: string
}

export interface SaveReceivedImagePayload {
  id: string
  imageUrl: string
  /** Proposed local file name (derived from the sender's copy or the CDN URL). */
  fileName: string
}

export interface SaveReceivedImageResultPayload {
  id: string
  success: boolean
  localImagePath?: string
  error?: string
}

export interface OpenExternalPayload {
  url: string
}

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface TaskUserRef {
  userId: string;
  username: string;
  avatar: string | null;
}

export interface TaskRepoRef {
  owner: string;
  name: string;
  fullName: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  tags: string[];
  assignee: TaskUserRef | null;
  dueDate: string | null;
  /** Optional — null when no repository is detected/available. */
  repository: TaskRepoRef | null;
  createdBy: TaskUserRef;
  createdAt: string;
  updatedAt: string;
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
  | { type: "copyText"; payload: CopyTextPayload }
  | { type: "insertText"; payload: InsertTextPayload }
  | { type: "saveChanges"; payload: SaveChangesPayload }
  | { type: "getSavedMessages"; payload: { roomId: string } }
  | { type: "saveMessages"; payload: { roomId: string; messages: SavedChatMessage[] } }
  | { type: "uploadImage"; payload: UploadImagePayload }
  | { type: "saveReceivedImage"; payload: SaveReceivedImagePayload }
  | { type: "openExternal"; payload: OpenExternalPayload }
  | { type: "getSavedTasks" }
  | { type: "saveTasks"; payload: { tasks: Task[] } }

export type ExtensionMessage =
  | { type: "connectionStatus"; payload: { status: string } }
  | { type: "navigate"; payload: { path: string } }
  | { type: "apiResponse"; payload: ApiResponsePayload }
  | { type: "workspaceInfo"; payload: WorkspaceInfoPayload }
  | { type: "githubApiResponse"; payload: GithubApiResponsePayload }
  | { type: "githubAuthProgress"; payload: GithubAuthProgressPayload }
  | { type: "githubAuthResponse"; payload: GithubAuthResponsePayload }
  | { type: "authToken"; payload: { token: string } }
  | { type: "savedMessages"; payload: { messages: SavedChatMessage[] } }
  | { type: "operationResult"; payload: { success: boolean; message: string } }
  | { type: "uploadImageResult"; payload: UploadImageResultPayload }
  | { type: "saveReceivedImageResult"; payload: SaveReceivedImageResultPayload }
  | { type: "savedTasks"; payload: { tasks: Task[] } }