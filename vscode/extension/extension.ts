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
  const apiUrl = env.API_URL ?? "http://localhost:4002"
  const clientUrl = env.CLIENT_URL ?? "http://localhost:3000"
  const chatUrl = env.CHAT_URL ?? "http://localhost:4004"

  const viewConfigs = [
    { viewType: "githuv.chat", route: "/chat" },
    { viewType: "githuv.tasks", route: "/tasks" },
    { viewType: "githuv.repo", route: "/repo" },
  ]

  const providers = new Map<string, GithuvWebviewProvider>()
  for (const cfg of viewConfigs) {
    const provider = new GithuvWebviewProvider(
      cfg.viewType,
      cfg.route,
      context.extensionUri,
      apiUrl,
      clientUrl,
      chatUrl,
      context.extension.id,
      context,
    )
    providers.set(cfg.viewType, provider)
    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(cfg.viewType, provider)
    )
  }

  const broadcastAuthToken = (token: string) => {
    for (const provider of providers.values()) {
      provider.receiveAuthToken(token)
    }
  }

  context.subscriptions.push(
    vscode.window.registerUriHandler({
      handleUri(uri: vscode.Uri) {
        if (uri.path === "/auth-callback") {
          const queryParams = new URLSearchParams(uri.query)
          const fragmentParams = new URLSearchParams(uri.fragment)
          const code = queryParams.get("code") ?? fragmentParams.get("code")
          const token = queryParams.get("token")
          if (code) {
            void exchangeAuthCode(apiUrl, code, broadcastAuthToken)
          } else if (token) {
            broadcastAuthToken(token)
          }
        }
      },
    })
  )

  registerCommands(context)
}

async function exchangeAuthCode(
  apiUrl: string,
  code: string,
  deliver: (token: string) => void,
) {
  try {
    const response = await fetch(`${apiUrl}/api/auth/vscode-token/exchange`, {
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

    deliver(result.token)
  } catch (error) {
    deliver(
      `error:${error instanceof Error ? error.message : "Failed to exchange auth code"}`,
    )
  }
}

export function deactivate() {}
