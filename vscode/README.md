# Githuv VS Code Extension

## Setup

```bash
bun install
```

## Build

```bash
bun run build
```

This builds both:

- `webview/dist`
- `dist/extension.js`

## Run locally

1. Open this folder in VS Code.
2. Run `bun run build`.
3. Press `F5` to launch an Extension Development Host.
4. In the new VS Code window, open the Activity Bar and click `Githuv`.

If you prefer not to use the debugger, you can also package first and then install the VSIX locally.

## Package for testing

```bash
npx @vscode/vsce package
```

That creates a `.vsix` file you can install with:

```bash
code --install-extension githuv-0.0.1.vsix
```

## Publish to the Marketplace later

To publish, add a `publisher` field to `package.json` and then authenticate `vsce` with a Personal Access Token from the Visual Studio Marketplace.

Typical flow:

```bash
npx @vscode/vsce login <publisher-name>
npx @vscode/vsce publish
```

If you want to keep the versioned artifact but not publish immediately:

```bash
npx @vscode/vsce package
```

## Notes

- `bun run build` is already wired into `vscode:prepublish`, so Marketplace packaging will build automatically.
- The extension command is `githuv-repo-chat`.
