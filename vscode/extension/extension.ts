import * as vscode from "vscode"
import { registerCommands } from "./commands"
import { GithuvWebviewProvider } from "./providers/WebviewProvider"

export function activate(context: vscode.ExtensionContext) {
  const provider = new GithuvWebviewProvider(context.extensionUri)

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(GithuvWebviewProvider.viewType, provider)
  )

  registerCommands(context)
}

export function deactivate() {}
