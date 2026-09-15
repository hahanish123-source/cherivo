"use client";

import React, { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function AnimatedAmbientBackground() {
  const pathname = usePathname();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Skip rendering on heavy studio editor, greeting link views, and admin pages
  const isExcluded =
    Boolean(pathname) &&
    (pathname.startsWith("/create") ||
      pathname.startsWith("/g/") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/demo"));

  useEffect(() => {
    if (isExcluded) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animId: number | null = null;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let isPaused = false;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleVisibility = () => {
      if (document.hidden) {
        isPaused = true;
        if (animId !== null) {
          cancelAnimationFrame(animId);
          animId = null;
        }
      } else {
        isPaused = false;
        if (animId === null) {
          animId = requestAnimationFrame(render);
        }
      }
    };

    window.addEventListener("resize", handleResize, { passive: true });
    document.addEventListener("visibilitychange", handleVisibility, { passive: true });

    // Floating Stardust Motes (lightweight: 14 particles max)
    interface StardustParticle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      pulseSpeed: number;
      pulseVal: number;
      color: string;
    }

    const colors = [
      "rgba(255, 159, 189, ", // soft pink
      "rgba(255, 215, 0, ",   // warm gold
      "rgba(192, 132, 252, ", // soft violet
      "rgba(255, 255, 255, "  // pure stardust white
    ];

    const particles: StardustParticle[] = [];
    const count = Math.min(14, Math.max(6, Math.floor((width * height) / 90000)));

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.8,
        speedX: (Math.random() - 0.5) * 0.22,
        speedY: -Math.random() * 0.25 - 0.08,
        opacity: Math.random() * 0.35 + 0.15,
        pulseSpeed: Math.random() * 0.015 + 0.008,
        pulseVal: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    let lastTime = 0;
    const targetInterval = 1000 / 30;

    const render = (currentTime: number) => {
      if (isPaused) return;
      animId = requestAnimationFrame(render);

      const delta = currentTime - lastTime;
      if (delta < targetInterval) return;
      lastTime = currentTime - (delta % targetInterval);

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.speedX;
        p.y += p.speedY;
        p.pulseVal += p.pulseSpeed;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const currentAlpha = Math.max(0.08, p.opacity * (0.65 + 0.35 * Math.sin(p.pulseVal)));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${currentAlpha})`;
        ctx.fill();

        if (p.size > 2.0) {
          ctx.strokeStyle = `${p.color}${currentAlpha * 0.4})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(p.x - p.size * 2, p.y);
          ctx.lineTo(p.x + p.size * 2, p.y);
          ctx.moveTo(p.x, p.y - p.size * 2);
          ctx.lineTo(p.x, p.y + p.size * 2);
          ctx.stroke();
        }
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (animId !== null) {
        cancelAnimationFrame(animId);
      }
    };
  }, [isExcluded]);

  if (isExcluded) return null;

  return (
    <div className="globalAmbientMotionLayer" aria-hidden="true">
      {/* Dynamic Glowing Aurora Gradient Orbs */}
      <div className="auroraOrb auroraOrb1" />
      <div className="auroraOrb auroraOrb2" />
      <div className="auroraOrb auroraOrb3" />
      <div className="auroraOrb auroraOrb4" />

      {/* Gentle Floating Stardust Canvas */}
      <canvas ref={canvasRef} className="ambientStardustCanvas" />
    </div>
  );
}
