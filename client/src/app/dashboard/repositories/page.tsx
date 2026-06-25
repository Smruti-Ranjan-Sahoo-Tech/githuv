"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  ChevronDown,
  GitBranch,
  Globe,
  Lock,
  Search,
  Star,
} from "lucide-react";
import { useFirebaseAuthStore } from "@/store/useFirebaseAuthStore";
import { useGithubDataStore, type RecentRepo } from "@/store/useGithubDataStore";

type SortKey = "updated" | "stars" | "name";
type Visibility = "all" | "public" | "private";

export default function RepositoriesPage() {
  const { user, loading: authLoading, initialLoginCheck } = useFirebaseAuthStore();
  const { data, loading, fetchDashboardData } = useGithubDataStore();

  const [query, setQuery] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("all");
  const [sortKey, setSortKey] = useState<SortKey>("updated");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const unsub = initialLoginCheck();
    return unsub;
  }, [initialLoginCheck]);

  useEffect(() => {
    if (user) fetchDashboardData();
  }, [user, fetchDashboardData]);

  const repos = useMemo(() => {
    let list = [...(data?.repositories ?? [])];

    // search
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.description || "").toLowerCase().includes(q) ||
          (r.language || "").toLowerCase().includes(q),
      );
    }

    // visibility
    if (visibility !== "all") {
      list = list.filter((r) => (visibility === "public" ? !r.private : r.private));
    }

    // date range
    if (dateFrom) {
      const from = new Date(dateFrom);
      list = list.filter((r) => new Date(r.updated_at) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      list = list.filter((r) => new Date(r.updated_at) <= to);
    }

    // sort
    list.sort((a, b) => {
      if (sortKey === "stars") return b.stars - a.stars;
      if (sortKey === "name") return a.name.localeCompare(b.name);
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    return list;
  }, [data, query, visibility, sortKey, dateFrom, dateTo]);

  const stats = useMemo(() => {
    const all = data?.repositories ?? [];
    return {
      total: all.length,
      public: all.filter((r) => !r.private).length,
      private: all.filter((r) => r.private).length,
    };
  }, [data]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-red-400" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
          Repositories
        </h1>
        <p className="mt-1 text-sm text-white/50">
          Find, filter, and explore your GitHub repositories.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Total", value: stats.total },
          { label: "Public", value: stats.public },
          { label: "Private", value: stats.private },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
          >
            <p className="text-xs uppercase tracking-wider text-white/40">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search + filters toggle */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5">
            <Search size={18} className="shrink-0 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a repository..."
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/70 transition hover:bg-white/10"
          >
            <ChevronDown
              size={16}
              className={`transition ${showFilters ? "rotate-180" : ""}`}
            />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 grid gap-4 border-t border-white/10 pt-4 sm:grid-cols-4">
            {/* Visibility */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/50">
                Category
              </label>
              <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
                {(["all", "public", "private"] as Visibility[]).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVisibility(v)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition ${
                      visibility === v
                        ? "bg-red-500/20 text-red-200"
                        : "text-white/50 hover:text-white/80"
                    }`}
                  >
                    {v === "public" ? <Globe size={14} /> : v === "private" ? <Lock size={14} /> : null}
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/50">
                Sort by
              </label>
              <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
                {([
                  { key: "updated", label: "Updated" },
                  { key: "stars", label: "Stars" },
                  { key: "name", label: "Name" },
                ] as { key: SortKey; label: string }[]).map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setSortKey(s.key)}
                    className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      sortKey === s.key
                        ? "bg-red-500/20 text-red-200"
                        : "text-white/50 hover:text-white/80"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date from */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/50">
                From date
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <Calendar size={14} className="shrink-0 text-white/40" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none [color-scheme:dark]"
                />
                {dateFrom && (
                  <button
                    type="button"
                    onClick={() => setDateFrom("")}
                    className="text-xs text-white/40 hover:text-white"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Date to */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/50">
                To date
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <Calendar size={14} className="shrink-0 text-white/40" />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none [color-scheme:dark]"
                />
                {dateTo && (
                  <button
                    type="button"
                    onClick={() => setDateTo("")}
                    className="text-xs text-white/40 hover:text-white"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="space-y-2">
        <p className="px-1 text-xs text-white/40">
          Showing {repos.length} of {data?.repositories.length ?? 0} repositories
        </p>

        {repos.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-16">
            <GitBranch size={32} className="text-white/20" />
            <p className="text-sm text-white/40">No repositories match your criteria</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {repos.map((repo) => (
              <RepoCard key={repo.full_name} repo={repo} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RepoCard({ repo }: { repo: RecentRepo }) {
  return (
    <a
      href={repo.html_url}
      target="_blank"
      rel="noreferrer"
      className="group block rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-red-400/30 hover:bg-red-500/5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="truncate text-base font-semibold text-white group-hover:text-red-200">
              {repo.name}
            </h3>
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                repo.private
                  ? "border-yellow-400/20 bg-yellow-400/10 text-yellow-200"
                  : "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
              }`}
            >
              {repo.private ? <Lock size={10} /> : <Globe size={10} />}
              {repo.private ? "Private" : "Public"}
            </span>
          </div>
          {repo.description && (
            <p className="mt-1.5 text-sm leading-6 text-white/50 line-clamp-2">
              {repo.description}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-4 text-sm text-white/40">
          <span className="inline-flex items-center gap-1">
            <Star size={14} />
            {repo.stars}
          </span>
          <span className="inline-flex items-center gap-1">
            <GitBranch size={14} />
            {repo.forks}
          </span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/40">
        {repo.language && (
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-medium text-white/60">
            {repo.language}
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <Calendar size={12} />
          Updated {new Date(repo.updated_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
    </a>
  );
}
