"use client";

import { useEffect, useState } from "react";
import {
  Download,
  FileEdit,
  FileText,
  Loader2,
  Trash2,
} from "lucide-react";
import Link from "next/link";

interface Resume {
  _id: string;
  version: number;
  name: string;
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
  isLatest: boolean;
  threadId: string;
  createdAt: string;
}

export default function ResumeDashboardPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState(false);

  useEffect(() => {
    fetchResumes();
  }, []);

  useEffect(() => {
    if (!selectedThreadId) {
      setPdfBlobUrl(null);
      return;
    }
    setPdfError(false);
    setPdfBlobUrl(null);
    fetch(`/api/resume/pdf/${selectedThreadId}`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load PDF");
        const blob = await res.blob();
        if (blob.type !== "application/pdf") throw new Error("Not a PDF");
        const url = URL.createObjectURL(blob);
        setPdfBlobUrl(url);
      })
      .catch(() => {
        setPdfError(true);
      });
    return () => {
      setPdfBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [selectedThreadId]);

  const fetchResumes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/resume/list", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setResumes(data.resumes);
        const latest = data.resumes.find((r: Resume) => r.isLatest);
        if (latest) setSelectedThreadId(latest.threadId);
      } else {
        setError(data.message || "Failed to load resumes");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (r: Resume) => {
    try {
      const res = await fetch(`/api/resume/pdf/${r.threadId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to download");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${r.name || `resume-v${r.version}`}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(`/api/resume/pdf/${r.threadId}`, "_blank");
    }
  };

  const handleDelete = async (r: Resume) => {
    if (!confirm(`Delete "${r.name || `Version ${r.version}`}"?`)) return;
    try {
      const res = await fetch(`/api/resume/${r.threadId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setResumes((prev) => prev.filter((x) => x.threadId !== r.threadId));
        if (selectedThreadId === r.threadId) {
          setSelectedThreadId(null);
          setPdfBlobUrl(null);
        }
      }
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin" style={{ color: "var(--accent)" }} />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Loading resumes...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchResumes}
            className="px-4 py-2 rounded-lg text-sm font-semibold"
            style={{
              background: "var(--accent-soft)",
              color: "var(--accent)",
              border: "1px solid var(--accent-border)",
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            My Resumes
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            {resumes.length} resume{resumes.length !== 1 ? "s" : ""} saved
          </p>
        </div>
        <Link
          href="/dashboard/resume-builder"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{
            background:
              "linear-gradient(135deg, var(--accent-gradient-from), var(--accent-gradient-to))",
            color: "#fff",
          }}
        >
          <FileText size={16} />
          Create New Resume
        </Link>
      </div>

      {resumes.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-2xl"
          style={{
            border: "2px dashed var(--border-subtle)",
            background: "var(--dashboard-card-bg)",
          }}
        >
          <FileText size={48} className="mb-4 opacity-30" style={{ color: "var(--text-secondary)" }} />
          <p className="text-lg font-medium mb-2" style={{ color: "var(--foreground)" }}>
            No resumes yet
          </p>
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
            Generate your first resume using the Resume Builder
          </p>
          <Link
            href="/dashboard/resume-builder"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: "var(--accent-soft)",
              color: "var(--accent)",
              border: "1px solid var(--accent-border)",
            }}
          >
            Go to Resume Builder
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* PDF Preview Panel */}
          <div className="lg:col-span-1">
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                border: "2px solid var(--border-subtle)",
                background: "var(--dashboard-card-bg)",
              }}
            >
              <div
                className="flex items-center gap-2 px-4 py-3"
                style={{
                  borderBottom: "1px solid var(--border-subtle)",
                  background: "var(--accent-soft)",
                }}
              >
                <FileText size={16} style={{ color: "var(--accent)" }} />
                <span className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
                  PDF Preview
                </span>
              </div>
              <div className="h-[600px]">
                {pdfBlobUrl ? (
                  <iframe
                    src={pdfBlobUrl}
                    className="w-full h-full"
                    style={{ border: "none" }}
                    title="Resume PDF"
                  />
                ) : pdfError ? (
                  <div className="flex items-center justify-center h-full px-6">
                    <div className="text-center">
                      <FileText size={48} className="mx-auto mb-4 opacity-30" style={{ color: "var(--text-secondary)" }} />
                      <p className="text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>
                        Failed to load PDF
                      </p>
                      <p className="text-xs mb-4" style={{ color: "var(--text-secondary)" }}>
                        Could not load the PDF from storage. The file may have been deleted or is unavailable.
                      </p>
                      <button
                        onClick={() => {
                          if (selectedThreadId) {
                            setPdfError(false);
                            fetch(`/api/resume/pdf/${selectedThreadId}`, { credentials: "include" })
                              .then(async (res) => {
                                if (!res.ok) throw new Error();
                                const blob = await res.blob();
                                if (blob.type !== "application/pdf") throw new Error();
                                setPdfBlobUrl(URL.createObjectURL(blob));
                              })
                              .catch(() => setPdfError(true));
                          }
                        }}
                        className="px-4 py-2 rounded-lg text-sm font-semibold"
                        style={{
                          background: "var(--accent-soft)",
                          color: "var(--accent)",
                          border: "1px solid var(--accent-border)",
                        }}
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                ) : selectedThreadId ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent)" }} />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      Select a resume to preview
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Resume List */}
          <div className="lg:col-span-1 space-y-3">
            {resumes.map((resume) => {
              const isSelected = selectedThreadId === resume.threadId;
              return (
                <div
                  key={resume._id}
                  className="rounded-2xl p-4 transition-all cursor-pointer"
                  style={{
                    border: `2px solid ${
                      resume.isLatest
                        ? "var(--accent-border)"
                        : "var(--border-subtle)"
                    }`,
                    background: isSelected
                      ? "var(--accent-soft)"
                      : "var(--dashboard-card-bg)",
                  }}
                  onClick={() => setSelectedThreadId(resume.threadId)}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "var(--sidebar-hover)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "var(--dashboard-card-bg)";
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{
                          background: resume.isLatest
                            ? "var(--accent-soft)"
                            : "var(--surface-input)",
                          border: `1px solid ${
                            resume.isLatest
                              ? "var(--accent-border)"
                              : "var(--border-subtle)"
                          }`,
                        }}
                      >
                        <FileText
                          size={18}
                          style={{
                            color: resume.isLatest
                              ? "var(--accent)"
                              : "var(--text-secondary)",
                          }}
                        />
                      </div>
                      <div>
                        <p
                          className="text-sm font-semibold"
                          style={{ color: "var(--foreground)" }}
                        >
                          {resume.name || `Version ${resume.version}`}
                          {resume.isLatest && (
                            <span
                              className="ml-2 text-xs px-1.5 py-0.5 rounded-full font-medium"
                              style={{
                                background: "var(--accent-soft)",
                                color: "var(--accent)",
                              }}
                            >
                              Latest
                            </span>
                          )}
                        </p>
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {new Date(resume.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/resume-builder/output?threadId=${resume.threadId}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          background: "var(--accent-soft)",
                          color: "var(--accent)",
                          border: "1px solid var(--accent-border)",
                        }}
                      >
                        <FileEdit size={12} />
                        Edit
                      </Link>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(resume);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          background: "rgba(34,197,94,0.12)",
                          color: "#16a34a",
                          border: "1px solid rgba(34,197,94,0.3)",
                        }}
                      >
                        <Download size={12} />
                        Download
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(resume);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          background: "rgba(239,68,68,0.12)",
                          color: "#ef4444",
                          border: "1px solid rgba(239,68,68,0.3)",
                        }}
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        iframe {
          color-scheme: light;
        }
      `}</style>
    </div>
  );
}
