# Githuv VS Code Extension

Chat with your GitHub repository right from the editor. The extension adds a **Githuv** panel to the Activity Bar, authenticates you with GitHub, and connects to a live chat room over WebSocket — while being able to read and write files in your workspace.

## Features

- **Native VS Code navigation** — **Chat**, **Tasks** and **Repository** are separate webview views in the Githuv Activity Bar panel (`githuv.chat`, `githuv.tasks`, `githuv.repo`), so each opens with a single click and the full panel width is used. The panel is opened via the `Githuv: Open Chat` command (`githuv-repo-chat`).
- **GitHub sign-in** — Device-code OAuth flow plus a browser-based sign-in through the Githuv client. Tokens are stored in VS Code secrets and re-injected on reload.
- **Repository awareness** — Detects the current workspace's repo (`owner/repo`) by reading the git remote from `.git/config`.
- **Access control** — Allows chat only if you are the repo owner or a collaborator.
- **Live chat rooms** — Real-time messaging over Socket.IO (default `ws://localhost:4004`). Rooms are keyed by the stable GitHub **repository id** (not the renamable repo name), so a rename never orphans a chat room.
- **Editor actions** — Copy text to the clipboard, insert text at the cursor, and apply suggested changes directly to files.
- **Message history** — Messages persisted to `.githuv/messages-<roomId>.json` in the workspace.

## Tech stack

| Layer | Technology |
|---|---|
| Extension host | TypeScript, esbuild (ESM, `--external:vscode`) |
| Webview UI | React 18, Vite, React Router (memory routing), Tailwind CSS, Zustand |
| Realtime | `socket.io-client` |
| Runtime / tooling | Bun, VS Code API `^1.125.0` |

## Prerequisites

The extension depends on the rest of the Githuv platform running locally:

- **Githuv server** (Express) on `http://localhost:4002`
- **Githuv socket server** on `http://localhost:4004`
- **Githuv client** (Next.js) on `http://localhost:3000` — only needed for the browser sign-in flow

You also need a VS Code workspace that is a **GitHub repository** (the extension reads `.git/config` to resolve the repo).

## Configuration

Optional `.env` file at the extension root:

```bash
API_URL=http://localhost:4002
CLIENT_URL=http://localhost:3000
```

Defaults are used when either variable is missing.

## Setup

```bash
bun install
```

## Build

```bash
bun run build
```

Builds both:

- `webview/dist` — the React webview bundle (Vite)
- `dist/extension.js` — the extension host bundle (esbuild)

Other scripts:

| Command | Purpose |
|---|---|
| `bun run dev` | Watch-build both extension and webview |
| `bun run watch:extension` | Rebuild the extension on change |
| `bun run watch:webview` | Rebuild the webview on change |
| `bun run lint` | Type-check (`tsc --noEmit`) |

## Run locally

1. Open this folder (`vscode/`) in VS Code — the folder that contains `package.json`.
2. Run `bun run build`.
3. Press `F5` to launch an Extension Development Host.
4. In the new window, click the `Githuv` icon in the Activity Bar.
5. Sign in with GitHub. The workspace must be a GitHub repo you own or collaborate on.

If you prefer not to use the debugger, package first and install the VSIX locally (below).

## Package for testing

```bash
bun run install:local
```

That builds, packages (`npx @vscode/vsce package --no-dependencies`), and installs the resulting `githuv-0.0.1.vsix` with `--force`.

If you need the install to be fully non-interactive (auto-answering any prompts), append `-y`:

```bash
bun run install:local -y
```

Or manually:

```bash
npx @vscode/vsce package
code --install-extension githuv-0.0.1.vsix --force
```

## Publish to the Marketplace

Add a `publisher` field to `package.json`, then authenticate `vsce` with a Personal Access Token from the Visual Studio Marketplace:

```bash
npx @vscode/vsce login <publisher-name>
npx @vscode/vsce publish
```

## Architecture

```
┌─────────────────────────────┐   postMessage()    ┌──────────────────────────────┐
│  Extension Host (Node.js)   │  ◄──────────────►  │  Webview (React SPA)          │
│                            │                     │                              │
│  extension/extension.ts    │                     │  webview/src/                │
│  extension/commands.ts     │                     │  main.tsx → MemoryRouter     │
│  providers/WebviewProvider │                     │  LoginPage / ChatPage        │
│  services/GithubAuthService│                     │  helpers/* (message bridge)  │
└─────────────┬───────────────┘                     └──────────────┬───────────────┘
              │                                                   │
              │  fetches API / GitHub on behalf                   │  Socket.IO
              │  (webview CSP only allows port 4004)              │  ws://localhost:4004
              ▼                                                   ▼
   http://localhost:4002  (server API)               http://localhost:4004  (socket server)
```

- **Webview → Extension messages** (`WebviewMessage`): `navigate`, `auth`, `sendMessage`, `openSettings`, `updateConnectionStatus`, `apiRequest`, `getWorkspaceInfo`, `githubApiRequest`, `githubAuthRequest`, `openClientAuth`, `clearStoredToken`, `copyText`, `insertText`, `saveChanges`, `getSavedMessages`.
- **Extension → Webview messages** (`ExtensionMessage`): `connectionStatus`, `navigate`, `apiResponse`, `workspaceInfo`, `githubApiResponse`, `githubAuthProgress`, `githubAuthResponse`, `authToken`, `savedMessages`, `operationResult`.

Both sides share typed contracts from `shared/types.ts` (discriminated unions), so unimplemented message types fail type-checking.

## Notes

- `bun run build` is wired into `vscode:prepublish`, so Marketplace packaging builds automatically.
- The webview's CSP allows connections to `localhost:4004`, `github.com`, and `api.github.com`; all backend calls are proxied through the extension host.
- See `EXTENSION.md` for a file-by-file walkthrough of the extension.