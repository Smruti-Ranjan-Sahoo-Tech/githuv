"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  GitBranch,
  Search,
  Sparkles,
  Star,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { useFirebaseAuthStore } from "@/store/useFirebaseAuthStore";
import { useGithubDataStore } from "@/store/useGithubDataStore";

const flowSteps = [
  "Collect user context",
  "Analyze existing README",
  "Read repository metadata",
  "Build folder tree and config summary",
  "Detect important features",
  "Merge knowledge deterministically",
  "Let AI write the README",
  "Validate and preview",
];

export default function RepositoryIntelligenceView() {
  const { user, loading, initialLoginCheck } = useFirebaseAuthStore();
  const { data, loading: ghLoading, error, fetchDashboardData } =
    useGithubDataStore();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const unsubscribe = initialLoginCheck();
    return unsubscribe;
  }, [initialLoginCheck]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, fetchDashboardData]);

  const repositories = data?.repositories ?? data?.recentRepos ?? [];
  const normalizedQuery = query.trim().toLowerCase();
  const filteredRepos = repositories.filter((repo) => {
    if (!normalizedQuery) return true;

    return [
      repo.name,
      repo.full_name,
      repo.language ?? "",
      repo.description ?? "",
    ]
      .some((value) => value.toLowerCase().includes(normalizedQuery));
  });

  const activeRepo = normalizedQuery
    ? filteredRepos[0] ?? null
    : repositories[0] ?? null;
  const publicCount = repositories.filter((repo) => !repo.private).length;
  const privateCount = repositories.filter((repo) => repo.private).length;

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center rounded-2xl border border-zinc-800 p-8">
        <p className="text-lg">Loading repository intelligence...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center rounded-2xl border border-zinc-800 p-8">
        <p className="text-lg">Please log in to view your repositories.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-red-100">
              <Sparkles size={14} />
              Repository Intelligence Engine + AI Writer
            </div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              Find a repo fast, then generate the right README flow.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
              This screen keeps the experience simple: search by repo name,
              review the repo card, and move toward the AI-powered README
              workflow without adding extra noise.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/10"
          >
            Back to dashboard <ArrowRight size={14} />
          </Link>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              Total repos
            </p>
            <p className="mt-1 text-2xl font-bold">{repositories.length}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              Public
            </p>
            <p className="mt-1 text-2xl font-bold">{publicCount}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              Private
            </p>
            <p className="mt-1 text-2xl font-bold">{privateCount}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
            <label
              htmlFor="repo-search"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              Search repository name
            </label>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <Search size={18} className="text-zinc-500" />
              <input
                id="repo-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Type a repo name, language, or keyword"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
              />
            </div>
            <p className="mt-3 text-xs text-zinc-500">
              Showing {filteredRepos.length} of {repositories.length} repos.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-red-400" />
              <h2 className="text-lg font-bold">80 / 20 Architecture</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Keep the repository analysis deterministic, then use AI only for
              the writing step. That makes the page easier to understand,
              easier to debug, and much easier to extend later.
            </p>
            <div className="mt-4 space-y-2">
              {flowSteps.map((step, index) => (
                <div
                  key={step}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
                >
                  <div className="flex size-7 items-center justify-center rounded-full bg-red-500/10 text-xs font-bold text-red-200">
                    {index + 1}
                  </div>
                  <span className="text-sm text-zinc-200">{step}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">Selected repository</h2>
                <p className="text-sm text-zinc-500">
                  The first matching repo appears here.
                </p>
              </div>
              {activeRepo && (
                <a
                  href={activeRepo.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-200 transition hover:bg-white/10"
                >
                  Open on GitHub <FaGithub />
                </a>
              )}
            </div>

            {activeRepo ? (
              <div className="space-y-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-semibold">{activeRepo.name}</h3>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] uppercase tracking-wide text-zinc-300">
                      {activeRepo.private ? "Private" : "Public"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    {activeRepo.description || "No description added yet."}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <p className="text-[11px] uppercase tracking-wide text-zinc-500">
                      Language
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      {activeRepo.language || "Unknown"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <p className="text-[11px] uppercase tracking-wide text-zinc-500">
                      Stars
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      {activeRepo.stars}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <p className="text-[11px] uppercase tracking-wide text-zinc-500">
                      Forks
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      {activeRepo.forks}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
                    <GitBranch size={16} className="text-red-400" />
                    README workflow
                  </div>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    Collect repo metadata, read the folder tree, summarize the
                    config, detect features, then let the AI write the README.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-sm text-zinc-500">
                No repositories matched the search.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
          <div className="mb-4 flex items-center gap-2">
            <Star size={18} className="text-red-400" />
            <h2 className="text-lg font-bold">Repository list</h2>
          </div>

          {ghLoading && (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-sm text-zinc-400">
              Fetching repositories...
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
              Failed to load repositories: {error}
            </div>
          )}

          {!ghLoading && !error && (
            <div className="grid gap-3">
              {filteredRepos.map((repo) => (
                <a
                  key={repo.full_name}
                  href={repo.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:-translate-y-0.5 hover:bg-white/[0.05]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-semibold text-white">
                          {repo.name}
                        </h3>
                        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
                          {repo.private ? "Private" : "Public"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-zinc-400">
                        {repo.description || "No description added yet."}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-3 text-xs text-zinc-400">
                      <span className="inline-flex items-center gap-1">
                        <Star size={12} />
                        {repo.stars}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <GitBranch size={12} />
                        {repo.forks}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                    {repo.language && (
                      <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1">
                        {repo.language}
                      </span>
                    )}
                    <span>Updated {new Date(repo.updated_at).toLocaleDateString()}</span>
                  </div>
                </a>
              ))}

              {filteredRepos.length === 0 && !ghLoading && !error && (
                <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-zinc-500">
                  No repositories found. Try a different search term.
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
