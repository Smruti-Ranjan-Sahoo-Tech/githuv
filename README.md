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

### Upcoming — DevChat VS Code Extension
- **Inline Chat** — Chat with your team directly inside VS Code. Share snippets, review PRs, and discuss changes without leaving the editor.
- **AI Commands** — Generate READMEs, suggest commit messages, analyze code, and get career coaching from your editor.
- **Workspace Sync** — View tasks, project boards, and team activity from VS Code. Accept invites and update status without switching contexts.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Client (Next.js)                  │
│                    Port 3000                         │
│                                                      │
│  Landing  →  Login (Firebase OAuth)  →  Dashboard   │
│                                         │            │
│              ┌──────────────────────────┘            │
│              ▼                                       │
│   ┌──────────────────┐   ┌───────────────────┐      │
│   │ GitHub Analytics │   │  Profile Studio   │      │
│   │ Strike Recovery  │   │  Resume Builder   │      │
│   └──────────────────┘   └───────────────────┘      │
│                                                      │
│  Next.js Rewrites: /api/* → localhost:4002          │
└──────────────────────┬──────────────────────────────┘
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
│   ├── src/Route/        # Express POST /compile endpoint
│   ├── services/         # Standalone Bun.serve compiler with auto-detection
│   ├── bin/              # Tectonic binary
│   └── scripts/          # Setup script (downloads tectonic)
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

### 2. Microservices Setup

```bash
cd microservices
bun install
bun run setup:tex   # downloads tectonic LaTeX compiler
bun run dev          # starts on port 3005
```

### 3. Client Setup

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

| Route | Description |
|---|---|---|
| `POST /api/auth/login` | Firebase + GitHub OAuth login |
| `GET /api/githuv/user` | Authenticated GitHub user data |
| `GET /api/githuv/dashboard` | Aggregated GitHub stats |
| `POST /api/githuv/create-repo` | Create private contribution repo |
| `POST /api/githuv/profile-readme/generate` | Generate profile README with theme + feedback |
| `GET /api/githuv/profile-readme/existing` | Fetch existing profile README from GitHub |
| `POST /api/githuv/profile-readme/publish` | Publish generated README to profile repo |
| `POST /api/githuv/repository-readme/generate` | Generate repository README |
| `POST /api/githuv/repository-readme/publish` | Publish repository README |
| `POST /api/githuv/repository-readme/undo` | Rollback repository README changes |
| `POST /api/onboarding/step1..5` | Profile wizard steps |
| `GET /api/resume` | List user resumes |
| `POST /api/resume/generate-ai` | AI resume generation |
| `POST /api/resume/compile-and-upload` | Manual LaTeX compilation |
| `POST /api/contribution/create` | Create recovery commits |
| `POST /api/contribution/daily` | Schedule daily recovery |

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
- GitHub access tokens hidden from default MongoDB queries (`select: false`)
- CORS restricted to `http://localhost:3000` in development
- PDF compilation runs in isolated temp directories with auto-cleanup
- The `.env` file contains development credentials — treat as compromised and rotate for production

---

## License

MIT
