# GithuV

> **AI-Powered Career Growth Platform for Developers**

GithuV helps developers build a stronger professional presence by intelligently connecting their GitHub activity with AI-powered tools — resume generation, profile README creation, contribution streak recovery, career coaching, and more.

---

## Features

### AI-Powered Profile & README Tools
- **AI Profile README Generator** — 6 themed templates, analyzes existing README before generating, resume-style image placement, live rendered preview with source toggle, one-click publish to your profile repo
- **AI Repository README Generator** — Analyzes repo metadata, folder structure, configs, and features before writing a clean README
- **AI Resume Builder** — ATS-optimized resumes from GitHub data, AI content generation, LaTeX editor, PDF export with version management, ATS scoring
- **LinkedIn Assistant** — AI-generated headlines, about sections, posts, and branding recommendations

### Developer Dashboard & Analytics
- Real-time GitHub stats (repos, stars, forks, followers, languages)
- Career score tracking and learning progress
- Recent activity feed and repository browser
- AI-powered suggestions and insights

### Project Collaboration
- **Project Workspace** — Create projects, invite members, manage roles, track progress
- **Team Collaboration** — Real-time individual and team chat, file sharing, notifications
- **Todo Management** — Create, assign, prioritize, and track tasks with completion status

### AI Career Coach
- Personalized learning roadmaps based on skill gaps
- Interview preparation and project planning recommendations

### Profile Studio
- 5-step onboarding wizard (personal info, professional profile, projects, experience, branding)
- Circular progress tracking with step completion

### Contribution Tools
- **Streak Recovery** — Restore contribution graph with backdated commits
- **Contribution Art Visualizer** — Plan patterns, initials, symbols with grid previews

### DevChat VS Code Extension
- **Inline Chat** — Chat with your repository from a dedicated Githuv panel in the Activity Bar. Share snippets, review PRs, and discuss changes without leaving the editor.
- **Editor Actions** — Copy messages to the clipboard, insert text at the cursor, and apply AI-suggested changes directly to files.
- **Live Repo Chat** — Real-time room chat over Socket.IO, restricted to repo owners and collaborators. Message history persisted locally in the workspace and synced through the chat service.
- **GitHub Sign-in** — Device-code OAuth + browser sign-in via the Githuv client; tokens stored in VS Code secrets.

---

## Architecture

```
┌─────────────────────────────────────────────┐     ┌────────────────────────────┐
│            Client (Next.js)                 │     │   VS Code Extension        │
│                Port 3000                    │     │   (Githuv Webview Panel)   │
│                                             │     │                            │
│ Landing → Login (Firebase OAuth) → Dashboard│     │  Repo chat • editor actions│
│                │                            │     │  GitHub sign-in            │
│     ┌──────────┘                            │     └─────────────┬──────────────┘
│     ▼                                       │                   │ Socket.IO
│ ┌──────────────┐  ┌──────────────────┐      │                   ▼
│ │GitHub Ana-  │  │Profile Studio    │      │        ┌─────────────────────┐
│ │lytics       │  │Resume Builder    │      │        │  Chat Service      │
│ └──────────────┘  └──────────────────┘      │        │  Socket.IO Port 4004│
│                                             │        │  MongoDB + Cloudinary
│ Next.js Rewrites: /api/* → localhost:4002  │        └─────────────────────┘
└──────────────────┬──────────────────────────┘
                   │ HTTP
                   ▼
┌─────────────────────────────────────────────────────┐
│                 Server (Express + Bun)               │
│                    Port 4002                         │
│                                                      │
│  Auth  →  Githuv  →  Onboarding  →  Resume          │
│  (JWT)    (Octokit)  (Profile Wizard)  (LangGraph)  │
│                              │            │          │
│                              ▼            ▼          │
│                      MongoDB       AI (GPT/Gemini)   │
│                      Cloudinary     ↓                │
│                      GitHub API   PDF Microservice   │
│                                    (Port 3005)       │
│                                     ↓                │
│                                  tectonic/xelatex    │
└─────────────────────────────────────────────────────┘
```

### Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16, React 19, Tailwind CSS v4, Zustand 5 |
| **Backend** | Express 5 on Bun (v1.3.14+) |
| **Database** | MongoDB with Mongoose 9 |
| **Auth** | Firebase Auth + GitHub OAuth, JWT (httpOnly cookies) |
| **AI/LLM** | LangGraph, GPT-4o-mini (GitHub Models), Gemini 2.0 Flash Lite, Ollama (phi4-mini) |
| **GitHub API** | Octokit |
| **Realtime** | Socket.IO (chat service on port 4004) |
| **PDF** | LaTeX (tectonic / xelatex / pdflatex) → Cloudinary |
| **Icons** | lucide-react, react-icons |

---

## Project Structure

```
githuv/
├── client/               # Next.js frontend
│   ├── src/
│   │   ├── app/          # Pages (landing, login, dashboard, resume-builder, etc.)
│   │   ├── components/   # Reusable UI components
│   │   ├── store/        # Zustand state management
│   │   ├── config/       # Firebase client config
│   │   └── API/          # Axios instance
│   └── public/           # Static assets
├── server/               # Express API backend
│   ├── src/
│   │   ├── config/       # MongoDB, JWT, Octokit, Cloudinary, Firebase Admin
│   │   ├── controllers/  # Route handlers (auth, githuv, onboarding, resume, contribution)
│   │   ├── lib/          # LangGraph resume builder, LLM integrations, PDF utils
│   │   ├── middleware/   # JWT auth middleware
│   │   ├── models/       # Mongoose schemas (user, userProfile, resume)
│   │   ├── routes/       # Express route definitions
│   │   ├── types/        # TypeScript declarations
│   │   └── util/         # Contribution grid utilities
│   └── index.ts          # Server entry point
├── microservices/        # LaTeX-to-PDF compilation service
│   ├── pdf-service/      # Express POST /compile (xelatex) on port 3005
│   │   ├── src/Route/    # Express endpoint
│   │   └── services/     # Standalone Bun.serve compiler with auto-detection
│   └── chat-service/     # Real-time Socket.IO chat service on port 4004
│       ├── src/controller/  # Message persistence, sync & Cloudinary cleanup
│       ├── src/routes/      # REST sync endpoints
│       └── src/model/       # Mongoose schema with TTL-based expiry
├── vscode/               # Githuv VS Code extension (webview + extension host)
└── README.md
```

---

## Getting Started

### Prerequisites

- **Bun** v1.3.14+
- **MongoDB** running locally on port 27017
- **Firebase project** with GitHub OAuth provider enabled
- **Cloudinary account** for PDF storage
- **GitHub account** for OAuth and API access

### 1. Server Setup

```bash
cd server
bun install
cp .env.example .env   # (if available) or create .env with your credentials
bun run dev            # starts on port 4002
```

Required environment variables in `server/.env`:

| Variable | Description |
|---|---|
| `MongoDB_URI` | MongoDB connection string |
| `PORT` | Server port (default: 4002) |
| `JWT_SERVER_SECREAT` | JWT signing secret |
| `serviceAccount` | Firebase Admin SDK service account JSON |
| `GOOGLE_API_KEY` | Google AI / Gemini API key |
| `GITHUB_ACCESS_TOKEN` | GitHub token for AI model access |
| `PDF_SERVICE_URL` | LaTeX microservice URL (default: `http://localhost:3005`) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

### 2. PDF Microservice Setup

```bash
cd microservices/pdf-service
bun install
bun run setup:tex   # downloads tectonic LaTeX compiler
bun run dev          # starts on port 3005
```

### 3. Chat Service Setup

```bash
cd microservices/chat-service
bun install
cp .env.example .env   # (if available) or create .env with your credentials
bun run dev            # starts on port 4004
```

Required environment variables in `microservices/chat-service/.env`:

| Variable | Description |
|---|---|
| `MongoDB_URI` | MongoDB connection string |
| `JWT_SERVER_SECREAT` | JWT signing secret (must match `server/.env`) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

### 4. Client Setup

```bash
cd client
bun install
bun run dev          # starts on port 3000
```

The client proxies `/api/*` requests to `http://localhost:4002` via Next.js rewrites.

---

## AI Profile README Generation Pipeline

```
User data (GitHub API + MongoDB Profile)
    ↓ fetchUserProfile.node.ts
Merged user data + existing README (from username/username repo)
    ↓ loadTheme.node.ts
Theme template loaded (1 of 6)
    ↓ aiWriter.node.ts + LLM (GPT-4o-mini / Gemini)
Analysis of existing README (if present) → improved generation
    ↓
Generated Profile README Markdown
    ↓ previewNode.ts
Preview prepared (old vs new)
    ↓ Publish
Published to GitHub username/username profile repository
```

Powered by a **LangGraph state machine** (`server/src/lib/Langgraph/ProfileReadmeBuilder/Graph.ts`) with four nodes:

1. **fetchUserProfile** — fetches GitHub user data + existing profile README
2. **loadTheme** — loads the selected theme template from 6 curated styles
3. **aiWriter** — constructs the prompt (with existing README analysis) and calls the LLM
4. **previewNode** — prepares before/after preview for the frontend

### Theme Templates

All 6 templates are LLM prompt files in `server/src/lib/Langgraph/ProfileReadmeBuilder/templates/`:

| Theme | Tone | Profile Image |
|---|---|---|
| Minimal Professional | Clean, understated, confident | Left/right aligned, resume-style |
| Modern Developer | Energetic, tech-forward, personal | Side-aligned or animated GIF/SVG |
| Corporate Clean | Formal, polished, business-ready | Beside header, executive-friendly |
| Open Source Creator | Warm, collaborative, community-first | Side-aligned or lively banner |
| Portfolio Style | Creative, visual, showcase-oriented | Resume-style or animated accent |
| Compact Minimal | Ultra-concise, direct, high signal | Tiny, left/right aligned |

The AI agent **analyzes the existing README before generating**, evaluating tone, sections, strengths, and weaknesses — carrying forward valid custom links and projects.

---

## AI Resume Generation Pipeline

```
User Profile (MongoDB)
    ↓ cleanProfile()
Profile Object (stripped of Mongo metadata)
    ↓ LLM (GPT-4o-mini / Gemini / Ollama)
LaTeX Code
    ↓ POST /compile
Microservice (tectonic / xelatex)
    ↓ PDF Buffer
Cloudinary Upload
    ↓
Resume Record (MongoDB)
```

Powered by a **LangGraph state machine** (`server/src/lib/Langgraph/ResumeBuilder/Graph.ts`) with three nodes:

1. **fetchAndCleanData** — loads and sanitizes user profile
2. **askOllamaForLatex** — generates LaTeX via AI
3. **compileAndUploadPdf** — compiles and stores the PDF

---

## Contribution Strike Recovery

The system creates backdated commits to a private GitHub repo (`githuv-official-app-for-contribution`) to repair contribution graphs:

- **Text-to-grid**: Renders text as 5×7 pixel bitmap patterns onto the contribution grid
- **Random patterns**: Generates realistic-looking contribution activity with configurable density
- **Custom art**: Maps ASCII art to contribution grid positions
- **Daily recovery**: Scheduled backdated commits

---

## API Overview

**Server** (`/api` prefix, port 4002):

| Route | Description |
|---|---|
| `POST /auth/login` | Firebase + GitHub OAuth login |
| `POST /auth/vscode-token` | Issue VS Code extension token |
| `POST /auth/vscode-token/device` | Start VS Code device-code flow |
| `POST /auth/vscode-token/exchange` | Exchange device code for token |
| `POST /auth/vscode/github` | Proxy GitHub API calls for the extension |
| `GET /githuv/github-user` | Authenticated GitHub user data |
| `GET /githuv/dashboard-data` | Aggregated GitHub stats |
| `POST /githuv/create-repo` | Create private contribution repo |
| `POST /githuv/print-contribution` | Print contribution pattern on grid |
| `POST /githuv/profile-readme/generate` | Generate profile README with theme + feedback |
| `GET /githuv/profile-readme/existing` | Fetch existing profile README from GitHub |
| `POST /githuv/profile-readme/publish` | Publish generated README to profile repo |
| `POST /githuv/repository-readme/generate` | Generate repository README |
| `POST /githuv/repository-readme/publish` | Publish repository README |
| `POST /githuv/repository-readme/undo` | Rollback repository README changes |
| `GET /onboarding/me` | Current onboarding profile |
| `POST /onboarding/step1..5` | Profile wizard steps |
| `POST /resume/generate-ai-resume` | AI resume generation |
| `POST /resume/generate-scratch` | Resume generation from scratch |
| `GET /resume/list` | List user resumes |
| `GET /resume/latex/:threadId` | Get LaTeX source for a thread |
| `POST /resume/regenerate` | Regenerate a resume |
| `POST /resume/chat/:threadId` | Chat with AI about a resume |
| `POST /resume/feedback/:threadId` | Resume AI feedback |
| `POST /resume/compile` | Compile LaTeX to PDF |
| `DELETE /resume/:threadId` | Delete a resume |
| `PUT /resume/:threadId` | Update a resume |
| `GET /resume/pdf/:threadId` | Serve resume PDF |

**Chat service** (`/api` prefix, port 4004):

| Route | Description |
|---|---|
| `POST /messages/sync` | Push local-first messages to MongoDB |
| `GET /messages/:roomId` | Full message history for a room |
| `GET /messages/:roomId/since` | Incremental pull since a timestamp |
| `POST /messages/delivered` | Mark messages as delivered (shortens TTL) |
| `DELETE /messages/:roomId` | Delete messages (also removes images) |
| `POST /images/upload` | Upload a chat image to Cloudinary |

**Chat service events** (Socket.IO):

| Event | Direction | Description |
|---|---|---|
| `joinRoom` | client → server | Join a room, receive history |
| `send-message` | client → server | Broadcast + persist a message |
| `receive-message` | server → client | Deliver message / system notices |
| `message-delivered` | both | Confirm delivery, update TTL |

---

## Development

- **Runtime**: Bun (all packages)
- **TypeScript**: Strict mode throughout
- **Styling**: Tailwind CSS v4 with utility-first approach
- **State**: Zustand stores for auth, GitHub data, and profile studio
- **No formal test framework**: Testing is done manually via `server/test.ts`

---

## Security Notes

- JWT tokens stored in httpOnly cookies with 30-day expiry
- GitHub access tokens are encrypted at rest and hidden from default MongoDB queries (`select: false`)
- CORS restricted to `http://localhost:3000` in development
- PDF compilation runs in isolated temp directories with auto-cleanup
- The `.env` file contains development credentials — treat as compromised and rotate for production

---

## License

MIT
