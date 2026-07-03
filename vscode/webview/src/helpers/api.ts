import type { ExtensionMessage } from "@shared/types"
import { sendMessage } from "./postMessage"

const pending = new Map<string, { resolve: (value: unknown) => void; reject: (err: Error) => void }>()
let requestId = 0

window.addEventListener("message", (event: MessageEvent<ExtensionMessage>) => {
  const msg = event.data
  if (msg.type === "apiResponse") {
    const { id, data, error } = msg.payload
    const p = pending.get(id)
    if (p) {
      pending.delete(id)
      if (error) p.reject(new Error(error))
      else p.resolve(data)
    }
  }
})

export function apiRequest<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
  headers?: Record<string, string>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = `${++requestId}`
    pending.set(id, { resolve: resolve as (v: unknown) => void, reject })
    sendMessage({ type: "apiRequest", payload: { id, method, path, headers, body } })
  })
}
