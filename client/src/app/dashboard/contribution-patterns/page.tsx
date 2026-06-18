"use client";

import { useState, useMemo } from "react";
import { axiosInstance } from "@/API/axiosInstance";
import {
  FaEye,
  FaRocket,
  FaCheckCircle,
  FaSpinner,
  FaExclamationTriangle,
  FaGithub,
  FaPaintBrush,
} from "react-icons/fa";

// 5x7 pixel font data (same as server)
const FONT_5X7: Record<string, number[]> = {
  A: [0b01110, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  B: [0b11110, 0b10001, 0b10001, 0b11110, 0b10001, 0b10001, 0b11110],
  C: [0b01110, 0b10001, 0b10000, 0b10000, 0b10000, 0b10001, 0b01110],
  D: [0b11110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b11110],
  E: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b11111],
  F: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b10000],
  G: [0b01110, 0b10001, 0b10000, 0b10111, 0b10001, 0b10001, 0b01110],
  H: [0b10001, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  I: [0b01110, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  J: [0b00111, 0b00010, 0b00010, 0b00010, 0b00010, 0b10010, 0b01100],
  K: [0b10001, 0b10010, 0b10100, 0b11000, 0b10100, 0b10010, 0b10001],
  L: [0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b11111],
  M: [0b10001, 0b11011, 0b10101, 0b10101, 0b10001, 0b10001, 0b10001],
  N: [0b10001, 0b10001, 0b11001, 0b10101, 0b10011, 0b10001, 0b10001],
  O: [0b01110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  P: [0b11110, 0b10001, 0b10001, 0b11110, 0b10000, 0b10000, 0b10000],
  Q: [0b01110, 0b10001, 0b10001, 0b10001, 0b10101, 0b10010, 0b01101],
  R: [0b11110, 0b10001, 0b10001, 0b11110, 0b10100, 0b10010, 0b10001],
  S: [0b01110, 0b10001, 0b10000, 0b01110, 0b00001, 0b10001, 0b01110],
  T: [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100],
  U: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  V: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01010, 0b00100],
  W: [0b10001, 0b10001, 0b10001, 0b10101, 0b10101, 0b11011, 0b10001],
  X: [0b10001, 0b10001, 0b01010, 0b00100, 0b01010, 0b10001, 0b10001],
  Y: [0b10001, 0b10001, 0b01010, 0b00100, 0b00100, 0b00100, 0b00100],
  Z: [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b10000, 0b11111],
  "0": [0b01110, 0b10001, 0b10011, 0b10101, 0b11001, 0b10001, 0b01110],
  "1": [0b00100, 0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  "2": [0b01110, 0b10001, 0b00001, 0b00010, 0b00100, 0b01000, 0b11111],
  "3": [0b01110, 0b10001, 0b00001, 0b00110, 0b00001, 0b10001, 0b01110],
  "4": [0b00010, 0b00110, 0b01010, 0b10010, 0b11111, 0b00010, 0b00010],
  "5": [0b11111, 0b10000, 0b11110, 0b00001, 0b00001, 0b10001, 0b01110],
  "6": [0b01110, 0b10000, 0b10000, 0b11110, 0b10001, 0b10001, 0b01110],
  "7": [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b01000, 0b01000],
  "8": [0b01110, 0b10001, 0b10001, 0b01110, 0b10001, 0b10001, 0b01110],
  "9": [0b01110, 0b10001, 0b10001, 0b01111, 0b00001, 0b00001, 0b01110],
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const PRESET_PATTERNS = [
  { name: "GITHUV", text: "GITHUV" },
  { name: "HELLO", text: "HELLO" },
  { name: "DEV", text: "DEV" },
  { name: "CODE", text: "CODE" },
  { name: "GIT", text: "GIT" },
  { name: "HACK", text: "HACK" },
  { name: "PRO", text: "PRO" },
  { name: "AI", text: "AI" },
  { name: "2024", text: "2024" },
  { name: "2025", text: "2025" },
  { name: "STAR", text: "STAR" },
  { name: "Hi", text: "HI" },
];

type GridCell = {
  row: number;
  col: number;
  active: boolean;
};

type PatternResult = {
  success: boolean;
  owner?: string;
  repository?: string;
  totalCommits?: number;
  uniqueDays?: number;
  message?: string;
};

function computeTextGrid(text: string): GridCell[] {
  const upper = text.toUpperCase();
  const cells: GridCell[] = [];
  const charSpacing = 6;

  for (let ci = 0; ci < upper.length; ci++) {
    const char = upper[ci] || " ";
    const fontData = FONT_5X7[char] || [0, 0, 0, 0, 0, 0, 0];
    const charOffset = ci * charSpacing;

    for (let row = 0; row < 7; row++) {
      const fontRow = fontData[row] || 0;
      for (let col = 0; col < 5; col++) {
        const bit = (fontRow >> (4 - col)) & 1;
        if (bit === 1) {
          cells.push({
            row,
            col: charOffset + col,
            active: true,
          });
        }
      }
    }
  }

  return cells;
}

export default function ContributionPatternsPage() {
  const [customText, setCustomText] = useState("GITHUV");
  const [activePattern, setActivePattern] = useState("GITHUV");
  const [startDate, setStartDate] = useState("");
  const [intensity, setIntensity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PatternResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState("");

  const displayText = customText.trim() || activePattern;
  const gridCells = useMemo(() => computeTextGrid(displayText), [displayText]);

  const totalCols = gridCells.length > 0
    ? Math.max(...gridCells.map((c) => c.col)) + 1
    : 0;

  const totalCommitsEstimate = gridCells.length * intensity;

  const today = new Date().toISOString().split("T")[0];

  const formatDateForApi = (dateStr: string): string => {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getFullYear()).slice(-2)}`;
  };

  const handleSelectPreset = (preset: (typeof PRESET_PATTERNS)[0]) => {
    setActivePattern(preset.text);
    setCustomText("");
  };

  const handlePublish = async () => {
    if (!startDate || !displayText) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setProgress("Preparing contribution pattern...");

    try {
      const endDate = new Date();
      setProgress(`Creating pattern "${displayText}" with ${totalCommitsEstimate} commits...`);

      const { data } = await axiosInstance.post(
        "/api/githuv/print-contribution",
        {
          startDate: formatDateForApi(startDate),
          endDate: formatDateForApi(endDate.toISOString().split("T")[0]),
          printName: displayText,
          randomContribution: false,
          darkerOrLightest: intensity,
        }
      );

      setResult(data as PatternResult);
      setProgress("");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create pattern";
      setError(msg);
      setProgress("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh]">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center size-10 rounded-lg" style={{ background: "var(--accent-soft)" }}>
            <FaPaintBrush className="text-lg" style={{ color: "var(--accent)" }} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">Contribution Patterns</h1>
        </div>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Design text patterns and render them on your GitHub contribution graph.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-6">
        {/* Left Column - Preview */}
        <div>
          {/* Preset Patterns */}
          <div className="rounded-xl border p-4 mb-4" style={{ borderColor: "var(--border-subtle)", background: "var(--dashboard-card-bg)" }}>
            <h2 className="text-sm font-semibold mb-3">Choose a Pattern</h2>
            <div className="flex flex-wrap gap-2">
              {PRESET_PATTERNS.map((preset) => (
                <button
                  key={preset.text}
                  onClick={() => handleSelectPreset(preset)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all border"
                  style={{
                    background:
                      activePattern === preset.text && !customText
                        ? "var(--accent-soft)"
                        : "var(--surface-input)",
                    borderColor:
                      activePattern === preset.text && !customText
                        ? "var(--accent-border)"
                        : "var(--border-subtle)",
                    color:
                      activePattern === preset.text && !customText
                        ? "var(--accent)"
                        : "var(--text-secondary)",
                  }}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Input */}
          <div className="rounded-xl border p-4 mb-4" style={{ borderColor: "var(--border-subtle)", background: "var(--dashboard-card-bg)" }}>
            <h2 className="text-sm font-semibold mb-3">Custom Text</h2>
            <input
              type="text"
              value={customText}
              onChange={(e) => {
                setCustomText(e.target.value.toUpperCase());
                if (e.target.value) setActivePattern("");
              }}
              placeholder="Type any text (A-Z, 0-9)..."
              maxLength={12}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
              style={{
                background: "var(--surface-input)",
                borderColor: "var(--border-subtle)",
                color: "var(--foreground)",
              }}
            />
            <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
              Max 12 characters. Only A-Z and 0-9 supported.
            </p>
          </div>

          {/* Preview Grid */}
          <div className="rounded-xl border p-4 mb-4" style={{ borderColor: "var(--border-subtle)", background: "var(--dashboard-card-bg)" }}>
            <div className="flex items-center gap-2 mb-4">
              <FaEye size={14} style={{ color: "var(--accent)" }} />
              <h2 className="text-sm font-semibold">Preview</h2>
              {displayText && (
                <span className="text-xs ml-auto" style={{ color: "var(--text-tertiary)" }}>
                  "{displayText}" &middot; ~{totalCommitsEstimate} commits
                </span>
              )}
            </div>

            {displayText ? (
              <div className="overflow-x-auto pb-2">
                <div className="inline-flex gap-[3px]" style={{ minWidth: totalCols * 14 }}>
                  {/* Day labels */}
                  <div className="flex flex-col gap-[3px] mr-1">
                    {DAY_NAMES.map((day) => (
                      <div
                        key={day}
                        className="text-[10px] leading-none flex items-center justify-end pr-1 h-3"
                        style={{ color: "var(--text-tertiary)", width: 28 }}
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                  {/* Grid */}
                  <div className="flex gap-[3px]">
                    {Array.from({ length: totalCols }).map((_, col) => (
                      <div key={col} className="flex flex-col gap-[3px]">
                        {Array.from({ length: 7 }).map((_, row) => {
                          const isActive = gridCells.some(
                            (c) => c.row === row && c.col === col
                          );
                          return (
                            <div
                              key={`${row}-${col}`}
                              className="size-3 rounded-[3px] transition-colors"
                              style={{
                                background: isActive
                                  ? "var(--accent)"
                                  : "var(--surface-input)",
                                opacity: isActive ? 1 : 0.5,
                              }}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-sm" style={{ color: "var(--text-tertiary)" }}>
                Select a preset or type custom text
              </div>
            )}
          </div>

          {/* Stats */}
          {displayText && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-xl border p-3" style={{ borderColor: "var(--border-subtle)", background: "var(--dashboard-card-bg)" }}>
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Characters</p>
                <p className="text-xl font-bold">{displayText.length}</p>
              </div>
              <div className="rounded-xl border p-3" style={{ borderColor: "var(--border-subtle)", background: "var(--dashboard-card-bg)" }}>
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Grid Cells</p>
                <p className="text-xl font-bold">{gridCells.length}</p>
              </div>
              <div className="rounded-xl border p-3" style={{ borderColor: "var(--border-subtle)", background: "var(--dashboard-card-bg)" }}>
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Est. Commits</p>
                <p className="text-xl font-bold">{totalCommitsEstimate}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Settings & Publish */}
        <div>
          <div className="rounded-xl border p-4 mb-4" style={{ borderColor: "var(--border-subtle)", background: "var(--dashboard-card-bg)" }}>
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <FaRocket size={14} style={{ color: "var(--accent)" }} />
              Publish Settings
            </h2>

            <div className="mb-3">
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-label)" }}>
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={today}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
                style={{
                  background: "var(--surface-input)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--foreground)",
                }}
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-label)" }}>
                Intensity
              </label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map((level) => (
                  <button
                    key={level}
                    onClick={() => setIntensity(level)}
                    className="flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-all"
                    style={{
                      background: intensity === level ? "var(--accent-soft)" : "var(--surface-input)",
                      borderColor: intensity === level ? "var(--accent-border)" : "var(--border-subtle)",
                      color: intensity === level ? "var(--accent)" : "var(--text-secondary)",
                    }}
                  >
                    x{level}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handlePublish}
              disabled={loading || !startDate || !displayText}
              className="w-full rounded-lg px-4 py-3 text-sm font-bold text-white transition-all disabled:opacity-50"
              style={{ background: loading ? "var(--accent-soft)" : "var(--accent)" }}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <FaSpinner className="animate-spin" />
                  {progress || "Creating..."}
                </span>
              ) : (
                <span className="inline-flex items-center justify-center gap-2">
                  <FaGithub />
                  Publish Pattern
                </span>
              )}
            </button>

            {!startDate && displayText && (
              <p className="text-xs mt-2 text-center" style={{ color: "var(--text-tertiary)" }}>
                Select a start date to publish
              </p>
            )}
          </div>

          {/* Progress */}
          {progress && loading && (
            <div className="rounded-xl border p-3 mb-4" style={{ borderColor: "var(--accent-border)", background: "var(--accent-soft)" }}>
              <div className="flex items-center gap-2">
                <FaSpinner className="animate-spin text-sm" style={{ color: "var(--accent)" }} />
                <p className="text-xs" style={{ color: "var(--accent)" }}>{progress}</p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-xl border p-3 mb-4" style={{ borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.1)" }}>
              <div className="flex items-start gap-2">
                <FaExclamationTriangle className="text-red-400 mt-0.5 text-xs" />
                <p className="text-xs text-red-200/70">{error}</p>
              </div>
            </div>
          )}

          {/* Result */}
          {result && result.success && (
            <div className="rounded-xl border p-4" style={{ borderColor: "rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.08)" }}>
              <div className="flex items-center gap-2 mb-3">
                <FaCheckCircle className="text-green-400" />
                <h3 className="text-sm font-semibold text-green-300">Published!</h3>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="rounded-lg p-2" style={{ background: "var(--surface-input)" }}>
                  <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>Commits</p>
                  <p className="text-lg font-bold text-green-300">{result.totalCommits}</p>
                </div>
                <div className="rounded-lg p-2" style={{ background: "var(--surface-input)" }}>
                  <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>Days</p>
                  <p className="text-lg font-bold text-green-300">{result.uniqueDays}</p>
                </div>
              </div>
              <a
                href={`https://github.com/${result.owner}/${result.repository}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs hover:underline inline-flex items-center gap-1"
                style={{ color: "var(--accent)" }}
              >
                View on GitHub <FaGithub size={10} />
              </a>
            </div>
          )}

          {/* Info */}
          <div className="rounded-xl border p-3" style={{ borderColor: "var(--border-subtle)", background: "var(--dashboard-card-bg)" }}>
            <h4 className="text-xs font-semibold mb-2">How it works</h4>
            <ul className="text-[11px] space-y-1" style={{ color: "var(--text-tertiary)" }}>
              <li>1. Pick a preset or type custom text</li>
              <li>2. Preview the contribution grid pattern</li>
              <li>3. Set start date &amp; commit intensity</li>
              <li>4. Publish to your contribution graph</li>
              <li className="pt-1">Pattern is rendered on:</li>
              <li className="font-mono text-[10px]">githuv-official-app-for-contribution</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
