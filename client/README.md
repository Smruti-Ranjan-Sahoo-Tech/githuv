# GithuV Client

Next.js frontend for the **GithuV** AI-powered career growth platform. Connects GitHub activity with AI tools — resume generation, profile README creation, contribution streak recovery, and more.

## Features

- **Dashboard** — real-time GitHub stats (repos, stars, forks, followers, languages), career score, recent activity feed, repository browser
- **Profile README Generator** — 6 themed templates, existing-README analysis, live rendered preview with source toggle, one-click publish
- **Repository README Intelligence** — AI-generated READMEs from repo metadata, folder structure, configs, and features
- **Resume Builder** — ATS-optimized resumes from GitHub data, AI content generation, LaTeX editor, PDF export, ATS scoring
- **Profile Studio** — 5-step onboarding wizard (personal info, professional profile, projects, experience, branding)
- **Strike Recovery** — contribution graph repair with text-to-grid, random patterns, custom art
- **VS Code auth** — browser-based sign-in flow used by the Githuv VS Code extension (`/api/resume/*`, `/vscode-auth`)

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, React Compiler), React 19 |
| **Styling** | Tailwind CSS v4, PostCSS |
| **State** | Zustand 5 |
| **Auth** | Firebase Auth + GitHub OAuth |
| **HTTP** | Axios |
| **Markdown** | react-markdown, remark-gfm, rehype-raw |
| **PDF** | jspdf, html2canvas |
| **Icons** | lucide-react, react-icons |
| **Realtime** | socket.io-client |
| **Notifications** | react-toastify |

## Getting Started

```bash
bun install
bun run dev        # starts on http://localhost:3000
```

Other scripts:

| Command | Purpose |
|---|---|
| `bun run build` | Production build |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |

## Environment

Create `client/.env.local` from the template (`cp .env.local.example .env.local`):

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL for the `/api/*` rewrite and the axios instance (default: `http://localhost:4002` in dev, `https://githuv.onrender.com` in production) |

Firebase client configuration is hard-coded in `src/config/firebase.ts` and needs no environment variables.

## Backend Proxy

The client proxies `/api/*` requests to the Githuv server via Next.js rewrites (`next.config.ts`), using `NEXT_PUBLIC_API_URL`:

```
/api/:path* → http://localhost:4002/api/:path*
```

Local API routes under `src/app/api/resume/` forward cookie-authenticated requests to the backend for resume generation, LaTeX retrieval, AI feedback, and the VS Code extension flows.

## Project Structure

```
client/
├── src/
│   ├── app/               # Pages (landing, login, dashboard, resume-builder, vscode-auth, etc.)
│   │   ├── api/resume/    # Server-side proxy routes for resume features
│   │   └── dashboard/     # profile-readme, readme-intelligence, repositories, resume, strike-recovery
│   ├── components/        # Navbar, Dashboard, ProfileStudio, ResumeBuilder, etc.
│   ├── store/             # Zustand stores (auth, GitHub data, profile studio, theme)
│   ├── API/               # Axios instance
│   └── config/            # Firebase client config
└── public/                # Static assets
```

## Prerequisites

- **Bun** runtime
- **Githuv server** running on `http://localhost:4002`
- **Chat service** running on `http://localhost:4004` (for chat features)
- **Firebase project** with GitHub OAuth provider enabled
- **MongoDB** running locally on port 27017

See the [root README](../README.md) for full platform setup instructions.