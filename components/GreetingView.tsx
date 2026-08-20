"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Pencil,
  RotateCcw,
  Volume2,
  Play,
  Pause,
  X
} from "lucide-react";
import type { Block, GreetingProject, ImageAdjustment } from "@/lib/types";
import { getFont, backgrounds, themes } from "@/lib/greetingConfig";
import Particles from "./Particles";

export type GreetingViewProps = {
  project: GreetingProject;
  sceneIndex?: number;
  onSceneChange?: (newIndex: number) => void;
  isEditable?: boolean;
  onEditSection?: (blockId: string) => void;
  onEditReason?: (blockId: string, reasonIndex: number) => void;
  onAddReason?: () => void;
  previewDevice?: "desktop" | "mobile";
  title?: string;
  memoryVideoPreviews?: Record<string, string>;
};

type DustParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  decay: number;
  color: string;
  rotation: number;
  vRot: number;
};

export default function GreetingView({
  project,
  sceneIndex = 0,
  onSceneChange,
  isEditable = false,
  onEditSection,
  onEditReason,
  onAddReason,
  previewDevice = "desktop",
  title = "A Hanora moment",
  memoryVideoPreviews = {}
}: GreetingViewProps) {
  const visibleBlocks = useMemo(
    () => (project.blocks ?? []).filter((b) => b.visible !== false),
    [project.blocks]
  );

  const [internalScene, setInternalScene] = useState(0);
  const currentSceneIndex = onSceneChange !== undefined ? sceneIndex : internalScene;

  const setScene = (newIndex: number) => {
    const clamped = Math.max(0, Math.min(newIndex, Math.max(0, visibleBlocks.length - 1)));
    if (onSceneChange) {
      onSceneChange(clamped);
    } else {
      setInternalScene(clamped);
    }
  };

  const currentBlock: Block | undefined =
    visibleBlocks.length > 0
      ? visibleBlocks[Math.min(currentSceneIndex, visibleBlocks.length - 1)]
      : project.blocks[0];

  // Interactive states
  const [candles, setCandles] = useState<boolean[]>([false, false, false]);
  const [smoke, setSmoke] = useState<number[]>([]);
  const [secretRevealed, setSecretRevealed] = useState(false);
  const [galleryViewer, setGalleryViewer] = useState<{ images: string[]; index: number } | null>(null);
  const [dustedPhotos, setDustedPhotos] = useState<number[]>([]);
  const [galleryScatter, setGalleryScatter] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);

  // Audio player state
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Dust Canvas Animation Refs
  const dustCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const dustParticlesRef = useRef<DustParticle[]>([]);
  const dustAnimRef = useRef<number | null>(null);

  const activeAudioUrl =
    typeof currentBlock?.audioUrl === "string"
      ? currentBlock.audioUrl
      : typeof project.audioUrl === "string"
      ? project.audioUrl
      : "";

  const activeAudioName = currentBlock?.audioName || project.audioName || "Your song";

  const attemptAudioPlayback = () => {
    const audioElement = audioRef.current;
    if (!audioElement || !activeAudioUrl) return;
    void audioElement
      .play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false));
  };

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement || !activeAudioUrl) return;
    audioElement.src = activeAudioUrl;
    audioElement.loop = true;
    audioElement.load();

    if (!isEditable) {
      const retryAfterInteraction = () => attemptAudioPlayback();
      document.addEventListener("pointerdown", retryAfterInteraction, { once: true });
      document.addEventListener("keydown", retryAfterInteraction, { once: true });
      attemptAudioPlayback();

      return () => {
        document.removeEventListener("pointerdown", retryAfterInteraction);
        document.removeEventListener("keydown", retryAfterInteraction);
        audioElement.pause();
        audioElement.removeAttribute("src");
        audioElement.load();
        setPlaying(false);
      };
    }
  }, [activeAudioUrl, isEditable]);

  // Clean up dust animation on unmount
  useEffect(() => {
    return () => {
      if (dustAnimRef.current !== null) {
        cancelAnimationFrame(dustAnimRef.current);
        dustAnimRef.current = null;
      }
      dustParticlesRef.current = [];
    };
  }, []);

  // Candle blow interaction
  const blowCandle = () => {
    const idx = candles.findIndex((x) => !x);
    if (idx < 0) return;
    const next = [...candles];
    next[idx] = true;
    setCandles(next);
    setSmoke((v) => [...v, idx]);

    window.setTimeout(() => {
      setSmoke((v) => v.filter((x) => x !== idx));
    }, 2200);

    if (next.every(Boolean)) {
      setConfettiActive(true);
      window.setTimeout(() => {
        setConfettiActive(false);
        if (currentSceneIndex < visibleBlocks.length - 1) {
          setScene(currentSceneIndex + 1);
        }
        setCandles([false, false, false]);
      }, 1800);
    }
  };

  const handleSecretToggle = (reveal: boolean) => {
    setSecretRevealed(reveal);
    if (reveal) {
      setConfettiActive(true);
      window.setTimeout(() => setConfettiActive(false), 2500);
    }
  };

  // Cinematic Matter-to-Dust Particle Disintegration
  const triggerDustDisintegration = (targetElement: HTMLElement) => {
    const canvas = dustCanvasRef.current;
    if (!canvas) return;

    const stage = targetElement.closest(".galleryStage") as HTMLElement | null;
    if (!stage) return;

    const stageRect = stage.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();

    if (canvas.width !== stageRect.width || canvas.height !== stageRect.height) {
      canvas.width = stageRect.width;
      canvas.height = stageRect.height;
    }

    const relX = targetRect.left - stageRect.left;
    const relY = targetRect.top - stageRect.top;
    const w = targetRect.width;
    const h = targetRect.height;

    const count = 320;
    const colors = ["#ffb0c8", "#ff7aa7", "#ffd1dc", "#ffffff", "#e89bb5", "#fcd5e2", "#ff4f8b", "#ffe4e6", "#fbcfe8"];

    const newParticles: DustParticle[] = [];
    for (let i = 0; i < count; i++) {
      const px = relX + Math.random() * w;
      const py = relY + Math.random() * h;
      const angle = (Math.random() - 0.5) * Math.PI * 0.9;
      const speed = 0.8 + Math.random() * 3.4;

      newParticles.push({
        x: px,
        y: py,
        vx: Math.sin(angle) * speed + (Math.random() - 0.45) * 1.6,
        vy: -Math.cos(angle) * speed * 0.7 - Math.random() * 1.5,
        size: 1.4 + Math.random() * 2.8,
        alpha: 0.96,
        decay: 0.01 + Math.random() * 0.013,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.12
      });
    }

    dustParticlesRef.current.push(...newParticles);

    if (dustAnimRef.current === null) {
      const animate = () => {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const particles = dustParticlesRef.current;
        const alive: DustParticle[] = [];

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.068; // gravity
          p.vx *= 0.985; // air drag
          p.alpha -= p.decay;
          p.size = Math.max(0.2, p.size * 0.988);
          p.rotation += p.vRot;

          if (p.alpha > 0.01 && p.size > 0.3) {
            alive.push(p);

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
            ctx.fillStyle = p.color;

            ctx.beginPath();
            ctx.arc(0, 0, p.size, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
          }
        }

        dustParticlesRef.current = alive;

        if (alive.length > 0) {
          dustAnimRef.current = requestAnimationFrame(animate);
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          dustAnimRef.current = null;
        }
      };

      dustAnimRef.current = requestAnimationFrame(animate);
    }
  };

  // Gallery interactions
  const openGalleryPhoto = (images: string[], index: number, isScattered: boolean, targetElement?: HTMLElement) => {
    if (isScattered) {
      if (targetElement) {
        triggerDustDisintegration(targetElement);
      }
      setGalleryScatter(true);
      setDustedPhotos((v) => (v.includes(index) ? v : [...v, index]));
      window.setTimeout(() => setGalleryScatter(false), 1050);
    } else {
      setGalleryViewer({ images, index });
    }
  };

  const closeGalleryPhoto = () => setGalleryViewer(null);
  const galleryPrev = () => {
    setGalleryViewer((v) => (v ? { ...v, index: (v.index - 1 + v.images.length) % v.images.length } : v));
  };
  const galleryNext = () => {
    setGalleryViewer((v) => (v ? { ...v, index: (v.index + 1) % v.images.length } : v));
  };
  const resetDustedPhotos = () => {
    setDustedPhotos([]);
    setGalleryScatter(false);
  };

  const themeColors = themes[project.theme || "dark"] ?? themes.dark;
  const activeBg = (project.cardBackgroundMode === "different" && currentBlock?.background)
    ? currentBlock.background
    : (project.background || "aurora");

  const containerStyle: CSSProperties = {
    "--card-opacity": (project.globalCardOpacity ?? 14) / 100,
    "--card-opacity-pct": `${project.globalCardOpacity ?? 14}%`,
    "--page-bg": project.backgroundBaseColor || themeColors[0],
    "--bg1": project.bgColor1 || themeColors[1],
    "--bg2": project.bgColor2 || themeColors[2],
    "--bg3": project.bgColor3 || (project.theme === "light" ? "#e8f7ff" : "#38bdf8"),
    "--bg4": project.bgColor4 || (project.theme === "light" ? "#fff0f5" : "#f59e0b"),
    "--bg-overlay": (project.backgroundOverlay ?? 18) / 100,
    "--accent": themeColors[1],
    "--accent2": themeColors[2],
    "--global-theme-text": project.globalTextColor || themeColors[3],
    "--global-text": project.globalTextColor || themeColors[3],
    "--story-spacing": `${project.globalSpacing ?? 18}px`,
    "--section-spacing": `${project.globalSpacing ?? 18}px`,
    "--global-radius": `${project.globalRadius ?? 21}px`,
    fontFamily: getFont(project.globalFont)
  } as CSSProperties;

  const getSectionStyle = (b: Block): CSSProperties => {
    const effectiveCardOpacity = typeof b.cardOpacity === "number" ? b.cardOpacity : (project.globalCardOpacity ?? 14);
    const headingFont = b.headingFont || b.font || project.globalFont || "serif";
    const bodyFont = b.bodyFont || project.globalFont || "sans";
    const titleFont = b.titleFont || "sans";
    const subtitleFont = b.subtitleFont || "sans";
    const headingColor = b.headingColor || project.globalTextColor || themeColors[3];
    const bodyColor = b.bodyColor || project.globalTextColor || themeColors[3];
    const subtitleColor = b.subtitleColor || (project.theme === "light" ? "#be185d" : "#ff9fc2");
    const emojiColor = b.emojiColor || (project.theme === "light" ? "#db2777" : "#ff86b0");

    return {
      fontFamily: getFont(headingFont),
      "--title-font": getFont(titleFont),
      "--subtitle-font": getFont(subtitleFont),
      "--heading-font": getFont(headingFont),
      "--body-font": getFont(bodyFont),
      "--local": b.accent,
      "--heading-size": `${b.headingSize}px`,
      "--body-size": `${b.bodySize}px`,
      "--line-height": b.lineHeight,
      "--letter-spacing": `${b.letterSpacing}px`,
      "--card-radius": `${b.radius}px`,
      "--story-spacing": `${project.globalSpacing ?? 18}px`,
      "--section-spacing": `${project.globalSpacing ?? 18}px`,
      "--global-text": project.globalTextColor || themeColors[3],
      "--heading-color": headingColor,
      "--subtitle-color": subtitleColor,
      "--body-color": bodyColor,
      "--emoji-color": emojiColor,
      "--card-color": b.cardColor || "#ffffff",
      "--section-card-opacity": `${effectiveCardOpacity}%`,
      "--card-opacity": `${effectiveCardOpacity / 100}`,
      "--card-opacity-pct": `${effectiveCardOpacity}%`,
      "--letter-color": b.letterColor || "#2d2024",
      "--letter-size": `${b.letterSize ?? 17}px`,
      "--letter-line-height": b.letterLineHeight ?? 1.8,
      "--letter-align": b.letterAlign ?? "left"
    } as CSSProperties;
  };

  const renderSectionContent = (b: Block) => {
    const style = getSectionStyle(b);
    const resolvedVideo =
      typeof b.memoryVideo === "string"
        ? b.memoryVideo
        : memoryVideoPreviews[b.id] || "";

    const heroAdj = b.imageAdjustments?.["hero"] ?? b.imageAdjustments?.["0"] ?? { scale: 100, x: 50, y: 50 };
    const emojiAnim = b.emojiAnimation || project.emojiAnimation || "floating";

    const nav = (
      <>
        {resolvedVideo && (
          <video
            className="memoryVideoPreview"
            src={resolvedVideo}
            controls
            playsInline
            preload="metadata"
          />
        )}
        <div className="actions">
          <button
            type="button"
            className="btn"
            disabled={currentSceneIndex === 0}
            onClick={() => setScene(currentSceneIndex - 1)}
          >
            <ArrowLeft size={16} /> Back
          </button>
          {currentSceneIndex < visibleBlocks.length - 1 ? (
            <button
              type="button"
              className="btn primary"
              onClick={() => setScene(currentSceneIndex + 1)}
            >
              Keep going <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                setScene(0);
                setSecretRevealed(false);
                setCandles([false, false, false]);
                setDustedPhotos([]);
              }}
            >
              <RotateCcw size={16} /> Replay
            </button>
          )}
        </div>
      </>
    );

    const editBadge = isEditable ? (
      <button
        type="button"
        className="previewEdit"
        onClick={() => onEditSection?.(b.id)}
      >
        <Pencil size={13} /> Edit this section
      </button>
    ) : null;

    if (b.type === "reasons") {
      return (
        <div className="sceneInner" style={style}>
          {editBadge}
          {isEditable ? (
            <>
              <button type="button" className={`editableDecor emoji-anim-${emojiAnim}`} onClick={() => onEditSection?.(b.id)}>
                {b.emoji}
              </button>
              <button type="button" className="editableText sectionKicker" onClick={() => onEditSection?.(b.id)}>
                {b.title}
              </button>
              <button type="button" className="editableText eyebrow" onClick={() => onEditSection?.(b.id)}>
                {b.subtitle}
              </button>
              <button type="button" className="editableText heroTitle" onClick={() => onEditSection?.(b.id)}>
                {b.heading}
              </button>
              <div className="heroTextWrap customScrollbar">
                <button type="button" className="editableText heroText" onClick={() => onEditSection?.(b.id)}>
                  {b.text}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className={`publicEmoji emoji-anim-${emojiAnim}`}>{b.emoji}</div>
              <div className="sectionKicker">{b.title}</div>
              <div className="eyebrow">{b.subtitle}</div>
              <h1 className="heroTitle">{b.heading}</h1>
              <div className="heroTextWrap customScrollbar">
                <p className="heroText">{b.text}</p>
              </div>
            </>
          )}

          <div className="cards">
            {(b.items ?? []).map((r, i) => (
              <article
                className="memoryCard"
                key={r.id || i}
                onClick={() => (isEditable ? onEditReason?.(b.id, i) : undefined)}
                style={{ cursor: isEditable ? "pointer" : "default" }}
              >
                {isEditable && (
                  <span className="cardEdit" title="Edit this reason">
                    <Pencil size={12} />
                  </span>
                )}
                <h3>
                  <span className={`emoji-anim-${emojiAnim}`} style={{ display: "inline-block", marginRight: "6px" }}>{r.emoji}</span>
                  {r.title}
                </h3>
                <p>{r.text}</p>
              </article>
            ))}
          </div>

          {isEditable && (
            <button type="button" className="addReasonPreview" onClick={onAddReason}>
              <span>+ Add another reason</span>
            </button>
          )}

          {nav}
        </div>
      );
    }

    if (b.type === "memories" || b.type === "gallery") {
      const images = b.images && b.images.length > 0 ? b.images : b.image ? [b.image] : [];
      const layout = b.galleryLayout || "collage";
      const isScattered = layout === "scattered";

      return (
        <div className={`sceneInner galleryPage layout-${layout}`} style={style}>
          {editBadge}
          {isEditable ? (
            <>
              <button type="button" className={`editableDecor emoji-anim-${emojiAnim}`} onClick={() => onEditSection?.(b.id)}>
                {b.emoji}
              </button>
              <button type="button" className="editableText sectionKicker" onClick={() => onEditSection?.(b.id)}>
                {b.title}
              </button>
              <button type="button" className="editableText eyebrow" onClick={() => onEditSection?.(b.id)}>
                {b.subtitle}
              </button>
              <button type="button" className="editableText heroTitle" onClick={() => onEditSection?.(b.id)}>
                {b.heading}
              </button>
              <div className="heroTextWrap customScrollbar">
                <button type="button" className="editableText heroText" onClick={() => onEditSection?.(b.id)}>
                  {b.text}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className={`publicEmoji emoji-anim-${emojiAnim}`}>{b.emoji}</div>
              <div className="sectionKicker">{b.title}</div>
              <div className="eyebrow">{b.subtitle}</div>
              <h1 className="heroTitle">{b.heading}</h1>
              <div className="heroTextWrap customScrollbar">
                <p className="heroText">{b.text}</p>
              </div>
            </>
          )}

          {isScattered && images.length > 0 && (
            <p className="scatteredTapHint">
              ✨ Tap a memory to see it disappear into dust ✨
            </p>
          )}

          {images.length > 0 ? (
            <div
              className={`galleryStage gallery-count-${Math.min(images.length, 20)} gallery-bg-${
                b.galleryBackground || "transparent"
              } ${galleryScatter && isScattered ? "scatter-active" : ""}`}
            >
              {/* Canvas Dust Disintegration Overlay */}
              {isScattered && <canvas ref={dustCanvasRef} className="galleryDustCanvas" />}

              <div className="galleryShape a" />
              <div className="galleryShape b" />
              {images.map((src, i) => {
                const adjustment: ImageAdjustment = b.imageAdjustments?.[String(i)] ?? {
                  scale: 100,
                  x: 50,
                  y: 50
                };
                const isDusted = dustedPhotos.includes(i);

                return (
                  <button
                    type="button"
                    className={`galleryPhoto galleryPhoto-${i + 1} ${
                      isScattered && isDusted ? "photo-dusted" : ""
                    }`}
                    key={`${i}-${src.slice(-10)}`}
                    aria-label={
                      isScattered
                        ? `Tap to dissolve memory ${i + 1}`
                        : `Open memory photo ${i + 1}`
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      openGalleryPhoto(images, i, isScattered, e.currentTarget);
                    }}
                  >
                    <img
                      src={src}
                      alt={`Memory ${i + 1}`}
                      style={{
                        transform: `scale(${adjustment.scale / 100})`,
                        objectPosition: `${adjustment.x}% ${adjustment.y}%`,
                        opacity: (b.imageOpacity ?? 100) / 100
                      }}
                    />
                    <span className="galleryPhotoHint">
                      {isScattered ? "✦ Disintegrate" : "🔍 Zoom"}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="photoFrame">
              <p style={{ padding: "30px 20px", color: "var(--muted)" }}>
                No memory photos added yet. Use the sidebar to add photos.
              </p>
            </div>
          )}

          {isScattered && dustedPhotos.length > 0 && (
            <button
              type="button"
              className="btn ghost small restoreMemories"
              onClick={resetDustedPhotos}
            >
              ↻ Restore memories
            </button>
          )}
          {nav}
        </div>
      );
    }

    if (b.type === "letter") {
      return (
        <div className="sceneInner letterScene" style={style}>
          {editBadge}
          {isEditable ? (
            <>
              <button type="button" className={`editableDecor emoji-anim-${emojiAnim}`} onClick={() => onEditSection?.(b.id)}>
                {b.emoji}
              </button>
              <button type="button" className="editableText sectionKicker" onClick={() => onEditSection?.(b.id)}>
                {b.title}
              </button>
              <button type="button" className="editableText eyebrow" onClick={() => onEditSection?.(b.id)}>
                {b.subtitle}
              </button>
              <button type="button" className="editableText heroTitle scriptTitle" onClick={() => onEditSection?.(b.id)}>
                {b.heading}
              </button>
              <button type="button" className="letter editableLetter" onClick={() => onEditSection?.(b.id)}>
                {b.image && (
                  <div className="letterPhotoMount">
                    <img
                      src={b.image}
                      alt="Letter memory"
                      style={{
                        transform: `scale(${(heroAdj.scale ?? 100) / 100})`,
                        objectPosition: `${heroAdj.x ?? 50}% ${heroAdj.y ?? 50}%`
                      }}
                    />
                  </div>
                )}
                <h2 style={{ fontFamily: getFont(b.headingFont) }}>{b.heading}</h2>
                <div className="letterBodyWrap customScrollbar">
                  <p style={{ fontFamily: getFont(b.bodyFont) }}>{b.text}</p>
                </div>
              </button>
            </>
          ) : (
            <>
              <div className={`publicEmoji emoji-anim-${emojiAnim}`}>{b.emoji}</div>
              <div className="sectionKicker">{b.title}</div>
              <div className="eyebrow">{b.subtitle}</div>
              <h1 className="heroTitle scriptTitle">{b.heading}</h1>
              <article className="letter">
                {b.image && (
                  <div className="letterPhotoMount">
                    <img
                      src={b.image}
                      alt="Letter memory"
                      style={{
                        transform: `scale(${(heroAdj.scale ?? 100) / 100})`,
                        objectPosition: `${heroAdj.x ?? 50}% ${heroAdj.y ?? 50}%`
                      }}
                    />
                  </div>
                )}
                <h2 style={{ fontFamily: getFont(b.headingFont) }}>{b.heading}</h2>
                <div className="letterBodyWrap customScrollbar">
                  <p style={{ fontFamily: getFont(b.bodyFont) }}>{b.text}</p>
                </div>
              </article>
            </>
          )}
          {nav}
        </div>
      );
    }

    if (b.type === "secret") {
      return (
        <div className="sceneInner secretScene" style={style}>
          {editBadge}
          {isEditable ? (
            <>
              <button type="button" className={`editableDecor secretHeart emoji-anim-${emojiAnim}`} onClick={() => onEditSection?.(b.id)}>
                {b.emoji}
              </button>
              <button type="button" className="editableText sectionKicker" onClick={() => onEditSection?.(b.id)}>
                {b.title}
              </button>
              <button type="button" className="editableText eyebrow" onClick={() => onEditSection?.(b.id)}>
                {b.subtitle}
              </button>
              <button type="button" className="editableText heroTitle" onClick={() => onEditSection?.(b.id)}>
                {b.heading}
              </button>
            </>
          ) : (
            <>
              <div className={`publicEmoji secretHeart emoji-anim-${emojiAnim}`}>{b.emoji}</div>
              <div className="sectionKicker">{b.title}</div>
              <div className="eyebrow">{b.subtitle}</div>
              <h1 className="heroTitle">{b.heading}</h1>
            </>
          )}

          {!secretRevealed ? (
            <>
              <div className="heroTextWrap customScrollbar">
                <p className="heroText">{b.text}</p>
              </div>
              <button
                type="button"
                className="btn primary revealBtn"
                onClick={() => handleSecretToggle(true)}
              >
                Tap to reveal <span>♥</span>
              </button>
            </>
          ) : (
            <div className="secretReveal">
              <span>✦</span>
              <h2>{b.text}</h2>
              <button
                type="button"
                className="btn"
                onClick={() => handleSecretToggle(false)}
              >
                Hide again
              </button>
            </div>
          )}
          {nav}
        </div>
      );
    }

    if (b.type === "cake") {
      return (
        <div className="sceneInner cakeScene" style={style}>
          {editBadge}
          {isEditable ? (
            <>
              <button type="button" className="editableText sectionKicker" onClick={() => onEditSection?.(b.id)}>
                {b.title}
              </button>
              <button type="button" className="editableText eyebrow" onClick={() => onEditSection?.(b.id)}>
                {b.subtitle}
              </button>
              <button type="button" className="editableText heroTitle" onClick={() => onEditSection?.(b.id)}>
                {b.heading}
              </button>
            </>
          ) : (
            <>
              <div className="sectionKicker">{b.title}</div>
              <div className="eyebrow">{b.subtitle}</div>
              <h1 className="heroTitle">{b.heading}</h1>
            </>
          )}

          <div className="cakeGraphic">
            <div className="cakePlate" />
            <div className="cakeBody">
              <div className="cakeTop" />
              <div className="cakeCream" />
            </div>
            <div className="candles">
              {candles.map((off, i) => (
                <span className="candleWrap" key={i}>
                  <span className={`flame ${off ? "flameOff" : ""}`} />
                  {smoke.includes(i) && <span className="smokePuff" />}
                  <button
                    type="button"
                    aria-label={`Candle ${i + 1}`}
                    className={`candleStick ${off ? "off" : ""}`}
                    onClick={blowCandle}
                  />
                </span>
              ))}
            </div>
          </div>
          <div className="heroTextWrap customScrollbar">
            <p className="heroText">
              Tap a candle to blow it out. Watch the flame flicker, fade and leave a soft trail of smoke.
            </p>
          </div>
          <button type="button" className="btn" onClick={blowCandle}>
            Blow a candle
          </button>
          {nav}
        </div>
      );
    }

    // Default / welcome / text / image / music / custom
    return (
      <div className="sceneInner" style={style}>
        {editBadge}
        {isEditable ? (
          <>
            <button type="button" className={`editableDecor emoji-anim-${emojiAnim}`} onClick={() => onEditSection?.(b.id)}>
              {b.emoji}
            </button>
            <button type="button" className="editableText sectionKicker" onClick={() => onEditSection?.(b.id)}>
              {b.title}
            </button>
            <button type="button" className="editableText eyebrow" onClick={() => onEditSection?.(b.id)}>
              {b.subtitle}
            </button>
            <button type="button" className="editableText heroTitle" onClick={() => onEditSection?.(b.id)}>
              {b.heading}
            </button>
            <div className="heroTextWrap customScrollbar">
              <button type="button" className="editableText heroText" onClick={() => onEditSection?.(b.id)}>
                {b.text}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className={`publicEmoji emoji-anim-${emojiAnim}`}>{b.emoji}</div>
            <div className="sectionKicker">{b.title}</div>
            <div className="eyebrow">{b.subtitle}</div>
            <h1 className="heroTitle">{b.heading}</h1>
            <div className="heroTextWrap customScrollbar">
              <p className="heroText">{b.text}</p>
            </div>
          </>
        )}
        {b.image && (
          <div className="photoFrame">
            <img
              className="photo"
              src={b.image}
              alt=""
              style={{
                opacity: (b.imageOpacity ?? 100) / 100,
                transform: `scale(${(heroAdj.scale ?? 100) / 100})`,
                objectPosition: `${heroAdj.x ?? 50}% ${heroAdj.y ?? 50}%`,
                transformOrigin: `${heroAdj.x ?? 50}% ${heroAdj.y ?? 50}%`
              }}
            />
          </div>
        )}
        {nav}
      </div>
    );
  };

  return (
    <section
      className={`preview preview-${previewDevice} bg-${activeBg} theme-${
        project.theme || "dark"
      } motion-${project.globalMotion || "cinematic"}`}
      style={containerStyle}
    >
      {/* Lightbox for gallery */}
      {galleryViewer && (
        <div
          className="galleryLightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Memory photo viewer"
          onClick={closeGalleryPhoto}
        >
          <button
            type="button"
            className="galleryLightboxClose"
            aria-label="Close photo viewer"
            onClick={closeGalleryPhoto}
          >
            <X size={20} />
          </button>
          <button
            type="button"
            className="galleryLightboxNav prev"
            aria-label="Previous photo"
            onClick={(e) => {
              e.stopPropagation();
              galleryPrev();
            }}
          >
            <ArrowLeft size={24} />
          </button>
          <div className="galleryLightboxContent" onClick={(e) => e.stopPropagation()}>
            <img
              key={galleryViewer.index}
              src={galleryViewer.images[galleryViewer.index]}
              alt={`Memory ${galleryViewer.index + 1}`}
            />
            <span>
              {galleryViewer.index + 1} / {galleryViewer.images.length}
            </span>
          </div>
          <button
            type="button"
            className="galleryLightboxNav next"
            aria-label="Next photo"
            onClick={(e) => {
              e.stopPropagation();
              galleryNext();
            }}
          >
            <ArrowRight size={24} />
          </button>
        </div>
      )}

      {/* Background Layers with Complete Cover & Rotation Support */}
      {project.customBg && (
        <>
          <div className="customBgContainer">
            <div
              className="customBgImage"
              style={{
                backgroundImage: `url("${project.customBg}")`,
                opacity: (project.customBgOpacity ?? 100) / 100,
                transform: `scale(${Math.max(1, (project.customBgScale ?? 100) / 100)}) rotate(${project.customBgRotation ?? 0}deg)`,
                backgroundPosition: `${project.customBgPositionX ?? 50}% ${
                  project.customBgPositionY ?? 50
                }%`
              }}
            />
          </div>
          <div
            className="backgroundOverlayLayer"
            style={{ opacity: (project.backgroundOverlay ?? 18) / 100 }}
          />
        </>
      )}

      {/* Optimized Particles */}
      {activeBg === "petals" && <Particles type="petals" count={22} />}
      {activeBg === "stars" && <Particles type="stars" count={25} />}
      {confettiActive && <Particles type="confetti" count={40} />}

      {/* Audio Element */}
      {activeAudioUrl && (
        <audio
          ref={audioRef}
          aria-hidden="true"
          style={{ display: "none" }}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
      )}

      {/* Interactive Controls Overlay */}
      <div className="previewToolbar">
        {activeAudioUrl && (
          <div className="previewAudio" style={{ marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                type="button"
                className="btn small"
                style={{ padding: "4px 8px", borderRadius: "999px" }}
                onClick={() => {
                  const el = audioRef.current;
                  if (!el) return;
                  if (playing) {
                    el.pause();
                    setPlaying(false);
                  } else {
                    void el.play().then(() => setPlaying(true)).catch(() => {});
                  }
                }}
              >
                {playing ? <Pause size={12} /> : <Play size={12} />}
              </button>
              <span style={{ fontSize: "11px", color: "#ddd", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                <Volume2 size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
                {activeAudioName}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Progress Dots */}
      <div className="progress">
        {visibleBlocks.map((_, i) => (
          <i
            key={i}
            className={i <= currentSceneIndex ? "on" : ""}
            onClick={() => setScene(i)}
            style={{ cursor: "pointer" }}
          />
        ))}
      </div>

      {/* Current Scene Content */}
      {currentBlock && renderSectionContent(currentBlock)}
    </section>
  );
}
