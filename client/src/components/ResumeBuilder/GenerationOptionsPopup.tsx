"use client";

import { useState } from "react";
import { FileText, Layers, Loader2, Sparkles, X } from "lucide-react";

const THEMES = [
  { id: "Theme1", label: "Classic Professional", description: "Clean, ATS-optimized two-column layout" },
];

const PAGE_OPTIONS = [
  { value: 1, label: "1 Page", description: "Concise, single-page resume" },
  { value: 2, label: "2 Pages", description: "Detailed, two-page resume" },
];

interface GenerationOptionsPopupProps {
  onGenerate: (themeNo: string, pageCount: number) => void;
  onClose: () => void;
  loading?: boolean;
}

export default function GenerationOptionsPopup({
  onGenerate,
  onClose,
  loading,
}: GenerationOptionsPopupProps) {
  const [selectedTheme, setSelectedTheme] = useState("Theme1");
  const [selectedPageCount, setSelectedPageCount] = useState(1);

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

        <div className="mb-6">
          <h2
            className="text-lg font-extrabold mb-2"
            style={{ color: "var(--foreground)" }}
          >
            Generate Your Resume
          </h2>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Choose your theme and page preference before AI generation begins.
          </p>
        </div>

        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Layers size={15} style={{ color: "var(--accent)" }} />
            <span
              className="text-sm font-bold"
              style={{ color: "var(--foreground)" }}
            >
              Theme
            </span>
          </div>
          <div className="space-y-2">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => setSelectedTheme(theme.id)}
                className="w-full text-left rounded-xl p-3.5 transition-all"
                style={{
                  background:
                    selectedTheme === theme.id
                      ? "var(--accent-soft)"
                      : "var(--surface-input)",
                  border: `1.5px solid ${
                    selectedTheme === theme.id
                      ? "var(--accent-border-strong)"
                      : "var(--border-subtle)"
                  }`,
                }}
              >
                <p
                  className="text-sm font-bold"
                  style={{ color: "var(--foreground)" }}
                >
                  {theme.label}
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {theme.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={15} style={{ color: "var(--accent)" }} />
            <span
              className="text-sm font-bold"
              style={{ color: "var(--foreground)" }}
            >
              Pages
            </span>
          </div>
          <div className="flex gap-3">
            {PAGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedPageCount(opt.value)}
                className="flex-1 text-center rounded-xl p-3.5 transition-all"
                style={{
                  background:
                    selectedPageCount === opt.value
                      ? "var(--accent-soft)"
                      : "var(--surface-input)",
                  border: `1.5px solid ${
                    selectedPageCount === opt.value
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
        </div>

        <button
          onClick={() => onGenerate(selectedTheme, selectedPageCount)}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all"
          style={{
            background: loading
              ? "var(--border-subtle)"
              : "linear-gradient(135deg, var(--accent-gradient-from), var(--accent-gradient-to))",
            color: loading ? "var(--text-secondary)" : "#fff",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Generating...
            </>
          ) : (
            <>
              <Sparkles size={16} /> Generate Resume
            </>
          )}
        </button>
      </div>
    </div>
  );
}
