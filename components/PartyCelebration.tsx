"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
  useCallback
} from "react";

export type PartyCelebrationHandle = {
  triggerBurst: (originX?: number, originY?: number) => void;
  playFanfare: () => void;
};

type PartyCelebrationProps = {
  active: boolean;
  cakeRef?: React.RefObject<HTMLDivElement | null>;
  onComplete?: () => void;
};

type FloatingEmoji = {
  id: number;
  emoji: string;
  leftPercent: number;
  delayMs: number;
  durationSec: number;
  scale: number;
  driftX: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  rotation: number;
  rotSpeed: number;
  type: "sparkle" | "star" | "confetti-rect" | "confetti-circle" | "streamer";
  tilt: number;
  tiltSpeed: number;
  wobble: number;
  wobbleSpeed: number;
  gravity: number;
  drag: number;
};

const CELEBRATION_EMOJIS = ["🎉", "🥳", "✨", "🎂", "🎈", "💖", "🎊", "🪄", "🧁", "🌟"];

const SPARKLE_PALETTE = [
  "#ffd700", // pure gold
  "#fff176", // bright yellow
  "#ffffff", // diamond white
  "#ff4f8b", // hot celebration pink
  "#a855f7", // vivid violet
  "#38bdf8", // radiant cyan
  "#f97316"  // warm orange
];

const CONFETTI_PALETTE = [
  "#ff2a6d",
  "#05d9e8",
  "#ffea00",
  "#a700ff",
  "#ff6080",
  "#00f5d4",
  "#fee440",
  "#7b2cbf",
  "#ffffff"
];

// Web Audio API Synthesized Fanfare Chime (Major arpeggio with bell overtones)
export function playCelebrationFanfare() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    const now = ctx.currentTime;
    const chord = [
      { freq: 523.25, time: 0.00, dur: 0.7 }, // C5
      { freq: 659.25, time: 0.08, dur: 0.7 }, // E5
      { freq: 783.99, time: 0.16, dur: 0.8 }, // G5
      { freq: 1046.5, time: 0.25, dur: 1.1 }, // C6
      { freq: 1318.5, time: 0.35, dur: 1.3 }, // E6
      { freq: 1567.98, time: 0.45, dur: 1.5 } // G6
    ];

    chord.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + time);

      gain.gain.setValueAtTime(0, now + time);
      gain.gain.linearRampToValueAtTime(0.14, now + time + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + dur + 0.05);

      // Shimmering octave bell harmonic
      const shimmer = ctx.createOscillator();
      const sGain = ctx.createGain();
      shimmer.type = "triangle";
      shimmer.frequency.setValueAtTime(freq * 2, now + time);
      sGain.gain.setValueAtTime(0, now + time);
      sGain.gain.linearRampToValueAtTime(0.05, now + time + 0.01);
      sGain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur * 0.6);

      shimmer.connect(sGain);
      sGain.connect(ctx.destination);
      shimmer.start(now + time);
      shimmer.stop(now + time + dur * 0.6 + 0.05);
    });
  } catch {
    // Graceful silent fallback if Web Audio is restricted
  }
}

const PartyCelebration = forwardRef<PartyCelebrationHandle, PartyCelebrationProps>(
  ({ active, cakeRef }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const particlesRef = useRef<Particle[]>([]);
    const animFrameRef = useRef<number | null>(null);
    const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
    const emojiCounterRef = useRef(0);
    const prevActiveRef = useRef(false);

    // Spawn floating emojis
    const spawnFloatingEmojis = useCallback((count = 12, startPercent?: number) => {
      const newEmojis: FloatingEmoji[] = [];
      const baseCenter = typeof startPercent === "number" ? startPercent : 50;

      for (let i = 0; i < count; i++) {
        emojiCounterRef.current += 1;
        const emoji = CELEBRATION_EMOJIS[Math.floor(Math.random() * CELEBRATION_EMOJIS.length)];
        const spread = (Math.random() - 0.5) * 55;
        const leftPercent = Math.max(8, Math.min(92, baseCenter + spread));
        const delayMs = Math.random() * 600;
        const durationSec = 2.4 + Math.random() * 1.6;
        const scale = 0.85 + Math.random() * 0.6;
        const driftX = (Math.random() - 0.5) * 80;

        newEmojis.push({
          id: emojiCounterRef.current,
          emoji,
          leftPercent,
          delayMs,
          durationSec,
          scale,
          driftX
        });
      }

      setFloatingEmojis((prev) => [...prev.slice(-20), ...newEmojis]);

      // Remove after animations finish
      window.setTimeout(() => {
        setFloatingEmojis((prev) => prev.filter((e) => !newEmojis.some((ne) => ne.id === e.id)));
      }, 4500);
    }, []);

    // Create particle burst
    const triggerBurst = useCallback(
      (originX?: number, originY?: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const w = canvas.width;
        const h = canvas.height;

        let ox = originX;
        let oy = originY;

        // If no explicit coordinates provided, use cake bounding rect or viewport center
        if (typeof ox !== "number" || typeof oy !== "number") {
          if (cakeRef?.current) {
            const rect = cakeRef.current.getBoundingClientRect();
            const canvasRect = canvas.getBoundingClientRect();
            ox = rect.left + rect.width / 2 - canvasRect.left;
            oy = rect.top + rect.height * 0.42 - canvasRect.top;
          } else {
            ox = w / 2;
            oy = h * 0.48;
          }
        }

        // 1. Radial Sparkle Burst (Diamond glitters & starbursts radiating from cake)
        const sparkleCount = 45;
        for (let i = 0; i < sparkleCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 9 + 2.5;
          const isStar = Math.random() > 0.45;
          particlesRef.current.push({
            x: ox + (Math.random() - 0.5) * 40,
            y: oy + (Math.random() - 0.5) * 30,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2.5,
            size: Math.random() * 11 + 6,
            color: SPARKLE_PALETTE[Math.floor(Math.random() * SPARKLE_PALETTE.length)],
            alpha: 1,
            decay: 0.008 + Math.random() * 0.012,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.25,
            type: isStar ? "star" : "sparkle",
            tilt: Math.random() * Math.PI,
            tiltSpeed: (Math.random() - 0.5) * 0.1,
            wobble: 0,
            wobbleSpeed: 0.05 + Math.random() * 0.05,
            gravity: 0.12,
            drag: 0.965
          });
        }

        // 2. Dual Confetti Cannons (Shooting from bottom corners towards upper center)
        const cannonConfettiCount = 35;

        // Left Cannon
        for (let i = 0; i < cannonConfettiCount; i++) {
          const angle = -Math.PI * (0.28 + Math.random() * 0.22);
          const speed = Math.random() * 14 + 11;
          const isStreamer = Math.random() > 0.65;
          particlesRef.current.push({
            x: Math.random() * (w * 0.18),
            y: h + 10,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: isStreamer ? Math.random() * 18 + 12 : Math.random() * 8 + 5,
            color: CONFETTI_PALETTE[Math.floor(Math.random() * CONFETTI_PALETTE.length)],
            alpha: 1,
            decay: 0.006 + Math.random() * 0.008,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.2,
            type: isStreamer ? "streamer" : Math.random() > 0.5 ? "confetti-rect" : "confetti-circle",
            tilt: Math.random() * Math.PI,
            tiltSpeed: (Math.random() - 0.5) * 0.15,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.08 + Math.random() * 0.08,
            gravity: 0.22,
            drag: 0.97
          });
        }

        // Right Cannon
        for (let i = 0; i < cannonConfettiCount; i++) {
          const angle = -Math.PI * (0.72 - Math.random() * 0.22);
          const speed = Math.random() * 14 + 11;
          const isStreamer = Math.random() > 0.65;
          particlesRef.current.push({
            x: w - Math.random() * (w * 0.18),
            y: h + 10,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: isStreamer ? Math.random() * 18 + 12 : Math.random() * 8 + 5,
            color: CONFETTI_PALETTE[Math.floor(Math.random() * CONFETTI_PALETTE.length)],
            alpha: 1,
            decay: 0.006 + Math.random() * 0.008,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.2,
            type: isStreamer ? "streamer" : Math.random() > 0.5 ? "confetti-rect" : "confetti-circle",
            tilt: Math.random() * Math.PI,
            tiltSpeed: (Math.random() - 0.5) * 0.15,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.08 + Math.random() * 0.08,
            gravity: 0.22,
            drag: 0.97
          });
        }

        // 3. Floating Emojis
        const percentX = (ox / (w || 1)) * 100;
        spawnFloatingEmojis(12, percentX);

        // 4. Play joyful audio fanfare
        playCelebrationFanfare();
      },
      [cakeRef, spawnFloatingEmojis]
    );

    useImperativeHandle(ref, () => ({
      triggerBurst,
      playFanfare: playCelebrationFanfare
    }));

    // Trigger burst whenever `active` transitions from false to true
    useEffect(() => {
      if (active && !prevActiveRef.current) {
        triggerBurst();
      }
      prevActiveRef.current = active;
    }, [active, triggerBurst]);

    // Continuous Canvas Render Loop
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const updateDimensions = () => {
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width || window.innerWidth;
        canvas.height = rect.height || window.innerHeight;
      };

      updateDimensions();
      window.addEventListener("resize", updateDimensions);

      let lastAmbientTime = performance.now();

      const drawDiamondSparkle = (
        c: CanvasRenderingContext2D,
        x: number,
        y: number,
        size: number,
        rotation: number,
        color: string,
        alpha: number
      ) => {
        c.save();
        c.translate(x, y);
        c.rotate(rotation);
        c.fillStyle = color;
        c.globalAlpha = alpha;
        c.beginPath();
        const half = size;
        const pinch = size * 0.18;
        c.moveTo(0, -half);
        c.quadraticCurveTo(0, -pinch, pinch, 0);
        c.quadraticCurveTo(0, pinch, 0, half);
        c.quadraticCurveTo(0, pinch, -pinch, 0);
        c.quadraticCurveTo(0, -pinch, 0, -half);
        c.fill();
        c.restore();
      };

      const drawStar = (
        c: CanvasRenderingContext2D,
        cx: number,
        cy: number,
        outerR: number,
        rotation: number,
        color: string,
        alpha: number
      ) => {
        c.save();
        c.translate(cx, cy);
        c.rotate(rotation);
        c.fillStyle = color;
        c.globalAlpha = alpha;
        c.beginPath();
        const points = 5;
        const innerR = outerR * 0.45;
        for (let i = 0; i < points * 2; i++) {
          const r = i % 2 === 0 ? outerR : innerR;
          const a = (i * Math.PI) / points - Math.PI / 2;
          if (i === 0) c.moveTo(Math.cos(a) * r, Math.sin(a) * r);
          else c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        c.closePath();
        c.fill();
        c.restore();
      };

      const render = (now: number) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // While active, add occasional ambient celebration twinkles (gentle gold glitters around screen)
        if (active && now - lastAmbientTime > 180 && particlesRef.current.length < 80) {
          lastAmbientTime = now;
          const isStar = Math.random() > 0.5;
          particlesRef.current.push({
            x: Math.random() * canvas.width,
            y: Math.random() * (canvas.height * 0.7),
            vx: (Math.random() - 0.5) * 1.2,
            vy: Math.random() * 0.8 + 0.3,
            size: Math.random() * 8 + 4,
            color: SPARKLE_PALETTE[Math.floor(Math.random() * SPARKLE_PALETTE.length)],
            alpha: 0.9,
            decay: 0.015,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.15,
            type: isStar ? "star" : "sparkle",
            tilt: 0,
            tiltSpeed: 0,
            wobble: 0,
            wobbleSpeed: 0,
            gravity: 0.04,
            drag: 0.99
          });
        }

        const particles = particlesRef.current;
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];

          // Physics update
          p.vx *= p.drag;
          p.vy = p.vy * p.drag + p.gravity;
          p.x += p.vx;
          p.y += p.vy;
          p.rotation += p.rotSpeed;
          p.tilt += p.tiltSpeed;
          p.wobble += p.wobbleSpeed;
          p.alpha -= p.decay;

          if (p.alpha <= 0 || p.y > canvas.height + 40) {
            particles.splice(i, 1);
            continue;
          }

          // 3D perspective simulated tumble scale
          const tumbleScale = Math.cos(p.tilt);

          if (p.type === "sparkle") {
            drawDiamondSparkle(ctx, p.x, p.y, p.size, p.rotation, p.color, p.alpha);
          } else if (p.type === "star") {
            drawStar(ctx, p.x, p.y, p.size, p.rotation, p.color, p.alpha);
          } else if (p.type === "streamer") {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.scale(1, Math.max(0.2, Math.abs(tumbleScale)));
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha;
            ctx.fillRect(-p.size / 2, -2, p.size, 4.5);
            ctx.restore();
          } else if (p.type === "confetti-rect") {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.scale(Math.max(0.15, Math.abs(tumbleScale)), 1);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha;
            ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.7);
            ctx.restore();
          } else {
            // confetti-circle
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.scale(Math.max(0.2, Math.abs(tumbleScale)), 1);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha;
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }

        animFrameRef.current = requestAnimationFrame(render);
      };

      animFrameRef.current = requestAnimationFrame(render);

      const handleVisibility = () => {
        if (document.hidden) {
          if (animFrameRef.current !== null) {
            cancelAnimationFrame(animFrameRef.current);
            animFrameRef.current = null;
          }
        } else {
          if (animFrameRef.current === null) {
            animFrameRef.current = requestAnimationFrame(render);
          }
        }
      };

      document.addEventListener("visibilitychange", handleVisibility, { passive: true });

      return () => {
        if (animFrameRef.current !== null) {
          cancelAnimationFrame(animFrameRef.current);
        }
        window.removeEventListener("resize", updateDimensions);
        document.removeEventListener("visibilitychange", handleVisibility);
      };
    }, [active]);

    return (
      <div
        className="partyCelebrationOverlay"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 35,
          overflow: "hidden"
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            display: "block"
          }}
        />

        {/* Floating Celebration Emojis Layer */}
        {floatingEmojis.map((item) => (
          <span
            key={item.id}
            className="floatingPartyEmoji"
            style={{
              position: "absolute",
              bottom: "16%",
              left: `${item.leftPercent}%`,
              fontSize: `${Math.round(28 * item.scale)}px`,
              animation: `partyEmojiFloatUp ${item.durationSec}s cubic-bezier(0.2, 0.8, 0.3, 1) ${item.delayMs}ms forwards`,
              filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.35))",
              userSelect: "none",
              pointerEvents: "none",
              "--drift-x": `${item.driftX}px`
            } as React.CSSProperties}
          >
            {item.emoji}
          </span>
        ))}
      </div>
    );
  }
);

PartyCelebration.displayName = "PartyCelebration";

export default PartyCelebration;
