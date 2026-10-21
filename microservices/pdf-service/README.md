# PDF Service

LaTeX-to-PDF compilation microservice for the **Githuv** resume builder. Ships two independent services:

1. **Express service** (default port **3005**) — `POST /compile`, used by the Githuv server (`PDF_SERVICE_URL`)
2. **Standalone Bun.serve service** (default port **3001**) — `POST /convert` + `GET /health`, with auto-detection across compilers

Both ports live in a single `.env` file — change them there, no code edits needed.

## Features

- **Configurable URLs** — ports and public URL come from `.env` (Bun loads it automatically)
- **Compiler auto-detection** — tries, in order: `bin/tectonic`, system `tectonic`, `pdflatex`, `xelatex`, `lualatex`
- **Sandboxed compilation** — each job runs in an isolated temp directory that is cleaned up afterwards
- **Security** — runs without shell escape (`-no-shell-escape`, `-interaction=nonstopmode`) and a 20-second timeout in the Express service
- **Size limit** — `tex` payloads capped at 10 MB in the standalone service
- **Health endpoint** — reports available compiler and output directory

## Getting Started

```bash
bun install
cp .env.example .env   # then adjust ports/URLs if needed
bun run setup:tex      # downloads the tectonic LaTeX compiler into bin/
bun run dev            # starts the Express service on port 3005
```

Other scripts:

| Command | Purpose |
|---|---|
| `bun run dev` | Express service on `PORT` (default 3005, `--watch`) |
| `bun run start:tex-pdf` | Standalone Bun.serve service on `TEX_PDF_PORT` (default 3001) |
| `bun run setup:tex` | Download tectonic into `bin/` |

> You only need `setup:tex` once. If tectonic is missing, the standalone service falls back to any system LaTeX compiler (`pdflatex`, `xelatex`, `lualatex`).

## Environment Variables (`microservices/pdf-service/.env`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3005` | Port for the Express `POST /compile` service |
| `TEX_PDF_PORT` | `3001` | Port for the standalone `POST /convert` service |
| `PDF_SERVICE_URL` | `http://localhost:3005` | Public URL of this service as reached by the Githuv server |

> Keep `PDF_SERVICE_URL` in `server/.env` in sync with `PORT` here — if you change `PORT`, update `PDF_SERVICE_URL` too.

## Endpoints

### Express service (default port 3005)

`POST /compile` — body: `{ "latex": "<tex source>" }`

Returns the compiled PDF as `resume.pdf` (or a JSON error on failure).

### Standalone service (default port 3001)

| Endpoint | Description |
|---|---|
| `GET /health` | `{ status, compiler, outputDir }` |
| `POST /convert` | Body: `{ "tex": "<tex source>", "filename?" }` → returns the compiled PDF |

## Project Structure

```
pdf-service/
├── index.ts                # Express entry point (PORT, default 3005)
├── .env                    # Local URLs/ports (not committed)
├── .env.example            # Template for .env
├── src/Route/compile.ts    # POST /compile handler (xelatex in temp dir)
├── services/tex-to-pdf/    # Standalone Bun.serve service (TEX_PDF_PORT, default 3001)
├── bin/                    # Tectonic binary (from setup:tex)
├── scripts/setup-tex.sh    # Downloads tectonic
└── output/pdfs/            # Compiled PDFs (standalone service)
```

## Deploying to Azure

`.github/workflows/main_githuv-pdf-service.yml` builds this folder and deploys it to the **githuv-pdf-service** Azure Web App on every push to `main`.

What the workflow does:

1. Installs dependencies with Bun and bundles `index.ts` to `dist/index.js` for the **Node** runtime
2. Ships `bin/tectonic` (the LaTeX compiler) and a pre-warmed Tectonic cache in the deploy package
3. Deploys the package, sets the startup command to `node dist/index.js`, and health-checks `GET /test`

The Web App must be a **Linux App Service (code deployment, Node stack)**. The workflow sets these app settings:

| Setting | Value | Description |
|---|---|---|
| `TECTONIC_CACHE_DIR` | `/home/site/wwwroot/tectonic-cache` | Where Tectonic keeps its downloaded TeX bundle (shipped with the deployment) |
| `LATEX_TIMEOUT_MS` | `120000` | Per-compilation timeout; the first compilation also downloads the TeX bundle |

The compiler is auto-detected at runtime: the bundled `bin/tectonic` first, then a system `tectonic`, `xelatex`, `pdflatex` or `lualatex`. Tectonic runs with `-Z continue-on-errors`, which matches `xelatex -interaction=nonstopmode`: recoverable LaTeX errors no longer fail the request.

Point the Githuv server at the deployed service:

```bash
PDF_SERVICE_URL=https://githuv-pdf-service.azurewebsites.net
```

## Related Services

- **Githuv server** on port 4002 — calls `POST /compile` and uploads the returned PDF to Cloudinary
- **Githuv client** on port 3000 — serves the PDFs to users

See the [root README](../README.md) for full platform setup instructions.