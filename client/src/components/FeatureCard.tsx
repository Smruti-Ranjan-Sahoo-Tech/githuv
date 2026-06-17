"use client";

import { useRef } from "react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}

export default function FeatureCard({
  icon,
  title,
  description,
  gradient,
}: FeatureCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform =
      "perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)";
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative rounded-xl border border-white/5 bg-white/[0.02] p-6 transition-all duration-200 ease-out hover:border-white/10"
      style={{ transformStyle: "preserve-3d" }}
    >
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${gradient}20, transparent 40%)`,
        }}
      />

      <div className="relative z-10">
        <div
          className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ background: `${gradient}20` }}
        >
          <div style={{ color: gradient }}>{icon}</div>
        </div>

        <h3 className="mb-2 text-lg font-semibold text-white/90">{title}</h3>
        <p className="text-sm leading-relaxed text-white/50">{description}</p>
      </div>

      <div
        className="absolute -inset-px rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${gradient}20, transparent 50%, ${gradient}10)`,
        }}
      />
    </div>
  );
}
