import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { MemoryRouter } from "react-router-dom"
import App from "./App"
import "./index.css"

// The native VS Code view this webview backs decides the initial route
// (injected by the extension host as window.__GITHUV_ROUTE__).
const initialEntry = window.__GITHUV_ROUTE__ ?? "/chat"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MemoryRouter initialEntries={[initialEntry]}>
      <App />
    </MemoryRouter>
  </StrictMode>
)
