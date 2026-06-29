import * as vscode from "vscode"

const EXTENSION_COMMAND = "githuv-repo-chat"

export function registerCommands(context: vscode.ExtensionContext) {
  const openChatCommand = vscode.commands.registerCommand(EXTENSION_COMMAND, () => {
    vscode.commands.executeCommand("workbench.view.extension.githuv")
  })

  context.subscriptions.push(openChatCommand)
}
