import Link from "next/link";
import HeroCanvas from "@/components/HeroCanvas";
import Navbar from "@/components/Navbar";
import {
  FaBrain,
  FaChartLine,
  FaFileAlt,
  FaGithub,
  FaLinkedin,
  FaProjectDiagram,
  FaTasks,
  FaUsers,
  FaCode,
  FaRocket,
  FaFire,
} from "react-icons/fa";

const features = [
  {
    icon: FaGithub,
    title: "AI Profile README Generator",
    description:
      "Generate stunning profile READMEs with 6 themed templates. Analyzes your existing README, carries forward your best content, and publishes with one click.",
    tone: "text-red-300 bg-red-500/10 border-red-500/20",
  },
  {
    icon: FaGithub,
    title: "AI Repository README Generator",
    description:
      "Analyze repository metadata, folder structure, config files, and features before generating a clean, professional README.",
    tone: "text-red-300 bg-red-500/10 border-red-500/20",
  },
  {
    icon: FaFileAlt,
    title: "AI Resume Builder",
    description:
      "Create ATS-optimized resumes, estimate scores, get improvement suggestions, and export clean PDFs via LaTeX.",
    tone: "text-amber-300 bg-amber-500/10 border-amber-500/20",
  },
  {
    icon: FaFire,
    title: "Streak Recovery",
    description:
      "Maintain platform learning streaks through tasks, profile updates, resume improvements, roadmap milestones, and project participation.",
    tone: "text-orange-300 bg-orange-500/10 border-orange-500/20",
  },
];

const objectives = [
  "Improve developer career readiness",
  "Automate professional profile creation",
  "Optimize resumes and ATS readiness",
  "Support LinkedIn profile growth",
  "Enable project collaboration",
  "Track learning and development progress",
];

function LogoMark({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`font-black italic tracking-tight text-white ${
        compact ? "text-3xl" : "text-5xl sm:text-6xl lg:text-8xl"
      }`}
    >
      Githu
      <span className="inline-block text-red-500">V</span>
    </span>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-neutral-950 text-white">
      <Navbar />

      <section className="relative min-h-screen overflow-hidden px-5 pt-32 pb-16 lg:pt-36">
        <HeroCanvas />

        <div className="absolute inset-0 githuv-hero-grid opacity-40" />

        <div className="absolute inset-x-0 top-0 h-96 bg-[radial-gradient(circle_at_50%_0%,rgba(239,68,68,0.15),transparent_60%)]" />

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div className="text-center lg:text-left page-enter">
              <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-100">
                <span className="size-2 rounded-full bg-red-400 githuv-pulse-dot" />
                AI-Powered Career Growth Platform
              </div>

              <h1 className="mt-8">
                <LogoMark />
              </h1>

              <p className="mx-auto mt-8 max-w-2xl text-base leading-8 text-neutral-300 sm:text-lg lg:mx-0">
                GithuV helps developers improve their professional presence,
                collaborate on projects, generate AI-powered assets, track
                progress, and accelerate career growth.
              </p>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <Link
                  href="/login"
                  className="rounded-lg bg-red-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-red-400"
                >
                  Start with GitHub
                </Link>

                <a
                  href="#overview"
                  className="rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-neutral-200 transition hover:bg-white/10"
                >
                  Explore Platform
                </a>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-xl githuv-float">
              <div className="rounded-2xl border border-white/10 bg-neutral-900/90 p-5 backdrop-blur-xl">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-400">
                      Developer Dashboard
                    </p>
                    <h3 className="text-xl font-bold">Career Snapshot</h3>
                  </div>

                  <div className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-1 text-sm font-bold text-red-200">
                    AI
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 49 }).map((_, index) => {
                    const level = index % 5;

                    const colors = [
                      "bg-neutral-800",
                      "bg-red-950",
                      "bg-red-800",
                      "bg-red-600",
                      "bg-emerald-400",
                    ];

                    return (
                      <div
                        key={index}
                        className={`aspect-square rounded ${colors[level]}`}
                      />
                    );
                  })}
                </div>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                    <p className="text-xs text-neutral-500">Career Score</p>
                    <p className="mt-1 text-2xl font-black">82</p>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                    <p className="text-xs text-neutral-500">Tasks</p>
                    <p className="mt-1 text-2xl font-black">14</p>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                    <p className="text-xs text-neutral-500">Roadmaps</p>
                    <p className="mt-1 text-2xl font-black">3</p>
                  </div>
                </div>
              </div>

              <a
                href="/login"
                className="hover-3d hidden md:block absolute -right-6 -top-8 text-sky-200 githuv-float-delayed"
                aria-label="Resume ATS plus AI"
              >
                <div className="hover-3d-card rounded-xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm font-semibold backdrop-blur-md">
                  <div className="flex items-start justify-between gap-5">
                    <div className="space-y-1">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-sky-100/60">
                        Feature
                      </p>
                      <p>Resume ATS + AI</p>
                    </div>

                    <div className="text-4xl leading-none opacity-10">
                      ❋
                    </div>
                  </div>
                </div>
              </a>

              <a
                href="/login"
                className="hover-3d hidden md:block absolute -left-6 -bottom-8 text-emerald-200 githuv-float"
                aria-label="Projects plus team chat"
              >
                <div className="hover-3d-card rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold backdrop-blur-md">
                  <div className="flex items-start justify-between gap-5">
                    <div className="space-y-1">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-emerald-100/60">
                        Feature
                      </p>
                      <p>Projects + Team Chat</p>
                    </div>

                    <div className="text-4xl leading-none opacity-10">
                      ❋
                    </div>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="overview" className="px-5 py-20 scroll-mt-20">
        <div className="mx-auto max-w-7xl page-enter">
          <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="rounded-lg border border-white/10 bg-neutral-900 p-6">
              <p className="text-sm font-bold uppercase tracking-wide text-red-300">
                Objectives
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">
                Built for career-ready developers.
              </h2>
              <p className="mt-4 text-neutral-400">
                The platform combines profile automation, resume optimization,
                collaboration, AI guidance, and learning progress tracking into
                one ecosystem.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {objectives.map((objective) => (
                <div
                  key={objective}
                  className="rounded-lg border border-white/10 bg-neutral-900 p-4 text-sm font-medium text-neutral-200 transition duration-300 hover:border-white/20 hover:-translate-y-0.5"
                >
                  {objective}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="px-5 py-20 scroll-mt-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-wide text-red-300">
              Core Features
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              AI tools, collaboration, and analytics in one platform.
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.title}
                  className="card-hover-glow group rounded-lg border border-white/10 bg-neutral-900 p-5 transition duration-300 hover:-translate-y-1"
                >
                  <div
                    className={`mb-5 flex size-11 items-center justify-center rounded-md border ${feature.tone}`}
                  >
                    <Icon size={20} />
                  </div>
                  <h3 className="text-lg font-bold">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-neutral-400">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-5 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <p className="text-sm font-bold uppercase tracking-wide text-red-300">
              Coming Soon
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              DevChat — VS Code Integration
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-neutral-400">
              Your entire GithuV workspace, now inside your editor. Collaborate, review, and manage projects without leaving VS Code.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-neutral-900 p-6 transition duration-300 hover:border-violet-500/30 hover:-translate-y-1">
              <div className="mb-4 flex size-12 items-center justify-center rounded-lg border border-violet-500/20 bg-violet-500/10 text-violet-300">
                <FaCode size={20} />
              </div>
              <h3 className="text-lg font-bold">Inline Chat</h3>
              <p className="mt-3 text-sm leading-6 text-neutral-400">
                Chat with your team directly in VS Code. Share code snippets, review PRs, and discuss changes without switching contexts.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-neutral-900 p-6 transition duration-300 hover:border-violet-500/30 hover:-translate-y-1">
              <div className="mb-4 flex size-12 items-center justify-center rounded-lg border border-violet-500/20 bg-violet-500/10 text-violet-300">
                <FaRocket size={20} />
              </div>
              <h3 className="text-lg font-bold">AI Commands</h3>
              <p className="mt-3 text-sm leading-6 text-neutral-400">
                Generate READMEs, suggest commit messages, analyze code, and get AI career coaching suggestions from within your editor.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-neutral-900 p-6 transition duration-300 hover:border-violet-500/30 hover:-translate-y-1">
              <div className="mb-4 flex size-12 items-center justify-center rounded-lg border border-violet-500/20 bg-violet-500/10 text-violet-300">
                <FaUsers size={20} />
              </div>
              <h3 className="text-lg font-bold">Workspace Sync</h3>
              <p className="mt-3 text-sm leading-6 text-neutral-400">
                View tasks, project boards, and team activity from VS Code. Accept invites, update status, and stay in flow.
              </p>
            </div>
          </div>

          <div className="mt-16">
            <p className="mb-6 text-sm font-bold uppercase tracking-wide text-neutral-500 text-center">
              More on the Way
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-neutral-900 p-5 transition duration-300 hover:border-sky-500/30 hover:-translate-y-1">
                <div className="mb-3 flex size-10 items-center justify-center rounded-lg border border-sky-500/20 bg-sky-500/10 text-sky-300">
                  <FaLinkedin size={16} />
                </div>
                <h3 className="font-bold">LinkedIn Assistant</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-400">
                  Generate headlines, about sections, posts, and professional branding recommendations tailored to your profile.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-neutral-900 p-5 transition duration-300 hover:border-emerald-500/30 hover:-translate-y-1">
                <div className="mb-3 flex size-10 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
                  <FaBrain size={16} />
                </div>
                <h3 className="font-bold">AI Career Coach</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-400">
                  Build personalized learning roadmaps, analyze skill gaps, prepare for interviews, and plan projects.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-neutral-900 p-5 transition duration-300 hover:border-cyan-500/30 hover:-translate-y-1">
                <div className="mb-3 flex size-10 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10 text-cyan-300">
                  <FaChartLine size={16} />
                </div>
                <h3 className="font-bold">Developer Dashboard</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-400">
                  Track GitHub statistics, career score, learning progress, activity feed, and AI-powered suggestions in one place.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-neutral-900 p-5 transition duration-300 hover:border-rose-500/30 hover:-translate-y-1">
                <div className="mb-3 flex size-10 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-300">
                  <FaProjectDiagram size={16} />
                </div>
                <h3 className="font-bold">Project Workspace</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-400">
                  Create projects, invite members, manage roles, and monitor progress in a shared workspace.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-neutral-900 p-5 transition duration-300 hover:border-teal-500/30 hover:-translate-y-1">
                <div className="mb-3 flex size-10 items-center justify-center rounded-lg border border-teal-500/20 bg-teal-500/10 text-teal-300">
                  <FaUsers size={16} />
                </div>
                <h3 className="font-bold">Team Collaboration</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-400">
                  Real-time chat, file sharing, notifications, and role management for coordinated team work.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-neutral-900 p-5 transition duration-300 hover:border-orange-500/30 hover:-translate-y-1">
                <div className="mb-3 flex size-10 items-center justify-center rounded-lg border border-orange-500/20 bg-orange-500/10 text-orange-300">
                  <FaTasks size={16} />
                </div>
                <h3 className="font-bold">Todo Management</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-400">
                  Create, assign, prioritize, and track tasks with completion status and progress tracking.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-neutral-900 p-5 transition duration-300 hover:border-amber-500/30 hover:-translate-y-1">
              <h3 className="font-bold">Contribution Visualizer</h3>
              <p className="mt-2 text-sm leading-6 text-neutral-400">
                Plan contribution patterns, initials, names, and custom art with real-time GitHub-style grid previews.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-neutral-900 p-5 transition duration-300 hover:border-amber-500/30 hover:-translate-y-1">
              <h3 className="font-bold">Contribution Art</h3>
              <p className="mt-2 text-sm leading-6 text-neutral-400">
                Preview initials, names, symbols, custom shapes, and estimate the activity needed for contribution-style patterns.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-neutral-900 p-5 transition duration-300 hover:border-amber-500/30 hover:-translate-y-1">
              <h3 className="font-bold">Repo Intelligence</h3>
              <p className="mt-2 text-sm leading-6 text-neutral-400">
                Search your repositories, inspect repo metadata, and follow the deterministic analysis flow before the AI writes the README.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20">
        <div className="mx-auto max-w-4xl rounded-lg border border-red-500/20 bg-red-500/10 p-8 text-center">
          <h2 className="text-3xl font-black tracking-tight">
            Build stronger profiles. Organize projects. Track career growth.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-neutral-300">
            GithuV is designed to help students and developers improve
            employability, collaborate effectively, and grow systematically.
          </p>
          <Link
            href="/login"
            className="mt-7 inline-flex rounded-md bg-white px-6 py-3 text-sm font-bold text-neutral-950 transition hover:bg-neutral-200"
          >
            Continue to Login
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 px-5 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
          <LogoMark compact />
          <div className="flex items-center gap-4">
            <Link href="/about" className="transition hover:text-white">About</Link>
            <Link href="/terms" className="transition hover:text-white">Terms</Link>
            <Link href="/developer" className="transition hover:text-white">Developer</Link>
          </div>
          <span>GithuV — AI-Powered Career Growth Platform for Developers</span>
        </div>
      </footer>
    </main>
  );
}
