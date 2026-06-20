"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { axiosInstance } from "@/API/axiosInstance";
import { useFirebaseAuthStore } from "@/store/useFirebaseAuthStore";
import { useGithubDataStore } from "@/store/useGithubDataStore";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  GitBranch,
  Loader2,
  RefreshCcw,
  Search,
  Send,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";

type Repository = {
  name: string;
  full_name: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  updated_at: string;
  private: boolean;
  html_url: string;
};

type ConfigSummary = {
  filesAnalyzed: string[];
  framework: string;
  databases: string[];
  authentication: string[];
  scripts: string[];
  libraries: string[];
  signals: string[];
};

type ValidationResult = {
  score: number;
  presentSections: string[];
  missingSections: string[];
};

type RollbackSnapshot = {
  existed: boolean;
  sha: string;
  content: string;
};

type GenerateResponse = {
  success: boolean;
  configSummary?: ConfigSummary;
  importantFeatures?: string[];
  repoKnowledge?: { projectPurpose: string };
  generatedReadme?: string;
  validation?: ValidationResult;
};

type PublishResponse = {
  success: boolean;
  rollbackSnapshot?: RollbackSnapshot;
  message?: string;
};

export default function ReadmeIntelligenceView() {
  const { user, loading, initialLoginCheck } = useFirebaseAuthStore();
  const { data, loading: ghLoading, error, fetchDashboardData } =
    useGithubDataStore();

  const [query, setQuery] = useState("");
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [projectPurpose, setProjectPurpose] = useState("");
  const [keyFeatures, setKeyFeatures] = useState("");
  const [targetUsers, setTargetUsers] = useState("");

  const [mode, setMode] = useState<"form" | "result">("form");
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  const [generatedReadme, setGeneratedReadme] = useState("");
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const unsubscribe = initialLoginCheck();
    return unsubscribe;
  }, [initialLoginCheck]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, fetchDashboardData]);

  const repositories = useMemo(
    () => (data?.repositories ?? data?.recentRepos ?? []) as Repository[],
    [data]
  );
  const activeRepo = selectedRepo ?? repositories[0] ?? null;

  const filteredRepos = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return repositories;

    return repositories.filter((repo) =>
      [repo.name, repo.full_name, repo.language, repo.description]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(q))
    );
  }, [query, repositories]);

  const selectedOwner = activeRepo?.full_name.split("/")[0] || "";
  const selectedName = activeRepo?.name || "";

  const parseKeyFeatures = () =>
    keyFeatures
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const handleGenerate = async () => {
    if (!activeRepo || !projectPurpose.trim()) {
      setErrorMessage("Choose a repository and add the project purpose.");
      return;
    }

    setGenerating(true);
    setErrorMessage("");
    setMessage("Building repository knowledge...");

    try {
      const { data } = await axiosInstance.post(
        "/api/githuv/repository-readme/generate",
        {
          repoOwner: selectedOwner,
          repoName: selectedName,
          userInput: {
            projectPurpose,
            keyFeatures: parseKeyFeatures(),
            targetUsers,
          },
        }
      );

      const response = data as GenerateResponse;

      setGeneratedReadme(response.generatedReadme || "");
      setValidation(response.validation || null);
      setPublished(false);
      setMode("result");
      setMessage("");
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setErrorMessage(
        error.response?.data?.message ||
          error.message ||
          "Failed to generate repository README"
      );
      setMessage("");
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!activeRepo || !generatedReadme) {
      setErrorMessage("Generate a README before publishing.");
      return;
    }

    setPublishing(true);
    setErrorMessage("");
    setMessage("Publishing README to GitHub...");

    try {
      const { data } = await axiosInstance.post(
        "/api/githuv/repository-readme/publish",
        {
          repoOwner: selectedOwner,
          repoName: selectedName,
          generatedReadme,
        }
      );

      const response = data as PublishResponse;
      setPublished(true);
      setMessage(response.message || "README published successfully.");
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setErrorMessage(
        error.response?.data?.message ||
          error.message ||
          "Failed to publish README"
      );
      setMessage("");
    } finally {
      setPublishing(false);
    }
  };

  const handleRedo = () => {
    setMode("form");
    setGeneratedReadme("");
    setValidation(null);
    setPublished(false);
    setMessage("");
    setErrorMessage("");
  };

  if (loading) {
    return (
      <div
        className="flex min-h-[70vh] items-center justify-center rounded-2xl border p-8"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <p style={{ color: "var(--text-secondary)" }}>Loading README intelligence...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className="flex min-h-[70vh] items-center justify-center rounded-2xl border p-8"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <p style={{ color: "var(--text-secondary)" }}>
          Please log in to use the README generator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <section
        className="rounded-2xl border p-5"
        style={{
          borderColor: "var(--border-subtle)",
          background: "var(--surface-card)",
        }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div
              className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]"
              style={{
                borderColor: "var(--accent-border)",
                background: "var(--accent-soft)",
                color: "var(--accent-text)",
              }}
            >
              <Sparkles size={14} />
              AI Powered README Generator
            </div>
            <h1
              className="text-2xl font-black tracking-tight sm:text-3xl"
              style={{ color: "var(--text-primary)" }}
            >
              Generate, review, and publish READMEs in one flow.
            </h1>
            <p
              className="mt-3 max-w-2xl text-sm leading-6"
              style={{ color: "var(--text-secondary)" }}
            >
              Select a repository, describe your project, and generate a README.
              Review the result, then{" "}
              <span
                className="font-semibold"
                style={{ color: "var(--accent-text-hover)" }}
              >
                Confirm
              </span>{" "}
              to publish directly to GitHub or{" "}
              <span
                className="font-semibold"
                style={{ color: "var(--text-label)" }}
              >
                Redo
              </span>{" "}
              to refine your input.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition"
            style={{
              borderColor: "var(--border-subtle)",
              background: "var(--surface-input)",
              color: "var(--text-primary)",
            }}
          >
            <ArrowLeft size={14} />
            Back to dashboard
          </Link>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div
            className="rounded-xl border p-4"
            style={{
              borderColor: "var(--border-subtle)",
              background: "var(--surface-elevated)",
            }}
          >
            <p
              className="text-xs uppercase tracking-wide"
              style={{ color: "var(--text-tertiary)" }}
            >
              Repository
            </p>
            <p
              className="mt-1 truncate text-lg font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              {activeRepo?.name || "-"}
            </p>
          </div>
          <div
            className="rounded-xl border p-4"
            style={{
              borderColor: "var(--border-subtle)",
              background: "var(--surface-elevated)",
            }}
          >
            <p
              className="text-xs uppercase tracking-wide"
              style={{ color: "var(--text-tertiary)" }}
            >
              Status
            </p>
            <p
              className="mt-1 text-lg font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              {published
                ? "Published"
                : mode === "result"
                  ? "Generated"
                  : "Ready"}
            </p>
          </div>
          <div
            className="rounded-xl border p-4"
            style={{
              borderColor: "var(--border-subtle)",
              background: "var(--surface-elevated)",
            }}
          >
            <p
              className="text-xs uppercase tracking-wide"
              style={{ color: "var(--text-tertiary)" }}
            >
              Validation
            </p>
            <p className="mt-1 text-2xl font-bold">0/100</p>
          </div>
        </div>
      </section>

      {mode === "form" ? (
        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          {/* Repo selection column */}
          <div className="space-y-6">
            <div
              className="rounded-2xl border p-5"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--surface-card)",
              }}
            >
              <label
                htmlFor="repo-search"
                className="mb-2 block text-sm font-medium"
                style={{ color: "var(--text-label)" }}
              >
                Search repository
              </label>
              <div
                className="flex items-center gap-3 rounded-xl border px-4 py-3"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "var(--surface-input)",
                }}
              >
                <Search size={18} style={{ color: "var(--text-tertiary)" }} />
                  <input
                    id="repo-search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Type a repo name"
                    className="w-full bg-transparent text-sm outline-none placeholder-theme"
                    style={{ color: "var(--text-primary)" }}
                  />
              </div>
              <p
                className="mt-3 text-xs"
                style={{ color: "var(--text-tertiary)" }}
              >
                Click a repository to load it into the generator.
              </p>
            </div>

            <div
              className="rounded-2xl border p-5"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--surface-card)",
              }}
            >
              <div className="mb-4 flex items-center gap-2">
                <FaGithub size={18} style={{ color: "var(--accent)" }} />
                <h2
                  className="text-lg font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Your repositories
                </h2>
              </div>

              {ghLoading && (
                <div
                  className="rounded-xl border p-4 text-sm"
                  style={{
                    borderColor: "var(--border-subtle)",
                    background: "var(--surface-elevated)",
                    color: "var(--text-secondary)",
                  }}
                >
                  Fetching repositories...
                </div>
              )}

              {error && (
                <div
                  className="rounded-xl border p-4 text-sm"
                  style={{
                    borderColor: "var(--accent-border)",
                    background: "var(--accent-soft)",
                    color: "var(--accent-text)",
                  }}
                >
                  Failed to load repositories: {error}
                </div>
              )}

              <div className="mt-3 max-h-[30rem] space-y-3 overflow-y-auto pr-1">
                {filteredRepos.map((repo) => {
                  const isActive = activeRepo?.full_name === repo.full_name;

                  return (
                    <button
                      key={repo.full_name}
                      onClick={() => setSelectedRepo(repo)}
                      className="w-full rounded-xl border p-4 text-left transition hover:-translate-y-0.5"
                      style={{
                        borderColor: isActive
                          ? "var(--accent-border-strong)"
                          : "var(--border-subtle)",
                        background: isActive
                          ? "var(--accent-soft)"
                          : "var(--surface-elevated)",
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p
                            className="truncate text-sm font-semibold"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {repo.name}
                          </p>
                          <p
                            className="mt-1 line-clamp-2 text-xs"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {repo.description || "No description added yet."}
                          </p>
                        </div>
                        <span
                          className="shrink-0 rounded-full border px-2 py-1 text-[10px] uppercase tracking-wide"
                          style={{
                            borderColor: "var(--border-subtle)",
                            color: "var(--text-label)",
                          }}
                        >
                          {repo.private ? "Private" : "Public"}
                        </span>
                      </div>
                      <div
                        className="mt-3 flex flex-wrap items-center gap-2 text-xs"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {repo.language && (
                          <span
                            className="rounded-full border px-2 py-1"
                            style={{
                              borderColor: "var(--border-subtle)",
                              background: "var(--surface-input)",
                            }}
                          >
                            {repo.language}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <GitBranch size={12} />
                          {repo.full_name}
                        </span>
                      </div>
                    </button>
                  );
                })}

                {filteredRepos.length === 0 && !ghLoading && !error && (
                  <div
                    className="rounded-xl border border-dashed p-4 text-sm"
                    style={{
                      borderColor: "var(--border-subtle)",
                      background: "var(--surface-elevated)",
                      color: "var(--text-tertiary)",
                    }}
                  >
                    No repositories found.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Input form column */}
          <div className="space-y-6">
            <div
              className="rounded-2xl border p-5"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--surface-card)",
              }}
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2
                    className="text-lg font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Project context
                  </h2>
                  <p
                    className="text-sm"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Describe your project so the AI can write a meaningful
                    README.
                  </p>
                </div>
                {selectedRepo && (
                  <a
                    href={selectedRepo.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition"
                    style={{
                      borderColor: "var(--border-subtle)",
                      background: "var(--surface-input)",
                      color: "var(--text-primary)",
                    }}
                  >
                    Open on GitHub <FaGithub />
                  </a>
                )}
              </div>

              <div className="grid gap-4">
                <label className="block">
                  <span
                    className="mb-2 block text-sm font-medium"
                    style={{ color: "var(--text-label)" }}
                  >
                    Project purpose *
                  </span>
                  <textarea
                    value={projectPurpose}
                    onChange={(event) => setProjectPurpose(event.target.value)}
                    rows={3}
                    placeholder="Example: GitHub-first developer growth platform"
                    className="w-full rounded-xl border px-4 py-3 text-sm outline-none placeholder-theme"
                    style={{
                      borderColor: "var(--border-subtle)",
                      background: "var(--surface-input)",
                      color: "var(--text-primary)",
                    }}
                  />
                </label>

                <label className="block">
                  <span
                    className="mb-2 block text-sm font-medium"
                    style={{ color: "var(--text-label)" }}
                  >
                    Key features
                  </span>
                  <input
                    value={keyFeatures}
                    onChange={(event) => setKeyFeatures(event.target.value)}
                    placeholder="Streak recovery, notifications, collaboration spaces"
                    className="w-full rounded-xl border px-4 py-3 text-sm outline-none placeholder-theme"
                    style={{
                      borderColor: "var(--border-subtle)",
                      background: "var(--surface-input)",
                      color: "var(--text-primary)",
                    }}
                  />
                  <span
                    className="mt-2 block text-xs"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Separate features with commas.
                  </span>
                </label>

                <label className="block">
                  <span
                    className="mb-2 block text-sm font-medium"
                    style={{ color: "var(--text-label)" }}
                  >
                    Target users
                  </span>
                  <input
                    value={targetUsers}
                    onChange={(event) => setTargetUsers(event.target.value)}
                    placeholder="Developers, students, teams"
                    className="w-full rounded-xl border px-4 py-3 text-sm outline-none placeholder-theme"
                    style={{
                      borderColor: "var(--border-subtle)",
                      background: "var(--surface-input)",
                      color: "var(--text-primary)",
                    }}
                  />
                </label>
              </div>

              <div className="mt-5">
                <button
                  onClick={handleGenerate}
                  disabled={generating || !selectedRepo}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    background: "var(--accent)",
                    color: "#ffffff",
                  }}
                >
                  {generating ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Sparkles size={16} />
                  )}
                  Generate README
                </button>
              </div>

              {errorMessage && (
                <div
                  className="mt-4 rounded-xl border p-3 text-sm"
                  style={{
                    borderColor: "var(--accent-border)",
                    background: "var(--accent-soft)",
                    color: "var(--accent-text)",
                  }}
                >
                  {errorMessage}
                </div>
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="space-y-6">
          {/* Generated README display */}
          <div
            className="rounded-2xl border p-5"
            style={{
              borderColor: "var(--border-subtle)",
              background: "var(--surface-card)",
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2
                  className="text-lg font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Generated README
                </h2>
                <p
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {activeRepo?.full_name} — Review the result below
                </p>
              </div>
              {validation && (
                <div className="flex items-center gap-2">
                  <span
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Score:
                  </span>
                  <span
                    className="text-lg font-black"
                    style={{
                      color:
                        validation.score >= 70
                          ? "#10b981"
                          : validation.score >= 40
                            ? "#eab308"
                            : "var(--accent)",
                    }}
                  >
                    {validation.score}/100
                  </span>
                </div>
              )}
            </div>
            <pre
              className="max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-xl border p-5 font-mono text-sm leading-6"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--surface)",
                color: "var(--text-primary)",
              }}
            >
              {generatedReadme || "No README generated."}
            </pre>
          </div>

          {/* Validation details */}
          {validation && (
            <div
              className="rounded-2xl border p-5"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--surface-card)",
              }}
            >
              <h3
                className="text-sm font-semibold"
                style={{ color: "var(--text-label)" }}
              >
                README Quality Check
              </h3>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div>
                  <p
                    className="text-xs font-medium uppercase tracking-wide"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Present sections
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {validation.presentSections.length > 0
                      ? validation.presentSections.map((s) => (
                          <span
                            key={s}
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
                            style={{
                              background: "rgba(16, 185, 129, 0.1)",
                              color: "#10b981",
                            }}
                          >
                            <CheckCircle2 size={10} />
                            {s}
                          </span>
                        ))
                      : (
                        <span
                          className="text-xs"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          None detected
                        </span>
                      )}
                  </div>
                </div>
                <div>
                  <p
                    className="text-xs font-medium uppercase tracking-wide"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Missing sections
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {validation.missingSections.length > 0
                      ? validation.missingSections.map((s) => (
                          <span
                            key={s}
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
                            style={{
                              background: "var(--accent-soft)",
                              color: "var(--accent-text-hover)",
                            }}
                          >
                            <AlertTriangle size={10} />
                            {s}
                          </span>
                        ))
                      : (
                        <span
                          className="text-xs"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          None — all sections present
                        </span>
                      )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {message && !published && (
            <div
              className="rounded-xl border p-3 text-sm"
              style={{
                borderColor: "rgba(16, 185, 129, 0.2)",
                background: "rgba(16, 185, 129, 0.1)",
                color: "#059669",
              }}
            >
              {message}
            </div>
          )}

          {errorMessage && (
            <div
              className="rounded-xl border p-3 text-sm"
              style={{
                borderColor: "var(--accent-border)",
                background: "var(--accent-soft)",
                color: "var(--accent-text)",
              }}
            >
              {errorMessage}
            </div>
          )}

          {/* Confirm / Redo - highlighted action area */}
          {!published && (
            <div
              className="rounded-2xl border-2 p-6"
              style={{
                borderColor: "var(--accent-border-strong)",
                background: "var(--accent-soft)",
              }}
            >
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="flex size-10 items-center justify-center rounded-full"
                  style={{ background: "var(--accent)" }}
                >
                  <Sparkles size={18} className="text-white" />
                </div>
                <div>
                  <h3
                    className="text-base font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Ready to publish?
                  </h3>
                  <p
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Confirm to push this README to{" "}
                    <span className="font-semibold">
                      {activeRepo?.full_name}
                    </span>{" "}
                    on GitHub, or redo to go back and refine.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    background: "var(--accent)",
                    color: "#ffffff",
                  }}
                >
                  {publishing ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Send size={16} />
                  )}
                  {publishing ? "Publishing..." : "Confirm & Publish"}
                </button>

                <button
                  onClick={handleRedo}
                  disabled={publishing}
                  className="inline-flex items-center gap-2 rounded-xl border px-6 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    borderColor: "var(--border-subtle)",
                    background: "var(--surface-input)",
                    color: "var(--text-primary)",
                  }}
                >
                  <RefreshCcw size={16} />
                  Redo
                </button>
              </div>
            </div>
          )}

          {/* Published success state */}
          {published && (
            <div
              className="rounded-2xl border p-6"
              style={{
                borderColor: "rgba(16, 185, 129, 0.3)",
                background: "rgba(16, 185, 129, 0.1)",
              }}
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 size={24} style={{ color: "#10b981" }} />
                <div>
                  <h3
                    className="text-lg font-bold"
                    style={{ color: "#059669" }}
                  >
                    Published successfully!
                  </h3>
                  <p className="text-sm" style={{ color: "#059669" }}>
                    README has been committed to {activeRepo?.full_name}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                {activeRepo && (
                  <a
                    href={activeRepo.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition"
                    style={{
                      borderColor: "var(--border-subtle)",
                      background: "var(--surface-input)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <ExternalLink size={14} />
                    View on GitHub
                  </a>
                )}
                <button
                  onClick={handleRedo}
                  className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition"
                  style={{
                    borderColor: "var(--border-subtle)",
                    background: "var(--surface-input)",
                    color: "var(--text-primary)",
                  }}
                >
                  <RefreshCcw size={14} />
                  Generate another
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
