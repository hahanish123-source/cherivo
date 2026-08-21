"use client";

import { useEffect, useMemo, useState, useRef, type CSSProperties } from "react";
import type { Block, BlockType, GreetingProject, ImageAdjustment } from "@/lib/types";
import { defaultBlocks, getFont, themes, incidentDefaults, reasonDefaults } from "@/lib/greetingConfig";
import Particles from "./Particles";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  Heart,
  Music2,
  Pause,
  Pencil,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  X
} from "lucide-react";

interface DustParticle {
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
}

export default function GreetingView({
  project,
  isEditable = false,
  selectedBlockId,
  onSelectBlock,
  onEditSection,
  onEditReason,
  onAddReason,
  onEditIncident,
  onAddIncident,
  onOpenResponseModal,
  previewDevice = "desktop",
  title = "A Hanora moment",
  memoryVideoPreviews = {},
  customBgPreviews = {}
}: {
  project: GreetingProject;
  sceneIndex?: number;
  onSceneChange?: (scene: number) => void;
  isEditable?: boolean;
  selectedBlockId?: string;
  onSelectBlock?: (blockId: string) => void;
  onEditSection?: (blockId: string) => void;
  onEditReason?: (blockId: string, reasonIndex: number) => void;
  onAddReason?: () => void;
  onEditIncident?: (blockId: string, incidentIndex: number) => void;
  onAddIncident?: () => void;
  onOpenResponseModal?: () => void;
  previewDevice?: "mobile" | "desktop";
  title?: string;
  memoryVideoPreviews?: Record<string, string>;
  customBgPreviews?: Record<string, string>;
}) {
  const visibleBlocks = useMemo(
    () => (project.blocks ?? defaultBlocks).filter((b) => b.visible),
    [project.blocks]
  );

  // Active section scrolling sync
  useEffect(() => {
    if (selectedBlockId) {
      const el = document.getElementById(`section-${selectedBlockId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [selectedBlockId]);

  // Interactive states
  const [candles, setCandles] = useState<boolean[]>([false, false, false]);
  const [smoke, setSmoke] = useState<number[]>([]);
  const [candleFinale, setCandleFinale] = useState(false);
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

  // Keyboard Escape listener to close photo lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && galleryViewer) {
        setGalleryViewer(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [galleryViewer]);

  const activeAudioUrl =
    typeof project.audioUrl === "string"
      ? project.audioUrl
      : "";

  const activeAudioName = project.audioName || "Your song";

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
      setCandleFinale(true);
      window.setTimeout(() => {
        setConfettiActive(false);
      }, 3800);
    }
  };

  const relightCandles = () => {
    setCandles([false, false, false]);
    setSmoke([]);
    setCandleFinale(false);
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

    const count = 55;
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
          p.vy += 0.068;
          p.vx *= 0.985;
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

  const openGalleryPhoto = (images: string[], index: number, isScattered: boolean, targetElement?: HTMLElement) => {
    if (isScattered && targetElement) {
      triggerDustDisintegration(targetElement);
    }
    setGalleryViewer({ images, index });
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
  const isDifferentBg = project.cardBackgroundMode === "different";
  const activeBg = project.background || "aurora";

  const rawCustomBg = project.customBg;
  let activeCustomBg = "";
  if (typeof rawCustomBg === "string") {
    activeCustomBg = customBgPreviews[rawCustomBg] || rawCustomBg;
  } else if (rawCustomBg && typeof rawCustomBg === "object") {
    const p = (rawCustomBg as any).path;
    const u = (rawCustomBg as any).url;
    activeCustomBg = (p && customBgPreviews[p]) || u || (typeof p === "string" && (p.startsWith("http") || p.startsWith("data:")) ? p : "");
  }
  const activeCustomBgOpacity = project.customBgOpacity;
  const activeCustomBgScale = project.customBgScale;
  const activeCustomBgPositionX = project.customBgPositionX;
  const activeCustomBgPositionY = project.customBgPositionY;
  const activeCustomBgRotation = project.customBgRotation;
  const activeBgOverlay = project.backgroundOverlay;

  const activeBaseColor = project.backgroundBaseColor || themeColors[0];
  const activeBg1 = project.bgColor1 || themeColors[1];
  const activeBg2 = project.bgColor2 || themeColors[2];
  const activeBg3 = project.bgColor3 || (project.theme === "light" ? "#e8f7ff" : "#38bdf8");
  const activeBg4 = project.bgColor4 || (project.theme === "light" ? "#fff0f5" : "#f59e0b");

  const containerStyle: CSSProperties = {
    "--card-opacity": (project.globalCardOpacity ?? 14) / 100,
    "--card-opacity-pct": `${project.globalCardOpacity ?? 14}%`,
    "--page-bg": activeBaseColor,
    "--bg1": activeBg1,
    "--bg2": activeBg2,
    "--bg3": activeBg3,
    "--bg4": activeBg4,
    "--bg-overlay": (activeBgOverlay ?? 18) / 100,
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
    const titleFont = b.titleFont || project.globalFont || "sans";
    const subtitleFont = b.subtitleFont || project.globalFont || "sans";
    const letterFont = b.letterFont || project.globalFont || "serif";
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
      "--letter-font": getFont(letterFont),
      "--local": b.accent,
      "--title-size": `${b.titleSize ?? 12}px`,
      "--subtitle-size": `${b.subtitleSize ?? 13}px`,
      "--heading-size": `${b.headingSize ?? 70}px`,
      "--body-size": `${b.bodySize ?? 17}px`,
      "--emoji-size": `${b.emojiSize ?? 48}px`,
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

  const handleSelect = (blockId: string) => {
    if (!isEditable) return;
    if (onSelectBlock) {
      onSelectBlock(blockId);
    } else if (onEditSection) {
      onEditSection(blockId);
    }
  };

  const scrollToSection = (targetId: string) => {
    const el = document.getElementById(`section-${targetId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Render individual section card
  const renderSectionContent = (b: Block, index: number, total: number) => {
    const style = getSectionStyle(b);
    const resolvedVideo =
      typeof b.memoryVideo === "string"
        ? b.memoryVideo
        : memoryVideoPreviews[b.id] || "";

    const heroAdj = b.imageAdjustments?.["hero"] ?? b.imageAdjustments?.["0"] ?? { scale: 100, x: 50, y: 50 };
    const emojiAnim = b.emojiAnimation || project.emojiAnimation || "floating";
    const isSelected = selectedBlockId === b.id;

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
        <div className="actions" onClick={(e) => e.stopPropagation()}>
          {index > 0 ? (
            <button
              type="button"
              className="btn"
              onClick={(e) => {
                e.stopPropagation();
                const prevBlock = visibleBlocks[index - 1];
                if (prevBlock) {
                  scrollToSection(prevBlock.id);
                  if (isEditable) handleSelect(prevBlock.id);
                }
              }}
            >
              <ArrowLeft size={16} /> Back
            </button>
          ) : (
            <span />
          )}

          {index < total - 1 ? (
            <button
              type="button"
              className="btn primary"
              onClick={(e) => {
                e.stopPropagation();
                const nextBlock = visibleBlocks[index + 1];
                if (nextBlock) {
                  scrollToSection(nextBlock.id);
                  if (isEditable) handleSelect(nextBlock.id);
                }
              }}
            >
              Keep going <ArrowRight size={16} />
            </button>
          ) : (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
              {!isEditable && onOpenResponseModal && (
                <button
                  type="button"
                  className="btn primary replyBtn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenResponseModal();
                  }}
                  style={{ background: "linear-gradient(135deg, #ff4f8b 0%, #7c5cff 100%)", color: "#fff", fontWeight: 600 }}
                >
                  💌 Reply to Greeting
                </button>
              )}
              <button
                type="button"
                className="btn primary"
                onClick={(e) => {
                  e.stopPropagation();
                  if (visibleBlocks[0]) {
                    scrollToSection(visibleBlocks[0].id);
                    if (isEditable) handleSelect(visibleBlocks[0].id);
                  }
                  setSecretRevealed(false);
                  setCandles([false, false, false]);
                  setDustedPhotos([]);
                }}
              >
                <RotateCcw size={16} /> Replay
              </button>
            </div>
          )}
        </div>
      </>
    );

    const editBadge = isEditable ? (
      <button
        type="button"
        className={`previewEdit ${isSelected ? "activeEditing" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          handleSelect(b.id);
        }}
      >
        <Pencil size={12} /> {isSelected ? "Editing this section" : "Edit section"}
      </button>
    ) : null;

    if (b.type === "reasons") {
      return (
        <div
          className={`sceneInner ${isEditable && isSelected ? "selectedBlockIndicator" : ""}`}
          style={{ ...style, cursor: isEditable ? "pointer" : "default" }}
          onClick={() => handleSelect(b.id)}
        >
          {editBadge}
          {isEditable ? (
            <>
              <button type="button" className={`editableDecor emoji-anim-${emojiAnim}`} onClick={(e) => { e.stopPropagation(); handleSelect(b.id); }}>
                {b.emoji}
              </button>
              <button type="button" className="editableText sectionKicker" onClick={(e) => { e.stopPropagation(); handleSelect(b.id); }}>
                {b.title}
              </button>
              <button type="button" className="editableText eyebrow" onClick={(e) => { e.stopPropagation(); handleSelect(b.id); }}>
                {b.subtitle}
              </button>
              <button type="button" className="editableText heroTitle" onClick={(e) => { e.stopPropagation(); handleSelect(b.id); }}>
                {b.heading}
              </button>
              <div className="heroTextWrap customScrollbar">
                <button type="button" className="editableText heroText" onClick={(e) => { e.stopPropagation(); handleSelect(b.id); }}>
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
                onClick={(e) => {
                  if (isEditable) {
                    e.stopPropagation();
                    handleSelect(b.id);
                    onEditReason?.(b.id, i);
                  }
                }}
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
            <button
              type="button"
              className="addReasonPreview"
              onClick={(e) => {
                e.stopPropagation();
                onAddReason?.();
              }}
            >
              <span>+ Add another reason</span>
            </button>
          )}

          {nav}
        </div>
      );
    }

    if (b.type === "incidents") {
      return (
        <div
          className={`sceneInner incidentsScene ${isEditable && isSelected ? "selectedBlockIndicator" : ""}`}
          style={{ ...style, cursor: isEditable ? "pointer" : "default" }}
          onClick={() => handleSelect(b.id)}
        >
          {editBadge}
          {isEditable ? (
            <>
              <button type="button" className={`editableDecor emoji-anim-${emojiAnim}`} onClick={(e) => { e.stopPropagation(); handleSelect(b.id); }}>
                {b.emoji}
              </button>
              <button type="button" className="editableText sectionKicker" onClick={(e) => { e.stopPropagation(); handleSelect(b.id); }}>
                {b.title}
              </button>
              <button type="button" className="editableText eyebrow" onClick={(e) => { e.stopPropagation(); handleSelect(b.id); }}>
                {b.subtitle}
              </button>
              <button type="button" className="editableText heroTitle" onClick={(e) => { e.stopPropagation(); handleSelect(b.id); }}>
                {b.heading}
              </button>
              <div className="heroTextWrap customScrollbar">
                <button type="button" className="editableText heroText" onClick={(e) => { e.stopPropagation(); handleSelect(b.id); }}>
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

          <div className="incidentCards">
            {(b.incidents ?? []).map((inc, i) => (
              <article
                className="incidentCard"
                key={inc.id || i}
                onClick={(e) => {
                  if (isEditable) {
                    e.stopPropagation();
                    handleSelect(b.id);
                    onEditIncident?.(b.id, i);
                  }
                }}
                style={{ cursor: isEditable ? "pointer" : "default" }}
              >
                {isEditable && (
                  <span className="cardEdit" title="Edit this incident">
                    <Pencil size={12} />
                  </span>
                )}
                <div className="incidentCardHeader">
                  <span className="incidentTag">{inc.tag || `Incident #${i + 1}`}</span>
                  {inc.date && <span className="incidentDate">{inc.date}</span>}
                </div>
                <h3>
                  <span className={`emoji-anim-${emojiAnim}`} style={{ display: "inline-block", marginRight: "8px" }}>{inc.emoji}</span>
                  {inc.title}
                </h3>
                <p>{inc.text}</p>
                {inc.image && (
                  <div
                    className="incidentPhoto"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isEditable) {
                        handleSelect(b.id);
                        onEditIncident?.(b.id, i);
                      } else {
                        openGalleryPhoto([inc.image!], 0, false);
                      }
                    }}
                    title={isEditable ? "Edit incident photo" : "Click to zoom photo"}
                  >
                    <img src={inc.image} alt={inc.title} style={{ opacity: (b.imageOpacity ?? 100) / 100 }} />
                  </div>
                )}
              </article>
            ))}
          </div>

          {isEditable && (
            <button
              type="button"
              className="addReasonPreview"
              onClick={(e) => {
                e.stopPropagation();
                onAddIncident?.();
              }}
            >
              <span>+ Add another incident</span>
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
        <div
          className={`sceneInner galleryPage layout-${layout} ${isEditable && isSelected ? "selectedBlockIndicator" : ""}`}
          style={{ ...style, cursor: isEditable ? "pointer" : "default" }}
          onClick={() => handleSelect(b.id)}
        >
          {editBadge}
          {isEditable ? (
            <>
              <button type="button" className={`editableDecor emoji-anim-${emojiAnim}`} onClick={(e) => { e.stopPropagation(); handleSelect(b.id); }}>
                {b.emoji}
              </button>
              <button type="button" className="editableText sectionKicker" onClick={(e) => { e.stopPropagation(); handleSelect(b.id); }}>
                {b.title}
              </button>
              <button type="button" className="editableText eyebrow" onClick={(e) => { e.stopPropagation(); handleSelect(b.id); }}>
                {b.subtitle}
              </button>
              <button type="button" className="editableText heroTitle" onClick={(e) => { e.stopPropagation(); handleSelect(b.id); }}>
                {b.heading}
              </button>
              <div className="heroTextWrap customScrollbar">
                <button type="button" className="editableText heroText" onClick={(e) => { e.stopPropagation(); handleSelect(b.id); }}>
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
              Tap a photo to explore our memories ❤️
            </p>
          )}

          {images.length > 0 ? (
            <div
              className={`galleryStage gallery-count-${Math.min(images.length, 20)} gallery-bg-${
                b.galleryBackground || "transparent"
              } ${galleryScatter && isScattered ? "scatter-active" : ""}`}
              onClick={(e) => {
                if (isEditable) {
                  e.stopPropagation();
                  handleSelect(b.id);
                }
              }}
            >
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
                      if (isEditable) {
                        handleSelect(b.id);
                      } else {
                        openGalleryPhoto(images, i, isScattered, e.currentTarget);
                      }
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
                      {isEditable ? "✏️ Edit" : isScattered ? "✦ Disintegrate" : "🔍 Zoom"}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div
              className="photoFrame"
              onClick={(e) => {
                if (isEditable) {
                  e.stopPropagation();
                  handleSelect(b.id);
                }
              }}
            >
              <p style={{ padding: "30px 20px", color: "var(--muted)" }}>
                No memory photos added yet. Tap here to add photos in the editor.
              </p>
            </div>
          )}

          {isScattered && dustedPhotos.length > 0 && (
            <button
              type="button"
              className="btn ghost small restoreMemories"
              onClick={(e) => {
                e.stopPropagation();
                resetDustedPhotos();
              }}
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
        <div
          className={`sceneInner letterScene ${isEditable && isSelected ? "selectedBlockIndicator" : ""}`}
          style={{ ...style, cursor: isEditable ? "pointer" : "default" }}
          onClick={() => handleSelect(b.id)}
        >
          {editBadge}
          {isEditable ? (
            <>
              <button type="button" className={`editableDecor emoji-anim-${emojiAnim}`} onClick={(e) => { e.stopPropagation(); handleSelect(b.id); }}>
                {b.emoji}
              </button>
              <button type="button" className="editableText sectionKicker" onClick={(e) => { e.stopPropagation(); handleSelect(b.id); }}>
                {b.title}
              </button>
              <button type="button" className="editableText eyebrow" onClick={(e) => { e.stopPropagation(); handleSelect(b.id); }}>
                {b.subtitle}
              </button>
              <button type="button" className="editableText heroTitle" onClick={(e) => { e.stopPropagation(); handleSelect(b.id); }}>
                {b.heading}
              </button>
              <button type="button" className="letter editableLetter" onClick={(e) => { e.stopPropagation(); handleSelect(b.id); }}>
                {b.image && (
                  <div className="letterPhotoMount">
                    <img
                      src={b.image}
                      alt="Letter memory"
                      style={{
                        transform: `scale(${(heroAdj.scale ?? 100) / 100})`,
                        objectPosition: `${heroAdj.x ?? 50}% ${heroAdj.y ?? 50}%`,
                        opacity: (b.imageOpacity ?? 100) / 100
                      }}
                    />
                  </div>
                )}
                <h2>{b.heading}</h2>
                <div className="letterBodyWrap customScrollbar">
                  <p>{b.text}</p>
                </div>
              </button>
            </>
          ) : (
            <>
              <div className={`publicEmoji emoji-anim-${emojiAnim}`}>{b.emoji}</div>
              <div className="sectionKicker">{b.title}</div>
              <div className="eyebrow">{b.subtitle}</div>
              <h1 className="heroTitle">{b.heading}</h1>
              <article className="letter">
                {b.image && (
                  <div className="letterPhotoMount">
                    <img
                      src={b.image}
                      alt="Letter memory"
                      style={{
                        transform: `scale(${(heroAdj.scale ?? 100) / 100})`,
                        objectPosition: `${heroAdj.x ?? 50}% ${heroAdj.y ?? 50}%`,
                        opacity: (b.imageOpacity ?? 100) / 100
                      }}
                    />
                  </div>
                )}
                <h2>{b.heading}</h2>
                <div className="letterBodyWrap customScrollbar">
                  <p>{b.text}</p>
                </div>
              </article>
            </>
          )}
          {nav}
        </div>
      );
    }

    if (b.type === "secret") {
      const secretImg = b.secretImage || b.image;
      const resolvedSecretVideo =
        typeof b.secretVideo === "string"
          ? b.secretVideo
          : typeof b.memoryVideo === "string"
          ? b.memoryVideo
          : memoryVideoPreviews[b.id] || "";

      return (
        <div
          className={`sceneInner secretScene ${isEditable && isSelected ? "selectedBlockIndicator" : ""}`}
          style={{ ...style, cursor: isEditable ? "pointer" : "default" }}
          onClick={() => handleSelect(b.id)}
        >
          {editBadge}
          {isEditable ? (
            <>
              <button type="button" className={`editableDecor secretHeart emoji-anim-${emojiAnim}`} onClick={(e) => { e.stopPropagation(); handleSelect(b.id); }}>
                {b.emoji}
              </button>
              <button type="button" className="editableText sectionKicker" onClick={(e) => { e.stopPropagation(); handleSelect(b.id); }}>
                {b.title}
              </button>
              <button type="button" className="editableText eyebrow" onClick={(e) => { e.stopPropagation(); handleSelect(b.id); }}>
                {b.subtitle}
              </button>
              <button type="button" className="editableText heroTitle" onClick={(e) => { e.stopPropagation(); handleSelect(b.id); }}>
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
                onClick={(e) => {
                  if (isEditable) {
                    e.stopPropagation();
                    handleSelect(b.id);
                  } else {
                    handleSecretToggle(true);
                  }
                }}
              >
                {isEditable ? "✏️ Edit Tap-to-Reveal" : "Tap to reveal ♥"}
              </button>
            </>
          ) : (
            <div
              className="secretReveal"
              onClick={(e) => {
                if (isEditable) {
                  e.stopPropagation();
                  handleSelect(b.id);
                }
              }}
            >
              <span>✦</span>
              <h2>{b.text}</h2>
              {secretImg && (
                <div
                  className="secretPhotoMount"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isEditable) {
                      handleSelect(b.id);
                    } else {
                      openGalleryPhoto([secretImg], 0, false);
                    }
                  }}
                  style={{ cursor: "pointer", marginTop: "14px" }}
                >
                  <img src={secretImg} alt="Secret memory" style={{ opacity: (b.imageOpacity ?? 100) / 100 }} />
                </div>
              )}
              {resolvedSecretVideo && (
                <div style={{ marginTop: "14px", width: "100%", maxWidth: "420px" }}>
                  <video
                    className="memoryVideoPreview"
                    src={resolvedSecretVideo}
                    controls
                    autoPlay
                    playsInline
                    preload="metadata"
                  />
                </div>
              )}
              <button
                type="button"
                className="btn"
                style={{ marginTop: "16px" }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSecretToggle(false);
                }}
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
        <div
          className={`sceneInner cakeScene ${isEditable && isSelected ? "selectedBlockIndicator" : ""}`}
          style={{ ...style, cursor: isEditable ? "pointer" : "default" }}
          onClick={() => handleSelect(b.id)}
        >
          {editBadge}
          {isEditable ? (
            <>
              <button type="button" className="editableText sectionKicker" onClick={(e) => { e.stopPropagation(); handleSelect(b.id); }}>
                {b.title}
              </button>
              <button type="button" className="editableText eyebrow" onClick={(e) => { e.stopPropagation(); handleSelect(b.id); }}>
                {b.subtitle}
              </button>
              <button type="button" className="editableText heroTitle" onClick={(e) => { e.stopPropagation(); handleSelect(b.id); }}>
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

          {!candleFinale ? (
            <>
              <div
                className="cakeGraphic"
                onClick={(e) => {
                  if (isEditable) {
                    e.stopPropagation();
                    handleSelect(b.id);
                  }
                }}
              >
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
                        onClick={(e) => {
                          e.stopPropagation();
                          blowCandle();
                        }}
                      />
                    </span>
                  ))}
                </div>
              </div>
              <div className="heroTextWrap customScrollbar">
                <p className="heroText">
                  {b.text || "Tap a candle to blow it out. Make a special wish for the year ahead ✨"}
                </p>
              </div>
              <button
                type="button"
                className="btn primary"
                onClick={(e) => {
                  e.stopPropagation();
                  blowCandle();
                }}
                style={{ marginTop: "12px" }}
              >
                🎂 Blow a candle
              </button>
            </>
          ) : (
            <div className="candleFinaleWrap">
              <div className="candleFinaleEmojis">
                <span>🎂</span>
                <span>✨</span>
                <span>🎉</span>
                <span>🎁</span>
                <span>❤️</span>
              </div>
              <h2 className="candleFinaleTitle">Happy Birthday, once again! 🎂✨❤️</h2>
              <p className="candleFinaleMessage">
                May your special day be filled with endless joy, magic, and sweet memories. May all your dreams come true!
              </p>
              <div className="candleFinaleActions">
                <button
                  type="button"
                  className="btn ghost small"
                  onClick={(e) => {
                    e.stopPropagation();
                    relightCandles();
                  }}
                >
                  🕯️ Relight candles
                </button>
                {onOpenResponseModal && (
                  <button
                    type="button"
                    className="btn primary small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenResponseModal();
                    }}
                  >
                    💌 Send a Response
                  </button>
                )}
              </div>
            </div>
          )}

          {nav}
        </div>
      );
    }

    // Default / welcome / text / image / music / custom
    return (
      <div
        className={`sceneInner ${isEditable && isSelected ? "selectedBlockIndicator" : ""}`}
        style={{ ...style, cursor: isEditable ? "pointer" : "default" }}
        onClick={() => handleSelect(b.id)}
      >
        {editBadge}
        {isEditable ? (
          <>
            <button type="button" className={`editableDecor emoji-anim-${emojiAnim}`} onClick={(e) => { e.stopPropagation(); handleSelect(b.id); }}>
              {b.emoji}
            </button>
            <button type="button" className="editableText sectionKicker" onClick={(e) => { e.stopPropagation(); handleSelect(b.id); }}>
              {b.title}
            </button>
            <button type="button" className="editableText eyebrow" onClick={(e) => { e.stopPropagation(); handleSelect(b.id); }}>
              {b.subtitle}
            </button>
            <button type="button" className="editableText heroTitle" onClick={(e) => { e.stopPropagation(); handleSelect(b.id); }}>
              {b.heading}
            </button>
            <div className="heroTextWrap customScrollbar">
              <button type="button" className="editableText heroText" onClick={(e) => { e.stopPropagation(); handleSelect(b.id); }}>
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
          <div
            className="photoFrame"
            onClick={(e) => {
              if (isEditable) {
                e.stopPropagation();
                handleSelect(b.id);
              }
            }}
            style={{ cursor: isEditable ? "pointer" : "default" }}
          >
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
      {activeCustomBg && (
        <>
          <div className="customBgContainer">
            <div
              className="customBgImage"
              style={{
                backgroundImage: `url("${activeCustomBg}")`,
                opacity: (activeCustomBgOpacity ?? 100) / 100,
                transform: `scale(${Math.max(1, (activeCustomBgScale ?? 100) / 100)}) rotate(${activeCustomBgRotation ?? 0}deg)`,
                backgroundPosition: `${activeCustomBgPositionX ?? 50}% ${
                  activeCustomBgPositionY ?? 50
                }%`
              }}
            />
          </div>
          <div
            className="backgroundOverlayLayer"
            style={{ opacity: (activeBgOverlay ?? 18) / 100 }}
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

      {/* Top Preview Controls */}
      <div className="previewToolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
        {activeAudioUrl && (
          <div className="previewAudio">
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

        {/* Section Jump Quick Progress Dots */}
        <div className="progress" style={{ marginLeft: "auto" }}>
          {visibleBlocks.map((b, i) => (
            <i
              key={b.id || i}
              className={selectedBlockId === b.id ? "on" : ""}
              onClick={() => {
                scrollToSection(b.id);
                if (isEditable) handleSelect(b.id);
              }}
              title={`Jump to ${b.title}`}
              style={{ cursor: "pointer" }}
            />
          ))}
        </div>
      </div>

      {/* COMPLETE GREETING: Render all sections in sequence with independent scroll */}
      <div className="greetingSequenceContainer" style={{ display: "flex", flexDirection: "column", gap: "var(--section-spacing, 24px)", width: "100%" }}>
        {visibleBlocks.map((b, i) => (
          <section
            key={b.id || i}
            id={`section-${b.id}`}
            className={`greetingSectionBlock ${selectedBlockId === b.id ? "activeSelectedBlock" : ""}`}
            style={{ position: "relative", width: "100%", scrollMarginTop: "20px" }}
          >
            {renderSectionContent(b, i, visibleBlocks.length)}
          </section>
        ))}
      </div>
    </section>
  );
}
