import path from "node:path"
import { readFileSync } from "node:fs"
import { createServer, type Server } from "node:http"
import type { AddressInfo } from "node:net"
import type {
  CancellationToken,
  ExtensionContext,
  WebviewView,
  WebviewViewProvider,
  WebviewViewResolveContext,
} from "vscode"
import { Uri, workspace, commands, env } from "vscode"
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
} from "../../shared/types"
import { GithubAuthService } from "../services/GithubAuthService"

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

export class GithuvWebviewProvider implements WebviewViewProvider {
  public static readonly viewType = "githuv.chat"

  private _view?: WebviewView
  private readonly _githubAuth = new GithubAuthService()
  private _callbackServer?: Server

  constructor(
    private readonly _extensionUri: Uri,
    private readonly _apiUrl: string,
    private readonly _clientUrl: string,
    private readonly _extensionId: string,
    private readonly _context: ExtensionContext,
  ) {}

  async resolveWebviewView(
    webviewView: WebviewView,
    _context: WebviewViewResolveContext,
    _token: CancellationToken
  ) {
    this._view = webviewView

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
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

  private async _handleGetWorkspaceInfo() {
    const payload: WorkspaceInfoPayload = { isRepo: false }

    try {
      const folders = workspace.workspaceFolders
      if (!folders || folders.length === 0) {
        this.postMessage({ type: "workspaceInfo", payload })
        return
      }

      const folder = folders[0]
      if (!folder) {
        this.postMessage({ type: "workspaceInfo", payload })
        return
      }

      const folderPath = folder.uri.fsPath
      payload.folderPath = folderPath

      const gitConfigPath = path.join(folderPath, ".git", "config")
      let gitConfig: string
      try {
        gitConfig = readFileSync(gitConfigPath, "utf-8")
      } catch {
        this.postMessage({ type: "workspaceInfo", payload })
        return
      }

      const remoteMatch = gitConfig.match(/\[remote "origin"\]\s*\n\s*url\s*=\s*(.+)/)
      if (!remoteMatch) {
        this.postMessage({ type: "workspaceInfo", payload })
        return
      }

      const remoteUrl = remoteMatch[1]?.trim()
      if (!remoteUrl) {
        this.postMessage({ type: "workspaceInfo", payload })
        return
      }
      const parsed = parseGitRemoteUrl(remoteUrl)

      if (!parsed) {
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

      const responsePayload: GithubApiResponsePayload = {
        id,
        status: result.status ?? response.status,
        data: result.data,
        error: result.message,
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

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'unsafe-eval'; connect-src http://localhost:4004 ws://localhost:4004 https://github.com https://api.github.com;">
  <link rel="stylesheet" href="${styleUri}">
  <title>Githuv</title>
</head>
<body>
  ${tokenScript}
  <div id="root"></div>
  <script src="${scriptUri}"></script>
</body>
</html>`
  }
}
