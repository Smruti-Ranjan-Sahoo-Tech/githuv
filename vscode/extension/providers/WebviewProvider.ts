import path from "node:path"
import type {
  CancellationToken,
  WebviewView,
  WebviewViewProvider,
  WebviewViewResolveContext,
} from "vscode"
import { Uri, commands } from "vscode"
import type { WebviewMessage, ExtensionMessage } from "../../shared/types"

export class GithuvWebviewProvider implements WebviewViewProvider {
  public static readonly viewType = "githuv.chat"

  private _view?: WebviewView

  constructor(private readonly _extensionUri: Uri) {}

  resolveWebviewView(
    webviewView: WebviewView,
    _context: WebviewViewResolveContext,
    _token: CancellationToken
  ) {
    this._view = webviewView

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    }

    webviewView.webview.html = this._getHtmlContent(webviewView.webview)

    webviewView.webview.onDidReceiveMessage((message: WebviewMessage) => {
      switch (message.type) {
        case "navigate":
          commands.executeCommand("setContext", "githuv.view", message.payload.path)
          break
        case "openSettings":
          commands.executeCommand("workbench.action.openSettings", "githuv")
          break
      }
    })
  }

  postMessage(message: ExtensionMessage) {
    this._view?.webview.postMessage(message)
  }

  private _getHtmlContent(webview: WebviewView["webview"]): string {
    const scriptUri = webview.asWebviewUri(
      Uri.file(path.join(this._extensionUri.fsPath, "webview", "dist", "assets", "index.js"))
    )
    const styleUri = webview.asWebviewUri(
      Uri.file(path.join(this._extensionUri.fsPath, "webview", "dist", "assets", "index.css"))
    )

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'unsafe-eval'; connect-src http://localhost:5000;">
  <link rel="stylesheet" href="${styleUri}">
  <title>Githuv</title>
</head>
<body>
  <div id="root"></div>
  <script src="${scriptUri}"></script>
</body>
</html>`
  }
}
