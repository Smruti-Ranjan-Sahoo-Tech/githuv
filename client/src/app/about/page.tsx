import Link from "next/link";
import Navbar from "@/components/Navbar";
import { FaGithub, FaRocket, FaUsers, FaShieldAlt, FaBullseye, FaEye } from "react-icons/fa";

const values = [
  {
    icon: FaRocket,
    title: "Innovation First",
    desc: "We build AI-powered tools that adapt to how developers actually work — not the other way around.",
    color: "text-red-300 bg-red-500/10 border-red-500/20",
  },
  {
    icon: FaUsers,
    title: "Community Driven",
    desc: "Every feature is shaped by real developer feedback. The platform grows with its users.",
    color: "text-sky-300 bg-sky-500/10 border-sky-500/20",
  },
  {
    icon: FaShieldAlt,
    title: "Privacy & Trust",
    desc: "Your data stays yours. We use minimal permissions and never share your GitHub or personal information.",
    color: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    icon: FaBullseye,
    title: "Career Focused",
    desc: "Every tool is designed with one goal: help developers advance their careers faster.",
    color: "text-amber-300 bg-amber-500/10 border-amber-500/20",
  },
  {
    icon: FaEye,
    title: "Transparent AI",
    desc: "AI suggestions are clearly labeled, reviewable, and never applied without your approval.",
    color: "text-cyan-300 bg-cyan-500/10 border-cyan-500/20",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <Navbar showAuth={false} />

      <section className="relative px-5 pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-96 bg-[radial-gradient(circle_at_50%_0%,rgba(239,68,68,0.12),transparent_60%)]" />
        <div className="absolute inset-0 githuv-hero-grid opacity-30" />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-100">
            <span className="size-2 rounded-full bg-red-400" />
            About GithuV
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">
            Built for developers,<br />
            <span className="text-gradient">powered by AI</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-neutral-300">
            GithuV is an AI-powered career growth platform that helps developers build stronger
            professional profiles, collaborate on projects, and accelerate their careers — all from
            one integrated workspace.
          </p>
        </div>
      </section>

      <section className="px-5 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-neutral-900 p-8">
              <h2 className="text-2xl font-black tracking-tight">Our Mission</h2>
              <p className="mt-4 leading-7 text-neutral-300">
                We believe every developer deserves a professional presence that reflects their
                actual skills and contributions. GithuV bridges the gap between writing code every
                day and having a career profile that opens doors — by automating the tedious parts
                and amplifying what matters.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-neutral-900 p-8">
              <h2 className="text-2xl font-black tracking-tight">What We Do</h2>
              <p className="mt-4 leading-7 text-neutral-300">
                From AI-generated resumes and LinkedIn content to intelligent profile READMEs,
                project collaboration, and career coaching — GithuV connects your GitHub activity
                with the tools you need to grow. No manual data entry. No repetitive form filling.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <p className="text-sm font-bold uppercase tracking-wide text-red-300">
              What We Stand For
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Our Values
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((v) => {
              const Icon = v.icon;
              return (
                <div
                  key={v.title}
                  className="rounded-xl border border-white/10 bg-neutral-900 p-6 transition duration-300 hover:-translate-y-1 hover:border-white/20"
                >
                  <div className={`mb-4 flex size-12 items-center justify-center rounded-lg border ${v.color}`}>
                    <Icon size={20} />
                  </div>
                  <h3 className="text-lg font-bold">{v.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-neutral-400">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-5 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-black tracking-tight">
            Ready to grow your career?
          </h2>
          <p className="mt-4 text-neutral-300">
            Connect your GitHub and start building your professional presence in minutes.
          </p>
          <Link
            href="/login"
            className="mt-7 inline-flex rounded-lg bg-red-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-red-400"
          >
            Start with GitHub
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 px-5 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 text-sm text-neutral-500 sm:flex-row sm:justify-between">
          <Link href="/" className="text-xl font-black italic tracking-tight text-white">
            Githu<span className="text-red-500">V</span>
          </Link>
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
