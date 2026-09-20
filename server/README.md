# GithuV Server

Express API backend for the **GithuV** platform, running on Bun. Handles authentication, GitHub integration, AI-powered README/resume generation, and contribution recovery.

## Features

- **Auth** — Firebase Auth + GitHub OAuth login, JWT issued in httpOnly cookies, VS Code extension auth flows (device code, exchange, GitHub proxy)
- **GitHub integration** — Octokit-powered user data, dashboard stats, and repository operations
- **Profile README builder** — LangGraph state machine with 6 curated theme templates and existing-README analysis
- **Repository README builder** — LangGraph pipeline analyzing repo metadata, folder tree, configs, features, and important code
- **Resume builder** — LangGraph pipeline generating ATS-optimized LaTeX resumes via GPT-4o-mini / Gemini / Ollama, then compiling and uploading PDFs
- **Onboarding** — 5-step profile wizard
- **Contribution recovery** — Creates backdated commits to repair contribution graphs

## Getting Started

```bash
bun install
cp .env.example .env   # (if available) or create .env with your credentials
bun run dev            # starts on http://localhost:4002
```

Other scripts:

| Command | Purpose |
|---|---|
| `bun run dev` | Watch-mode development server |
| `bun run chat` | Run `test.ts` (manual testing) |

## Environment Variables

| Variable | Description |
|---|---|
| `MongoDB_URI` | MongoDB connection string |
| `PORT` | Server port (default: 4002) |
| `JWT_SERVER_SECREAT` | JWT signing secret (also used by chat-service) |
| `serviceAccount` | Firebase Admin SDK service account JSON |
| `GOOGLE_API_KEY` | Google AI / Gemini API key |
| `GITHUB_ACCESS_TOKEN` | GitHub token for AI model access |
| `PDF_SERVICE_URL` | LaTeX microservice URL (default: `http://localhost:3005`) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

## Project Structure

```
server/
├── index.ts               # Server entry point
└── src/
    ├── config/            # MongoDB, JWT, Octokit, Cloudinary, Firebase Admin
    ├── controllers/       # Route handlers (auth, githuv, onboarding, resume, contribution)
    ├── lib/
    │   ├── Langgraph/     # ProfileReadmeBuilder, RepositoryReadmeBuilder, ResumeBuilder
    │   ├── llm/           # GitHub, Gemini, Ollama LLM integrations
    │   ├── pdf/           # compileAndUpload helper
    │   └── cleanProfile.ts
    ├── middleware/        # JWT auth middleware
    ├── models/            # Mongoose schemas (user, userProfile, resume)
    ├── routes/            # Express route definitions
    ├── types/             # TypeScript declarations
    └── util/              # Contribution grid utilities
```

## Architecture

- **Runtime**: Bun
- **Database**: MongoDB with Mongoose
- **Auth**: Firebase Admin + JWT (httpOnly cookies)
- **AI/LLM**: LangGraph, GPT-4o-mini (GitHub Models), Gemini 2.0 Flash Lite, Ollama (phi4-mini)
- **PDF**: LaTeX compiled by the [pdf-service](../microservices/pdf-service) microservice → Cloudinary

## Related Services

- **Client** (Next.js) on port 3000 — proxies `/api/*` to this server
- **PDF service** on port 3005 — LaTeX-to-PDF compilation
- **Chat service** on port 4004 — real-time Socket.IO chat

See the [root README](../README.md) for full platform setup instructions.