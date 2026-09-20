# PDF Service

LaTeX-to-PDF compilation microservice for the **Githuv** resume builder. Ships two independent services:

1. **Express service** (port **3005**) — `POST /compile`, used by the Githuv server (`PDF_SERVICE_URL`)
2. **Standalone Bun.serve service** (port **3001**) — `POST /convert` + `GET /health`, with auto-detection across compilers

## Features

- **Compiler auto-detection** — tries, in order: `bin/tectonic`, system `tectonic`, `pdflatex`, `xelatex`, `lualatex`
- **Sandboxed compilation** — each job runs in an isolated temp directory that is cleaned up afterwards
- **Security** — runs without shell escape (`-no-shell-escape`, `-interaction=nonstopmode`) and a 20-second timeout in the Express service
- **Size limit** — `tex` payloads capped at 10 MB in the standalone service
- **Health endpoint** — reports available compiler and output directory

## Getting Started

```bash
bun install
bun run setup:tex   # downloads the tectonic LaTeX compiler into bin/
bun run dev         # starts the Express service on port 3005
```

Other scripts:

| Command | Purpose |
|---|---|
| `bun run dev` | Express service on port 3005 (`--watch`) |
| `bun run start:tex-pdf` | Standalone Bun.serve service on port 3001 |
| `bun run setup:tex` | Download tectonic into `bin/` |

> You only need `setup:tex` once. If tectonic is missing, the standalone service falls back to any system LaTeX compiler (`pdflatex`, `xelatex`, `lualatex`).

## Endpoints

### Express service (port 3005)

`POST /compile` — body: `{ "latex": "<tex source>" }`

Returns the compiled PDF as `resume.pdf` (or a JSON error on failure).

### Standalone service (port 3001)

| Endpoint | Description |
|---|---|
| `GET /health` | `{ status, compiler, outputDir }` |
| `POST /convert` | Body: `{ "tex": "<tex source>", "filename?" }` → returns the compiled PDF |

## Project Structure

```
pdf-service/
├── index.ts                # Express entry point (port 3005)
├── src/Route/compile.ts    # POST /compile handler (xelatex in temp dir)
├── services/tex-to-pdf/    # Standalone Bun.serve service (port 3001)
├── bin/                    # Tectonic binary (from setup:tex)
├── scripts/setup-tex.sh    # Downloads tectonic
└── output/pdfs/            # Compiled PDFs (standalone service)
```

## Related Services

- **Githuv server** on port 4002 — calls `POST /compile` and uploads the returned PDF to Cloudinary
- **Githuv client** on port 3000 — serves the PDFs to users

See the [root README](../README.md) for full platform setup instructions.