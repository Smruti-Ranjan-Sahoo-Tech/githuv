import * as vscode from "vscode"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { registerCommands } from "./commands"
import { GithuvWebviewProvider } from "./providers/WebviewProvider"

function loadEnv(basePath: string): Record<string, string> {
  try {
    const content = readFileSync(join(basePath, ".env"), "utf-8")
    const env: Record<string, string> = {}
    for (const line of content.split("\n")) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith("#")) {
        const eq = trimmed.indexOf("=")
        if (eq !== -1) {
          env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
        }
      }
    }
    return env
  } catch {
    return {}
  }
}

export function activate(context: vscode.ExtensionContext) {
  const env = loadEnv(context.extensionUri.fsPath)
  const apiUrl = env.API_URL ?? "http://localhost:4004"

  const provider = new GithuvWebviewProvider(context.extensionUri, apiUrl)

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(GithuvWebviewProvider.viewType, provider)
  )

  registerCommands(context)
}

export function deactivate() {}
