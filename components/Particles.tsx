"use client";

import { useEffect, useRef } from "react";

type ParticlesProps = {
  type: "petals" | "sparkles" | "confetti" | "stars";
  count?: number;
  active?: boolean;
};

export default function Particles({ type, count = 20, active = true }: ParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth || window.innerWidth);
    let height = (canvas.height = canvas.offsetHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth || window.innerWidth;
      height = canvas.height = canvas.offsetHeight || window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    type Particle = {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      rotation: number;
      rotSpeed: number;
      color: string;
      alpha: number;
      shape: string;
      petalType?: number;
    };

    const petalColors = [
      "rgba(255, 150, 190, ",
      "rgba(255, 180, 210, ",
      "rgba(255, 120, 175, ",
      "rgba(255, 200, 225, ",
      "rgba(244, 114, 182, "
    ];

    const confettiColors = [
      "#ff4f8b",
      "#7c5cff",
      "#38bdf8",
      "#f59e0b",
      "#10b981",
      "#ec4899",
      "#ffd700"
    ];

    const sparkleColors = ["#ffffff", "#ffe4e6", "#fbcfe8", "#fef08a", "#c4b5fd"];

    const particles: Particle[] = [];

    const createParticle = (initY?: number): Particle => {
      const pType = type;
      if (pType === "petals") {
        return {
          x: Math.random() * width,
          y: initY !== undefined ? initY : Math.random() * height,
          size: Math.random() * 8 + 6,
          speedX: Math.random() * 1.5 - 0.5,
          speedY: Math.random() * 1.2 + 0.8,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.03,
          color: petalColors[Math.floor(Math.random() * petalColors.length)],
          alpha: Math.random() * 0.4 + 0.5,
          shape: "petal",
          petalType: Math.floor(Math.random() * 3)
        };
      } else if (pType === "confetti") {
        return {
          x: Math.random() * width,
          y: initY !== undefined ? initY : -20,
          size: Math.random() * 7 + 4,
          speedX: Math.random() * 3 - 1.5,
          speedY: Math.random() * 2.5 + 1.5,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.08,
          color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
          alpha: 1,
          shape: Math.random() > 0.5 ? "rect" : "circle"
        };
      } else {
        // sparkles / stars
        return {
          x: Math.random() * width,
          y: initY !== undefined ? initY : Math.random() * height,
          size: Math.random() * 3 + 1.5,
          speedX: (Math.random() - 0.5) * 0.4,
          speedY: (Math.random() - 0.5) * 0.4,
          rotation: Math.random() * Math.PI,
          rotSpeed: (Math.random() - 0.5) * 0.05,
          color: sparkleColors[Math.floor(Math.random() * sparkleColors.length)],
          alpha: Math.random() * 0.6 + 0.3,
          shape: "star"
        };
      }
    };

    const total = Math.min(count, 40);
    for (let i = 0; i < total; i++) {
      particles.push(createParticle(type === "confetti" ? Math.random() * height * 0.5 : undefined));
    }

    const drawPetal = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color + p.alpha + ")";
      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.bezierCurveTo(p.size * 0.8, -p.size * 0.5, p.size * 0.8, p.size * 0.5, 0, p.size);
      ctx.bezierCurveTo(-p.size * 0.8, p.size * 0.5, -p.size * 0.8, -p.size * 0.5, 0, -p.size);
      ctx.fill();
      ctx.restore();
    };

    const drawConfetti = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      if (p.shape === "rect") {
        ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.6);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    const drawStar = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotSpeed;

        if (type === "petals") {
          drawPetal(p);
          if (p.y > height + 20) {
            p.y = -20;
            p.x = Math.random() * width;
          }
        } else if (type === "confetti") {
          drawConfetti(p);
          if (p.y > height + 20) {
            p.y = -20;
            p.x = Math.random() * width;
          }
        } else {
          drawStar(p);
          if (p.x < -10 || p.x > width + 10 || p.y < -10 || p.y > height + 10) {
            p.x = Math.random() * width;
            p.y = Math.random() * height;
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [type, count, active]);

  return (
    <canvas
      ref={canvasRef}
      className="particleCanvas"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1
      }}
    />
  );
}
