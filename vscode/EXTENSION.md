# Githuv Extension — Complete Guide

## Overview

Githuv is a VS Code extension that adds a "Chat with your GitHub repository" panel to the activity bar. It uses a webview (React app) for the UI and communicates with the extension host via message passing.

---

## Project Structure

```
vscode/
├── .vscode/                          # VS Code workspace settings (for development only)
│   ├── launch.json                   #   F5 debug configuration
│   └── tasks.json                    #   Build task (runs before F5)
├── .vscodeignore                     # What to exclude when packaging .vsix
├── package.json                      # Extension manifest + build scripts
├── tsconfig.json                     # Root TypeScript config (type-check only)
├── index.ts                          # Re-exports activate/deactivate
├── media/
│   └── icon.svg                      # Activity bar icon (GitHub Octocat)
├── shared/
│   └── types.ts                      # Types shared between extension & webview
├── extension/                        # Extension host code (runs in Node.js)
│   ├── extension.ts                  #   Activate/deactivate entry point
│   ├── commands.ts                   #   Command registration
│   └── providers/
│       └── WebviewProvider.ts        #   Webview view provider (bridge)
├── webview/                          # React frontend (runs in webview sandbox)
│   ├── index.html                    #   Vite entry HTML
│   ├── package.json                  #   Webview dependencies
│   ├── tsconfig.json                 #   Webview TypeScript config
│   ├── vite.config.ts                #   Vite build config
│   ├── tailwind.config.js            #   Tailwind CSS config
│   ├── postcss.config.js             #   PostCSS config
│   └── src/
│       ├── main.tsx                  #   React entry point
│       ├── App.tsx                   #   Root component with routing
│       ├── index.css                 #   Global styles + Tailwind
│       ├── vscode.d.ts               #   TypeScript types for acquireVsCodeApi()
│       ├── helpers/
│       │   └── postMessage.ts        #   Webview <-> Extension message helpers
│       ├── components/
│       │   ├── ChatMessage.tsx       #   Single chat bubble
│       │   └── TopBar.tsx            #   Top navigation bar
│       └── pages/
│           ├── LoginPage.tsx         #   GitHub OAuth login
│           ├── ChatPage.tsx          #   Main chat interface
│           └── LetterPage.tsx        #   Letter API tester
├── dist/                             # Built extension output (auto-generated)
│   ├── extension.js                  #   Bundled extension host code
│   └── extension.js.map              #   Source map for debugging
├── node_modules/                     # Dependencies (auto-generated)
└── EXTENSION.md                      # This file
```

---

## How It All Fits Together

### When VS Code loads the extension

```
VS Code starts
  └─ reads package.json
       └─ sees main: "dist/extension.js"
            └─ loads that file
                 └─ registers contributions from package.json:
                      ├─ activity bar icon (media/icon.svg)
                      ├─ command "Githuv: Open Chat"
                      └─ webview view "githuv.chat"
```

### When you press F5 (debug)

```
F5 → launch.json finds "Run Extension"
  └─ preLaunchTask "bun: build" runs first
       └─ bun run build
            ├─ builds webview (vite → webview/dist/)
            └─ builds extension (esbuild → dist/extension.js)
  └─ VS Code launches a new window ("Extension Development Host")
       └─ with --extensionDevelopmentPath=<current folder>
            └─ loads this extension from source
```

### When the user clicks the Githuv icon

```
User clicks activity bar icon
  └─ activation event "onView:githuv.chat" fires
       └─ VS Code calls activate() from dist/extension.js
            ├─ extension.ts creates GithuvWebviewProvider
            ├─ registers it as a webview view provider (id: "githuv.chat")
            └─ registers command "githuv-repo-chat"
                 └─ (opens the Githuv view when run from command palette)
  └─ resolveWebviewView() is called
       ├─ builds HTML string with:
       │    ├─ <script> pointing to webview/dist/assets/index.js
       │    ├─ <link> pointing to webview/dist/assets/index.css
       │    └─ Content-Security-Policy header
       └─ sets up message listener (extension ← webview)
```

### Communication between Extension and Webview

There are two processes that communicate via message passing:

```
┌─────────────────────────────┐        postMessage()        ┌──────────────────────┐
│  Extension Host (Node.js)   │  ◄──────────────────────►   │  Webview (React/SPA)  │
│                             │                             │                      │
│  extension/extension.ts     │                             │  webview/src/        │
│  extension/commands.ts      │                             │  helpers/postMessage  │
│  providers/WebviewProvider  │                             │  .ts                 │
└─────────────────────────────┘                             └──────────────────────┘
         │                                                            │
         │                  shared/types.ts defines                    │
         │         WebviewMessage and ExtensionMessage                 │
         └────────────────────────────────────────────────────────────┘
```

**Webview → Extension messages (WebviewMessage):**
| type | payload | purpose |
|---|---|---|
| `navigate` | `{ path: string }` | Navigate webview to a route |
| `auth` | `{ code: string }` | Submit auth code |
| `sendMessage` | `{ text: string }` | Send chat message |
| `openSettings` | — | Open VS Code settings |
| `updateConnectionStatus` | `{ status: string }` | Report connection status |

**Extension → Webview messages (ExtensionMessage):**
| type | payload | purpose |
|---|---|---|
| `connectionStatus` | `{ status: string }` | Notify webview of connection state |
| `navigate` | `{ path: string }` | Tell webview to go to a page |

---

## File-by-File Breakdown

### Root Files

#### `package.json` — The Extension Manifest

This is the most important file. It tells VS Code everything about the extension.

```json
{
  "name": "githuv",
  "displayName": "Githuv",
  "description": "Chat with your GitHub repository",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "engines": { "vscode": "^1.73.0" },
  "activationEvents": [
    "onCommand:githuv-repo-chat",
    "onView:githuv.chat"
  ],
  "main": "dist/extension.js",
  "contributes": { ... },
  "scripts": { ... },
  "devDependencies": { ... }
}
```

Key fields:
- **`engines.vscode`** — Minimum VS Code version requirement. Your VS Code must be >= this version.
- **`activationEvents`** — What triggers the extension to load:
  - `onCommand:githuv-repo-chat` — when the user runs "Githuv: Open Chat" from the command palette
  - `onView:githuv.chat` — when the Githuv view needs to be shown (e.g., clicking the icon)
- **`main`** — The entry point file (relative path). This must be a JS file that exports `activate` and `deactivate`.
- **`type: "module"`** — Tells Node.js this extension uses ES Module syntax (`import`/`export`) instead of CommonJS (`require`/`module.exports`).
- **`contributes`** — What the extension adds to VS Code:
  - `commands` — Custom command palette entries
  - `viewsContainers` — Activity bar icons
  - `views` — Side panel views

Scripts:
- **`build:extension`** — Uses esbuild to bundle `extension/extension.ts` into `dist/extension.js`. The `--external:vscode` flag means the `vscode` module is not bundled (it's provided by VS Code at runtime).
- **`build:webview`** — Builds the React webview using Vite.
- **`build`** — Runs both builds in sequence.
- **`lint`** — Type-checks with TypeScript without emitting files.

#### `tsconfig.json` — Root TypeScript Configuration

Configures TypeScript for the extension host code only (not the webview).

```json
{
  "compilerOptions": {
    "module": "Preserve",
    "moduleResolution": "bundler",
    "noEmit": true,
    "strict": true,
    "jsx": "react-jsx",
    ...
  },
  "include": ["extension/**/*.ts", "shared/**/*.ts", "index.ts"]
}
```

Key points:
- **`noEmit: true`** — TypeScript is only used for type-checking. The actual JS output is produced by esbuild and Vite.
- **`module: "Preserve"`** — Keeps `import`/`export` syntax as-is (doesn't convert to CommonJS).
- **`moduleResolution: "bundler"`** — Allows importing `.ts` files without extensions (esbuild handles resolution).
- **Does NOT include `webview/`** — The webview has its own `tsconfig.json`.

#### `index.ts` — Activation Re-export

Simply re-exports from the real extension code:

```ts
export { activate, deactivate } from "./extension/extension"
```

This is a barrel file. The esbuild build compiles `extension/extension.ts` directly via `--bundle`, so `index.ts` is not strictly needed. But it serves as a clean public API surface.

#### `.vscodeignore` — Packaging Exclusions

When you run `vsce package` to create a `.vsix` file, this file tells VS Code what NOT to include:

```
.vscode/**         # Debug configs (not for users)
node_modules/**    # Dependencies (included via bundling)
extension/**       # Source .ts files (already compiled to dist/)
webview/src/**     # React source (already compiled to webview/dist/)
**/*.ts            # All TypeScript source files
tsconfig*.json     # Build configs
bun.lock           # Lockfile
```

Net effect: the packaged extension only contains `dist/extension.js`, `webview/dist/`, `media/icon.svg`, `README.md`, and `package.json`.

---

### `.vscode/` — Development Configuration

#### `launch.json` — Debug Launch

```json
{
  "name": "Run Extension",
  "type": "extensionHost",
  "request": "launch",
  "args": ["--extensionDevelopmentPath=${workspaceFolder}"],
  "preLaunchTask": "bun: build",
  "outFiles": ["${workspaceFolder}/dist/**/*.js"]
}
```

- **`type: "extensionHost"`** — Tells VS Code to open a new window with this extension loaded.
- **`args`** — `--extensionDevelopmentPath=${workspaceFolder}` tells the new window: "load the current folder as an extension".
- **`preLaunchTask`** — Builds the extension before launching (defined in `tasks.json`).
- **`outFiles`** — Tells the debugger where to find the compiled JS files for breakpoints.

#### `tasks.json` — Build Task

```json
{
  "type": "shell",
  "command": "bun",
  "args": ["run", "build"],
  "group": { "kind": "build", "isDefault": true },
  "label": "bun: build"
}
```

- Runs `bun run build` which builds both the webview and extension.
- Marked as the default build task so `Ctrl+Shift+B` also works.

---

### `media/` — Static Assets

#### `icon.svg` — Activity Bar Icon

The SVG is the GitHub Octocat logo (24x24). It's referenced by `package.json` at `contributes.viewsContainers.activitybar[0].icon`.

Rules for VS Code activity bar icons:
- Must be 24x24 SVG
- Must use `fill="currentColor"` (not a hardcoded color) so VS Code can theme it
- Should be monochrome

---

### `shared/` — Shared Code

#### `types.ts` — Shared Type Definitions

This file defines the contract between the extension host and the webview. Both sides import from this file to ensure type safety.

```ts
// Data models
ChatMessage  — A single chat message with id, role, content, timestamp
AuthResponse — Response from GitHub OAuth backend
LetterResponse — Response from letter API

// Messages: Webview → Extension
WebviewMessage = navigate | auth | sendMessage | openSettings | updateConnectionStatus

// Messages: Extension → Webview
ExtensionMessage = connectionStatus | navigate
```

Using discriminated unions (`{ type: "navigate", payload: ... }`) ensures both sides handle messages correctly. TypeScript's type narrowing guarantees you can't access `payload` on a message with `type: "openSettings"` (which has no payload).

---

### `extension/` — Extension Host Code

This code runs in VS Code's Node.js process. It has full access to the VS Code API and the file system.

#### `extension.ts` — Activation Entry Point

```ts
export function activate(context: vscode.ExtensionContext) {
  const provider = new GithuvWebviewProvider(context.extensionUri)
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(GithuvWebviewProvider.viewType, provider)
  )
  registerCommands(context)
}
```

- **`activate()`** — Called by VS Code when an activation event fires. This is where you set up all extension resources.
- **`context.subscriptions`** — An array of disposables. When the extension is deactivated or VS Code closes, all disposables are cleaned up automatically.
- **`registerWebviewViewProvider()`** — Tells VS Code: "when the `githuv.chat` view is opened, use this provider to create the webview."

#### `commands.ts` — Command Registration

```ts
vscode.commands.registerCommand("githuv-repo-chat", () => {
  vscode.commands.executeCommand("workbench.view.extension.githuv")
})
```

- Registers the "Githuv: Open Chat" command in the command palette.
- When invoked, it programmatically opens the Githuv activity bar view by executing the internal VS Code command `workbench.view.extension.githuv`.
- The `githuv` part of `workbench.view.extension.githuv` matches the view container `id` from `package.json`.

#### `providers/WebviewProvider.ts` — The Bridge

This is the core of the extension. It implements `WebviewViewProvider`, which is VS Code's interface for creating webview-based panels.

```ts
class GithuvWebviewProvider implements WebviewViewProvider {
  static readonly viewType = "githuv.chat"       // matches package.json view id
```

**`resolveWebviewView()`** — Called by VS Code when the webview needs to be shown:
1. **Sets webview options**: enables JavaScript, restricts local resource loading to the extension folder.
2. **Builds HTML**: `_getHtmlContent()` creates the HTML page that loads the React app.
3. **Listens for messages**: `onDidReceiveMessage` handles navigation and settings requests from the webview.

**`_getHtmlContent()`** — Builds the webview's HTML:
- Resolves file paths for the React bundle (`webview/dist/assets/index.js` and `index.css`)
- Converts them to special `webview.asWebviewUri()` URIs (VS Code webviews can't load regular file:// paths)
- Injects a Content-Security-Policy (CSP) for security:
  - `default-src 'none'` — Block everything by default
  - `style-src ${cspSource} 'unsafe-inline'` — Allow VS Code's styles + inline styles (needed by Tailwind)
  - `script-src ${cspSource} 'unsafe-eval'` — Allow VS Code's scripts + eval (needed by React)
  - `connect-src http://localhost:5000` — Allow fetch to the local backend

**Why CSP is important**: Without it, a compromised webview could make arbitrary network requests or execute arbitrary scripts. The CSP restricts what the webview can do to only what the extension needs.

**`postMessage()`** — Sends messages from the extension to the webview (e.g., connection status updates).

---

### `webview/` — React Frontend

This is a React single-page application built with Vite. It runs inside VS Code's webview sandbox, which is similar to an iframe. It has no access to Node.js APIs, the file system, or the VS Code API directly — it communicates via `postMessage`.

#### Build Configuration

##### `vite.config.ts`

```ts
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@shared": path.resolve(__dirname, "../shared") },
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
        entryFileNames: "assets/index.js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
})
```

Key points:
- **Alias `@shared`** → `../shared` — Lets the webview import shared types as `import { ... } from "@shared/types"`.
- **Deterministic output filenames** — The webview provider in `extension/providers/` expects the files at `webview/dist/assets/index.js` and `webview/dist/assets/index.css`. If Vite used hash filenames (default), the extension wouldn't know the filenames.

##### `tailwind.config.js` + `postcss.config.js`

Tailwind CSS scans the webview source files for class names and generates only the CSS that's actually used. PostCSS processes the Tailwind output with Autoprefixer for cross-browser compatibility.

#### Entry Points

##### `index.html`

A minimal HTML file that Vite uses as its build entry point. It's only used during development/build — the actual HTML shown in the webview is generated by `WebviewProvider._getHtmlContent()`.

##### `main.tsx` — React Mount Point

```tsx
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MemoryRouter>
      <App />
    </MemoryRouter>
  </StrictMode>
)
```

- **`MemoryRouter`** — Since webviews don't have URLs (no address bar), React Router uses memory-based routing instead of browser URL routing.
- **`StrictMode`** — React dev mode double-invokes effects to catch bugs.

##### `App.tsx` — Root Component with Routes

```tsx
<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route path="/chat" element={<ChatPage />} />
  <Route path="/letter" element={<LetterPage />} />
  <Route path="*" element={<Navigate to="/login" replace />} />
</Routes>
```

Three routes:
- `/login` — GitHub OAuth authentication
- `/chat` — Main chat interface
- `/letter` — Simple API tester for the letter endpoint
- Catch-all — redirects to `/login`

##### `index.css` — Global Styles

Defines CSS custom properties (design tokens) based on GitHub's dark theme:
```css
:root {
  --githuv-bg: #0d1117;           /* GitHub dark background */
  --githuv-surface: #161b22;      /* Card/surface background */
  --githuv-border: #30363d;       /* Border color */
  --githuv-text: #e6edf3;         /* Primary text */
  --githuv-text-secondary: #8b949e; /* Secondary text */
  --githuv-accent: #58a6ff;       /* Blue accent (links, focus) */
  --githuv-success: #3fb950;      /* Green (connected, success) */
  --githuv-danger: #f85149;       /* Red (errors, disconnected) */
}
```

These are used throughout the webview via `bg-[var(--githuv-bg)]` or directly as hex values.

##### `vscode.d.ts` — VS Code Webview API Types

```ts
declare function acquireVsCodeApi(): {
  postMessage: (message: unknown) => void
  getState: () => unknown
  setState: (state: unknown) => void
}
```

This tells TypeScript that `acquireVsCodeApi()` exists. It's a function injected by VS Code into every webview. Without this declaration, TypeScript would error on `acquireVsCodeApi()`.

#### Communication Helpers

##### `helpers/postMessage.ts` — Message Bridge

Two functions that wrap the VS Code API:

```ts
// Send a message from webview → extension
export function sendMessage(message: WebviewMessage) {
  vscodeApi?.postMessage(message)
}

// Listen for messages from extension → webview
export function receiveMessage(handler: (message: ExtensionMessage) => void) {
  const listener = (event: MessageEvent<ExtensionMessage>) => {
    handler(event.data)
  }
  window.addEventListener("message", listener)
  return () => window.removeEventListener("message", listener)  // cleanup
}
```

- **`sendMessage()`** — Calls `acquireVsCodeApi().postMessage()`. It's guarded with `?.` so it doesn't crash if called outside VS Code.
- **`receiveMessage()`** — Listens for `window.message` events (the standard DOM event for cross-origin communication). Returns a cleanup function for React `useEffect`.
- Both use the types from `@shared/types` for type safety.

#### Pages

##### `pages/LoginPage.tsx` — GitHub Authentication

Simple login flow:
1. User clicks "Login with GitHub"
2. Sends POST to `http://localhost:5000/api/auth/github`
3. On success → navigate to `/chat`
4. On failure → show error in a red alert box

Shows a loading spinner while the request is in-flight.

##### `pages/ChatPage.tsx` — Main Chat Interface

The most complex page:
- **State**: messages list, input text, connection status
- **TopBar component** — Shows connection status dot, repo name, settings button, user avatar
- **Message list** — Scrollable area with auto-scroll to bottom. Empty state shows "Start a conversation..."
- **Input area** — Textarea with send button. Enter to send, Shift+Enter for newline.
- **Sending**: Creates a `ChatMessage` with role `"user"`, adds it to state, then sends it to the extension via `sendMessage({ type: "sendMessage", payload: { text } })`.
- **Receiving**: Uses `receiveMessage()` in a `useEffect` to listen for `connectionStatus` updates from the extension.

##### `pages/LetterPage.tsx` — API Tester

A simple page for testing the `http://localhost:5000/api/letter` endpoint:
- Textarea input
- Submit button
- JSON response preview

#### Components

##### `components/ChatMessage.tsx` — Chat Bubble

Renders a single message:
- User messages: right-aligned, green background (`#238636`)
- Assistant messages: left-aligned, dark surface with border, italic placeholder note for future Markdown rendering

##### `components/TopBar.tsx` — Navigation Bar

Displays at the top of the chat page:
- **Status indicator** — Colored dot + text label (green=connected, red=disconnected, yellow=connecting)
- **Repository name** — Currently hardcoded as `"user/repository"`
- **Settings button** — Gear icon, calls `onSettings` callback
- **User avatar** — Circular image, currently hardcoded URL

---

## Build Pipeline

```
Terminal: bun run build
  │
  ├── Step 1: Build Webview (cd webview && bun run build)
  │     └── tsc && vite build
  │           ├── Type-checks webview/src/*.tsx, *.ts
  │           └── Bundles with Vite + React plugin
  │                 └── Output: webview/dist/
  │                       ├── assets/index.js    (React app bundle)
  │                       ├── assets/index.css   (Tailwind CSS)
  │                       └── index.html         (not used at runtime)
  │
  └── Step 2: Build Extension
        └── esbuild extension/extension.ts --bundle --outfile=dist/extension.js
              └── Bundles extension + commands + provider into one file
                    └── Output: dist/
                          ├── extension.js       (self-contained extension)
                          └── extension.js.map   (source map for debugging)
```

The webview is built first because the extension's HTML template references `webview/dist/assets/index.js` and `webview/dist/assets/index.css`.

---

## Debugging Tips

### Extension won't load / icon doesn't show

1. **Check the Extension Development Host** — In the new window, open Extensions view (`Ctrl+Shift+X`) → search `@installed githuv`. If it shows with an error, click it to see the error message.

2. **Check Developer Tools Console** — `Ctrl+Shift+I` → Console tab. Look for red errors from the extension host.

3. **Check Extension Host logs** — `Ctrl+Shift+U` → in the dropdown, select "Extension Host".

4. **Common issues:**
   - **VS Code version too old** — `package.json` `engines.vscode` must be ≤ your VS Code version
   - **Extension not built** — Run `bun run build` before F5, or let the preLaunchTask run
   - **Wrong workspace folder** — Must open the `vscode/` folder (with `package.json`), not the parent
   - **Bun not found by VS Code** — Check that `bun` is in your PATH and restart VS Code

### Webview blank / not loading

1. Check the webview's Developer Tools: Run `Developer: Toggle Developer Tools` in the Extension Dev Host, find the webview's iframe, and check its console.
2. Verify `webview/dist/assets/index.js` exists (run `bun run build`).
3. Check the CSP (Content-Security-Policy) in `WebviewProvider.ts` — it might be blocking scripts.

### Messages not reaching the extension

1. Check that `acquireVsCodeApi()` is working (not null) in `postMessage.ts`.
2. Verify the message type matches one of the `WebviewMessage` union members.
3. Check the extension side's `onDidReceiveMessage` handler.

---

## Adding a New Feature

### Step 1: Add a new page to the webview

1. Create `webview/src/pages/MyPage.tsx`
2. Add a route in `webview/src/App.tsx`
3. Add a new message type in `shared/types.ts` if the page needs to communicate with the extension

### Step 2: Handle the new message type in the extension

1. Add a case in `WebviewProvider.ts`'s `onDidReceiveMessage` switch statement
2. Add any new VS Code API calls

### Step 3: Build and test

1. `bun run build`
2. Press `F5` to test

---

## Packaging & Publishing

```bash
# Install VS Code extension packaging tool
bun install

# Build
bun run build

# Package into .vsix
npx vsce package

# Install locally
code --install-extension githuv-0.0.1.vsix

# Publish to marketplace (requires publisher account)
npx vsce publish
```
