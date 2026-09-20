declare function acquireVsCodeApi(): {
  postMessage: (message: unknown) => void
  getState: () => unknown
  setState: (state: unknown) => void
}

interface Window {
  __GITHUV_VIEW__?: string
  __GITHUV_ROUTE__?: string
  __GITHUV_CHAT_URL__?: string
  __GITHUV_STORED_TOKEN__?: string
  __GITHUV_IMAGES_URI__?: string
}
