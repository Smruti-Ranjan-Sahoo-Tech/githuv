"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";

interface FeedbackOption {
  label: string;
  value: string;
  description: string;
}

interface FeedbackModalProps {
  pageFitResult: {
    fits: boolean;
    estimatedLines: number;
    removeProjects: number;
    removeCertifications: number;
    removeExperiences: number;
  };
  onSelect: (choice: string) => void;
  onClose: () => void;
  loading?: boolean;
}

const OPTIONS: FeedbackOption[] = [
  {
    label: "Keep Best Projects",
    value: "auto_optimize",
    description: "AI trims projects and sections to fit one page",
  },
  {
    label: "Keep All Content (2 Pages)",
    value: "keep_all",
    description: "Expand to two pages, keep everything",
  },
  {
    label: "Customize Sections",
    value: "customize",
    description: "I'll tell the AI what to keep or remove",
  },
];

export default function FeedbackModal({
  pageFitResult,
  onSelect,
  onClose,
  loading,
}: FeedbackModalProps) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl p-6 shadow-2xl"
        style={{
          background: "var(--dashboard-card-bg)",
          border: "2px solid var(--accent-border)",
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg transition-colors"
          style={{ color: "var(--text-secondary)" }}
        >
          <X size={18} />
        </button>

        <div className="mb-5">
          <h2
            className="text-lg font-extrabold mb-2"
            style={{ color: "var(--foreground)" }}
          >
            Resume Doesn&apos;t Fit on One Page
          </h2>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Estimated content: <strong>{pageFitResult.estimatedLines}</strong>{" "}
            lines. A single page can hold ~50-60 lines.
          </p>
          {pageFitResult.removeProjects > 0 && (
            <p className="text-xs mt-2" style={{ color: "#ca8a04" }}>
              Suggestion: remove {pageFitResult.removeProjects} project
              {pageFitResult.removeProjects > 1 ? "s" : ""}
              {pageFitResult.removeCertifications > 0
                ? ` and ${pageFitResult.removeCertifications} certification${pageFitResult.removeCertifications > 1 ? "s" : ""}`
                : ""}
            </p>
          )}
        </div>

        <div className="space-y-2.5 mb-5">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelected(opt.value)}
              className="w-full text-left rounded-xl p-3.5 transition-all"
              style={{
                background:
                  selected === opt.value
                    ? "var(--accent-soft)"
                    : "var(--surface-input)",
                border: `1.5px solid ${
                  selected === opt.value
                    ? "var(--accent-border-strong)"
                    : "var(--border-subtle)"
                }`,
              }}
            >
              <p
                className="text-sm font-bold"
                style={{ color: "var(--foreground)" }}
              >
                {opt.label}
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--text-secondary)" }}
              >
                {opt.description}
              </p>
            </button>
          ))}
        </div>

        <button
          onClick={() => selected && onSelect(selected)}
          disabled={!selected || loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all"
          style={{
            background: selected
              ? "linear-gradient(135deg, var(--accent-gradient-from), var(--accent-gradient-to))"
              : "var(--border-subtle)",
            color: selected ? "#fff" : "var(--text-secondary)",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Processing…
            </>
          ) : (
            "Continue"
          )}
        </button>
      </div>
    </div>
  );
}
