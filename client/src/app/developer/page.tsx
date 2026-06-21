import Link from "next/link";
import Navbar from "@/components/Navbar";
import { FaGithub, FaCode, FaUsers, FaEnvelope, FaRocket, FaLightbulb, FaCogs } from "react-icons/fa";

const interests = [
  "Building Full Stack & AI-powered Applications",
  "System Design, Scaling & Advanced GenAI",
  "Real-world products, not just projects",
  "LangChain, LLMs & AI integrations",
  "MERN, APIs, Auth, Realtime Apps",
];

const languages = [
  "JavaScript", "TypeScript", "Python", "Java", "C", "C++",
];

export default function DeveloperPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <Navbar showAuth={false} />

      <section className="relative px-5 pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-96 bg-[radial-gradient(circle_at_50%_0%,rgba(239,68,68,0.10),transparent_60%)]" />
        <div className="absolute inset-0 githuv-hero-grid opacity-20" />

        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="grid gap-10 lg:grid-cols-[auto_1fr]">
            <div className="flex flex-col items-center lg:items-start">
              <img
                src="https://avatars.githubusercontent.com/u/68041717?v=4"
                alt="Smruti Ranjan Sahoo"
                className="size-40 rounded-2xl border-2 border-white/10 object-cover"
              />
              <a
                href="https://github.com/Smruti-Ranjan-Sahoo-Tech"
                target="_blank"
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-neutral-300 transition hover:bg-white/10 hover:text-white"
              >
                <FaGithub size={16} />
                @Smruti-Ranjan-Sahoo-Tech
              </a>
              <a
                href="mailto:s.r.sahoo370@gmail.com"
                className="mt-2 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-neutral-300 transition hover:bg-white/10 hover:text-white"
              >
                <FaEnvelope size={14} />
                s.r.sahoo370@gmail.com
              </a>
            </div>

            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-100">
                <span className="size-2 rounded-full bg-red-400" />
                Developer
              </div>
              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                Smruti Ranjan Sahoo
              </h1>
              <p className="mt-2 text-lg text-red-300 font-semibold">
                Full Stack Developer | MERN | Next.js | GenAI
              </p>
              <p className="mt-4 leading-7 text-neutral-400 max-w-2xl">
                Building production-level SaaS applications — not just coding, building real impact. 
                Focused on combining AI with web apps, diving deep into system design, and shipping 
                products that solve real problems.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border border-white/10 bg-neutral-900/60 p-4 text-center">
                  <p className="text-2xl font-black">33</p>
                  <p className="mt-1 text-xs text-neutral-500">Repositories</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-neutral-900/60 p-4 text-center">
                  <p className="text-2xl font-black">4</p>
                  <p className="mt-1 text-xs text-neutral-500">Followers</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-neutral-900/60 p-4 text-center">
                  <p className="text-2xl font-black">4</p>
                  <p className="mt-1 text-xs text-neutral-500">Following</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-neutral-900/60 p-4 text-center">
                  <p className="text-2xl font-black">2020</p>
                  <p className="mt-1 text-xs text-neutral-500">Joined</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FaRocket className="text-red-300" size={18} />
                <p className="text-sm font-bold uppercase tracking-wide text-red-300">Focus Areas</p>
              </div>
              <div className="space-y-3">
                {interests.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-lg border border-white/10 bg-neutral-900/60 px-4 py-3 text-sm text-neutral-300"
                  >
                    <span className="size-1.5 rounded-full bg-red-400 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <FaCode className="text-red-300" size={18} />
                <p className="text-sm font-bold uppercase tracking-wide text-red-300">Languages</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {languages.map((lang) => (
                  <span
                    key={lang}
                    className="rounded-lg border border-white/10 bg-neutral-900 px-4 py-2.5 text-sm font-medium text-neutral-200"
                  >
                    {lang}
                  </span>
                ))}
              </div>

              <div className="mt-8">
                <div className="flex items-center gap-2 mb-4">
                  <FaCogs className="text-red-300" size={18} />
                  <p className="text-sm font-bold uppercase tracking-wide text-red-300">Current Focus</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-neutral-900/60 p-5 text-sm leading-7 text-neutral-400">
                  Building Production-level SaaS apps · Deep dive into System Design · Combining AI + Web Apps
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-black tracking-tight">
            Not just coding, building real impact.
          </h2>
          <p className="mt-4 text-neutral-300">
            Creator of GithuV — building tools that help developers grow.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href="https://github.com/Smruti-Ranjan-Sahoo-Tech"
              target="_blank"
              className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-red-400"
            >
              <FaGithub size={16} />
              GitHub Profile
            </a>
            <a
              href="mailto:s.r.sahoo370@gmail.com"
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-neutral-200 transition hover:bg-white/10"
            >
              <FaEnvelope size={14} />
              Get in Touch
            </a>
          </div>
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
