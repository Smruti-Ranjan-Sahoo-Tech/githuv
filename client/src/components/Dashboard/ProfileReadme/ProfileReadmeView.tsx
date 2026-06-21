"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { axiosInstance } from "@/API/axiosInstance";
import { useFirebaseAuthStore } from "@/store/useFirebaseAuthStore";
import {
  CheckCircle2,
  Loader2,
  RefreshCcw,
  Sparkles,
  Eye,
  EyeOff,
  FileText,
  UserCircle,
  MessageSquare,
  RotateCcw,
  AlertTriangle,
  ExternalLink,
  Upload,
  Share2,
  Code,
  Monitor,
} from "lucide-react";

const THEMES = [
  { id: 1, name: "Minimal Professional", desc: "Clean, understated, confident", demoBg: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)", demoColor: "#2d3436" },
  { id: 2, name: "Modern Developer", desc: "Energetic, tech-forward, personal", demoBg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", demoColor: "#fff" },
  { id: 3, name: "Corporate Clean", desc: "Formal, polished, business-ready", demoBg: "linear-gradient(135deg, #2c3e50 0%, #3498db 100%)", demoColor: "#ecf0f1" },
  { id: 4, name: "Open Source Creator", desc: "Community-first, collaborative", demoBg: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)", demoColor: "#fff" },
  { id: 5, name: "Portfolio Style", desc: "Creative, visual, showcase", demoBg: "linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)", demoColor: "#fff" },
  { id: 6, name: "Compact Minimal", desc: "Ultra-concise, direct, no fluff", demoBg: "#1a1a2e", demoColor: "#e0e0e0" },
];

type GenerateResponse = {
  success: boolean;
  data?: Record<string, any>;
  existingProfileReadme?: string;
  generatedProfileReadme?: string;
  preview?: {
    oldReadme: string;
    newReadme: string;
    themeUsed: number;
  };
};

export default function ProfileReadmeView() {
  const { user, loading, initialLoginCheck } = useFirebaseAuthStore();

  const [selectedTheme, setSelectedTheme] = useState(1);
  const [feedbackEnabled, setFeedbackEnabled] = useState(false);
  const [userFeedback, setUserFeedback] = useState("");

  const [generating, setGenerating] = useState(false);
  const [mode, setMode] = useState<"idle" | "result">("idle");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [generatedReadme, setGeneratedReadme] = useState("");
  const [existingReadme, setExistingReadme] = useState("");
  const [showExisting, setShowExisting] = useState(true);
  const [existingView, setExistingView] = useState<"rendered" | "source">("rendered");
  const [generatedView, setGeneratedView] = useState<"rendered" | "source">("rendered");
  const [fetchingExisting, setFetchingExisting] = useState(false);

  const [copySuccess, setCopySuccess] = useState(false);

  const [publishing, setPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [publishResult, setPublishResult] = useState<{
    repoUrl: string;
    profileUrl: string;
    repoCreated: boolean;
  } | null>(null);

  useEffect(() => {
    const unsubscribe = initialLoginCheck();
    return unsubscribe;
  }, [initialLoginCheck]);

  useEffect(() => {
    if (!user) return;
    const fetchExisting = async () => {
      setFetchingExisting(true);
      try {
        const { data } = await axiosInstance.get("/api/githuv/profile-readme/existing");
        if (data.success && data.existingProfileReadme) {
          setExistingReadme(data.existingProfileReadme);
        }
      } catch {
      } finally {
        setFetchingExisting(false);
      }
    };
    fetchExisting();
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center rounded-2xl p-12">
        <div className="flex flex-col items-center gap-4">
          <div className="shimmer size-16 rounded-full" />
          <div className="shimmer h-4 w-48 rounded-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center rounded-2xl p-12">
        <p style={{ color: "var(--text-secondary)" }}>Please log in to generate a Profile README</p>
      </div>
    );
  }

  const handleGenerate = async () => {
    setGenerating(true);
    setErrorMessage("");
    setMessage("Fetching your profile and generating README...");

    try {
      const { data } = await axiosInstance.post(
        "/api/githuv/profile-readme/generate",
        {
          themeNo: selectedTheme,
          userFeedback: feedbackEnabled ? userFeedback : "",
        }
      );

      const response = data as GenerateResponse;

      setGeneratedReadme(response.generatedProfileReadme || "");
      setExistingReadme(response.existingProfileReadme || "");
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
          "Failed to generate profile README"
      );
      setMessage("");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedReadme) return;
    await navigator.clipboard.writeText(generatedReadme);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handlePublish = async () => {
    if (!generatedReadme) return;
    setPublishing(true);
    setErrorMessage("");
    setMessage("Publishing to GitHub...");

    try {
      const { data } = await axiosInstance.post(
        "/api/githuv/profile-readme/publish",
        { generatedReadme }
      );

      const res = data as {
        success: boolean;
        repoUrl: string;
        profileUrl: string;
        repoCreated: boolean;
        message: string;
      };

      setPublishSuccess(true);
      setPublishResult({
        repoUrl: res.repoUrl,
        profileUrl: res.profileUrl,
        repoCreated: res.repoCreated,
      });
      setMessage(res.message);
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setErrorMessage(
        error.response?.data?.message ||
          error.message ||
          "Failed to publish profile README"
      );
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">
            <span className="text-gradient">Profile README</span>
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            Generate a professional GitHub profile README with AI
          </p>
        </div>
      </div>

      <div className="grid xl:grid-cols-5 gap-6">
        {/* Left Panel - Current Profile */}
        <div
          className="xl:col-span-2 rounded-2xl border overflow-hidden flex flex-col"
          style={{
            background: "var(--surface-card)",
            borderColor: "var(--border-subtle)",
            maxHeight: "calc(100vh - 12rem)",
          }}
        >
          <div
            className="flex items-center gap-2 px-5 py-3.5 border-b"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <UserCircle size={16} style={{ color: "var(--accent)" }} />
            <span className="text-sm font-semibold">Current Profile</span>
            {existingReadme && (
              <div className="ml-auto flex items-center gap-1">
                <button
                  onClick={() => setExistingView(existingView === "rendered" ? "source" : "rendered")}
                  className="flex items-center gap-1 text-xs rounded-lg px-2 py-1 transition-colors"
                  style={{
                    background: "var(--surface-elevated)",
                    color: existingView === "source" ? "var(--accent)" : "var(--text-secondary)",
                  }}
                  title={existingView === "rendered" ? "View source" : "View rendered"}
                >
                  {existingView === "rendered" ? <Code size={12} /> : <Monitor size={12} />}
                  {existingView === "rendered" ? "Source" : "Render"}
                </button>
                <button
                  onClick={() => setShowExisting(!showExisting)}
                  className="flex items-center gap-1 text-xs rounded-lg px-2 py-1 transition-colors"
                  style={{
                    background: "var(--surface-elevated)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {showExisting ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {fetchingExisting ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="shimmer size-14 rounded-xl mb-4" />
                <div className="shimmer h-4 w-36 rounded-full mb-2" />
                <div className="shimmer h-3 w-48 rounded-full" />
              </div>
            ) : existingReadme ? (
              showExisting ? (
                existingView === "rendered" ? (
                  <div className="markdown-body">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {existingReadme}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div
                    className="whitespace-pre-wrap font-mono text-xs leading-relaxed"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {existingReadme}
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div
                    className="size-14 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: "var(--accent-soft)" }}
                  >
                    <CheckCircle2 size={24} style={{ color: "var(--accent)" }} />
                  </div>
                  <p className="font-semibold text-sm mb-1">
                    Profile README Found
                  </p>
                  <p className="text-xs mb-4" style={{ color: "var(--text-tertiary)" }}>
                    You already have a profile README. Generating a new one will replace it.
                  </p>
                  <button
                    onClick={() => setShowExisting(true)}
                    className="inline-flex items-center gap-1.5 text-xs rounded-xl px-3 py-1.5 transition-colors"
                    style={{
                      background: "var(--surface-elevated)",
                      color: "var(--accent)",
                    }}
                  >
                    <Eye size={12} /> Preview Current
                  </button>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div
                  className="size-14 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "var(--surface-elevated)" }}
                >
                  <FileText size={22} style={{ color: "var(--text-tertiary)" }} />
                </div>
                <p className="font-semibold text-sm mb-1">
                  No Profile README Yet
                </p>
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  Generate one using the panel on the right
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Generator */}
        <div
          className="xl:col-span-3 rounded-2xl border flex flex-col"
          style={{
            background: "var(--surface-card)",
            borderColor: "var(--border-subtle)",
            maxHeight: "calc(100vh - 12rem)",
          }}
        >
          <div
            className="flex items-center gap-2 px-5 py-3.5 border-b"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <Sparkles size={16} style={{ color: "var(--accent)" }} />
            <span className="text-sm font-semibold">AI Generator</span>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {mode === "result" && generatedReadme ? (
              <div className="space-y-4">
                {/* Generated Preview */}
                <div
                  className="rounded-xl border p-4"
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 size={14} style={{ color: "var(--accent)" }} />
                    <span className="text-xs font-medium" style={{ color: "var(--accent)" }}>
                      Generated — {THEMES.find((t) => t.id === selectedTheme)?.name}
                    </span>
                    <button
                      onClick={() => setGeneratedView(generatedView === "rendered" ? "source" : "rendered")}
                      className="ml-auto flex items-center gap-1 text-xs rounded-lg px-2 py-1 transition-colors"
                      style={{
                        background: "var(--surface-elevated)",
                        color: generatedView === "source" ? "var(--accent)" : "var(--text-secondary)",
                      }}
                    >
                      {generatedView === "rendered" ? <Code size={12} /> : <Monitor size={12} />}
                      {generatedView === "rendered" ? "Source" : "Render"}
                    </button>
                  </div>
                  {generatedView === "rendered" ? (
                    <div className="markdown-body">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {generatedReadme}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div
                      className="whitespace-pre-wrap font-mono text-xs leading-relaxed"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {generatedReadme}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  {!publishSuccess ? (
                    <>
                      <button
                        onClick={handlePublish}
                        disabled={publishing}
                        className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all"
                        style={{
                          background: publishing ? "var(--surface-elevated)" : "var(--accent)",
                          color: publishing ? "var(--text-secondary)" : "#fff",
                          opacity: publishing ? 0.7 : 1,
                        }}
                      >
                        {publishing ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Publishing...
                          </>
                        ) : (
                          <>
                            <Upload size={16} />
                            Publish to GitHub
                          </>
                        )}
                      </button>

                      <button
                        onClick={handleCopy}
                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
                        style={{
                          background: copySuccess ? "rgba(34,197,94,0.15)" : "var(--surface-elevated)",
                          color: copySuccess ? "#22c55e" : "var(--text-primary)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        {copySuccess ? (
                          <>
                            <CheckCircle2 size={16} /> Copied!
                          </>
                        ) : (
                          <>
                            <FileText size={16} /> Copy
                          </>
                        )}
                      </button>

                      <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
                        style={{
                          background: "var(--surface-elevated)",
                          color: "var(--text-primary)",
                          border: "1px solid var(--border-subtle)",
                          opacity: generating ? 0.6 : 1,
                        }}
                      >
                        <RefreshCcw size={16} />
                        Regenerate
                      </button>
                    </>
                  ) : (
                    <div className="w-full space-y-3">
                      <div
                        className="rounded-xl border p-4"
                        style={{
                          borderColor: "rgba(34,197,94,0.3)",
                          background: "rgba(34,197,94,0.08)",
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <CheckCircle2 size={20} className="shrink-0 mt-0.5" style={{ color: "#22c55e" }} />
                          <div className="flex-1">
                            <p className="text-sm font-semibold" style={{ color: "#22c55e" }}>
                              Published Successfully
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                              {publishResult?.repoCreated
                                ? "Profile repository was created and README published."
                                : "README was published to your profile repository."}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-4">
                          <a
                            href={publishResult?.profileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
                            style={{
                              background: "var(--accent)",
                              color: "#fff",
                            }}
                          >
                            <ExternalLink size={12} />
                            View Profile
                          </a>
                          <a
                            href={publishResult?.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
                            style={{
                              background: "var(--surface-elevated)",
                              color: "var(--text-primary)",
                              border: "1px solid var(--border-subtle)",
                            }}
                          >
                            <ExternalLink size={12} />
                            Open Repository
                          </a>
                          <button
                            onClick={async () => {
                              if (!publishResult?.profileUrl) return;
                              await navigator.clipboard.writeText(publishResult.profileUrl);
                              setCopySuccess(true);
                              setTimeout(() => setCopySuccess(false), 2000);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
                            style={{
                              background: "var(--surface-elevated)",
                              color: copySuccess ? "#22c55e" : "var(--text-primary)",
                              border: "1px solid var(--border-subtle)",
                            }}
                          >
                            <Share2 size={12} />
                            {copySuccess ? "Copied!" : "Copy Link"}
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setPublishSuccess(false);
                          setPublishResult(null);
                          setMode("idle");
                        }}
                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all"
                        style={{
                          background: "var(--surface-elevated)",
                          color: "var(--text-primary)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        <RefreshCcw size={14} />
                        Generate New
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Theme Selection */}
                <div>
                  <label className="text-sm font-medium mb-3 block" style={{ color: "var(--text-label)" }}>
                    Choose a Theme
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {THEMES.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => setSelectedTheme(theme.id)}
                        className="text-left rounded-xl border transition-all duration-200 overflow-hidden"
                        style={{
                          borderColor:
                            selectedTheme === theme.id
                              ? "var(--accent-border-strong)"
                              : "var(--border-subtle)",
                          background:
                            selectedTheme === theme.id
                              ? "var(--accent-soft)"
                              : "transparent",
                          outline:
                            selectedTheme === theme.id
                              ? "1px solid var(--accent)"
                              : "none",
                        }}
                      >
                        <div
                          className="h-12 flex items-end p-2"
                          style={{
                            background: theme.demoBg,
                          }}
                        >
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                            style={{
                              background: "rgba(0,0,0,0.3)",
                              color: "#fff",
                              backdropFilter: "blur(2px)",
                            }}
                          >
                            Preview
                          </span>
                        </div>
                        <div className="p-3.5">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold">{theme.name}</span>
                            {selectedTheme === theme.id && (
                              <CheckCircle2 size={14} style={{ color: "var(--accent)" }} />
                            )}
                          </div>
                          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                            {theme.desc}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Feedback Toggle */}
                <div
                  className="rounded-xl border p-4"
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  <button
                    onClick={() => setFeedbackEnabled(!feedbackEnabled)}
                    className="flex items-center gap-2 w-full text-left"
                  >
                    <MessageSquare size={16} style={{ color: "var(--text-secondary)" }} />
                    <span className="text-sm font-medium flex-1" style={{ color: "var(--text-label)" }}>
                      Add style preferences
                    </span>
                    <div
                      className="relative inline-flex h-5 w-9 rounded-full transition-colors"
                      style={{
                        background: feedbackEnabled ? "var(--accent)" : "var(--surface-elevated)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <span
                        className="inline-block size-4 rounded-full bg-white shadow-sm transition-transform"
                        style={{
                          transform: feedbackEnabled ? "translateX(18px)" : "translateX(2px)",
                          marginTop: "1px",
                        }}
                      />
                    </div>
                  </button>

                  {feedbackEnabled && (
                    <textarea
                      value={userFeedback}
                      onChange={(e) => setUserFeedback(e.target.value)}
                      placeholder="Describe your preferred tone, style, or anything specific you want in your profile README..."
                      rows={3}
                      className="mt-3 w-full rounded-xl border p-3 text-sm resize-none transition-colors"
                      style={{
                        background: "var(--surface-input)",
                        borderColor: "var(--border-subtle)",
                        color: "var(--text-primary)",
                      }}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Message / Error */}
            {(message || errorMessage) && (
              <div
                className="mt-4 rounded-xl border p-3 text-sm flex items-start gap-2"
                style={{
                  borderColor: errorMessage ? "var(--accent-border)" : "var(--border-subtle)",
                  background: errorMessage ? "var(--accent-soft)" : "var(--surface-elevated)",
                  color: errorMessage ? "var(--accent-text)" : "var(--text-secondary)",
                }}
              >
                {errorMessage ? (
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" style={{ color: "var(--accent)" }} />
                ) : (
                  <Loader2 size={14} className="shrink-0 mt-0.5 animate-spin" />
                )}
                <span>{errorMessage || message}</span>
              </div>
            )}
          </div>

          {/* Bottom Actions */}
          <div
            className="border-t px-5 py-3.5 flex items-center gap-3"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            {mode === "result" ? (
              <>
                <button
                  onClick={() => { setMode("idle"); setPublishSuccess(false); setPublishResult(null); }}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all"
                  style={{ background: "var(--accent)", color: "#fff" }}
                >
                  <RotateCcw size={16} />
                  Start Over
                </button>
                {publishResult && (
                  <a
                    href={publishResult.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ml-auto"
                    style={{
                      background: "var(--surface-elevated)",
                      color: "var(--text-secondary)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <ExternalLink size={14} />
                    View Profile
                  </a>
                )}
              </>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-medium transition-all"
                style={{
                  background: generating ? "var(--surface-elevated)" : "var(--accent)",
                  color: generating ? "var(--text-secondary)" : "#fff",
                  opacity: generating ? 0.7 : 1,
                }}
              >
                {generating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Generate Profile README
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
