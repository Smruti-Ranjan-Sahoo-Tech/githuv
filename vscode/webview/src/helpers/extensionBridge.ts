import type {
  ExtensionMessage,
  WorkspaceInfoPayload,
  GithubApiResponsePayload,
  GithubAuthProgressPayload,
  GithubAuthResponsePayload,
} from "@shared/types"
import { sendMessage } from "./postMessage"

let workspaceRequestId = 0
let githubRequestId = 0
let githubAuthRequestId = 0

const pendingWorkspace = new Map<string, { resolve: (v: WorkspaceInfoPayload) => void; reject: (e: Error) => void }>()
const pendingGithub = new Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void }>()
const pendingGithubAuth = new Map<
  string,
  {
    resolve: (v: GithubAuthResponsePayload) => void
    reject: (e: Error) => void
    onProgress?: (payload: GithubAuthProgressPayload) => void
  }
>()

window.addEventListener("message", (event: MessageEvent<ExtensionMessage>) => {
  const msg = event.data

  if (msg.type === "workspaceInfo") {
    const p = pendingWorkspace.get("workspace")
    if (p) {
      pendingWorkspace.delete("workspace")
      p.resolve(msg.payload)
    }
  }

  if (msg.type === "githubApiResponse") {
    const { id, data, error } = msg.payload
    const p = pendingGithub.get(id)
    if (p) {
      pendingGithub.delete(id)
      if (error) p.reject(new Error(error))
      else p.resolve(data)
    }
  }

  if (msg.type === "githubAuthResponse") {
    const { id } = msg.payload
    const p = pendingGithubAuth.get(id)
    if (p) {
      pendingGithubAuth.delete(id)
      p.resolve(msg.payload)
    }
  }

  if (msg.type === "githubAuthProgress") {
    const { id } = msg.payload
    const p = pendingGithubAuth.get(id)
    if (p?.onProgress) {
      p.onProgress(msg.payload)
    }
  }
})

export function getWorkspaceInfo(): Promise<WorkspaceInfoPayload> {
  return new Promise((resolve, reject) => {
    pendingWorkspace.set("workspace", { resolve, reject })
    sendMessage({ type: "getWorkspaceInfo" })
  })
}

export function githubApiRequest<T = unknown>(
  endpoint: string,
  method: string,
  token: string,
  body?: unknown,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = `${++githubRequestId}`
    pendingGithub.set(id, { resolve: resolve as (v: unknown) => void, reject })
    sendMessage({ type: "githubApiRequest", payload: { id, endpoint, method, token, body } })
  })
}

export function requestGithubAuth(
  onProgress?: (payload: GithubAuthProgressPayload) => void,
): Promise<GithubAuthResponsePayload> {
  return new Promise((resolve, reject) => {
    const id = `${++githubAuthRequestId}`
    pendingGithubAuth.set(id, { resolve, reject, onProgress })
    sendMessage({ type: "githubAuthRequest", payload: { id } })
  })
}
