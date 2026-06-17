"use client";

import useThemeStore from "@/store/useThemeStore";

type ProgressRingProps = {
  progress: number;
  completedSteps: number;
  totalSteps: number;
  currentStep: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export default function ProgressRing({
  progress,
  completedSteps,
  totalSteps,
  currentStep,
}: ProgressRingProps) {
  const isDark = useThemeStore((s) => s.isDark);
  const safeProgress = clamp(progress, 0, 100);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safeProgress / 100) * circumference;

  const accentFrom = isDark ? "#ef4444" : "#3b82f6";
  const accentTo = isDark ? "#fb7185" : "#60a5fa";
  const trackColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)";
  const innerFill = isDark ? "rgba(9,9,11,0.92)" : "rgba(255,255,255,0.95)";
  const innerStroke = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)";

  return (
    <div className="relative mx-auto flex w-full max-w-sm items-center justify-center">
      <svg viewBox="0 0 140 140" className="h-64 w-64 -rotate-90">
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={accentFrom} />
            <stop offset="100%" stopColor={accentTo} />
          </linearGradient>
        </defs>
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth="14"
        />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
        <circle
          cx="70"
          cy="70"
          r="32"
          fill={innerFill}
          stroke={innerStroke}
          strokeWidth="1"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-4xl font-black tracking-tight text-white">
          {Math.round(safeProgress)}%
        </p>
        <p className="mt-1 text-xs uppercase tracking-[0.28em] text-white/45">
          Profile Studio
        </p>
        <p className="mt-3 text-sm font-medium text-white/70">
          Step {currentStep} of {totalSteps}
        </p>
        <p className="text-xs text-white/45">
          {completedSteps} completed
        </p>
      </div>
    </div>
  );
}
