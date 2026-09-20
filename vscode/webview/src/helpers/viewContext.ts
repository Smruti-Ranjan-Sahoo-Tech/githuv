const VIEW_ROUTES: Record<string, string> = {
  "githuv.chat": "/chat",
  "githuv.tasks": "/tasks",
  "githuv.repo": "/repo",
}

export function getViewId(): string {
  return typeof window !== "undefined" ? window.__GITHUV_VIEW__ ?? "githuv.chat" : "githuv.chat"
}

export function getViewRoute(): string {
  return VIEW_ROUTES[getViewId()] ?? "/chat"
}

export function getInitialRoute(): string {
  return typeof window !== "undefined" ? window.__GITHUV_ROUTE__ ?? "/chat" : "/chat"
}