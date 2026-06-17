"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  FileCode2,
  FileText,
  Loader2,
  Play,
  Save,
  X,
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-toastify";
import { DEFAULT_LATEX } from "../output/page";

const STORAGE_KEY = "githuv-resume-latex";

export default function ResumeBuilderScratchPage() {
  const [latexCode, setLatexCode] = useState("");

  const [copied, setCopied] = useState(false);
  const [compiling, setCompiling] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedInfo, setSavedInfo] = useState<{
    threadId: string;
    version: number;
    name: string;
    cloudinaryUrl: string;
  } | null>(null);

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfThreadId, setPdfThreadId] = useState<string | null>(null);

  const [nextVersion, setNextVersion] = useState(1);

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveNameInput, setSaveNameInput] = useState("");

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setLatexCode(stored);
    } else {
      setLatexCode(DEFAULT_LATEX);
    }
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    if (latexCode) {
      localStorage.setItem(STORAGE_KEY, latexCode);
    }
  }, [latexCode]);

  // Load saved resumes for next version
  useEffect(() => {
    fetch("/api/resume/list", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.resumes.length > 0) {
          const maxVer = Math.max(...data.resumes.map((r: any) => r.version));
          setNextVersion(maxVer + 1);
        }
      })
      .catch(console.error);
  }, []);

  const handleLatexChange = useCallback((val: string) => {
    setLatexCode(val);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(latexCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCompile = async () => {
    if (!latexCode) return;
    setCompiling(true);
    setPdfUrl(null);
    setPdfThreadId(null);
    try {
      const res = await fetch("/api/resume/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ latexCode }),
      });
      if (!res.ok) throw new Error("Compilation failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      toast.success("PDF compiled successfully");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCompiling(false);
    }
  };

  const handleDownloadPdf = () => {
    if (pdfUrl) {
      const a = document.createElement("a");
      a.href = pdfUrl;
      a.download = "resume.pdf";
      a.click();
      toast.success("PDF downloaded");
      return;
    }
    if (pdfThreadId) {
      const a = document.createElement("a");
      a.href = `/api/resume/pdf/${pdfThreadId}`;
      a.download = "resume.pdf";
      a.click();
      return;
    }
    handleCompile();
  };

  const openSaveDialog = () => {
    setSaveNameInput(`version_${nextVersion}`);
    setShowSaveDialog(true);
  };

  const handleSave = async () => {
    if (!latexCode) return;
    setShowSaveDialog(false);
    setSaving(true);
    const nameToSave = saveNameInput.trim() || `version_${nextVersion}`;
    try {
      const res = await fetch("/api/resume/generate-scratch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ latexCode, name: nameToSave }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setSavedInfo(data.data);
      setPdfThreadId(data.data.threadId);
      setPdfUrl(null);
      setNextVersion(data.data.version + 1);
      toast.success(`Saved as "${data.data.name}"`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const getPdfDisplayUrl = () => {
    if (pdfUrl) return pdfUrl;
    if (pdfThreadId) return `/api/resume/pdf/${pdfThreadId}`;
    return null;
  };

  const pdfDisplayUrl = getPdfDisplayUrl();

  return (
    <div
      className="flex flex-col"
      style={{ height: "calc(100vh - 64px)", overflow: "hidden" }}
    >
      {/* Top bar */}
      <div
        className="flex items-center gap-3 px-2 pb-3 shrink-0"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <Link
          href="/dashboard/resume-builder"
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-all"
          style={{
            color: "var(--text-secondary)",
            background: "var(--surface-input)",
          }}
        >
          <ArrowLeft size={15} /> Back
        </Link>

        <div className="flex items-center gap-2 flex-1">
          <FileText size={18} style={{ color: "var(--accent)" }} />
          <span className="font-bold text-base" style={{ color: "var(--foreground)" }}>
            Resume Builder
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{
              background: "var(--surface-input)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            Scratch Mode
          </span>
          {savedInfo && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                background: "rgba(34,197,94,0.12)",
                color: "#16a34a",
              }}
            >
              <Check size={10} className="inline mr-1" />
              {savedInfo.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
            style={{
              background: copied ? "var(--accent-soft)" : "var(--surface-input)",
              color: copied ? "var(--accent)" : "var(--text-secondary)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <Copy size={14} /> {copied ? "Copied!" : "Copy LaTeX"}
          </button>

          <button
            onClick={handleCompile}
            disabled={compiling || !latexCode}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
            style={{
              background: compiling ? "var(--surface-input)" : "#22c55e",
              color: compiling ? "var(--text-secondary)" : "#fff",
              opacity: compiling || !latexCode ? 0.7 : 1,
            }}
          >
            {compiling ? (
              <><Loader2 size={14} className="animate-spin" /> Compiling...</>
            ) : (
              <><Play size={14} /> Compile</>
            )}
          </button>

          <button
            onClick={openSaveDialog}
            disabled={saving || !latexCode}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold"
            style={{
              background: saving ? "var(--surface-input)" : "var(--accent-soft)",
              color: saving ? "var(--text-secondary)" : "var(--accent)",
              border: "1.5px solid var(--accent-border)",
              opacity: saving || !latexCode ? 0.7 : 1,
            }}
          >
            {saving ? (
              <><Loader2 size={14} className="animate-spin" /> Saving...</>
            ) : (
              <><Save size={14} /> Save</>
            )}
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={compiling}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold"
            style={{
              background:
                "linear-gradient(135deg, var(--accent-gradient-from), var(--accent-gradient-to))",
              color: "#fff",
              opacity: compiling ? 0.7 : 1,
            }}
          >
            <Download size={14} /> Download PDF
          </button>
        </div>
      </div>

      {/* Save Name Dialog */}
      {showSaveDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowSaveDialog(false)}
        >
          <div
            className="rounded-2xl p-6 w-full max-w-sm mx-4"
            style={{
              background: "var(--dashboard-card-bg)",
              border: "2px solid var(--accent-border)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                Save Resume
              </h3>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="p-1 rounded-lg"
                style={{ color: "var(--text-secondary)" }}
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>
              Enter a name for this version (or keep the default):
            </p>
            <input
              value={saveNameInput}
              onChange={(e) => setSaveNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="version_1"
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none mb-4"
              style={{
                background: "var(--surface-input)",
                border: "1.5px solid var(--border-subtle)",
                color: "var(--foreground)",
              }}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold"
                style={{
                  background: "var(--surface-input)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold"
                style={{
                  background: "linear-gradient(135deg, var(--accent-gradient-from), var(--accent-gradient-to))",
                  color: "#fff",
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main layout */}
      <div className="flex flex-1 gap-4 pt-3 overflow-hidden">
        {/* LEFT: Editable LaTeX - 60% width */}
        <div
          className="flex flex-col rounded-2xl overflow-hidden"
          style={{
            flex: "0 0 60%",
            border: "2px solid var(--accent-border-strong)",
            background: "var(--dashboard-card-bg)",
          }}
        >
          <div
            className="flex items-center gap-2 px-4 py-2.5 shrink-0"
            style={{
              borderBottom: "1px solid var(--border-subtle)",
              background: "var(--accent-soft)",
            }}
          >
            <FileCode2 size={15} style={{ color: "var(--accent)" }} />
            <span className="text-sm font-bold" style={{ color: "var(--accent)" }}>
              LaTeX Editor
            </span>
            <span className="text-xs ml-1 opacity-60" style={{ color: "var(--accent)" }}>
              - edit then click Compile to generate PDF
            </span>
            <div className="ml-auto flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400 opacity-70" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 opacity-70" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 opacity-70" />
            </div>
          </div>

          <div className="flex-1 min-h-0">
            <textarea
              value={latexCode}
              onChange={(e) => handleLatexChange(e.target.value)}
              spellCheck={false}
              className="w-full h-full resize-none outline-none p-4 text-xs leading-relaxed"
              style={{
                fontFamily:
                  "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace",
                background: "transparent",
                color: "var(--foreground)",
              }}
            />
          </div>
        </div>

        {/* DIVIDER */}
        <div
          className="w-px shrink-0 self-stretch"
          style={{ background: "var(--border-subtle)" }}
        />

        {/* RIGHT: Compiled PDF Preview */}
        <div
          className="flex flex-col rounded-2xl overflow-hidden"
          style={{
            flex: "1",
            border: "2px solid var(--border-subtle)",
            background: "var(--dashboard-card-bg)",
          }}
        >
          <div
            className="flex items-center gap-2 px-4 py-2.5 shrink-0"
            style={{
              borderBottom: "1px solid var(--border-subtle)",
              background: "rgba(34,197,94,0.08)",
            }}
          >
            <FileText size={15} style={{ color: "#16a34a" }} />
            <span className="text-sm font-bold" style={{ color: "#16a34a" }}>
              Compiled PDF
            </span>
            {savedInfo && (
              <span
                className="text-xs ml-2 px-2 py-0.5 rounded-full font-medium"
                style={{ background: "rgba(34,197,94,0.15)", color: "#16a34a" }}
              >
                {savedInfo.name}
              </span>
            )}
            {pdfDisplayUrl && (
              <span
                className="text-xs ml-auto px-2 py-0.5 rounded-full font-medium"
                style={{ background: "rgba(34,197,94,0.15)", color: "#16a34a" }}
              >
                Ready
              </span>
            )}
          </div>

          <div className="flex-1 overflow-auto p-0">
            {compiling ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 size={28} className="animate-spin" style={{ color: "#22c55e" }} />
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    Compiling LaTeX to PDF...
                  </p>
                </div>
              </div>
            ) : pdfDisplayUrl ? (
              <iframe
                src={pdfDisplayUrl}
                className="w-full h-full"
                style={{ border: "none" }}
                title="Compiled Resume PDF"
              />
            ) : (
              <div className="flex items-center justify-center h-full px-6">
                <div className="text-center">
                  <FileText
                    size={48}
                    className="mx-auto mb-4 opacity-30"
                    style={{ color: "var(--text-secondary)" }}
                  />
                  <p className="text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>
                    No PDF compiled yet
                  </p>
                  <p className="text-xs mb-6" style={{ color: "var(--text-secondary)" }}>
                    Edit your LaTeX on the left, then click <strong>Compile</strong> to generate the PDF.
                  </p>
                  <button
                    onClick={handleCompile}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: "#22c55e",
                      color: "#fff",
                    }}
                  >
                    <Play size={16} />
                    Compile Now
                  </button>
                </div>
              </div>
            )}
          </div>

          {pdfDisplayUrl && (
            <div
              className="flex px-4 pb-3 pt-3 shrink-0"
              style={{ borderTop: "1px solid var(--border-subtle)" }}
            >
              <button
                onClick={handleDownloadPdf}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all w-full"
                style={{
                  border: "1.5px solid var(--border-subtle)",
                  color: "#16a34a",
                  background: "rgba(34,197,94,0.08)",
                }}
              >
                <Download size={16} /> Download PDF
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
