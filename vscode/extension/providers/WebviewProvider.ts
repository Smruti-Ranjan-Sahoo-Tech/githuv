import path from "node:path"
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from "node:fs"
import { createServer, type Server } from "node:http"
import type { AddressInfo } from "node:net"
import type {
  CancellationToken,
  ExtensionContext,
  WebviewView,
  WebviewViewProvider,
  WebviewViewResolveContext,
} from "vscode"
import { Uri, workspace, commands, env, window, Range } from "vscode"
import type {
  WebviewMessage,
  ExtensionMessage,
  ApiRequestPayload,
  ApiResponsePayload,
  WorkspaceInfoPayload,
  GithubApiRequestPayload,
  GithubApiResponsePayload,
  GithubAuthRequestPayload,
  GithubAuthResponsePayload,
  CopyTextPayload,
  InsertTextPayload,
  SaveChangesPayload,
  SavedChatMessage,
  UploadImagePayload,
  UploadImageResultPayload,
  SaveReceivedImagePayload,
  SaveReceivedImageResultPayload,
  OpenExternalPayload,
  Task,
} from "../../shared/types"
import { GithubAuthService } from "../services/GithubAuthService"

const ROUTE_TO_VIEW: Record<string, string> = {
  "/chat": "githuv.sidebar",
  "/tasks": "githuv.sidebar",
  "/repo": "githuv.sidebar",
}

export { ROUTE_TO_VIEW }

function parseGitRemoteUrl(remoteUrl: string): { owner: string; repo: string } | null {
  // SSH: git@github.com:owner/repo.git
  const sshMatch = remoteUrl.match(/github\.com[:/](.+?)\/(.+?)(?:\.git)?$/)
  if (sshMatch) {
    const [, owner, repo] = sshMatch
    if (owner && repo) {
      return { owner, repo }
    }
  }
  // HTTPS: https://github.com/owner/repo.git
  const httpsMatch = remoteUrl.match(/github\.com\/(.+?)\/(.+?)(?:\.git)?$/)
  if (httpsMatch) {
    const [, owner, repo] = httpsMatch
    if (owner && repo) {
      return { owner, repo }
    }
  }
  return null
}

/**
 * Walks up from `startDir` looking for a `.git` entry. The opened folder is
 * often a subdirectory of the real repository (e.g. a monorepo package), so
 * checking only the folder root misses the repo entirely.
 */
function findGitRepoRoot(startDir: string): string | null {
  let current = path.resolve(startDir)
  const root = path.parse(current).root

  for (;;) {
    if (existsSync(path.join(current, ".git"))) return current
    if (current === root) return null
    current = path.dirname(current)
  }
}

/**
 * Resolves the actual git directory: a `.git` file (worktree / submodule)
 * points at the real directory, and worktrees keep the shared config (with the
 * remotes) one level up via a `commondir` file.
 */
function resolveGitDir(gitPath: string): string | null {
  let dir: string | null = null
  try {
    if (existsSync(gitPath) && statSync(gitPath).isFile()) {
      const content = readFileSync(gitPath, "utf-8").trim()
      const match = content.match(/^gitdir:\s*(.+)$/m)
      const target = match?.[1]?.trim()
      if (!target) return null
      dir = path.isAbsolute(target) ? target : path.resolve(path.dirname(gitPath), target)
    } else if (existsSync(gitPath)) {
      dir = gitPath
    }
  } catch {
    return null
  }
  if (!dir) return null

  try {
    const commonPath = path.join(dir, "commondir")
    if (existsSync(commonPath)) {
      const common = readFileSync(commonPath, "utf-8").trim()
      const commonDir = path.isAbsolute(common) ? common : path.resolve(dir, common)
      if (existsSync(path.join(commonDir, "config"))) return commonDir
    }
  } catch {
    // ignore — fall back to the resolved dir
  }

  return dir
}

/**
 * Picks the best GitHub remote from a git config: `origin` first, then any
 * other remote that points at github.com.
 */
function pickGithubRemoteUrl(gitConfig: string): string | null {
  const remotes = new Map<string, string>()
  const sections = gitConfig.split(/^\s*\[remote "/m)
  for (const section of sections.slice(1)) {
    const name = section.slice(0, section.indexOf('"'))
    const url = section.match(/^\s*url\s*=\s*(.+)$/m)?.[1]?.trim()
    if (name && url) remotes.set(name, url)
  }

  const origin = remotes.get("origin")
  if (origin && parseGitRemoteUrl(origin)) return origin

  for (const url of remotes.values()) {
    if (parseGitRemoteUrl(url)) return url
  }
  return null
}

export class GithuvWebviewProvider implements WebviewViewProvider {
  private _view?: WebviewView
  private readonly _githubAuth = new GithubAuthService()
  private _callbackServer?: Server

  constructor(
    /** Native VS Code view id this provider backs. */
    readonly viewType: string,
    /** Initial SPA route for this view (e.g. "/chat"). */
    private readonly _route: string,
    private readonly _extensionUri: Uri,
    private readonly _apiUrl: string,
    private readonly _clientUrl: string,
    private readonly _chatUrl: string,
    private readonly _extensionId: string,
    private readonly _context: ExtensionContext,
  ) {}

  async resolveWebviewView(
    webviewView: WebviewView,
    _context: WebviewViewResolveContext,
    _token: CancellationToken
  ) {
    this._view = webviewView

    const imagesDirUri = this._getImagesDirUri()

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: imagesDirUri
        ? [this._extensionUri, imagesDirUri]
        : [this._extensionUri],
    }

    let storedToken: string | undefined
    try {
      storedToken = await this._context.secrets.get("githuv-token")
    } catch {
      // ignore
    }

    webviewView.webview.html = this._getHtmlContent(webviewView.webview, storedToken)

    webviewView.webview.onDidReceiveMessage((message: WebviewMessage) => {
      switch (message.type) {
        case "navigate":
          commands.executeCommand("setContext", "githuv.view", message.payload.path)
          this._focusViewForPath(message.payload.path)
          break
        case "openSettings":
          commands.executeCommand("workbench.action.openSettings", "githuv")
          break
        case "apiRequest":
          this._handleApiRequest(message.payload)
          break
        case "getWorkspaceInfo":
          this._handleGetWorkspaceInfo()
          break
        case "githubApiRequest":
          this._handleGithubApiRequest(message.payload)
          break
        case "githubAuthRequest":
          this._handleGithubAuthRequest(message.payload)
          break
        case "openClientAuth":
          this._handleOpenClientAuth()
          break
        case "clearStoredToken":
          void this._context.secrets.delete("githuv-token")
          break
        case "copyText":
          this._handleCopyText(message.payload)
          break
        case "insertText":
          this._handleInsertText(message.payload)
          break
        case "saveChanges":
          this._handleSaveChanges(message.payload)
          break
        case "getSavedMessages":
          this._handleGetSavedMessages(message.payload.roomId)
          break
        case "saveMessages":
          this._handleSaveMessages(message.payload.roomId, message.payload.messages)
          break
        case "sendMessage":
          this._handleSendMessage(message.payload.text)
          break
        case "uploadImage":
          void this._handleUploadImage(message.payload)
          break
        case "saveReceivedImage":
          void this._handleSaveReceivedImage(message.payload)
          break
        case "openExternal":
          void this._handleOpenExternal(message.payload)
          break
        case "getSavedTasks":
          this._handleGetSavedTasks()
          break
        case "saveTasks":
          this._handleSaveTasks(message.payload.tasks)
          break
      }
    })
  }

  postMessage(message: ExtensionMessage) {
    this._view?.webview.postMessage(message)
  }

  receiveAuthToken(token: string) {
    this.postMessage({ type: "authToken", payload: { token } })
    this._saveToken(token)
  }

  private async _saveToken(token: string) {
    try {
      await this._context.secrets.store("githuv-token", token)
    } catch {
      // secrets storage failed, non-critical
    }
  }

  async receiveAuthCode(code: string) {
    try {
      const response = await fetch(`${this._apiUrl}/api/auth/vscode-token/exchange`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })

      const result = (await response.json().catch(() => ({}))) as {
        token?: string
        message?: string
      }

      if (!response.ok || !result.token) {
        throw new Error(result.message ?? "Failed to exchange auth code")
      }

      this.postMessage({ type: "authToken", payload: { token: result.token } })
      this._saveToken(result.token)
    } catch (error) {
      this.postMessage({
        type: "authToken",
        payload: {
          token: `error:${error instanceof Error ? error.message : "Failed to exchange auth code"}`,
        },
      })
    }
  }

  private async _handleOpenClientAuth() {
    const callbackUrl = await this._startCallbackServer()

    const url = new URL(`${this._clientUrl}/vscode-auth`)
    if (callbackUrl) {
      url.searchParams.set("redirect", callbackUrl)
    } else {
      url.searchParams.set("redirect", `vscode://${this._extensionId}/auth-callback`)
    }

    try {
      await env.openExternal(Uri.parse(url.toString()))
    } catch {
      this.postMessage({
        type: "authToken",
        payload: {
          token:
            "error:Could not open browser. Make sure the client app is running.",
        },
      })
    }
  }

  private _startCallbackServer(): Promise<string | null> {
    if (this._callbackServer) {
      this._callbackServer.close()
      this._callbackServer = undefined
    }

    return new Promise((resolve) => {
      const server = createServer(async (req, res) => {
        try {
          const reqUrl = new URL(req.url ?? "/", "http://localhost")
          if (reqUrl.pathname !== "/callback") {
            res.writeHead(404)
            res.end("Not found")
            return
          }

          const code = reqUrl.searchParams.get("code")
          res.writeHead(200, { "Content-Type": "text/html" })
          res.end(
            "<!DOCTYPE html><html><body style='font-family:sans-serif;background:#0d1117;color:#c9d1d9;display:flex;align-items:center;justify-content:center;height:100vh'><h2>Authentication complete. You can close this window.</h2></body></html>"
          )

          if (code) {
            void this.receiveAuthCode(code)
          }
        } finally {
          server.close(() => {
            if (this._callbackServer === server) {
              this._callbackServer = undefined
            }
          })
        }
      })

      server.on("error", () => {
        this._callbackServer = undefined
        resolve(null)
      })

      server.listen(0, "127.0.0.1", () => {
        const address = server.address() as AddressInfo
        this._callbackServer = server
        resolve(`http://127.0.0.1:${address.port}/callback`)
      })
    })
  }

  dispose() {
    if (this._callbackServer) {
      this._callbackServer.close()
      this._callbackServer = undefined
    }
  }

  /**
   * Keep the shared Githuv sidebar focused when the SPA navigates.
   */
  private _focusViewForPath(path: string) {
    const viewId = ROUTE_TO_VIEW[path]
    if (viewId) {
      commands.executeCommand(`${viewId}.focus`)
    }
  }

  private async _handleGetWorkspaceInfo() {
    const payload: WorkspaceInfoPayload = { isRepo: false }

    try {
      const folders = workspace.workspaceFolders
      const folder = folders?.[0]
      if (!folder) {
        this.postMessage({ type: "workspaceInfo", payload })
        return
      }

      const folderPath = folder.uri.fsPath
      payload.folderPath = folderPath

      // The opened folder may be a subdirectory of the actual repository
      // (e.g. a monorepo package folder), so walk up until `.git` is found.
      const repoRoot = findGitRepoRoot(folderPath)
      if (!repoRoot) {
        this.postMessage({ type: "workspaceInfo", payload })
        return
      }

      const gitDir = resolveGitDir(path.join(repoRoot, ".git"))
      if (!gitDir) {
        this.postMessage({ type: "workspaceInfo", payload })
        return
      }

      let gitConfig: string
      try {
        gitConfig = readFileSync(path.join(gitDir, "config"), "utf-8")
      } catch {
        this.postMessage({ type: "workspaceInfo", payload })
        return
      }

      const remoteUrl = pickGithubRemoteUrl(gitConfig)
      const parsed = remoteUrl ? parseGitRemoteUrl(remoteUrl) : null
      if (!remoteUrl || !parsed) {
        this.postMessage({ type: "workspaceInfo", payload })
        return
      }

      payload.isRepo = true
      payload.repoOwner = parsed.owner
      payload.repoName = parsed.repo
      payload.remoteUrl = remoteUrl
    } catch {
      // fallback: not a repo
    }

    this.postMessage({ type: "workspaceInfo", payload })
  }

  private async _handleGithubApiRequest(payload: GithubApiRequestPayload) {
    const { id, endpoint, method, token, body } = payload

    try {
      const response = await fetch(`${this._apiUrl}/api/auth/vscode/github`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, endpoint, method, body }),
      })

      const result = (await response.json().catch(() => ({}))) as {
        status?: number
        data?: unknown
        message?: string
      }

      const status = result.status ?? response.status
      let error: string | undefined
      if (status >= 400) {
        const data = result.data
        const dataMessage =
          data && typeof data === "object" && "message" in (data as Record<string, unknown>)
            ? String((data as { message: unknown }).message)
            : undefined
        error = result.message ?? dataMessage ?? `GitHub API request failed (${status})`
      }

      const responsePayload: GithubApiResponsePayload = {
        id,
        status,
        data: result.data,
        error,
      }

      this.postMessage({ type: "githubApiResponse", payload: responsePayload })
    } catch (err) {
      const responsePayload: GithubApiResponsePayload = {
        id,
        status: 0,
        error: err instanceof Error ? err.message : "GitHub API request failed",
      }

      this.postMessage({ type: "githubApiResponse", payload: responsePayload })
    }
  }

  private async _handleGithubAuthRequest(payload: GithubAuthRequestPayload) {
    const { id } = payload

    try {
      const result = await this._githubAuth.authenticate((progress: { message: string; userCode?: string; verificationUri?: string }) => {
        this.postMessage({ type: "githubAuthProgress", payload: { id, message: progress.message, userCode: progress.userCode, verificationUri: progress.verificationUri } })
      })
      const responsePayload: GithubAuthResponsePayload = {
        id,
        success: true,
        accessToken: result.accessToken,
      }

      this.postMessage({ type: "githubAuthResponse", payload: responsePayload })
    } catch (error) {
      const responsePayload: GithubAuthResponsePayload = {
        id,
        success: false,
        error: error instanceof Error ? error.message : "GitHub authentication failed",
      }

      this.postMessage({ type: "githubAuthResponse", payload: responsePayload })
    }
  }

  private async _handleApiRequest(payload: ApiRequestPayload) {
    const { id, method, path: reqPath, headers, body } = payload

    const url = reqPath.startsWith("http") ? reqPath : `${this._apiUrl}${reqPath}`

    try {
      const fetchOptions: RequestInit = {
        method,
        headers: { "Content-Type": "application/json", ...headers },
      }

      if (body && method !== "GET" && method !== "HEAD") {
        fetchOptions.body = JSON.stringify(body)
      }

      const response = await fetch(url, fetchOptions)

      let data: unknown
      const contentType = response.headers.get("content-type") ?? ""
      if (contentType.includes("application/json")) {
        data = await response.json()
      } else {
        data = await response.text()
      }

      const responsePayload: ApiResponsePayload = {
        id,
        status: response.status,
        data,
      }

      this.postMessage({ type: "apiResponse", payload: responsePayload })
    } catch (err) {
      const responsePayload: ApiResponsePayload = {
        id,
        status: 0,
        error: err instanceof Error ? err.message : "Request failed",
      }

      this.postMessage({ type: "apiResponse", payload: responsePayload })
    }
  }

  private async _handleCopyText(payload: CopyTextPayload) {
    try {
      await env.clipboard.writeText(payload.text)
      this.postMessage({ type: "operationResult", payload: { success: true, message: "Text copied to clipboard" } })
    } catch {
      this.postMessage({ type: "operationResult", payload: { success: false, message: "Failed to copy text" } })
    }
  }

  private _handleInsertText(payload: InsertTextPayload) {
    const editor = window.activeTextEditor
    if (!editor) {
      this.postMessage({ type: "operationResult", payload: { success: false, message: "No active editor" } })
      return
    }

    editor.edit((editBuilder) => {
      editBuilder.insert(editor.selection.active, payload.text)
    }).then((success) => {
      this.postMessage({ type: "operationResult", payload: { success, message: success ? "Text inserted" : "Failed to insert text" } })
    })
  }

  private async _handleSaveChanges(payload: SaveChangesPayload) {
    try {
      const activeEditor = window.activeTextEditor
      const activeFilePath = activeEditor?.document.uri.scheme === "file" ? activeEditor.document.uri.fsPath : undefined
      const targetFilePath = payload.filePath ?? activeFilePath

      if (!targetFilePath) {
        const folders = workspace.workspaceFolders
        if (!folders || folders.length === 0) {
          this.postMessage({ type: "operationResult", payload: { success: false, message: "No workspace folder found" } })
          return
        }
        const folder = folders[0]
        if (!folder) {
          this.postMessage({ type: "operationResult", payload: { success: false, message: "No workspace folder found" } })
          return
        }
        const folderPath = folder.uri.fsPath
        const githuvDir = path.join(folderPath, ".githuv")
        if (!existsSync(githuvDir)) {
          mkdirSync(githuvDir, { recursive: true })
        }
        const suggestionPath = path.join(githuvDir, `suggestion-${Date.now()}.md`)
        writeFileSync(suggestionPath, payload.content, "utf-8")
        this.postMessage({ type: "operationResult", payload: { success: true, message: `Changes saved to ${suggestionPath}` } })

        const doc = await workspace.openTextDocument(Uri.file(suggestionPath))
        await window.showTextDocument(doc)
        return
      }

      if (activeEditor && activeFilePath === targetFilePath) {
        const document = activeEditor.document
        const lastLine = document.lineCount - 1
        const fullRange = new Range(
          document.lineAt(0).range.start,
          document.lineAt(lastLine).range.end
        )

        const success = await activeEditor.edit((editBuilder) => {
          editBuilder.replace(fullRange, payload.content)
        })

        if (!success) {
          this.postMessage({ type: "operationResult", payload: { success: false, message: "Failed to update active editor" } })
          return
        }

        await activeEditor.document.save()
      } else {
        writeFileSync(targetFilePath, payload.content, "utf-8")
      }

      this.postMessage({ type: "operationResult", payload: { success: true, message: `Changes saved to ${targetFilePath}` } })

      const doc = await workspace.openTextDocument(Uri.file(targetFilePath))
      await window.showTextDocument(doc)
    } catch (error) {
      this.postMessage({ type: "operationResult", payload: { success: false, message: `Failed to save: ${error instanceof Error ? error.message : "Unknown error"}` } })
    }
  }

  private async _handleUploadImage(payload: UploadImagePayload) {
    const { id, roomId, dataUrl, fileName } = payload

    const result: UploadImageResultPayload = { id, success: false }

    try {
      const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
      if (!match) throw new Error("Invalid image data")
      const mime = match[1]!
      const buffer = Buffer.from(match[2]!, "base64")
      if (buffer.byteLength > 10 * 1024 * 1024) throw new Error("Image exceeds 10MB")

      const ext = (mime.split("/")[1] ?? "png").replace("jpeg", "jpg")
      const localPath = await this._saveImageLocally(roomId, id, ext, buffer)

      const form = new FormData()
      const blob = new Blob([new Uint8Array(buffer)], { type: mime })
      form.append("image", blob, fileName || `chat-${id}.${ext}`)

      const response = await fetch(`${this._chatUrl}/api/images/upload`, {
        method: "POST",
        body: form,
      })

      const json = (await response.json().catch(() => ({}))) as {
        success?: boolean
        imageUrl?: string
        publicId?: string
        error?: string
      }

      if (!response.ok || !json.success || !json.imageUrl) {
        throw new Error(json.error ?? "Cloudinary upload failed")
      }

      result.success = true
      result.imageUrl = json.imageUrl
      result.publicId = json.publicId
      result.localImagePath = localPath
    } catch (error) {
      result.error = error instanceof Error ? error.message : "Upload failed"
    }

    this.postMessage({ type: "uploadImageResult", payload: result })
  }

  private async _saveImageLocally(roomId: string, id: string, ext: string, buffer: Buffer): Promise<string> {
    const githuvDir = this._getGithuvDir()
    if (!githuvDir) throw new Error("No workspace folder found")

    const imagesDir = path.join(githuvDir, "images")
    if (!existsSync(imagesDir)) {
      mkdirSync(imagesDir, { recursive: true })
    }

    const filePath = path.join(imagesDir, `${id}.${ext}`)
    writeFileSync(filePath, buffer)
    return filePath
  }

  /**
   * WhatsApp-style received-image persistence: downloads an image the remote
   * user shared (Cloudinary URL) and stores a permanent local copy in
   * .githuv/images/ so the receiver keeps it even after the 7-day CDN TTL.
   * Skips the download when the file already exists locally.
   */
  private async _handleSaveReceivedImage(payload: SaveReceivedImagePayload) {
    const { id, imageUrl, fileName } = payload
    const result: SaveReceivedImageResultPayload = { id, success: false }
    try {
      if (!imageUrl) throw new Error("Missing image URL")
      const ext = (imageUrl.match(/\.(jpe?g|png|gif|webp|bmp|svg)$/i)?.[1] ?? "jpg").toLowerCase().replace("jpeg", "jpg")
      const safeName = (fileName || `msg-${id}.${ext}`).replace(/[^a-zA-Z0-9._-]/g, "-").replace(/\.+$/g, "") || `msg-${id}.${ext}`
      const finalName = safeName.endsWith(`.${ext}`) ? safeName : `${safeName}.${ext}`

      const githuvDir = this._getGithuvDir()
      if (!githuvDir) throw new Error("No workspace folder found")
      const imagesDir = path.join(githuvDir, "images")
      if (!existsSync(imagesDir)) {
        mkdirSync(imagesDir, { recursive: true })
      }

      const localPath = path.join(imagesDir, finalName)
      if (!existsSync(localPath)) {
        const res = await fetch(imageUrl)
        if (!res.ok) throw new Error(`Image download failed: ${res.status}`)
        const buffer = Buffer.from(await res.arrayBuffer())
        writeFileSync(localPath, buffer)
      }

      result.success = true
      result.localImagePath = localPath
    } catch (error) {
      result.error = error instanceof Error ? error.message : "Failed to save received image"
    }

    this.postMessage({ type: "saveReceivedImageResult", payload: result })
  }

  private async _handleOpenExternal(payload: OpenExternalPayload) {
    try {
      await env.openExternal(Uri.parse(payload.url))
    } catch {
      // ignore — can't open the browser
    }
  }

  private _handleGetSavedMessages(roomId: string) {
    const githuvDir = this._getGithuvDir()
    if (!githuvDir) {
      this.postMessage({ type: "savedMessages", payload: { messages: [] } })
      return
    }

    const messagesFile = path.join(githuvDir, `messages-${roomId}.json`)
    try {
      if (existsSync(messagesFile)) {
        const data = readFileSync(messagesFile, "utf-8")
        const messages = JSON.parse(data) as SavedChatMessage[]
        this.postMessage({ type: "savedMessages", payload: { messages } })
      } else {
        this.postMessage({ type: "savedMessages", payload: { messages: [] } })
      }
    } catch {
      this.postMessage({ type: "savedMessages", payload: { messages: [] } })
    }
  }

  /**
   * Durable local archive (like WhatsApp's on-device message history). Merges
   * the given messages by id into .githuv/messages-<roomId>.json so a rejoin
   * can always restore what has been sent, even if IndexedDB was reset or the
   * chat service is unreachable.
   */
  private async _handleSaveMessages(roomId: string, incoming: SavedChatMessage[]) {
    if (!incoming.length) return

    const githuvDir = this._getGithuvDir()
    if (!githuvDir) return

    const messagesFile = path.join(githuvDir, `messages-${roomId}.json`)
    try {
      const byId = new Map<string, SavedChatMessage>()
      if (existsSync(messagesFile)) {
        const data = readFileSync(messagesFile, "utf-8")
        const existing = JSON.parse(data) as SavedChatMessage[]
        for (const msg of existing) byId.set(msg.id, msg)
      }
      for (const msg of incoming) byId.set(msg.id, msg)

      const merged = Array.from(byId.values()).sort((a, b) => a.timestamp - b.timestamp)
      writeFileSync(messagesFile, JSON.stringify(merged, null, 2), "utf-8")
    } catch {
      // non-critical archive failure — the server (MongoDB) is the source of truth
    }
  }

  private _handleGetSavedTasks() {
    const githuvDir = this._getGithuvDir()
    if (!githuvDir) {
      this.postMessage({ type: "savedTasks", payload: { tasks: [] } })
      return
    }

    const tasksFile = path.join(githuvDir, "tasks.json")
    try {
      if (existsSync(tasksFile)) {
        const data = readFileSync(tasksFile, "utf-8")
        const tasks = JSON.parse(data) as Task[]
        this.postMessage({ type: "savedTasks", payload: { tasks } })
      } else {
        this.postMessage({ type: "savedTasks", payload: { tasks: [] } })
      }
    } catch {
      this.postMessage({ type: "savedTasks", payload: { tasks: [] } })
    }
  }

  /**
   * Durable local archive for tasks (.githuv/tasks.json). The webview always
   * sends the authoritative full task list (including deletions), so this
   * replaces the file contents rather than merging, keeping the disk copy
   * identical to what the user sees.
   */
  private _handleSaveTasks(tasks: Task[]) {
    const githuvDir = this._getGithuvDir()
    if (!githuvDir) return

    const tasksFile = path.join(githuvDir, "tasks.json")
    try {
      const sorted = [...tasks].sort((a, b) => {
        return a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0
      })
      writeFileSync(tasksFile, JSON.stringify(sorted, null, 2), "utf-8")
    } catch {
      // non-critical archive failure — IndexedDB remains the primary store
    }
  }

  private _handleSendMessage(text: string) {
    const githuvDir = this._getGithuvDir()
    if (!githuvDir) {
      return
    }

    const roomId = "default"
    const messagesFile = path.join(githuvDir, `messages-${roomId}.json`)
    const message: SavedChatMessage = {
      id: crypto.randomUUID(),
      roomId,
      role: "user",
      content: text,
      timestamp: Date.now(),
    }

    try {
      let messages: SavedChatMessage[] = []
      if (existsSync(messagesFile)) {
        const data = readFileSync(messagesFile, "utf-8")
        messages = JSON.parse(data) as SavedChatMessage[]
      }
      messages.push(message)
      writeFileSync(messagesFile, JSON.stringify(messages, null, 2), "utf-8")
    } catch {
      // Ignore errors
    }
  }

  private _getGithuvDir(): string | null {
    const folders = workspace.workspaceFolders
    if (!folders || folders.length === 0) {
      return null
    }
    const folder = folders[0]
    if (!folder) {
      return null
    }
    const folderPath = folder.uri.fsPath
    const githuvDir = path.join(folderPath, ".githuv")
    if (!existsSync(githuvDir)) {
      mkdirSync(githuvDir, { recursive: true })
    }
    return githuvDir
  }

  private _getHtmlContent(webview: WebviewView["webview"], storedToken?: string): string {
    const scriptUri = webview.asWebviewUri(
      Uri.file(path.join(this._extensionUri.fsPath, "webview", "dist", "assets", "index.js"))
    )
    const styleUri = webview.asWebviewUri(
      Uri.file(path.join(this._extensionUri.fsPath, "webview", "dist", "assets", "index.css"))
    )

    const tokenScript = storedToken
      ? `<script>window.__GITHUV_STORED_TOKEN__=${JSON.stringify(storedToken)}</script>`
      : ""

    const imagesDirUri = this._getImagesDirUri()
    const imagesUri = imagesDirUri ? webview.asWebviewUri(imagesDirUri).toString() : null

    const imagesUriScript = imagesUri
      ? `<script>window.__GITHUV_IMAGES_URI__=${JSON.stringify(imagesUri)}</script>`
      : ""

    const chatUrlScript = `<script>window.__GITHUV_CHAT_URL__=${JSON.stringify(this._chatUrl)}</script>`
    const viewScript = `<script>window.__GITHUV_VIEW__=${JSON.stringify(this.viewType)}</script>`
    const routeScript = `<script>window.__GITHUV_ROUTE__=${JSON.stringify(this._route)}</script>`

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'unsafe-eval'; img-src ${webview.cspSource} data: https://res.cloudinary.com https://*.cloudinary.com https://github.com https://*.github.com https://avatars.githubusercontent.com; connect-src http://localhost:4004 ws://localhost:4004 wss://localhost:4004 http://localhost:4002 ${this._chatUrl} ${new URL(this._chatUrl).protocol === "https:" ? "wss" : "ws"}://${new URL(this._chatUrl).host} https://github.com https://api.github.com;">
  <link rel="stylesheet" href="${styleUri}">
  <title>Githuv</title>
</head>
<body>
  ${tokenScript}
  ${imagesUriScript}
  ${chatUrlScript}
  ${viewScript}
  ${routeScript}
  <div id="root"></div>
  <script src="${scriptUri}"></script>
</body>
</html>`
  }

  private _getImagesDirUri(): Uri | null {
    try {
      const folders = workspace.workspaceFolders
      if (!folders || folders.length === 0) return null
      const folder = folders[0]
      if (!folder) return null
      const imagesDir = path.join(folder.uri.fsPath, ".githuv", "images")
      if (!existsSync(imagesDir)) {
        mkdirSync(imagesDir, { recursive: true })
      }
      return Uri.file(imagesDir)
    } catch {
      return null
    }
  }
}
