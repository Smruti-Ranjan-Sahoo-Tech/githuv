"use client";

import { useState } from "react";
import { axiosInstance } from "@/API/axiosInstance";
import {
  FaCalendarAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaSpinner,
  FaGithub,
  FaRocket,
  FaFire,
} from "react-icons/fa";

type RecoveryResult = {
  success: boolean;
  owner?: string;
  repository?: string;
  totalCommits?: number;
  uniqueDays?: number;
  message?: string;
};

export default function StrikeRecoveryPage() {
  const [startDate, setStartDate] = useState("");
  const [density, setDensity] = useState(0.3);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecoveryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>("");

  const formatDateForApi = (dateStr: string): string => {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = String(d.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
  };

  const formatDateForDisplay = (dateStr: string): string => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const today = new Date().toISOString().split("T")[0];

  const handleRecover = async () => {
    if (!startDate) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setProgress("Preparing contribution pattern...");

    try {
      const endDate = new Date();
      const start = new Date(startDate);

      setProgress(`Generating random commits from ${formatDateForDisplay(startDate)} to today...`);

      const { data } = await axiosInstance.post(
        "/api/githuv/print-contribution",
        {
          startDate: formatDateForApi(startDate),
          endDate: formatDateForApi(endDate.toISOString().split("T")[0]),
          randomContribution: true,
          darkerOrLightest: 1,
          density,
        }
      );

      setResult(data as RecoveryResult);
      setProgress("");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create contribution pattern";
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
            <FaFire className="text-lg" style={{ color: "var(--accent)" }} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">Strike Recovery</h1>
        </div>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Recover your GitHub contribution streak by auto-generating random commits to
          the <code className="px-1.5 py-0.5 rounded text-xs" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>githuv-official-app-for-contribution</code> repository.
        </p>
      </div>

      {/* Configuration Card */}
      <div className="rounded-xl border p-5 mb-6" style={{ borderColor: "var(--border-subtle)", background: "var(--dashboard-card-bg)" }}>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FaRocket size={16} style={{ color: "var(--accent)" }} />
          Recovery Settings
        </h2>

        {/* Start Date */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-label)" }}>
            <FaCalendarAlt className="inline mr-1.5" size={12} />
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
          <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
            One commit per day from this date through today.
          </p>
        </div>

        {/* Density */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-label)" }}>
            Density: {Math.round(density * 100)}%
          </label>
          <input
            type="range"
            min="0.05"
            max="1"
            step="0.05"
            value={density}
            onChange={(e) => setDensity(parseFloat(e.target.value))}
            className="w-full accent-red-500"
          />
          <div className="flex justify-between text-xs" style={{ color: "var(--text-tertiary)" }}>
            <span>Sparse</span>
            <span>Dense</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleRecover}
          disabled={loading || !startDate}
          className="w-full rounded-lg px-4 py-3 text-sm font-bold text-white transition-all disabled:opacity-50"
          style={{ background: loading ? "var(--accent-soft)" : "var(--accent)" }}
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <FaSpinner className="animate-spin" />
              {progress || "Creating commits..."}
            </span>
          ) : (
            <span className="inline-flex items-center justify-center gap-2">
              <FaGithub />
              {startDate
                ? `Recover Streak from ${formatDateForDisplay(startDate)}`
                : "Select a start date"}
            </span>
          )}
        </button>
      </div>

      {/* Progress */}
      {progress && loading && (
        <div className="rounded-xl border p-4 mb-6" style={{ borderColor: "var(--accent-border)", background: "var(--accent-soft)" }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-8 rounded-full" style={{ background: "var(--accent-soft)" }}>
              <FaSpinner className="animate-spin text-sm" style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--accent)" }}>Working...</p>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{progress}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border p-4 mb-6" style={{ borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.1)" }}>
          <div className="flex items-start gap-3">
            <FaExclamationTriangle className="text-red-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-300">Error</p>
              <p className="text-xs text-red-200/70">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Result */}
      {result && result.success && (
        <div className="rounded-xl border p-5" style={{ borderColor: "rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.08)" }}>
          <div className="flex items-center gap-3 mb-4">
            <FaCheckCircle className="text-green-400 text-xl" />
            <h3 className="text-lg font-semibold text-green-300">Recovery Complete!</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-lg p-3" style={{ background: "var(--surface-input)" }}>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Total Commits</p>
              <p className="text-2xl font-bold text-green-300">{result.totalCommits}</p>
            </div>
            <div className="rounded-lg p-3" style={{ background: "var(--surface-input)" }}>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Unique Days</p>
              <p className="text-2xl font-bold text-green-300">{result.uniqueDays}</p>
            </div>
          </div>
          <div className="text-sm space-y-1" style={{ color: "var(--text-secondary)" }}>
            <p>
              Repository:{" "}
              <a
                href={`https://github.com/${result.owner}/${result.repository}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline inline-flex items-center gap-1"
                style={{ color: "var(--accent)" }}
              >
                {result.owner}/{result.repository} <FaGithub size={12} />
              </a>
            </p>
            <p>Your GitHub contribution graph will update within a few minutes.</p>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 rounded-xl border p-4" style={{ borderColor: "var(--border-subtle)", background: "var(--dashboard-card-bg)" }}>
        <h4 className="text-sm font-semibold mb-2">How it works</h4>
        <ul className="text-xs space-y-1" style={{ color: "var(--text-tertiary)" }}>
          <li>1. Select a start date when your streak was lost</li>
          <li>2. Choose commit intensity and density</li>
          <li>3. The app creates random commits for each day from start to today</li>
          <li>4. Commits are pushed to <code className="px-1 rounded" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>githuv-official-app-for-contribution</code></li>
          <li>5. Your GitHub contribution graph will show the recovered activity</li>
          <li>Note: Only commits on this repo will show in your contribution graph</li>
        </ul>
      </div>
    </div>
  );
}
