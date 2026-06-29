import type { WebviewMessage, ExtensionMessage } from "@shared/types"

let vscodeApi: ReturnType<typeof acquireVsCodeApi> | null = null

try {
  if (typeof acquireVsCodeApi === "function") {
    vscodeApi = acquireVsCodeApi()
  }
} catch {
  vscodeApi = null
}

export function sendMessage(message: WebviewMessage) {
  vscodeApi?.postMessage(message)
}

export function receiveMessage(handler: (message: ExtensionMessage) => void) {
  const listener = (event: MessageEvent<ExtensionMessage>) => {
    handler(event.data)
  }
  window.addEventListener("message", listener)
  return () => window.removeEventListener("message", listener)
}
