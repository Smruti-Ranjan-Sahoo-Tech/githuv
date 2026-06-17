"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import {
  ArrowRight,
  FileText,
  Loader2,
  PenLine,
  Sparkles,
  Star,
  User,
  Zap,
} from "lucide-react";
import FeedbackModal from "@/components/ResumeBuilder/FeedbackModal";
import GenerationOptionsPopup from "@/components/ResumeBuilder/GenerationOptionsPopup";

export default function ResumeBuilderLandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);

  function handleGenerateFromProfile() {
    setShowOptions(true);
  }

  async function handleStartGeneration(themeNo: string, pageCount: number) {
    setShowOptions(false);
    setLoading(true);
    try {
      const res = await fetch("/api/resume/generate-ai-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ themeNo, pageCount }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      setCurrentThreadId(data.threadId);

      const generatedLatex = data.result?.latexCode;
      if (generatedLatex) {
        localStorage.setItem("githuv-resume-latex", generatedLatex);
      } else {
        const latexRes = await fetch(`/api/resume/latex/${data.threadId}`, {
          credentials: "include",
        });
        const latexData = await latexRes.json();
        if (latexData.success) {
          localStorage.setItem("githuv-resume-latex", latexData.latexCode);
        }
      }
      router.push(`/dashboard/resume-builder/output?threadId=${data.threadId}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFeedbackSelect(choice: string) {
    if (!currentThreadId) return;
    setFeedbackLoading(true);
    try {
      const res = await fetch(`/api/resume/feedback/${currentThreadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ feedback: { choice } }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      const latexRes = await fetch(`/api/resume/latex/${currentThreadId}`, {
        credentials: "include",
      });
      const latexData = await latexRes.json();
      if (latexData.success) {
        localStorage.setItem("githuv-resume-latex", latexData.latexCode);
      }
      setFeedbackData(null);
      router.push(`/dashboard/resume-builder/output?threadId=${currentThreadId}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setFeedbackLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-6">
      {/* ── Page Title ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-10">
        <div
          className="flex items-center justify-center w-11 h-11 rounded-2xl shrink-0"
          style={{
            background: "var(--accent-soft)",
            border: "1.5px solid var(--accent-border)",
          }}
        >
          <FileText size={22} style={{ color: "var(--accent)" }} />
        </div>
        <div>
          <h1
            className="text-3xl font-extrabold tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            Resume Builder
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            AI-powered · LaTeX quality · ATS-optimised
          </p>
        </div>
      </div>

      {/* ── Profile Studio notice banner ───────────────────────────────────── */}
      <div
        className="rounded-2xl p-6 mb-8 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, var(--accent-soft) 0%, rgba(250,204,21,0.08) 100%)",
          border: "2px solid var(--accent-border-strong)",
        }}
      >
        <div className="absolute right-6 top-4 opacity-20">
          <Star size={64} style={{ color: "var(--accent)" }} />
        </div>
        <div className="flex items-start gap-4">
          <div
            className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0"
            style={{
              background: "var(--accent)",
              boxShadow: "0 4px 16px var(--accent-soft)",
            }}
          >
            <Zap size={24} color="#fff" />
          </div>
          <div className="flex-1">
            <p
              className="text-xl font-extrabold leading-snug mb-2"
              style={{ color: "var(--accent)" }}
            >
              Want a High-Quality, ATS-Friendly Resume?
            </p>
            <p
              className="text-base font-semibold leading-relaxed"
              style={{ color: "var(--foreground)" }}
            >
              For the{" "}
              <span
                className="font-black underline underline-offset-2"
                style={{ color: "var(--accent)" }}
              >
                best results
              </span>
              , please fill in your details in{" "}
              <Link
                href="/dashboard/profile-studio"
                className="font-black underline underline-offset-2 transition-opacity hover:opacity-75"
                style={{ color: "var(--accent)" }}
              >
                Profile Studio
              </Link>{" "}
              first. Our AI uses your saved profile to craft a perfectly tailored,
              recruiter-ready resume that passes ATS filters.
            </p>
            <div className="flex items-center gap-2 mt-4">
              <Link
                href="/dashboard/profile-studio"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: "var(--accent)",
                  color: "#fff",
                  boxShadow: "0 2px 12px var(--accent-soft)",
                }}
              >
                <User size={15} />
                Go to Profile Studio
                <ArrowRight size={15} />
              </Link>
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                ← recommended first step
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Two options ────────────────────────────────────────────────────── */}
      <p
        className="text-sm font-semibold uppercase tracking-widest mb-4"
        style={{ color: "var(--text-secondary)" }}
      >
        Choose how to generate
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Option 1 — Profile Studio data */}
        <button
          onClick={handleGenerateFromProfile}
          disabled={loading}
          className="group flex flex-col gap-4 rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1 text-left w-full"
          style={{
            background: "var(--dashboard-card-bg)",
            border: "2px solid var(--accent-border)",
            boxShadow: "0 2px 16px var(--accent-soft)",
            opacity: loading ? 0.6 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          <div
            className="flex items-center justify-center w-14 h-14 rounded-2xl"
            style={{
              background:
                "linear-gradient(135deg, var(--accent-gradient-from), var(--accent-gradient-to))",
              boxShadow: "0 4px 16px var(--accent-soft)",
            }}
          >
            {loading ? (
              <Loader2 size={26} color="#fff" className="animate-spin" />
            ) : (
              <Sparkles size={26} color="#fff" />
            )}
          </div>

          <div>
            <p
              className="text-lg font-extrabold mb-1"
              style={{ color: "var(--foreground)" }}
            >
              {loading ? "AI is building your resume…" : "Generate from Profile Studio"}
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {loading
                ? "Reading your profile, analyzing skills, optimizing content, and generating LaTeX…"
                : "AI reads your saved Profile Studio data and instantly builds a professional, ATS-optimised LaTeX resume. You can then refine it by chatting with the AI."}
            </p>
          </div>

          <div
            className="flex items-center gap-2 text-sm font-bold mt-auto pt-2"
            style={{ color: loading ? "var(--text-secondary)" : "var(--accent)" }}
          >
            {loading ? "Processing…" : "Generate Now"}
            {!loading && (
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            )}
          </div>
        </button>

        {/* Option 2 — From scratch */}
        <Link
          href="/dashboard/resume-builder/scratch"
          className="group flex flex-col gap-4 rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1"
          style={{
            background: "var(--dashboard-card-bg)",
            border: "2px solid var(--border-subtle)",
          }}
        >
          <div
            className="flex items-center justify-center w-14 h-14 rounded-2xl"
            style={{
              background: "var(--surface-input)",
              border: "1.5px solid var(--border-subtle)",
            }}
          >
            <PenLine size={26} style={{ color: "var(--text-secondary)" }} />
          </div>

          <div>
            <p
              className="text-lg font-extrabold mb-1"
              style={{ color: "var(--foreground)" }}
            >
              Generate from Scratch
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Start with a blank professional LaTeX template and edit every line
              directly in the built-in code editor. Perfect if you prefer full
              manual control.
            </p>
          </div>

          <div
            className="flex items-center gap-2 text-sm font-bold mt-auto pt-2"
            style={{ color: "var(--text-secondary)" }}
          >
            Open Editor
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-1"
            />
          </div>
        </Link>
      </div>

      {/* ── Tips row ──────────────────────────────────────────────────────── */}
      <div
        className="mt-8 rounded-xl px-5 py-4 flex flex-wrap gap-4 text-xs font-medium"
        style={{
          background: "var(--surface-input)",
          border: "1px solid var(--border-subtle)",
          color: "var(--text-secondary)",
        }}
      >
        <span>✅ ATS-optimised LaTeX output</span>
        <span>✅ Editable code in-browser</span>
        <span>✅ Download as .tex file</span>
        <span>✅ AI chat refinement (Profile Studio mode)</span>
      </div>

      {/* ── Generation Options Popup ──────────────────────────────────────── */}
      {showOptions && !loading && (
        <GenerationOptionsPopup
          onGenerate={handleStartGeneration}
          onClose={() => setShowOptions(false)}
          loading={loading}
        />
      )}

      {/* ── Loading Overlay (AI is generating) ────────────────────────────── */}
      {loading && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5"
          style={{ background: "rgba(0,0,0,0.6)" }}
        >
          <div
            className="flex items-center justify-center w-16 h-16 rounded-2xl"
            style={{
              background:
                "linear-gradient(135deg, var(--accent-gradient-from), var(--accent-gradient-to))",
              boxShadow: "0 8px 32px var(--accent-soft)",
            }}
          >
            <Loader2 size={32} color="#fff" className="animate-spin" />
          </div>
          <div className="text-center max-w-sm">
            <p
              className="text-lg font-extrabold mb-2"
              style={{ color: "#fff" }}
            >
              Generating your resume with AI
            </p>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              Our AI is reading your profile, optimizing content, and generating
              a professional LaTeX resume. This may take a minute — please wait.
            </p>
          </div>
        </div>
      )}

      {/* ── Feedback Modal ───────────────────────────────────────────────── */}
      {feedbackData && (
        <FeedbackModal
          pageFitResult={feedbackData}
          onSelect={handleFeedbackSelect}
          onClose={() => setFeedbackData(null)}
          loading={feedbackLoading}
        />
      )}
    </div>
  );
}
