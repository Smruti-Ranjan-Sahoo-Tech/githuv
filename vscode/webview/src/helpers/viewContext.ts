const VIEW_ROUTES: Record<string, string> = {
  "githuv.sidebar": "/chat",
}

export function getViewId(): string {
  return typeof window !== "undefined" ? window.__GITHUV_VIEW__ ?? "githuv.sidebar" : "githuv.sidebar"
}

export function getViewRoute(): string {
  return VIEW_ROUTES[getViewId()] ?? "/chat"
}

export function getInitialRoute(): string {
  return typeof window !== "undefined" ? window.__GITHUV_ROUTE__ ?? "/chat" : "/chat"
}
