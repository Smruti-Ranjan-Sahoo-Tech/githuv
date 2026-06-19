"use client";

import { useState } from "react";
import { axiosInstance } from "@/API/axiosInstance";
import {
  FaCalendarAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaSpinner,
  FaGithub,
  FaFire,
  FaChartLine,
  FaCalendarDay,
} from "react-icons/fa";

type RecoveryResult = {
  success: boolean;
  owner?: string;
  repository?: string;
  totalCommits?: number;
  uniqueDays?: number;
  longestStreak?: number;
  dateRange?: {
    start: string;
    end: string;
  };
  message?: string;
};

export default function StrikeRecoveryPage() {
  const [startDate, setStartDate] = useState("");
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

      const daysDiff = Math.ceil(
        (endDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff > 365) {
        setError("Date range cannot exceed 365 days");
        setLoading(false);
        return;
      }

      setProgress(`Generating one commit for ${formatDateForDisplay(startDate)}...`);

      const { data } = await axiosInstance.post(
        "/api/githuv/print-contribution",
        {
          startDate: formatDateForApi(startDate),
          endDate: formatDateForApi(startDate),
          forceSingleDayRecovery: true,
        }
      );

      setResult(data as RecoveryResult);
      setProgress("");
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create contribution pattern";
      setError(msg);
      setProgress("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="flex items-center justify-center size-12 rounded-xl" style={{ background: "linear-gradient(135deg, #f97316, #ef4444)" }}>
            <FaFire className="text-white text-xl" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-2">Strike Recovery</h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Recover your GitHub contribution streak with one commit per day.
        </p>
      </div>

      <div className="rounded-xl border p-6 mb-6" style={{ borderColor: "var(--border-subtle)", background: "var(--dashboard-card-bg)" }}>
        <div className="mb-5">
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-label)" }}>
            <FaCalendarAlt className="inline mr-1.5" size={12} />
            From Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            max={today}
            className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none"
            style={{
              background: "var(--surface-input)",
              borderColor: "var(--border-subtle)",
              color: "var(--foreground)",
            }}
          />
          {startDate && (
            <p className="text-xs mt-1.5" style={{ color: "var(--text-tertiary)" }}>
              <FaCalendarDay className="inline mr-1" size={10} />
              {formatDateForDisplay(startDate)} (1 commit only)
            </p>
          )}
        </div>

        <button
          onClick={handleRecover}
          disabled={loading || !startDate}
          className="w-full rounded-lg px-4 py-3 text-sm font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: loading ? "var(--accent-soft)" : "linear-gradient(135deg, #f97316, #ef4444)" }}
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin" />
              {progress || "Creating commits..."}
            </>
          ) : (
            <>
              <FaFire />
              {startDate
                ? `Recover ${formatDateForDisplay(startDate)}`
                : "Select a date"}
            </>
          )}
        </button>
      </div>

      {progress && loading && (
        <div className="rounded-xl border p-4 mb-6" style={{ borderColor: "var(--accent-border)", background: "var(--accent-soft)" }}>
          <div className="flex items-center gap-3">
            <FaSpinner className="animate-spin text-sm" style={{ color: "var(--accent)" }} />
            <p className="text-sm" style={{ color: "var(--accent)" }}>{progress}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border p-4 mb-6" style={{ borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.1)" }}>
          <div className="flex items-start gap-3">
            <FaExclamationTriangle className="text-red-400 mt-0.5" />
            <p className="text-sm text-red-200/70">{error}</p>
          </div>
        </div>
      )}

      {result && result.success && (
        <div className="rounded-xl border p-6 mb-6" style={{ borderColor: "rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.08)" }}>
          <div className="flex items-center gap-3 mb-5">
            <FaCheckCircle className="text-green-400 text-xl" />
            <h3 className="text-lg font-semibold text-green-300">Recovery Complete!</h3>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="rounded-lg p-3 text-center" style={{ background: "var(--surface-input)" }}>
              <FaCalendarDay className="mx-auto mb-1 text-sm" style={{ color: "var(--accent)" }} />
              <p className="text-2xl font-bold text-green-300">{result.uniqueDays}</p>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Days</p>
            </div>
            <div className="rounded-lg p-3 text-center" style={{ background: "var(--surface-input)" }}>
              <FaFire className="mx-auto mb-1 text-sm" style={{ color: "#f97316" }} />
              <p className="text-2xl font-bold text-orange-300">{result.longestStreak || 0}</p>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Max Streak</p>
            </div>
            <div className="rounded-lg p-3 text-center" style={{ background: "var(--surface-input)" }}>
              <FaChartLine className="mx-auto mb-1 text-sm" style={{ color: "#22c55e" }} />
              <p className="text-2xl font-bold text-green-300">{result.totalCommits}</p>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Commits</p>
            </div>
          </div>

          {result.dateRange && (
            <div className="rounded-lg p-3 mb-4 flex items-center gap-2 text-sm" style={{ background: "var(--surface-input)" }}>
              <FaCalendarAlt size={12} style={{ color: "var(--text-tertiary)" }} />
              <span style={{ color: "var(--text-secondary)" }}>
                {result.dateRange.start} → {result.dateRange.end}
              </span>
            </div>
          )}

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
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              Your GitHub contribution graph will update within a few minutes for that single date.
            </p>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              The recovered date range has been saved to your profile.
            </p>
          </div>
        </div>
      )}

      <div className="rounded-xl border p-5" style={{ borderColor: "var(--border-subtle)", background: "var(--dashboard-card-bg)" }}>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <FaChartLine size={14} style={{ color: "var(--accent)" }} />
          How it works
        </h4>
        <ul className="text-xs space-y-2" style={{ color: "var(--text-tertiary)" }}>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 size-1.5 rounded-full" style={{ background: "var(--accent)" }} />
            Select a start date when your streak was lost
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 size-1.5 rounded-full" style={{ background: "var(--accent)" }} />
            One commit is created for each day from your selected date through today
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 size-1.5 rounded-full" style={{ background: "var(--accent)" }} />
            Commits go to <code className="px-1 rounded text-[10px]" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>githuv-official-app-for-contribution</code>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 size-1.5 rounded-full" style={{ background: "var(--accent)" }} />
            Your GitHub contribution graph will show the recovered activity
          </li>
        </ul>
      </div>
    </div>
  );
}
