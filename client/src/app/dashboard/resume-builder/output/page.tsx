"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  Check,
  Copy,
  Download,
  FileCode2,
  FileText,
  Loader2,
  Play,
  RefreshCw,
  Save,
  Send,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-toastify";

const STORAGE_KEY = "githuv-resume-latex";

export const DEFAULT_LATEX = `\\documentclass[letterpaper,11pt]{article}
\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\begin{document}

%----------HEADING----------
\\begin{center}
  {\\Huge \\scshape John Doe} \\\\ \\vspace{1pt}
  \\small +1 555-000-0000 $|$
  \\href{mailto:john@example.com}{\\underline{john@example.com}} $|$
  \\href{https://linkedin.com/in/johndoe}{\\underline{linkedin.com/in/johndoe}} $|$
  \\href{https://github.com/johndoe}{\\underline{github.com/johndoe}}
\\end{center}

\\vspace{2pt}
\\textit{Experienced software engineer with a passion for building scalable systems.}
\\vspace{4pt}

%----------EDUCATION----------
\\section{Education}
\\resumeSubHeadingListStart
  \\resumeSubheading
    {Massachusetts Institute of Technology}{Cambridge, MA}
    {Bachelor of Science in Computer Science}{Sep 2018 -- May 2022}
\\resumeSubHeadingListEnd

%----------EXPERIENCE----------
\\section{Experience}
\\resumeSubHeadingListStart
  \\resumeSubheading
    {Google}{Mountain View, CA}
    {Software Engineer}{Jan 2022 -- Present}
    \\resumeItemListStart
      \\resumeItem{Developed microservices handling 10M+ requests/day}
      \\resumeItem{Reduced API latency by 40\\% through caching optimizations}
      \\resumeItem{Led cross-functional team of 6 engineers}
    \\resumeItemListEnd
\\resumeSubHeadingListEnd

%----------PROJECTS----------
\\section{Projects}
\\resumeSubHeadingListStart
  \\resumeProjectHeading
    {\\textbf{GithuV} $|$ \\emph{Next.js, Elysia, Firebase, TypeScript}}{}
    \\resumeItemListStart
      \\resumeItem{Full-stack GitHub analytics platform with AI-powered insights}
      \\resumeItem{Built real-time dashboard with 3D visualizations}
    \\resumeItemListEnd
\\resumeSubHeadingListEnd

%----------SKILLS----------
\\section{Technical Skills}
\\begin{itemize}[leftmargin=0.15in, label={}]
  \\small{\\item{
    \\textbf{Languages}{: Python, TypeScript, Go, Rust, Java} \\\\
    \\textbf{Frameworks}{: React, Next.js, FastAPI, Elysia} \\\\
    \\textbf{Tools}{: Git, Docker, AWS, Kubernetes, CI/CD} \\\\
    \\textbf{Databases}{: PostgreSQL, Redis, MongoDB} \\\\
  }}
\\end{itemize}

\\end{document}`;

interface ChatMessage {
  role: "ai" | "user";
  content: string;
}

export default function ResumeBuilderOutputPage() {
  const searchParams = useSearchParams();
  const threadId = searchParams.get("threadId");

  const [latexCode, setLatexCode] = useState("");
  const [loadingLatex, setLoadingLatex] = useState(!!threadId);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const [compiling, setCompiling] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfThreadId, setPdfThreadId] = useState<string | null>(null);

  const [cloudinaryLoading, setCloudinaryLoading] = useState(false);
  const [cloudinaryPdfUrl, setCloudinaryPdfUrl] = useState<string | null>(null);
  const [nextVersion, setNextVersion] = useState(1);
  const [savedName, setSavedName] = useState<string | null>(null);

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveNameInput, setSaveNameInput] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load LaTeX from API if threadId is present
  useEffect(() => {
    if (threadId) {
      setLoadingLatex(true);
      fetch(`/api/resume/latex/${threadId}`, { credentials: "include" })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            setLatexCode(data.latexCode);
            setSavedName(data.name || null);
            localStorage.setItem(STORAGE_KEY, data.latexCode);
          }
        })
        .catch(console.error)
        .finally(() => setLoadingLatex(false));
    }
  }, [threadId]);

  // Fallback: load from localStorage on mount
  useEffect(() => {
    if (!threadId && !latexCode) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setLatexCode(stored);
      } else {
        setLatexCode(DEFAULT_LATEX);
      }
    }
  }, [threadId, latexCode]);

  // Persist to localStorage on change
  useEffect(() => {
    if (latexCode) {
      localStorage.setItem(STORAGE_KEY, latexCode);
    }
  }, [latexCode]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Load next version number
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

  const handleCompile = async () => {
    setCompiling(true);
    setPdfUrl(null);
    try {
      const res = await fetch("/api/resume/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ latexCode }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || "Compilation failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setPdfThreadId(null);
      toast.success("PDF compiled successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to compile PDF");
    } finally {
      setCompiling(false);
    }
  };

  const handleDownloadPdf = async () => {
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
    await handleCompile();
  };

  const openSaveDialog = () => {
    setSaveNameInput(`version_${nextVersion}`);
    setShowSaveDialog(true);
  };

  const handleSaveWithName = async () => {
    if (!latexCode) return;
    setShowSaveDialog(false);
    setCloudinaryLoading(true);
    const nameToSave = saveNameInput.trim() || `version_${nextVersion}`;
    try {
      const res = await fetch("/api/resume/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ latexCode, threadId, name: nameToSave }),
      });
      const data = await res.json();
      if (data.success) {
        setCloudinaryPdfUrl(data.data.cloudinaryUrl);
        setPdfThreadId(data.data.threadId);
        setSavedName(data.data.name);
        setNextVersion(data.data.version + 1);
        toast.success(`Saved as "${data.data.name}"`);
      } else {
        toast.error(data.message || "Failed to save PDF");
      }
    } catch (err: any) {
      toast.error("Failed to connect to server");
    } finally {
      setCloudinaryLoading(false);
    }
  };

  const getPdfDisplayUrl = () => {
    if (pdfUrl) return pdfUrl;
    if (pdfThreadId) return `/api/resume/pdf/${pdfThreadId}`;
    return null;
  };

  const handleLatexChange = useCallback((val: string) => {
    setLatexCode(val);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(latexCode);
    setCopied(true);
    toast.success("LaTeX copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const [copied, setCopied] = useState(false);

  const handleSendChat = async () => {
    if (!chatInput.trim() || isSending) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsSending(true);

    try {
      const res = await fetch(`/api/resume/chat/${threadId ?? "undefined"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: userMsg, latexCode }),
      });
      const data = await res.json();

      if (data.success) {
        setLatexCode(data.latexCode);
        setChatMessages((prev) => [
          ...prev,
          { role: "ai", content: "LaTeX updated with your changes." },
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          { role: "ai", content: `Error: ${data.message}` },
        ]);
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: "ai", content: "Network error. Please try again." },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const pdfDisplayUrl = getPdfDisplayUrl();

  if (loadingLatex) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin" style={{ color: "var(--accent)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            Loading your resume...
          </p>
        </div>
      </div>
    );
  }

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
              background: "var(--accent-soft)",
              color: "var(--accent)",
            }}
          >
            {threadId ? "AI Generated" : "Manual Edit"}
          </span>
          {savedName && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                background: "rgba(34,197,94,0.12)",
                color: "#16a34a",
              }}
            >
              <Check size={10} className="inline mr-1" />
              {savedName}
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
            disabled={compiling}
            className="flex items-center gap-1.5 text-xs px-4 py-1.5 rounded-lg font-semibold transition-all"
            style={{
              background: compiling ? "var(--surface-input)" : "#22c55e",
              color: compiling ? "var(--text-secondary)" : "#fff",
              opacity: compiling ? 0.7 : 1,
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
            disabled={cloudinaryLoading}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
            style={{
              background: cloudinaryLoading ? "var(--surface-input)" : "var(--accent-soft)",
              color: cloudinaryLoading ? "var(--text-secondary)" : "var(--accent)",
              border: "1.5px solid var(--accent-border)",
              opacity: cloudinaryLoading ? 0.7 : 1,
            }}
          >
            {cloudinaryLoading ? (
              <><Loader2 size={14} className="animate-spin" /> Saving...</>
            ) : (
              <><Save size={14} /> Save to Cloud</>
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
              onKeyDown={(e) => e.key === "Enter" && handleSaveWithName()}
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
                onClick={handleSaveWithName}
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
        {/* LEFT PANEL: 60% - code editor + AI chat */}
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
              LaTeX Source
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

          <div className="relative" style={{ flex: "0 0 60%", minHeight: 0 }}>
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
                borderBottom: "1px solid var(--border-subtle)",
              }}
            />
          </div>

          {/* AI chat area */}
          <div className="flex flex-col" style={{ flex: "1 1 0", minHeight: 0 }}>
            <div
              className="flex items-center gap-2 px-4 py-2 shrink-0"
              style={{
                borderBottom: "1px solid var(--border-subtle)",
                background: "rgba(34,197,94,0.06)",
              }}
            >
              <Bot size={14} style={{ color: "#22c55e" }} />
              <span className="text-xs font-bold" style={{ color: "#22c55e" }}>
                AI Assistant
              </span>
              <span className="text-xs ml-auto opacity-60" style={{ color: "var(--text-secondary)" }}>
                Ask me to improve your resume
              </span>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {chatMessages.length === 0 && (
                <div className="text-xs text-center py-6" style={{ color: "var(--text-secondary)" }}>
                  {threadId
                    ? "Ask me to add sections, update skills, reformat, or change the template."
                    : "Edit the LaTeX directly or send a message to ask the AI for changes."}
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className="flex items-center justify-center w-7 h-7 rounded-full shrink-0 mt-0.5"
                    style={{
                      background:
                        msg.role === "ai"
                          ? "rgba(34,197,94,0.15)"
                          : "var(--accent-soft)",
                      border: `1px solid ${msg.role === "ai" ? "rgba(34,197,94,0.3)" : "var(--accent-border)"}`,
                    }}
                  >
                    {msg.role === "ai" ? (
                      <Bot size={13} style={{ color: "#22c55e" }} />
                    ) : (
                      <User size={13} style={{ color: "var(--accent)" }} />
                    )}
                  </div>
                  <div
                    className="text-xs leading-relaxed rounded-xl px-3 py-2.5 max-w-[80%]"
                    style={{
                      background:
                        msg.role === "ai"
                          ? "rgba(34,197,94,0.08)"
                          : "var(--accent-soft)",
                      border: `1px solid ${msg.role === "ai" ? "rgba(34,197,94,0.2)" : "var(--accent-border)"}`,
                      color: "var(--foreground)",
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isSending && (
                <div className="flex gap-2.5">
                  <div
                    className="flex items-center justify-center w-7 h-7 rounded-full shrink-0"
                    style={{
                      background: "rgba(34,197,94,0.15)",
                      border: "1px solid rgba(34,197,94,0.3)",
                    }}
                  >
                    <Bot size={13} style={{ color: "#22c55e" }} />
                  </div>
                  <div
                    className="text-xs rounded-xl px-3 py-2.5"
                    style={{
                      background: "rgba(34,197,94,0.08)",
                      border: "1px solid rgba(34,197,94,0.2)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <span className="animate-pulse">AI is updating your LaTeX...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div
              className="flex items-center gap-2 px-4 pb-4 pt-2 shrink-0"
              style={{ borderTop: "1px solid var(--border-subtle)" }}
            >
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !e.shiftKey && handleSendChat()
                }
                placeholder="Input changes to chat with AI..."
                className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                style={{
                  background: "var(--surface-input)",
                  border: "1.5px solid var(--border-subtle)",
                  color: "var(--foreground)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-subtle)";
                }}
              />
              <button
                onClick={handleSendChat}
                disabled={isSending || !chatInput.trim()}
                className="flex items-center justify-center w-9 h-9 rounded-xl transition-all shrink-0"
                style={{
                  background:
                    isSending || !chatInput.trim()
                      ? "var(--border-subtle)"
                      : "linear-gradient(135deg, var(--accent-gradient-from), var(--accent-gradient-to))",
                  color:
                    isSending || !chatInput.trim()
                      ? "var(--text-secondary)"
                      : "#fff",
                }}
              >
                {isSending ? (
                  <RefreshCw size={15} className="animate-spin" />
                ) : (
                  <Send size={15} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* DIVIDER */}
        <div
          className="w-px shrink-0 self-stretch"
          style={{ background: "var(--border-subtle)" }}
        />

        {/* RIGHT PANEL: Compiled PDF Preview */}
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
            {savedName && (
              <span
                className="text-xs ml-2 px-2 py-0.5 rounded-full font-medium"
                style={{ background: "rgba(34,197,94,0.15)", color: "#16a34a" }}
              >
                {savedName}
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
