"use client";

import { useEffect, useRef } from "react";

type Vec2 = {
  x: number;
  y: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  hueOffset: number;
};

type Ring = {
  radius: number;
  thickness: number;
  speed: number;
  tilt: number;
  offset: number;
  alpha: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const lerp = (from: number, to: number, amount: number) =>
  from + (to - from) * amount;

const createParticle = (
  width: number,
  height: number,
  orbitalIndex: number
): Particle => ({
  x: Math.random() * width,
  y: Math.random() * height,
  vx: (Math.random() - 0.5) * 0.18,
  vy: (Math.random() - 0.5) * 0.18,
  size: Math.random() * 1.6 + 0.5,
  hueOffset: orbitalIndex * 0.02 + Math.random() * 0.2,
});

export default function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const particleCount = prefersReducedMotion ? 28 : isMobile ? 72 : 132;
    const ringCount = prefersReducedMotion ? 2 : 4;
    const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    let animationFrame = 0;
    let width = 0;
    let height = 0;

    const mouseTarget: Vec2 = { x: 0, y: 0 };
    const mouseCurrent: Vec2 = { x: 0, y: 0 };
    const camera: Vec2 = { x: 0, y: 0 };
    const orbPhase = Math.random() * Math.PI * 2;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = Math.floor(width * devicePixelRatio);
      canvas.height = Math.floor(height * devicePixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    };

    resize();

    const particles: Particle[] = Array.from({ length: particleCount }, (_, index) =>
      createParticle(width, height, index)
    );

    const rings: Ring[] = Array.from({ length: ringCount }, (_, index) => ({
      radius: 92 + index * 24,
      thickness: index === 0 ? 1.8 : 1.2,
      speed: 0.08 + index * 0.04,
      tilt: 0.42 - index * 0.06,
      offset: index * 0.75,
      alpha: 0.24 - index * 0.04,
    }));

    const onResize = () => {
      resize();

      particles.splice(
        0,
        particles.length,
        ...Array.from({ length: particleCount }, (_, index) =>
          createParticle(width, height, index)
        )
      );
    };

    const onMouseMove = (event: MouseEvent) => {
      const centerX = width / 2;
      const centerY = height / 2;

      mouseTarget.x = (event.clientX - centerX) / centerX;
      mouseTarget.y = (event.clientY - centerY) / centerY;
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouseMove);

    const drawBackground = (time: number) => {
      const pulse = 0.5 + Math.sin(time * 0.00035) * 0.5;

      const baseGradient = context.createLinearGradient(0, 0, width, height);
      baseGradient.addColorStop(0, "#04050a");
      baseGradient.addColorStop(0.45, "#050816");
      baseGradient.addColorStop(1, "#020308");

      context.fillStyle = baseGradient;
      context.fillRect(0, 0, width, height);

      const glowLeft = context.createRadialGradient(
        width * 0.18 + camera.x * 0.18,
        height * 0.32 + camera.y * 0.12,
        0,
        width * 0.18 + camera.x * 0.18,
        height * 0.32 + camera.y * 0.12,
        width * 0.58
      );
      glowLeft.addColorStop(0, `rgba(59, 130, 246, ${0.12 + pulse * 0.08})`);
      glowLeft.addColorStop(0.5, "rgba(59, 130, 246, 0.03)");
      glowLeft.addColorStop(1, "rgba(59, 130, 246, 0)");

      context.fillStyle = glowLeft;
      context.fillRect(0, 0, width, height);

      const glowRight = context.createRadialGradient(
        width * 0.82 - camera.x * 0.14,
        height * 0.18 - camera.y * 0.1,
        0,
        width * 0.82 - camera.x * 0.14,
        height * 0.18 - camera.y * 0.1,
        width * 0.48
      );
      glowRight.addColorStop(0, `rgba(244, 63, 94, ${0.08 + pulse * 0.06})`);
      glowRight.addColorStop(0.55, "rgba(244, 63, 94, 0.02)");
      glowRight.addColorStop(1, "rgba(244, 63, 94, 0)");

      context.fillStyle = glowRight;
      context.fillRect(0, 0, width, height);
    };

    const drawOrb = (time: number) => {
      const orbitalTime = time * 0.001;
      const breathe = 1 + Math.sin(orbitalTime * 1.15 + orbPhase) * 0.06;
      const orbitX = Math.sin(orbitalTime * 0.65 + orbPhase) * 22;
      const orbitY = Math.cos(orbitalTime * 0.82 + orbPhase) * 16;
      const depthShift = Math.sin(orbitalTime * 0.5 + orbPhase) * 10;
      const centerX = width / 2 + camera.x * 0.35 + orbitX;
      const centerY = height / 2 + camera.y * 0.35 + orbitY;
      const orbRadius = 92 * breathe;
      const glowRadius = 240 + Math.sin(orbitalTime * 2.1) * 12;
      const glowIntensity = 0.28 + Math.sin(orbitalTime * 1.6 + 0.7) * 0.07;

      const glow = context.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        glowRadius
      );
      glow.addColorStop(0, `rgba(99, 102, 241, ${glowIntensity + 0.12})`);
      glow.addColorStop(0.28, "rgba(99, 102, 241, 0.12)");
      glow.addColorStop(0.58, "rgba(34, 211, 238, 0.04)");
      glow.addColorStop(1, "rgba(34, 211, 238, 0)");

      context.fillStyle = glow;
      context.beginPath();
      context.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
      context.fill();

      const coreGlow = context.createRadialGradient(
        centerX - 10,
        centerY - 14,
        0,
        centerX,
        centerY,
        orbRadius
      );
      coreGlow.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      coreGlow.addColorStop(0.18, "rgba(165, 180, 252, 0.92)");
      coreGlow.addColorStop(0.56, "rgba(99, 102, 241, 0.58)");
      coreGlow.addColorStop(1, "rgba(15, 23, 42, 0)");

      context.save();
      context.translate(centerX, centerY + depthShift * 0.15);
      context.scale(1, 0.88);
      context.fillStyle = coreGlow;
      context.beginPath();
      context.arc(0, 0, orbRadius, 0, Math.PI * 2);
      context.fill();
      context.restore();

      context.save();
      context.translate(centerX, centerY + depthShift * 0.15);
      context.shadowColor = "rgba(168, 85, 247, 0.35)";
      context.shadowBlur = 24;
      context.fillStyle = "rgba(255, 255, 255, 0.92)";
      context.beginPath();
      context.arc(0, 0, 16, 0, Math.PI * 2);
      context.fill();
      context.restore();

      return { centerX, centerY, orbRadius, depthShift };
    };

    const drawRings = (
      time: number,
      centerX: number,
      centerY: number,
      orbRadius: number,
      depthShift: number
    ) => {
      const t = time * 0.001;

      rings.forEach((ring, index) => {
        const speed = ring.speed * (index % 2 === 0 ? 1 : -1);
        const rotation = t * speed + ring.offset;
        const wobble = Math.sin(t * 1.35 + ring.offset) * 0.08;
        const scaleY = ring.tilt + wobble;
        const scaleX = 1 + Math.sin(t * 0.5 + ring.offset) * 0.03;
        const radius = orbRadius + ring.radius + Math.sin(t * 1.1 + ring.offset) * 4;

        context.save();
        context.translate(centerX + camera.x * 0.08, centerY + depthShift * 0.08);
        context.rotate(rotation);
        context.scale(scaleX, scaleY);
        context.strokeStyle = `rgba(148, 163, 184, ${ring.alpha})`;
        context.lineWidth = ring.thickness;
        context.shadowColor = "rgba(96, 165, 250, 0.2)";
        context.shadowBlur = 12;
        context.beginPath();
        context.arc(0, 0, radius, 0, Math.PI * 2);
        context.stroke();
        context.restore();
      });
    };

    const drawLightWaves = (time: number, centerX: number, centerY: number) => {
      const t = time * 0.001;
      const waveCount = prefersReducedMotion ? 2 : 3;

      for (let waveIndex = 0; waveIndex < waveCount; waveIndex += 1) {
        const bandY = centerY + (waveIndex - 1) * 54 + Math.sin(t * 1.6 + waveIndex) * 18;
        const amplitude = 10 + waveIndex * 3;
        const frequency = 0.0045 + waveIndex * 0.0008;

        context.save();
        context.beginPath();
        context.lineWidth = 1;
        context.strokeStyle = `rgba(125, 211, 252, ${0.08 - waveIndex * 0.015})`;
        context.shadowColor = "rgba(14, 165, 233, 0.28)";
        context.shadowBlur = 16;

        for (let x = 0; x <= width; x += 18) {
          const normalized = x * frequency + t * (0.85 + waveIndex * 0.15);
          const y =
            bandY +
            Math.sin(normalized) * amplitude +
            Math.sin(normalized * 0.5 + t * 1.2) * 4;

          if (x === 0) {
            context.moveTo(x, y);
          } else {
            context.lineTo(x, y);
          }
        }

        context.stroke();
        context.restore();
      }

      const ambientBeam = context.createLinearGradient(
        0,
        centerY - 120,
        width,
        centerY + 120
      );
      ambientBeam.addColorStop(0, "rgba(59, 130, 246, 0)");
      ambientBeam.addColorStop(0.5, "rgba(59, 130, 246, 0.05)");
      ambientBeam.addColorStop(1, "rgba(59, 130, 246, 0)");

      context.fillStyle = ambientBeam;
      context.fillRect(0, centerY - 120, width, 240);
    };

    const drawConnections = (
      time: number,
      centerX: number,
      centerY: number,
      orbRadius: number
    ) => {
      const t = time * 0.001;

      for (let i = 0; i < particles.length; i += 1) {
        const first = particles[i];
        for (let j = i + 1; j < particles.length; j += 1) {
          const second = particles[j];
          const dx = second.x - first.x;
          const dy = second.y - first.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance > 145) continue;

          const alpha = ((145 - distance) / 145) * 0.14;
          const pulse = 0.72 + Math.sin(t * 2 + i * 0.2 + j * 0.17) * 0.28;

          context.beginPath();
          context.moveTo(first.x, first.y);
          context.lineTo(second.x, second.y);
          context.strokeStyle = `rgba(148, 163, 184, ${alpha * pulse})`;
          context.lineWidth = 1;
          context.stroke();
        }
      }

      particles.forEach((particle) => {
        const dx = centerX - particle.x;
        const dy = centerY - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const influenceRadius = orbRadius + 220;

        if (distance > influenceRadius) return;

        const force = ((influenceRadius - distance) / influenceRadius) * 0.0016;
        const swirlX = -dy * force;
        const swirlY = dx * force;

        particle.vx += swirlX + Math.sin(t * 2 + particle.hueOffset) * 0.00015;
        particle.vy += swirlY + Math.cos(t * 1.5 + particle.hueOffset) * 0.00015;
      });
    };

    const updateParticles = (time: number, centerX: number, centerY: number, orbRadius: number) => {
      const t = time * 0.001;
      const influenceRadius = orbRadius + 240;

      particles.forEach((particle) => {
        const dx = centerX - particle.x;
        const dy = centerY - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const distanceRatio = clamp(distance / influenceRadius, 0, 1);

        const attraction = (1 - distanceRatio) * 0.015;
        const pullX = (dx / distance) * attraction;
        const pullY = (dy / distance) * attraction;
        const swirlX = (-dy / distance) * attraction * 0.55;
        const swirlY = (dx / distance) * attraction * 0.55;

        particle.vx += pullX + swirlX;
        particle.vy += pullY + swirlY;

        particle.vx += Math.sin(t * 0.8 + particle.hueOffset * 8.5) * 0.0015;
        particle.vy += Math.cos(t * 0.7 + particle.hueOffset * 11.5) * 0.0015;

        particle.vx += camera.x * 0.000015;
        particle.vy += camera.y * 0.000015;

        particle.vx *= 0.985;
        particle.vy *= 0.985;

        particle.x += particle.vx * (prefersReducedMotion ? 0.7 : 1);
        particle.y += particle.vy * (prefersReducedMotion ? 0.7 : 1);

        const margin = 60;
        if (particle.x < -margin) particle.x = width + margin;
        if (particle.x > width + margin) particle.x = -margin;
        if (particle.y < -margin) particle.y = height + margin;
        if (particle.y > height + margin) particle.y = -margin;
      });
    };

    const drawParticles = (
      time: number,
      centerX: number,
      centerY: number,
      orbRadius: number
    ) => {
      const t = time * 0.001;
      const influenceRadius = orbRadius + 240;

      particles.forEach((particle) => {
        const dx = centerX - particle.x;
        const dy = centerY - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const distanceRatio = clamp(distance / influenceRadius, 0, 1);
        const glow = 1 - distanceRatio;
        const sizePulse = 1 + Math.sin(t * 3.2 + particle.hueOffset) * 0.35;
        const size = particle.size * sizePulse;

        context.beginPath();
        context.fillStyle = `rgba(226, 232, 240, ${0.38 + glow * 0.42})`;
        context.shadowColor = `rgba(125, 211, 252, ${0.18 + glow * 0.18})`;
        context.shadowBlur = 10 + glow * 8;
        context.arc(particle.x, particle.y, size, 0, Math.PI * 2);
        context.fill();

        if (distance < 160) {
          const alpha = (160 - distance) / 160;
          context.beginPath();
          context.moveTo(particle.x, particle.y);
          context.lineTo(
            lerp(particle.x, centerX, 0.18),
            lerp(particle.y, centerY, 0.18)
          );
          context.strokeStyle = `rgba(56, 189, 248, ${alpha * 0.08})`;
          context.lineWidth = 1;
          context.stroke();
        }
      });
    };

    const animate = (time: number) => {
      const motionMix = prefersReducedMotion ? 0.04 : 0.08;
      mouseCurrent.x = lerp(mouseCurrent.x, mouseTarget.x, motionMix);
      mouseCurrent.y = lerp(mouseCurrent.y, mouseTarget.y, motionMix);

      camera.x = mouseCurrent.x * width * 0.07 + Math.sin(time * 0.00042) * 10;
      camera.y = mouseCurrent.y * height * 0.07 + Math.cos(time * 0.00036) * 8;

      context.clearRect(0, 0, width, height);

      drawBackground(time);

      const orb = drawOrb(time);
      drawLightWaves(time, orb.centerX, orb.centerY);
      drawRings(time, orb.centerX, orb.centerY, orb.orbRadius, orb.depthShift);
      updateParticles(time, orb.centerX, orb.centerY, orb.orbRadius);
      drawConnections(time, orb.centerX, orb.centerY, orb.orbRadius);
      drawParticles(time, orb.centerX, orb.centerY, orb.orbRadius);

      animationFrame = window.requestAnimationFrame(animate);
    };

    animationFrame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 -z-10 h-full w-full pointer-events-none"
      aria-hidden="true"
    />
  );
}
