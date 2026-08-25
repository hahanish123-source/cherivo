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
  X,
  Sparkles
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
  onSelectElement?: (blockId: string, elementKey: string, extraIndex?: number) => void;
  onEditReason?: (blockId: string, reasonIndex: number) => void;
  onAddReason?: () => void;
  onOpenResponseModal?: () => void;
  previewDevice?: "desktop" | "mobile";
  title?: string;
  memoryVideoPreviews?: Record<string, string>;
  customBgPreviews?: Record<string, string>;
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
  onSelectElement,
  onEditReason,
  onAddReason,
  onOpenResponseModal,
  previewDevice = "desktop",
  title = "A Hanora moment",
  memoryVideoPreviews = {},
  customBgPreviews = {}
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
  const [cakeCelebrated, setCakeCelebrated] = useState(false);
  const [secretRevealed, setSecretRevealed] = useState(false);
  const [galleryViewer, setGalleryViewer] = useState<{ images: string[]; index: number } | null>(null);
  const [dustedPhotos, setDustedPhotos] = useState<number[]>([]);
  const [galleryScatter, setGalleryScatter] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);
  const [imageAspects, setImageAspects] = useState<Record<string, number>>({});

  const handleImageLoad = (src: string, e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      const ratio = img.naturalWidth / img.naturalHeight;
      setImageAspects((prev) => {
        if (prev[src] === ratio) return prev;
        return { ...prev, [src]: ratio };
      });
    }
  };

  // Preload image aspect ratios for all images across blocks
  useEffect(() => {
    visibleBlocks.forEach((b) => {
      const imgList = Array.isArray(b.images) && b.images.length > 0 ? b.images : b.image ? [b.image] : [];
      imgList.forEach((src) => {
        if (!src || imageAspects[src]) return;
        const img = new Image();
        img.onload = () => {
          if (img.naturalWidth && img.naturalHeight) {
            const ratio = img.naturalWidth / img.naturalHeight;
            setImageAspects((prev) => {
              if (prev[src] === ratio) return prev;
              return { ...prev, [src]: ratio };
            });
          }
        };
        img.src = src;
      });
    });
  }, [visibleBlocks]);

  // Audio player state
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Dust Canvas Animation Refs
  const dustCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const dustParticlesRef = useRef<DustParticle[]>([]);
  const dustAnimRef = useRef<number | null>(null);

  // Keyboard Escape listener for Lightbox
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
      setCakeCelebrated(true);
      window.setTimeout(() => {
        setConfettiActive(false);
      }, 3500);
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
  const isDifferentBg = project.cardBackgroundMode === "different";
  const activeBg = (isDifferentBg && currentBlock?.background)
    ? currentBlock.background
    : (project.background || "aurora");

  const rawCustomBg = (currentBlock && typeof currentBlock.customBg === "string" && currentBlock.customBg)
    ? currentBlock.customBg
    : project.customBg;
  const activeCustomBg =
    typeof rawCustomBg === "string"
      ? rawCustomBg
      : rawCustomBg && typeof rawCustomBg === "object"
      ? customBgPreviews[(rawCustomBg as any).path] || ""
      : "";
  const activeCustomBgOpacity = typeof currentBlock?.customBgOpacity === "number"
    ? currentBlock.customBgOpacity
    : (typeof project.customBgOpacity === "number" ? project.customBgOpacity : 100);
  const activeCustomBgScale = typeof currentBlock?.customBgScale === "number"
    ? currentBlock.customBgScale
    : (typeof project.customBgScale === "number" ? project.customBgScale : 100);
  const activeCustomBgPositionX = typeof currentBlock?.customBgPositionX === "number"
    ? currentBlock.customBgPositionX
    : (typeof project.customBgPositionX === "number" ? project.customBgPositionX : 50);
  const activeCustomBgPositionY = typeof currentBlock?.customBgPositionY === "number"
    ? currentBlock.customBgPositionY
    : (typeof project.customBgPositionY === "number" ? project.customBgPositionY : 50);
  const activeCustomBgRotation = typeof currentBlock?.customBgRotation === "number"
    ? currentBlock.customBgRotation
    : (typeof project.customBgRotation === "number" ? project.customBgRotation : 0);
  const activeCustomBgFit = currentBlock?.customBgFit || project.customBgFit || "cover";
  const activeBgOverlay = typeof currentBlock?.backgroundOverlay === "number"
    ? currentBlock.backgroundOverlay
    : (typeof project.backgroundOverlay === "number" ? project.backgroundOverlay : 18);

  const activeBaseColor = (isDifferentBg && currentBlock?.backgroundBaseColor) ? currentBlock.backgroundBaseColor : (project.backgroundBaseColor || themeColors[0]);
  const activeBg1 = (isDifferentBg && currentBlock?.bgColor1) ? currentBlock.bgColor1 : (project.bgColor1 || themeColors[1]);
  const activeBg2 = (isDifferentBg && currentBlock?.bgColor2) ? currentBlock.bgColor2 : (project.bgColor2 || themeColors[2]);
  const activeBg3 = (isDifferentBg && currentBlock?.bgColor3) ? currentBlock.bgColor3 : (project.bgColor3 || (project.theme === "light" ? "#e8f7ff" : "#38bdf8"));
  const activeBg4 = (isDifferentBg && currentBlock?.bgColor4) ? currentBlock.bgColor4 : (project.bgColor4 || (project.theme === "light" ? "#fff0f5" : "#f59e0b"));

  const activeVideo =
    typeof currentBlock?.video === "string"
      ? currentBlock.video
      : typeof currentBlock?.memoryVideo === "string"
      ? currentBlock.memoryVideo
      : currentBlock?.id ? memoryVideoPreviews[currentBlock.id] || "" : "";

  const activeVideoFit = currentBlock?.videoFit || "cover";
  const activeVideoOpacity = typeof currentBlock?.videoOpacity === "number" ? currentBlock.videoOpacity : 100;
  const activeVideoScale = typeof currentBlock?.videoScale === "number" ? currentBlock.videoScale : 100;
  const activeVideoPositionX = typeof currentBlock?.videoPositionX === "number" ? currentBlock.videoPositionX : 50;
  const activeVideoPositionY = typeof currentBlock?.videoPositionY === "number" ? currentBlock.videoPositionY : 50;
  const activeVideoAutoplay = currentBlock?.videoAutoplay ?? true;
  const activeVideoMuted = currentBlock?.videoMuted ?? true;
  const activeVideoLoop = currentBlock?.videoLoop ?? true;

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

    const titleColor = b.titleColor || b.kickerColor || (project.theme === "light" ? "#be185d" : "#ff9fc2");
    const headingColor = b.headingColor || project.globalTextColor || themeColors[3];
    const subtitleColor = b.subtitleColor || (project.theme === "light" ? "#be185d" : "#ff9fc2");
    const bodyColor = b.bodyColor || project.globalTextColor || themeColors[3];
    const emojiColor = b.emojiColor || (project.theme === "light" ? "#db2777" : "#ff86b0");
    const letterColor = b.letterColor || "#2d2024";

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
      "--title-color": titleColor,
      "--heading-color": headingColor,
      "--subtitle-color": subtitleColor,
      "--body-color": bodyColor,
      "--emoji-color": emojiColor,
      "--card-color": b.cardColor || "#ffffff",
      "--section-card-opacity": `${effectiveCardOpacity}%`,
      "--card-opacity": `${effectiveCardOpacity / 100}`,
      "--card-opacity-pct": `${effectiveCardOpacity}%`,
      "--letter-color": letterColor,
      "--letter-size": `${b.letterSize ?? 17}px`,
      "--letter-line-height": b.letterLineHeight ?? 1.8,
      "--letter-align": b.letterAlign ?? "left"
    } as CSSProperties;
  };

  const getElementStyle = (b: Block, role: string, fallback: CSSProperties = {}): CSSProperties => {
    const custom = b.textStyles?.[role];
    let baseStyle: CSSProperties = { ...fallback };

    const titleColor = b.titleColor || b.kickerColor || (project.theme === "light" ? "#be185d" : "#ff9fc2");
    const headingColor = b.headingColor || project.globalTextColor || themeColors[3];
    const subtitleColor = b.subtitleColor || (project.theme === "light" ? "#be185d" : "#ff9fc2");
    const bodyColor = b.bodyColor || project.globalTextColor || themeColors[3];
    const letterColor = b.letterColor || "#2d2024";
    const buttonColor = b.buttonColor || (project.theme === "light" ? "#ffffff" : "#fff8fc");
    const reasonTitleColor = b.reasonTitleColor || headingColor;
    const reasonTextColor = b.reasonTextColor || bodyColor;
    const incidentTitleColor = b.incidentTitleColor || headingColor;
    const incidentTextColor = b.incidentTextColor || bodyColor;
    const secretTextColor = b.secretTextColor || bodyColor;
    const cakeSubtitleColor = b.cakeSubtitleColor || subtitleColor;
    const cakeTextColor = b.cakeTextColor || bodyColor;

    if (role === "heading" || role === "letterHeading") {
      baseStyle = {
        fontFamily: getFont(b.headingFont || b.font || project.globalFont),
        fontSize: `${b.headingSize ?? 70}px`,
        color: headingColor,
        ...fallback
      };
    } else if (role === "subtitle" || role === "eyebrow") {
      baseStyle = {
        fontFamily: getFont(b.subtitleFont || b.font || project.globalFont),
        fontSize: `${b.subtitleSize ?? 14}px`,
        color: subtitleColor,
        ...fallback
      };
    } else if (role === "body" || role === "text") {
      baseStyle = {
        fontFamily: getFont(b.bodyFont || b.font || project.globalFont),
        fontSize: `${b.bodySize ?? 17}px`,
        color: bodyColor,
        ...fallback
      };
    } else if (role === "title" || role === "kicker") {
      baseStyle = {
        fontFamily: getFont(b.titleFont || b.font || project.globalFont),
        fontSize: `${b.titleSize ?? 13}px`,
        color: titleColor,
        ...fallback
      };
    } else if (role === "letter" || role === "letterBody") {
      baseStyle = {
        fontFamily: getFont(b.letterFont || b.bodyFont || b.font || project.globalFont),
        fontSize: `${b.letterSize ?? b.bodySize ?? 17}px`,
        color: letterColor,
        lineHeight: b.letterLineHeight ?? 1.8,
        textAlign: b.letterAlign ?? "left",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        ...fallback
      };
    } else if (role === "button" || role === "buttons" || role === "backButton" || role === "keepGoingButton" || role === "revealButton") {
      baseStyle = {
        color: buttonColor,
        ...fallback
      };
    } else if (role === "reasonTitle") {
      baseStyle = {
        fontFamily: getFont(b.headingFont || b.font || project.globalFont),
        color: reasonTitleColor,
        ...fallback
      };
    } else if (role === "reasonText") {
      baseStyle = {
        fontFamily: getFont(b.bodyFont || b.font || project.globalFont),
        color: reasonTextColor,
        ...fallback
      };
    } else if (role === "incidentTitle") {
      baseStyle = {
        fontFamily: getFont(b.headingFont || b.font || project.globalFont),
        color: incidentTitleColor,
        ...fallback
      };
    } else if (role === "incidentText") {
      baseStyle = {
        fontFamily: getFont(b.bodyFont || b.font || project.globalFont),
        color: incidentTextColor,
        ...fallback
      };
    } else if (role === "incidentTag") {
      baseStyle = {
        color: titleColor,
        ...fallback
      };
    } else if (role === "secretMessage" || role === "secretText" || role === "secret") {
      baseStyle = {
        fontFamily: getFont(b.bodyFont || b.font || project.globalFont),
        color: secretTextColor,
        ...fallback
      };
    } else if (role === "cakeSubtitle") {
      baseStyle = {
        fontFamily: getFont(b.headingFont || b.font || project.globalFont),
        color: cakeSubtitleColor,
        ...fallback
      };
    } else if (role === "cakeText") {
      baseStyle = {
        fontFamily: getFont(b.bodyFont || b.font || project.globalFont),
        color: cakeTextColor,
        ...fallback
      };
    }

    if (!custom) return baseStyle;

    return {
      ...baseStyle,
      ...(custom.font ? { fontFamily: getFont(custom.font) } : {}),
      ...(typeof custom.size === "number" ? { fontSize: `${custom.size}px` } : {}),
      ...(custom.weight ? { fontWeight: custom.weight } : {}),
      ...(custom.color ? { color: custom.color } : {}),
      ...(typeof custom.opacity === "number" ? { opacity: custom.opacity / 100 } : {}),
      ...(typeof custom.letterSpacing === "number" ? { letterSpacing: `${custom.letterSpacing}px` } : {}),
      ...(typeof custom.lineHeight === "number" ? { lineHeight: custom.lineHeight } : {}),
      ...(custom.align ? { textAlign: custom.align } : {}),
      ...(typeof custom.offsetX === "number" || typeof custom.offsetY === "number"
        ? { transform: `translate(${custom.offsetX || 0}px, ${custom.offsetY || 0}px)` }
        : {}),
      ...(custom.visible === false ? { display: "none" } : {})
    };
  };

  const renderSectionContent = (b: Block) => {
    const style = getSectionStyle(b);
    const resolvedVideo =
      typeof b.video === "string"
        ? b.video
        : typeof b.memoryVideo === "string"
        ? b.memoryVideo
        : memoryVideoPreviews[b.id] || "";

    const heroAdj = b.imageAdjustments?.["hero"] ?? b.imageAdjustments?.["0"] ?? { scale: 100, x: 50, y: 28 };
    const emojiAnim = b.emojiAnimation || project.emojiAnimation || "floating";

    const triggerSelect = (role: string, extraIndex?: number) => {
      if (onSelectElement) {
        onSelectElement(b.id, role, extraIndex);
      } else if (onEditSection) {
        onEditSection(b.id);
      }
    };

    const renderForegroundMediaLayer = (targetBlock: Block) => {
      const imagesList = Array.isArray(targetBlock.images) && targetBlock.images.length > 0
        ? targetBlock.images
        : targetBlock.image
        ? [targetBlock.image]
        : [];

      if (imagesList.length === 0) return null;

      return (
        <div
          className="foregroundPhotoSectionWrap"
          style={{
            position: "relative",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            margin: "18px auto 14px",
            zIndex: 25,
            pointerEvents: "auto"
          }}
        >
          {imagesList.map((src, idx) => {
            const bAdj: ImageAdjustment =
              targetBlock.imageAdjustments?.[String(idx)] ??
              targetBlock.imageAdjustments?.[`photo_${idx}`] ??
              (idx === 0 ? targetBlock.imageAdjustments?.["hero"] ?? targetBlock.imageAdjustments?.["0"] : undefined) ??
              { scale: 100, x: 50, y: 50, opacity: 100, rotation: 0, width: 65, cornerRadius: 0 };

            const isCover = bAdj.isCustomCropped ? true : (bAdj.fit === "cover");
            const fitMode = isCover ? "cover" : ((bAdj.fit || targetBlock.imageFit || "contain") as "cover" | "contain" | "fill");
            const scaleVal = (bAdj.scale ?? 100) / 100;
            const opacityVal = (bAdj.opacity ?? targetBlock.imageOpacity ?? 100) / 100;
            const rotVal = bAdj.rotation ?? 0;
            const widthPct = bAdj.width ?? 65;
            const radiusPx = bAdj.cornerRadius ?? 0;
            const offsetX = ((bAdj.x ?? 50) - 50) * 1.5;
            const offsetY = ((bAdj.y ?? 50) - 50) * 1.5;

            // Dedicated inner crop & framing parameters
            const cropX = bAdj.cropX ?? bAdj.crop?.cropX ?? 50;
            const cropY = bAdj.cropY ?? bAdj.crop?.cropY ?? 50;
            const cropScale = (bAdj.cropScale ?? bAdj.crop?.scale ?? 100) / 100;
            const rawAspect = imageAspects[src];
            const cropRatio = bAdj.cropRatio;
            const aspect = rawAspect || (cropRatio === "1:1" ? 1 : cropRatio === "16:9" ? 16 / 9 : cropRatio === "4:5" ? 4 / 5 : cropRatio === "3:4" ? 3 / 4 : cropRatio === "9:16" ? 9 / 16 : undefined);

            return (
              <div
                key={`${idx}-${src.slice(-15)}`}
                className="foregroundPhotoMediaBox sectionPhotoMediaWrap"
                onClick={() => isEditable && triggerSelect("photo", idx)}
                style={{
                  position: "relative",
                  width: `min(${widthPct}%, 500px)`,
                  maxWidth: "500px",
                  height: "auto",
                  maxHeight: "380px",
                  aspectRatio: isCover ? (aspect ? `${aspect}` : "4 / 3") : (aspect ? `${aspect}` : "auto"),
                  overflow: isCover ? "hidden" : "visible",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `translate(${offsetX}%, ${offsetY}%) scale(${scaleVal}) rotate(${rotVal}deg)`,
                  transformOrigin: "center center",
                  opacity: opacityVal,
                  borderRadius: `${radiusPx}px`,
                  background: "transparent",
                  border: "none",
                  boxShadow: "none",
                  padding: 0,
                  margin: idx > 0 ? "12px 0 0 0" : "0",
                  cursor: isEditable ? "pointer" : "default"
                }}
              >
                <img
                  className="foregroundPhotoImage sectionPhoto heroPhotoImage"
                  src={src}
                  alt=""
                  onLoad={(e) => handleImageLoad(src, e)}
                  style={{
                    width: "100%",
                    height: isCover ? "100%" : "auto",
                    maxHeight: "380px",
                    objectFit: isCover ? "cover" : fitMode,
                    objectPosition: isCover ? `${cropX}% ${cropY}%` : "center center",
                    transform: isCover ? `scale(${cropScale}) translate(${(cropX - 50) * 0.8}%, ${(cropY - 50) * 0.8}%)` : "none",
                    transformOrigin: "center center",
                    borderRadius: `${radiusPx}px`,
                    display: "block",
                    border: "none",
                    background: "transparent",
                    boxShadow: "none",
                    padding: 0,
                    margin: 0,
                    pointerEvents: "none"
                  }}
                />
              </div>
            );
          })}
        </div>
      );
    };

    const nav = (
      <div className="actions" style={{ position: "relative", zIndex: 100, pointerEvents: "auto" }}>
        <button
          type="button"
          className="btn"
          disabled={currentSceneIndex === 0}
          onClick={() => setScene(currentSceneIndex - 1)}
          style={{ position: "relative", zIndex: 100, pointerEvents: "auto", ...getElementStyle(b, "backButton") }}
        >
          <ArrowLeft size={16} /> {b.backButtonText || "Back"}
        </button>
        {currentSceneIndex < visibleBlocks.length - 1 ? (
          <button
            type="button"
            className="btn primary"
            onClick={() => setScene(currentSceneIndex + 1)}
            style={{ position: "relative", zIndex: 100, pointerEvents: "auto", ...getElementStyle(b, "keepGoingButton") }}
          >
            {b.keepGoingButtonText || "Keep going"} <ArrowRight size={16} />
          </button>
        ) : (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center", position: "relative", zIndex: 100, pointerEvents: "auto" }}>
            {!isEditable && onOpenResponseModal && (
              <button
                type="button"
                className="btn primary replyBtn"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenResponseModal();
                }}
                style={{ background: "linear-gradient(135deg, #ff4f8b 0%, #7c5cff 100%)", color: "#fff", fontWeight: 600, position: "relative", zIndex: 100, pointerEvents: "auto" }}
              >
                💌 Reply to Greeting
              </button>
            )}
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                setScene(0);
                setSecretRevealed(false);
                setCandles([false, false, false]);
                setDustedPhotos([]);
              }}
              style={{ position: "relative", zIndex: 100, pointerEvents: "auto" }}
            >
              <RotateCcw size={16} /> {b.replayButtonText || "Replay"}
            </button>
          </div>
        )}
      </div>
    );

    const editBadge = isEditable ? (
      <button
        type="button"
        className="previewEdit"
        style={{ position: "absolute", right: 0, top: 0, zIndex: 30 }}
        onClick={() => triggerSelect("heading")}
      >
        <Pencil size={13} /> Edit this section
      </button>
    ) : null;

    if (b.type === "reasons") {
      return (
        <div className="sceneInner" style={style}>
          {editBadge}
          <div className="sectionContentLayer" style={{ position: "relative", zIndex: 20, width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            {isEditable ? (
              <>
                <button type="button" className={`editableDecor emoji-anim-${emojiAnim}`} style={{ position: "relative", zIndex: 10 }} onClick={() => triggerSelect("emoji")}>
                  {b.emoji}
                </button>
                <button type="button" className="editableText sectionKicker" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "title") }} onClick={() => triggerSelect("kicker")}>
                  {b.title}
                </button>
                <button type="button" className="editableText eyebrow" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "eyebrow") }} onClick={() => triggerSelect("subtitle")}>
                  {b.subtitle}
                </button>
                <button type="button" className="editableText heroTitle" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "heading") }} onClick={() => triggerSelect("heading")}>
                  {b.heading}
                </button>
                <div className="heroTextWrap customScrollbar" style={{ position: "relative", zIndex: 20 }}>
                  <button type="button" className="editableText heroText" style={getElementStyle(b, "body")} onClick={() => triggerSelect("body")}>
                    {b.text}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className={`publicEmoji emoji-anim-${emojiAnim}`} style={{ position: "relative", zIndex: 10 }}>{b.emoji}</div>
                <div className="sectionKicker" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "title") }}>{b.title}</div>
                <div className="eyebrow" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "eyebrow") }}>{b.subtitle}</div>
                <h1 className="heroTitle" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "heading") }}>{b.heading}</h1>
                <div className="heroTextWrap customScrollbar" style={{ position: "relative", zIndex: 20 }}>
                  <p className="heroText" style={getElementStyle(b, "body")}>{b.text}</p>
                </div>
              </>
            )}

            {/* Dedicated Photo Area BELOW Text */}
            {renderForegroundMediaLayer(b)}

            <div className="cards" style={{ position: "relative", zIndex: 20, width: "100%" }}>
              {(b.items ?? []).map((r, i) => (
                <article
                  className="memoryCard"
                  key={r.id || i}
                  onClick={() => (isEditable ? triggerSelect("reasons", i) : undefined)}
                  style={{ cursor: isEditable ? "pointer" : "default" }}
                >
                  {isEditable && (
                    <span className="cardEdit" title="Edit this reason">
                      <Pencil size={12} />
                    </span>
                  )}
                  <h3 style={getElementStyle(b, "reasonTitle")}>
                    <span className={`emoji-anim-${emojiAnim}`} style={{ display: "inline-block", marginRight: "6px" }}>{r.emoji}</span>
                    {r.title}
                  </h3>
                  <p style={getElementStyle(b, "reasonText")}>{r.text}</p>
                </article>
              ))}
            </div>

            {isEditable && (
              <button type="button" className="addReasonPreview" style={{ position: "relative", zIndex: 20 }} onClick={onAddReason}>
                <span>+ Add another reason</span>
              </button>
            )}
          </div>

          {nav}
        </div>
      );
    }

    if (b.type === "incidents") {
      return (
        <div className="sceneInner incidentsScene" style={style}>
          {editBadge}
          <div className="sectionContentLayer" style={{ position: "relative", zIndex: 20, width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            {isEditable ? (
              <>
                <button type="button" className={`editableDecor emoji-anim-${emojiAnim}`} style={{ position: "relative", zIndex: 10 }} onClick={() => triggerSelect("emoji")}>
                  {b.emoji}
                </button>
                <button type="button" className="editableText sectionKicker" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "title") }} onClick={() => triggerSelect("kicker")}>
                  {b.title}
                </button>
                <button type="button" className="editableText eyebrow" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "eyebrow") }} onClick={() => triggerSelect("subtitle")}>
                  {b.subtitle}
                </button>
                <button type="button" className="editableText heroTitle" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "heading") }} onClick={() => triggerSelect("heading")}>
                  {b.heading}
                </button>
                <div className="heroTextWrap customScrollbar" style={{ position: "relative", zIndex: 20 }}>
                  <button type="button" className="editableText heroText" style={getElementStyle(b, "body")} onClick={() => triggerSelect("body")}>
                    {b.text}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className={`publicEmoji emoji-anim-${emojiAnim}`} style={{ position: "relative", zIndex: 10 }}>{b.emoji}</div>
                <div className="sectionKicker" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "title") }}>{b.title}</div>
                <div className="eyebrow" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "eyebrow") }}>{b.subtitle}</div>
                <h1 className="heroTitle" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "heading") }}>{b.heading}</h1>
                <div className="heroTextWrap customScrollbar" style={{ position: "relative", zIndex: 20 }}>
                  <p className="heroText" style={getElementStyle(b, "body")}>{b.text}</p>
                </div>
              </>
            )}

            {/* Dedicated Photo Area BELOW Text */}
            {renderForegroundMediaLayer(b)}

            <div className="incidentCards" style={{ position: "relative", zIndex: 20, width: "100%" }}>
              {(b.incidents ?? []).map((inc, i) => (
                <article
                  className="incidentCard"
                  key={inc.id || i}
                  onClick={() => (isEditable ? triggerSelect("incidents", i) : undefined)}
                  style={{ cursor: isEditable ? "pointer" : "default" }}
                >
                  {isEditable && (
                    <span className="cardEdit" title="Edit this incident">
                      <Pencil size={12} />
                    </span>
                  )}
                  <div className="incidentCardHeader">
                    <span className="incidentTag" style={getElementStyle(b, "incidentTag")}>{inc.tag || `Incident #${i + 1}`}</span>
                    {inc.date && <span className="incidentDate" style={getElementStyle(b, "incidentDate")}>{inc.date}</span>}
                  </div>
                  <h3 style={getElementStyle(b, "incidentTitle")}>
                    <span className={`emoji-anim-${emojiAnim}`} style={{ display: "inline-block", marginRight: "8px" }}>{inc.emoji}</span>
                    {inc.title}
                  </h3>
                  <p style={getElementStyle(b, "incidentText")}>{inc.text}</p>
                  {inc.image && (
                    <div className="incidentPhoto">
                      <img src={inc.image} alt={inc.title} style={{ opacity: (b.imageOpacity ?? 100) / 100 }} />
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>

          {nav}
        </div>
      );
    }

    if (b.type === "memories" || b.type === "gallery") {
      const images = b.images && b.images.length > 0 ? b.images : b.image ? [b.image] : [];
      const layout = b.galleryLayout || "scattered";
      const isScattered = layout === "scattered";
      const isMobile = previewDevice === "mobile";

      // Pure mathematical calculation for compact, content-aware bounding box & group centering
      const computeScatteredLayout = (imagesList: string[], isMobileView: boolean) => {
        const count = imagesList.length;
        if (count === 0) {
          return {
            items: [],
            stageWidth: isMobileView ? "100%" : "400px",
            stageHeight: "0px"
          };
        }

        // Base slot configurations for compact, centered, organic scatter (1-10 photos)
        const getBaseSlots = (n: number, mobile: boolean) => {
          if (n <= 1) {
            return [{ x: 50, y: 50, rot: 0, w: mobile ? 220 : 260, h: mobile ? 165 : 195 }];
          }
          if (n === 2) {
            return [
              { x: 30, y: 50, rot: -5, w: mobile ? 175 : 215, h: mobile ? 130 : 160 },
              { x: 70, y: 50, rot: 5, w: mobile ? 175 : 215, h: mobile ? 130 : 160 }
            ];
          }
          if (n === 3) {
            return [
              { x: 50, y: 30, rot: 0, w: mobile ? 160 : 195, h: mobile ? 120 : 150 },
              { x: 26, y: 70, rot: -6, w: mobile ? 155 : 190, h: mobile ? 115 : 145 },
              { x: 74, y: 70, rot: 6, w: mobile ? 155 : 190, h: mobile ? 115 : 145 }
            ];
          }
          if (n === 4) {
            return [
              { x: 26, y: 30, rot: -6, w: mobile ? 150 : 180, h: mobile ? 110 : 135 },
              { x: 74, y: 30, rot: 5, w: mobile ? 150 : 180, h: mobile ? 110 : 135 },
              { x: 28, y: 70, rot: 4, w: mobile ? 150 : 180, h: mobile ? 110 : 135 },
              { x: 72, y: 70, rot: -5, w: mobile ? 150 : 180, h: mobile ? 110 : 135 }
            ];
          }
          if (n === 5) {
            return [
              { x: 24, y: 26, rot: -6, w: mobile ? 140 : 170, h: mobile ? 105 : 125 },
              { x: 76, y: 26, rot: 6, w: mobile ? 140 : 170, h: mobile ? 105 : 125 },
              { x: 50, y: 50, rot: 0, w: mobile ? 145 : 175, h: mobile ? 110 : 130 },
              { x: 26, y: 74, rot: 5, w: mobile ? 140 : 170, h: mobile ? 105 : 125 },
              { x: 74, y: 74, rot: -5, w: mobile ? 140 : 170, h: mobile ? 105 : 125 }
            ];
          }
          if (n === 6) {
            return [
              { x: 22, y: 26, rot: -5, w: mobile ? 135 : 165, h: mobile ? 100 : 120 },
              { x: 78, y: 26, rot: 5, w: mobile ? 135 : 165, h: mobile ? 100 : 120 },
              { x: 34, y: 50, rot: 3, w: mobile ? 135 : 165, h: mobile ? 100 : 120 },
              { x: 66, y: 50, rot: -3, w: mobile ? 135 : 165, h: mobile ? 100 : 120 },
              { x: 22, y: 74, rot: 4, w: mobile ? 135 : 165, h: mobile ? 100 : 120 },
              { x: 78, y: 74, rot: -4, w: mobile ? 135 : 165, h: mobile ? 100 : 120 }
            ];
          }
          if (n === 7) {
            return [
              { x: 20, y: 24, rot: -5, w: mobile ? 125 : 155, h: mobile ? 95 : 115 },
              { x: 50, y: 22, rot: 2, w: mobile ? 125 : 155, h: mobile ? 95 : 115 },
              { x: 80, y: 24, rot: 5, w: mobile ? 125 : 155, h: mobile ? 95 : 115 },
              { x: 50, y: 50, rot: -2, w: mobile ? 130 : 160, h: mobile ? 98 : 120 },
              { x: 20, y: 76, rot: 4, w: mobile ? 125 : 155, h: mobile ? 95 : 115 },
              { x: 50, y: 78, rot: -3, w: mobile ? 125 : 155, h: mobile ? 95 : 115 },
              { x: 80, y: 76, rot: -4, w: mobile ? 125 : 155, h: mobile ? 95 : 115 }
            ];
          }
          if (n === 8) {
            return [
              { x: 18, y: 22, rot: -6, w: mobile ? 120 : 145, h: mobile ? 90 : 110 },
              { x: 50, y: 20, rot: 3, w: mobile ? 120 : 145, h: mobile ? 90 : 110 },
              { x: 82, y: 22, rot: 6, w: mobile ? 120 : 145, h: mobile ? 90 : 110 },
              { x: 30, y: 50, rot: -3, w: mobile ? 120 : 145, h: mobile ? 90 : 110 },
              { x: 70, y: 50, rot: 3, w: mobile ? 120 : 145, h: mobile ? 90 : 110 },
              { x: 18, y: 78, rot: 5, w: mobile ? 120 : 145, h: mobile ? 90 : 110 },
              { x: 50, y: 80, rot: -2, w: mobile ? 120 : 145, h: mobile ? 90 : 110 },
              { x: 82, y: 78, rot: -5, w: mobile ? 120 : 145, h: mobile ? 90 : 110 }
            ];
          }
          if (n === 9) {
            return [
              { x: 18, y: 22, rot: -6, w: mobile ? 115 : 140, h: mobile ? 85 : 105 },
              { x: 50, y: 20, rot: 2, w: mobile ? 115 : 140, h: mobile ? 85 : 105 },
              { x: 82, y: 22, rot: 6, w: mobile ? 115 : 140, h: mobile ? 85 : 105 },
              { x: 20, y: 50, rot: -3, w: mobile ? 115 : 140, h: mobile ? 85 : 105 },
              { x: 50, y: 50, rot: 0, w: mobile ? 115 : 140, h: mobile ? 85 : 105 },
              { x: 80, y: 50, rot: 3, w: mobile ? 115 : 140, h: mobile ? 85 : 105 },
              { x: 18, y: 78, rot: 5, w: mobile ? 115 : 140, h: mobile ? 85 : 105 },
              { x: 50, y: 80, rot: -2, w: mobile ? 115 : 140, h: mobile ? 85 : 105 },
              { x: 82, y: 78, rot: -5, w: mobile ? 115 : 140, h: mobile ? 85 : 105 }
            ];
          }
          if (n >= 10) {
            return [
              { x: 18, y: 20, rot: -6, w: mobile ? 110 : 135, h: mobile ? 80 : 100 },
              { x: 40, y: 18, rot: 2, w: mobile ? 110 : 135, h: mobile ? 80 : 100 },
              { x: 62, y: 18, rot: -2, w: mobile ? 110 : 135, h: mobile ? 80 : 100 },
              { x: 84, y: 20, rot: 6, w: mobile ? 110 : 135, h: mobile ? 80 : 100 },
              { x: 30, y: 50, rot: -3, w: mobile ? 110 : 135, h: mobile ? 80 : 100 },
              { x: 70, y: 50, rot: 3, w: mobile ? 110 : 135, h: mobile ? 80 : 100 },
              { x: 18, y: 80, rot: 5, w: mobile ? 110 : 135, h: mobile ? 80 : 100 },
              { x: 40, y: 82, rot: -2, w: mobile ? 110 : 135, h: mobile ? 80 : 100 },
              { x: 62, y: 82, rot: 2, w: mobile ? 110 : 135, h: mobile ? 80 : 100 },
              { x: 84, y: 80, rot: -5, w: mobile ? 110 : 135, h: mobile ? 80 : 100 }
            ];
          }

          // Fallback multi-row responsive scatter
          const perRow = mobile ? 2 : 3;
          const numRows = Math.ceil(n / perRow);
          const slots = [];
          for (let i = 0; i < n; i++) {
            const row = Math.floor(i / perRow);
            const col = i % perRow;
            const itemsInThisRow = (row === numRows - 1 && n % perRow !== 0) ? (n % perRow) : perRow;
            const x = itemsInThisRow === 1 ? 50 : Math.round((100 / (itemsInThisRow + 1)) * (col + 1));
            const y = Math.round((100 / (numRows + 1)) * (row + 1));
            const rot = ((i * 7 + 3) % 13) - 6;
            const w = mobile ? Math.max(120, 145 - n * 1.5) : Math.max(145, 175 - n * 1.5);
            const h = Math.round(w * 0.74);
            slots.push({ x, y, rot, w, h });
          }
          return slots;
        };

        const baseSlots = getBaseSlots(count, isMobileView);

        // Stage physical dimensions
        const maxStageWidthPx = isMobileView ? 340 : count <= 1 ? 380 : count <= 2 ? 540 : 700;
        const baseStageHeightPx = isMobileView
          ? (count <= 1 ? 180 : count <= 2 ? 200 : count <= 3 ? 230 : count <= 4 ? 250 : count <= 5 ? 270 : count <= 6 ? 290 : count <= 8 ? 350 : 410)
          : (count <= 1 ? 210 : count <= 2 ? 230 : count <= 3 ? 265 : count <= 4 ? 285 : count <= 5 ? 310 : count <= 6 ? 330 : count <= 8 ? 390 : 450);

        // Calculate occupied bounds factoring per-photo scale & pan
        let minXRelative = 100;
        let maxXRelative = 0;
        let maxBottomPx = baseStageHeightPx;

        const calculatedItems = imagesList.map((src, i) => {
          const slot = baseSlots[i % baseSlots.length];
          const adjustment: ImageAdjustment = b.imageAdjustments?.[String(i)] ?? b.imageAdjustments?.[`photo_${i}`] ?? {
            scale: 100,
            x: 50,
            y: 50,
            opacity: 100,
            rotation: 0
          };

          const scaleVal = (adjustment.scale ?? 100) / 100;

          // Intrinsic or custom dynamic aspect ratio for this specific photo
          const rawAspect = imageAspects[src];
          const cropRatio = adjustment.cropRatio;
          const aspect = rawAspect || (cropRatio === "1:1" ? 1 : cropRatio === "16:9" ? 16 / 9 : cropRatio === "4:5" ? 4 / 5 : cropRatio === "3:4" ? 3 / 4 : cropRatio === "9:16" ? 9 / 16 : undefined) || 1.33;

          // Calculate dynamic width and height tailored directly to each photo's size and aspect ratio
          const baseDim = slot.w * scaleVal;
          let photoWPx = baseDim;
          let photoHPx = baseDim / aspect;

          if (aspect < 0.85) {
            // Tall Portrait (e.g. 9:16, 3:4, tall notes / mobile screenshots)
            photoWPx = Math.round(baseDim * 0.82);
            photoHPx = Math.round(photoWPx / aspect);
            const maxHPx = isMobileView ? 230 : 280;
            if (photoHPx > maxHPx) {
              photoHPx = maxHPx;
              photoWPx = Math.round(photoHPx * aspect);
            }
          } else if (aspect > 1.35) {
            // Wide Landscape (e.g. 16:9, 4:3)
            photoWPx = Math.round(baseDim * 1.15);
            photoHPx = Math.round(photoWPx / aspect);
          } else {
            // Square or Balanced
            photoWPx = Math.round(baseDim * 0.95);
            photoHPx = Math.round(photoWPx / aspect);
          }

          const panXPct = typeof adjustment.x === "number" ? (adjustment.x - 50) * 0.8 : 0;
          const panYPct = typeof adjustment.y === "number" ? (adjustment.y - 50) * 0.8 : 0;

          const rawX = Math.max(8, Math.min(92, slot.x + panXPct));
          const rawY = Math.max(8, Math.min(92, slot.y + panYPct));
          const rotVal = (adjustment.rotation ?? 0) + slot.rot;

          // Relative horizontal bounds in stage percentage space
          const halfWPct = ((photoWPx / 2) / maxStageWidthPx) * 100;
          const leftBound = rawX - halfWPct;
          const rightBound = rawX + halfWPct;

          if (leftBound < minXRelative) minXRelative = leftBound;
          if (rightBound > maxXRelative) maxXRelative = rightBound;

          // Vertical physical bottom edge
          const centerYPx = (rawY / 100) * baseStageHeightPx;
          const bottomPx = centerYPx + (photoHPx / 2);
          if (bottomPx > maxBottomPx) maxBottomPx = bottomPx;

          return {
            src,
            index: i,
            rawX,
            rawY,
            rotVal,
            photoWPx,
            photoHPx,
            aspect,
            adjustment,
            scaleVal
          };
        });

        // Group Centering offset: ensure the entire photo cluster is centered horizontally
        const groupCenterPct = (minXRelative + maxXRelative) / 2;
        const shiftXPct = 50 - groupCenterPct;

        // Controlled padding around bounding box
        const finalStageHeightPx = Math.round(maxBottomPx + 16);

        const positionedItems = calculatedItems.map((item) => {
          const finalX = Math.max(5, Math.min(95, item.rawX + shiftXPct));
          return {
            ...item,
            finalX
          };
        });

        return {
          items: positionedItems,
          stageWidth: `${maxStageWidthPx}px`,
          stageHeight: `${finalStageHeightPx}px`
        };
      };

      const scatterLayout = computeScatteredLayout(images, isMobile);

      return (
        <div
          className={`sceneInner galleryPage layout-${layout}`}
          style={{
            ...style,
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            boxSizing: "border-box",
            height: "auto",
            minHeight: "auto",
            padding: isMobile ? "24px 16px 20px" : "28px 24px 24px"
          }}
        >
          {editBadge}

          {/* 1. TEXT / CONTENT AREA (ALWAYS AT TOP) */}
          <div
            className="sectionContentLayer memoryGreetingLayer"
            style={{
              position: "relative",
              zIndex: 20,
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              pointerEvents: "auto"
            }}
          >
            {isEditable ? (
              <>
                <button type="button" className={`editableDecor emoji-anim-${emojiAnim}`} style={{ position: "relative", zIndex: 20 }} onClick={() => triggerSelect("emoji")}>
                  {b.emoji}
                </button>
                <button type="button" className="editableText sectionKicker" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "title") }} onClick={() => triggerSelect("kicker")}>
                  {b.title}
                </button>
                <button type="button" className="editableText eyebrow" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "eyebrow") }} onClick={() => triggerSelect("subtitle")}>
                  {b.subtitle}
                </button>
                <button type="button" className="editableText heroTitle" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "heading") }} onClick={() => triggerSelect("heading")}>
                  {b.heading}
                </button>
                <div className="heroTextWrap customScrollbar" style={{ position: "relative", zIndex: 20 }}>
                  <button type="button" className="editableText heroText" style={getElementStyle(b, "body")} onClick={() => triggerSelect("body")}>
                    {b.text}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className={`publicEmoji emoji-anim-${emojiAnim}`} style={{ position: "relative", zIndex: 20 }}>{b.emoji}</div>
                <div className="sectionKicker" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "title") }}>{b.title}</div>
                <div className="eyebrow" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "eyebrow") }}>{b.subtitle}</div>
                <h1 className="heroTitle" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "heading") }}>{b.heading}</h1>
                <div className="heroTextWrap customScrollbar" style={{ position: "relative", zIndex: 20 }}>
                  <p className="heroText" style={getElementStyle(b, "body")}>{b.text}</p>
                </div>
              </>
            )}
          </div>

          {/* 2. DEDICATED PHOTO COMPOSITION AREA (BELOW TEXT, ABOVE NAVIGATION) */}
          <div
            className="memoryGallery"
            style={{
              position: "relative",
              width: "min(760px, 100%)",
              margin: "16px auto 0",
              zIndex: 5
            }}
          >
            {/* Scattered Images Layout */}
            {isScattered && images.length > 0 && (
              <div
                className={`scatteredGallery galleryStage gallery-count-${Math.min(images.length, 20)} gallery-bg-${
                  b.galleryBackground || "transparent"
                } ${galleryScatter ? "scatter-active" : ""}`}
                style={{
                  position: "relative",
                  width: "100%",
                  maxWidth: scatterLayout.stageWidth,
                  height: scatterLayout.stageHeight,
                  overflow: "visible",
                  margin: "0 auto"
                }}
              >
                <canvas ref={dustCanvasRef} className="galleryDustCanvas" style={{ zIndex: 12, pointerEvents: "none" }} />

                {scatterLayout.items.map((item) => {
                  const { src, index: i, finalX, rawY, rotVal, photoWPx, photoHPx, aspect, adjustment, scaleVal } = item;
                  const isDusted = dustedPhotos.includes(i);
                  const opacityVal = (adjustment.opacity ?? b.imageOpacity ?? 100) / 100;
                  const radiusPx = adjustment.cornerRadius ?? 12;
                  const isCover = adjustment.isCustomCropped ? true : (adjustment.fit === "cover");
                  const fitMode = isCover ? "cover" : ((adjustment.fit || b.imageFit || "contain") as "cover" | "contain" | "natural" | "fill");
                  const isNatural = fitMode === "natural";
                  const cropX = adjustment.cropX ?? adjustment.crop?.cropX ?? 50;
                  const cropY = adjustment.cropY ?? adjustment.crop?.cropY ?? 50;
                  const cropScale = (adjustment.cropScale ?? adjustment.crop?.scale ?? 100) / 100;

                  return (
                    <button
                      type="button"
                      className={`galleryPhoto scatteredPhoto galleryPhoto-${i + 1} ${
                        isDusted ? "photo-dusted" : ""
                      }`}
                      key={`${i}-${src.slice(-10)}`}
                      style={{
                        position: "absolute",
                        left: `${finalX}%`,
                        top: `${rawY}%`,
                        width: isNatural ? "auto" : `${Math.round(photoWPx)}px`,
                        maxWidth: "340px",
                        height: isCover ? `${Math.round(photoHPx)}px` : "auto",
                        maxHeight: `${Math.round(photoHPx)}px`,
                        aspectRatio: `${aspect}`,
                        transform: `translate(-50%, -50%) rotate(${rotVal}deg)`,
                        transformOrigin: "center center",
                        zIndex: (adjustment.zIndex ?? i) + 5,
                        opacity: opacityVal,
                        borderRadius: `${radiusPx}px`,
                        overflow: "hidden",
                        border: "none",
                        outline: "none",
                        boxShadow: "none",
                        padding: 0,
                        background: "transparent",
                        pointerEvents: "auto",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                      aria-label={`Tap to dissolve memory ${i + 1}`}
                      onClick={(e) => {
                        if (isEditable) {
                          triggerSelect("photo", i);
                        } else {
                          e.stopPropagation();
                          openGalleryPhoto(images, i, true, e.currentTarget);
                        }
                      }}
                    >
                      <img
                        src={src}
                        alt={`Memory ${i + 1}`}
                        onLoad={(e) => handleImageLoad(src, e)}
                        style={{
                          width: isNatural ? "auto" : "100%",
                          maxWidth: "100%",
                          height: isCover ? "100%" : "100%",
                          maxHeight: `${Math.round(photoHPx)}px`,
                          objectFit: isNatural ? "scale-down" : isCover ? "cover" : "contain",
                          objectPosition: isCover ? `${cropX}% ${cropY}%` : "center center",
                          borderRadius: `${radiusPx}px`,
                          transform: isCover ? `scale(${cropScale}) translate(${(cropX - 50) * 0.8}%, ${(cropY - 50) * 0.8}%)` : `scale(${scaleVal})`,
                          transformOrigin: "center center",
                          display: "block",
                          pointerEvents: "none"
                        }}
                      />
                      <span className="galleryPhotoHint">
                        {isEditable ? `Photo ${i + 1}` : "✦ Disintegrate"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Non-Scattered Layouts (Collage, Grid, Masonry, Polaroid, Filmstrip, Hero) */}
            {!isScattered && images.length > 0 && (
              <div
                className={`galleryStage gallery-count-${Math.min(images.length, 20)} layout-${layout} gallery-bg-${
                  b.galleryBackground || "transparent"
                }`}
                style={{
                  position: "relative",
                  zIndex: 5,
                  width: "100%",
                  margin: "0 auto"
                }}
              >
                {images.map((src, i) => {
                  const adjustment: ImageAdjustment = b.imageAdjustments?.[String(i)] ?? b.imageAdjustments?.[`photo_${i}`] ?? {
                    scale: 100,
                    x: 50,
                    y: 50,
                    opacity: 100,
                    rotation: 0
                  };
                  const rotVal = adjustment.rotation ?? 0;
                  const scaleVal = (adjustment.scale ?? 100) / 100;
                  const opacityVal = (adjustment.opacity ?? b.imageOpacity ?? 100) / 100;
                  const radiusPx = adjustment.cornerRadius ?? 8;
                  const isCover = adjustment.isCustomCropped ? true : (adjustment.fit === "cover");
                  const fitMode = isCover ? "cover" : ((adjustment.fit || b.imageFit || "contain") as "cover" | "contain" | "natural" | "fill");
                  const isNatural = fitMode === "natural";

                  const cropX = adjustment.cropX ?? adjustment.crop?.cropX ?? 50;
                  const cropY = adjustment.cropY ?? adjustment.crop?.cropY ?? 50;
                  const cropScale = (adjustment.cropScale ?? adjustment.crop?.scale ?? 100) / 100;

                  return (
                    <button
                      type="button"
                      className={`galleryPhoto galleryPhoto-${i + 1}`}
                      key={`${i}-${src.slice(-10)}`}
                      style={{
                        position: "relative",
                        overflow: "hidden",
                        borderRadius: `${radiusPx}px`,
                        opacity: opacityVal,
                        zIndex: (adjustment.zIndex ?? i) + 5,
                        pointerEvents: "auto",
                        border: "none",
                        outline: "none",
                        boxShadow: "none",
                        background: "transparent",
                        padding: 0
                      }}
                      aria-label={`Open memory photo ${i + 1}`}
                      onClick={(e) => {
                        if (isEditable) {
                          triggerSelect("photo", i);
                        } else {
                          e.stopPropagation();
                          openGalleryPhoto(images, i, false, e.currentTarget);
                        }
                      }}
                    >
                      <img
                        src={src}
                        alt={`Memory ${i + 1}`}
                        onLoad={(e) => handleImageLoad(src, e)}
                        style={{
                          width: isNatural ? "auto" : "100%",
                          maxWidth: "100%",
                          height: isCover ? "100%" : "auto",
                          maxHeight: "100%",
                          objectFit: isNatural ? "scale-down" : isCover ? "cover" : "contain",
                          objectPosition: isCover ? `${cropX}% ${cropY}%` : "center center",
                          borderRadius: `${radiusPx}px`,
                          transform: isCover ? `scale(${cropScale}) translate(${(cropX - 50) * 0.8}%, ${(cropY - 50) * 0.8}%) rotate(${rotVal}deg)` : `scale(${scaleVal}) rotate(${rotVal}deg)`,
                          transformOrigin: "center center",
                          display: "block",
                          pointerEvents: "none"
                        }}
                      />
                      <span className="galleryPhotoHint">
                        {isEditable ? `Photo ${i + 1}` : "🔍 Zoom"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Empty State / Add Photos Placeholder */}
            {images.length === 0 && (
              <div className="photoFrame" style={{ position: "relative", zIndex: 10, width: "100%", marginTop: "12px" }} onClick={() => isEditable && triggerSelect("photo", 0)}>
                <p style={{ padding: "30px 20px", color: "var(--muted)", cursor: isEditable ? "pointer" : "default" }}>
                  {isEditable ? "Tap here to add and edit photos 📸" : "No memory photos added yet."}
                </p>
              </div>
            )}
          </div>

          {/* 3. Tap Hint Directly Below Images */}
          {images.length > 0 && (
            <div className="galleryHint memoryTapHint" style={{ position: "relative", zIndex: 20, margin: "10px 0 0", textAlign: "center" }}>
              <p className="scatteredTapHint" style={{ margin: 0 }}>
                Tap a photo to explore the memory ❤️
              </p>
            </div>
          )}

          {isScattered && dustedPhotos.length > 0 && (
            <button
              type="button"
              className="btn ghost small restoreMemories"
              onClick={() => setDustedPhotos([])}
              style={{ position: "relative", zIndex: 20, margin: "8px 0 0" }}
            >
              <Sparkles size={14} /> Restore Photos
            </button>
          )}

          {/* 4. NAVIGATION (ALWAYS BELOW GALLERY) */}
          <div className="memoryNavigationWrap" style={{ position: "relative", zIndex: 40, width: "100%", marginTop: "14px" }}>
            {nav}
          </div>
        </div>
      );
    }

    if (b.type === "letter") {
      return (
        <div className="sceneInner letterScene" style={style}>
          {editBadge}
          <div className="sectionContentLayer" style={{ position: "relative", zIndex: 20, width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            {isEditable ? (
              <>
                <button type="button" className={`editableDecor emoji-anim-${emojiAnim}`} style={{ position: "relative", zIndex: 10 }} onClick={() => triggerSelect("emoji")}>
                  {b.emoji}
                </button>
                <button type="button" className="editableText sectionKicker" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "title") }} onClick={() => triggerSelect("kicker")}>
                  {b.title}
                </button>
                <button type="button" className="editableText eyebrow" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "eyebrow") }} onClick={() => triggerSelect("subtitle")}>
                  {b.subtitle}
                </button>
                <button type="button" className="editableText heroTitle" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "heading") }} onClick={() => triggerSelect("heading")}>
                  {b.heading}
                </button>
                <button type="button" className="letter editableLetter" style={{ position: "relative", zIndex: 20 }} onClick={() => triggerSelect("letter")}>
                  <h2 style={getElementStyle(b, "letterHeading")}>{b.heading}</h2>
                  <div className="letterBodyWrap customScrollbar">
                    <p style={getElementStyle(b, "letterBody")}>
                      {b.text || (isEditable ? "Tap here to write your personal letter... ✍️" : "")}
                    </p>
                  </div>
                </button>
              </>
            ) : (
              <>
                <div className={`publicEmoji emoji-anim-${emojiAnim}`} style={{ position: "relative", zIndex: 10 }}>{b.emoji}</div>
                <div className="sectionKicker" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "title") }}>{b.title}</div>
                <div className="eyebrow" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "eyebrow") }}>{b.subtitle}</div>
                <h1 className="heroTitle" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "heading") }}>{b.heading}</h1>
                <article className="letter" style={{ position: "relative", zIndex: 20 }}>
                  <h2 style={getElementStyle(b, "letterHeading")}>{b.heading}</h2>
                  <div className="letterBodyWrap customScrollbar">
                    <p style={getElementStyle(b, "letterBody")}>{b.text}</p>
                  </div>
                </article>
              </>
            )}

            {/* Dedicated Photo Area BELOW Letter */}
            {renderForegroundMediaLayer(b)}
          </div>
          {nav}
        </div>
      );
    }

    if (b.type === "secret") {
      return (
        <div className="sceneInner secretScene" style={style}>
          {editBadge}
          <div className="sectionContentLayer" style={{ position: "relative", zIndex: 20, width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            {isEditable ? (
              <>
                <button type="button" className={`editableDecor secretHeart emoji-anim-${emojiAnim}`} style={{ position: "relative", zIndex: 10 }} onClick={() => triggerSelect("emoji")}>
                  {b.emoji}
                </button>
                <button type="button" className="editableText sectionKicker" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "title") }} onClick={() => triggerSelect("kicker")}>
                  {b.title}
                </button>
                <button type="button" className="editableText eyebrow" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "eyebrow") }} onClick={() => triggerSelect("subtitle")}>
                  {b.subtitle}
                </button>
                <button type="button" className="editableText heroTitle" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "heading") }} onClick={() => triggerSelect("heading")}>
                  {b.heading}
                </button>
              </>
            ) : (
              <>
                <div className={`publicEmoji secretHeart emoji-anim-${emojiAnim}`} style={{ position: "relative", zIndex: 10 }}>{b.emoji}</div>
                <div className="sectionKicker" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "title") }}>{b.title}</div>
                <div className="eyebrow" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "eyebrow") }}>{b.subtitle}</div>
                <h1 className="heroTitle" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "heading") }}>{b.heading}</h1>
              </>
            )}

            {!secretRevealed ? (
              <>
                <div className="heroTextWrap customScrollbar" style={{ position: "relative", zIndex: 20 }}>
                  {isEditable ? (
                    <button type="button" className="editableText heroText" style={getElementStyle(b, "body")} onClick={() => triggerSelect("body")}>
                      {b.text}
                    </button>
                  ) : (
                    <p className="heroText" style={getElementStyle(b, "body")}>{b.text}</p>
                  )}
                </div>
                {/* Dedicated Photo Area BELOW Text */}
                {renderForegroundMediaLayer(b)}
                <button
                  type="button"
                  className="btn primary revealBtn"
                  style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "revealButton") }}
                  onClick={() => handleSecretToggle(true)}
                >
                  {b.revealButtonText || "Tap to reveal"} <span>♥</span>
                </button>
              </>
            ) : (
              <div className="secretReveal" style={{ position: "relative", zIndex: 20 }} onClick={() => isEditable && triggerSelect("secret")}>
                <span className="secretSparkle">✦</span>
                <h2 style={getElementStyle(b, "secretMessage")}>{b.text}</h2>
                {/* Dedicated Photo Area in reveal */}
                {renderForegroundMediaLayer(b)}
                {b.secretImage && (
                  <div className="secretPhotoMount" onClick={(e) => { e.stopPropagation(); isEditable && triggerSelect("photo", 0); }}>
                    <img src={b.secretImage} alt="Secret memory" style={{ opacity: (b.imageOpacity ?? 100) / 100 }} />
                  </div>
                )}
                {b.secretVideo && (
                  <video
                    className="secretVideo"
                    src={typeof b.secretVideo === "string" ? b.secretVideo : ""}
                    controls
                    playsInline
                    preload="metadata"
                    autoPlay={b.videoAutoplay ?? false}
                    muted={b.videoMuted ?? true}
                    loop={b.videoLoop ?? false}
                    onClick={(e) => { e.stopPropagation(); isEditable && triggerSelect("video"); }}
                    style={{
                      display: "block",
                      margin: "16px auto",
                      maxWidth: `${b.videoWidth ?? 100}%`,
                      maxHeight: "360px",
                      width: "auto",
                      height: "auto",
                      objectFit: b.videoFit === "contain" ? "contain" : b.videoFit === "fill" ? "fill" : "cover",
                      objectPosition: `${b.videoPositionX ?? 50}% ${b.videoPositionY ?? 50}%`,
                      transform: `scale(${(b.videoScale ?? 100) / 100}) translate(${((b.videoPositionX ?? 50) - 50)}%, ${((b.videoPositionY ?? 50) - 50)}%)`,
                      transformOrigin: "center center",
                      opacity: (b.videoOpacity ?? 100) / 100,
                      borderRadius: `${b.videoRadius ?? 16}px`,
                      background: "transparent",
                      border: "none",
                      boxShadow: "none",
                      outline: "none"
                    }}
                  />
                )}
                <button
                  type="button"
                  className="btn ghost small"
                  onClick={() => handleSecretToggle(false)}
                  style={{ marginTop: "12px" }}
                >
                  Hide again
                </button>
              </div>
            )}
          </div>
          {nav}
        </div>
      );
    }

    if (b.type === "cake") {
      return (
        <div className="sceneInner cakeScene" style={style}>
          {editBadge}
          <div className="sectionContentLayer" style={{ position: "relative", zIndex: 20, width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            {isEditable ? (
              <>
                <button type="button" className="editableText sectionKicker" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "title") }} onClick={() => triggerSelect("kicker")}>
                  {b.title}
                </button>
                <button type="button" className="editableText eyebrow" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "eyebrow") }} onClick={() => triggerSelect("subtitle")}>
                  {b.subtitle}
                </button>
                <button type="button" className="editableText heroTitle" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "heading") }} onClick={() => triggerSelect("heading")}>
                  {b.heading}
                </button>
              </>
            ) : (
              <>
                <div className="sectionKicker" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "title") }}>{b.title}</div>
                <div className="eyebrow" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "eyebrow") }}>{b.subtitle}</div>
                <h1 className="heroTitle" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "heading") }}>{b.heading}</h1>
              </>
            )}

            <div className="cakeGraphic" style={{ position: "relative", zIndex: 20 }} onClick={() => isEditable && triggerSelect("cake")}>
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

            {/* Dedicated Photo Area BELOW Cake */}
            {renderForegroundMediaLayer(b)}

            {cakeCelebrated ? (
              <div className="cakeCelebrationCard" style={{ position: "relative", zIndex: 20 }} onClick={() => isEditable && triggerSelect("cake")}>
                <div className="cakeCelebrationEmoji">🎂✨❤️</div>
                <h2 className="cakeCelebrationTitle" style={getElementStyle(b, "cakeSubtitle")}>{b.subtitle || "Happy Birthday, once again!"}</h2>
                <p className="cakeCelebrationSub" style={getElementStyle(b, "cakeText")}>{b.text || "May your year be filled with immense joy, love, and all your heart desires!"}</p>
                <button
                  type="button"
                  className="btn small ghost"
                  onClick={() => {
                    setCandles([false, false, false]);
                    setCakeCelebrated(false);
                  }}
                  style={{ marginTop: "10px" }}
                >
                  🕯️ Light candles again
                </button>
              </div>
            ) : (
              <>
                <div className="heroTextWrap customScrollbar" style={{ position: "relative", zIndex: 20 }}>
                  {isEditable ? (
                    <button type="button" className="editableText heroText" style={getElementStyle(b, "body")} onClick={() => triggerSelect("body")}>
                      {b.text || "Tap a candle to blow it out. Watch the flame flicker, fade and leave a soft trail of smoke."}
                    </button>
                  ) : (
                    <p className="heroText" style={getElementStyle(b, "body")}>
                      {b.text || "Tap a candle to blow it out. Watch the flame flicker, fade and leave a soft trail of smoke."}
                    </p>
                  )}
                </div>
                <button type="button" className="btn primary small" style={{ position: "relative", zIndex: 20 }} onClick={blowCandle}>
                  🌬️ Blow a candle
                </button>
              </>
            )}
          </div>

          {nav}
        </div>
      );
    }

    // Default / welcome / text / image / music / custom
    return (
      <div className="sceneInner" style={style}>
        {editBadge}

        <div className="sectionContentLayer" style={{ position: "relative", zIndex: 20, width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
          {isEditable ? (
            <>
              <button type="button" className={`editableDecor emoji-anim-${emojiAnim}`} style={{ position: "relative", zIndex: 10 }} onClick={() => triggerSelect("emoji")}>
                {b.emoji}
              </button>
              <button type="button" className="editableText sectionKicker" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "title") }} onClick={() => triggerSelect("kicker")}>
                {b.title}
              </button>
              <button type="button" className="editableText eyebrow" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "eyebrow") }} onClick={() => triggerSelect("subtitle")}>
                {b.subtitle}
              </button>
              <button type="button" className="editableText heroTitle" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "heading") }} onClick={() => triggerSelect("heading")}>
                {b.heading}
              </button>
              <div className="heroTextWrap customScrollbar" style={{ position: "relative", zIndex: 20 }}>
                <button type="button" className="editableText heroText" style={getElementStyle(b, "body")} onClick={() => triggerSelect("body")}>
                  {b.text}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className={`publicEmoji emoji-anim-${emojiAnim}`} style={{ position: "relative", zIndex: 10 }}>{b.emoji}</div>
              <div className="sectionKicker" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "title") }}>{b.title}</div>
              <div className="eyebrow" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "eyebrow") }}>{b.subtitle}</div>
              <h1 className="heroTitle" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "heading") }}>{b.heading}</h1>
              <div className="heroTextWrap customScrollbar" style={{ position: "relative", zIndex: 20 }}>
                <p className="heroText" style={getElementStyle(b, "body")}>{b.text}</p>
              </div>
            </>
          )}

          {/* Dedicated Photo Area BELOW Text */}
          {renderForegroundMediaLayer(b)}

          {(b.memoryVideo || b.video || resolvedVideo) && (
            <video
              className="sectionVideo"
              src={resolvedVideo || (typeof (b.video || b.memoryVideo) === "string" ? ((b.video || b.memoryVideo) as string) : "")}
              controls
              playsInline
              preload="metadata"
              autoPlay={b.videoAutoplay ?? false}
              muted={b.videoMuted ?? true}
              loop={b.videoLoop ?? false}
              onClick={() => isEditable && triggerSelect("video")}
              style={{
                display: "block",
                margin: "16px auto",
                maxWidth: `${b.videoWidth ?? 100}%`,
                maxHeight: "360px",
                width: "auto",
                height: "auto",
                objectFit: b.videoFit === "contain" ? "contain" : b.videoFit === "fill" ? "fill" : "cover",
                objectPosition: `${b.videoPositionX ?? 50}% ${b.videoPositionY ?? 50}%`,
                transform: `scale(${(b.videoScale ?? 100) / 100}) translate(${((b.videoPositionX ?? 50) - 50)}%, ${((b.videoPositionY ?? 50) - 50)}%)`,
                transformOrigin: "center center",
                opacity: (b.videoOpacity ?? 100) / 100,
                borderRadius: `${b.videoRadius ?? 16}px`,
                background: "transparent",
                border: "none",
                boxShadow: "none",
                outline: "none",
                position: "relative",
                zIndex: 20,
                cursor: isEditable ? "pointer" : "default"
              }}
            />
          )}
        </div>
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
          <div className="customBgContainer" style={{ zIndex: 0 }}>
            <div
              className="customBgImage"
              style={{
                backgroundImage: `url("${activeCustomBg}")`,
                opacity: (activeCustomBgOpacity ?? 100) / 100,
                backgroundSize: activeCustomBgFit === "contain" ? "contain" : activeCustomBgFit === "fill" ? "100% 100%" : "cover",
                backgroundRepeat: "no-repeat",
                backgroundPosition: `${activeCustomBgPositionX ?? 50}% ${activeCustomBgPositionY ?? 50}%`,
                transform: `scale(${(activeCustomBgScale ?? 100) / 100}) rotate(${activeCustomBgRotation ?? 0}deg)`,
                transformOrigin: `${activeCustomBgPositionX ?? 50}% ${activeCustomBgPositionY ?? 50}%`
              }}
            />
          </div>
          <div
            className="backgroundOverlayLayer"
            style={{ opacity: (activeBgOverlay ?? 18) / 100, zIndex: 0 }}
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
