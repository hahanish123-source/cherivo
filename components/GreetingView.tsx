"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { CSSProperties } from "react";
import {
  ArrowLeft,
  ArrowRight,
  GripVertical,
  Pencil,
  RotateCcw,
  Volume2,
  Play,
  Pause,
  X,
  Sparkles,
  Plus
} from "lucide-react";
import type { Block, GreetingProject, ImageAdjustment, ReasonItem } from "@/lib/types";
import { getFont, backgrounds, themes, incidentDefaults } from "@/lib/greetingConfig";
import Particles from "./Particles";
import PartyCelebration, { PartyCelebrationHandle } from "./PartyCelebration";

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
  onUpdateBlock?: (blockId: string, patch: Partial<Block>) => void;
  positionsLocked?: boolean;
  selectedCardIndex?: number;
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
  isSparkle?: boolean;
  sparkleScale?: number;
};

export default function GreetingView({
  project,
  sceneIndex = 0,
  onSceneChange,
  isEditable = false,
  positionsLocked = false,
  selectedCardIndex,
  onEditSection,
  onSelectElement,
  onEditReason,
  onAddReason,
  onOpenResponseModal,
  previewDevice = "desktop",
  title = "A Hamora moment",
  memoryVideoPreviews = {},
  customBgPreviews = {},
  onUpdateBlock
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

  const [transitionDir, setTransitionDir] = useState<"forward" | "backward">("forward");
  const prevSceneIndexRef = useRef(currentSceneIndex);

  useEffect(() => {
    if (currentSceneIndex > prevSceneIndexRef.current) {
      setTransitionDir("forward");
    } else if (currentSceneIndex < prevSceneIndexRef.current) {
      setTransitionDir("backward");
    }
    prevSceneIndexRef.current = currentSceneIndex;
  }, [currentSceneIndex]);

  const currentBlock: Block | undefined =
    visibleBlocks.length > 0
      ? visibleBlocks[Math.min(currentSceneIndex, visibleBlocks.length - 1)]
      : project.blocks[0];

  const getBlockCandleCount = (b?: Block): number => {
    if (!b) return 3;
    if (b.cakeCandleShape === "double-heart") return 2;
    if (typeof b.cakeCandleCount === "number") {
      return Math.max(1, Math.min(10, b.cakeCandleCount));
    }
    return b.cakeModel === "comic-2d" ? 1 : 3;
  };

  const activeCakeBlock = (currentBlock?.type === "cake" ? currentBlock : visibleBlocks.find((b) => b.type === "cake")) || currentBlock;
  const activeCandleCount = getBlockCandleCount(activeCakeBlock);

  // Interactive states
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [candles, setCandles] = useState<boolean[]>(() => Array(activeCandleCount).fill(false));
  const [smoke, setSmoke] = useState<number[]>([]);
  const [cakeCelebrated, setCakeCelebrated] = useState(false);
  const partyCelebrationRef = useRef<PartyCelebrationHandle | null>(null);
  const cakeContainerRef = useRef<HTMLDivElement | null>(null);
  const [secretRevealed, setSecretRevealed] = useState(false);
  const [galleryViewer, setGalleryViewer] = useState<{ images: string[]; index: number } | null>(null);
  const [dustedPhotos, setDustedPhotos] = useState<number[]>([]);
  const [galleryScatter, setGalleryScatter] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);
  const [imageAspects, setImageAspects] = useState<Record<string, number>>({});
  const [hoveredPhotoIndex, setHoveredPhotoIndex] = useState<number | null>(null);
  const [pinnedBadge, setPinnedBadge] = useState<{ text: string; x: number; y: number } | null>(null);

  useEffect(() => {
    setCandles((prev) => {
      if (prev.length === activeCandleCount) return prev;
      return Array(activeCandleCount).fill(false);
    });
  }, [activeCandleCount, activeCakeBlock?.id, activeCakeBlock?.cakeCandleCount, activeCakeBlock?.cakeCandleShape, activeCakeBlock?.cakeModel]);

  // Direct Interactive Dragging State (Mouse / Touch)
  const [draggingItem, setDraggingItem] = useState<{
    type: "photo" | "text" | "cake" | "card";
    blockId: string;
    photoIdx?: number;
    role?: string;
    cardIdx?: number;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    hasMoved: boolean;
    containerRect?: DOMRect;
  } | null>(null);

  // High-performance RAF throttle for smooth 60fps dragging without freezing the main thread
  const updateRafRef = useRef<number | null>(null);
  const pendingUpdateRef = useRef<{ blockId: string; patch: Partial<Block> } | null>(null);

  const scheduleBlockUpdate = (blockId: string, patch: Partial<Block>) => {
    pendingUpdateRef.current = { blockId, patch };
    if (updateRafRef.current === null) {
      updateRafRef.current = requestAnimationFrame(() => {
        updateRafRef.current = null;
        if (pendingUpdateRef.current && onUpdateBlock) {
          onUpdateBlock(pendingUpdateRef.current.blockId, pendingUpdateRef.current.patch);
        }
      });
    }
  };

  const flushBlockUpdate = () => {
    if (updateRafRef.current !== null) {
      cancelAnimationFrame(updateRafRef.current);
      updateRafRef.current = null;
    }
    if (pendingUpdateRef.current && onUpdateBlock) {
      onUpdateBlock(pendingUpdateRef.current.blockId, pendingUpdateRef.current.patch);
      pendingUpdateRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (updateRafRef.current !== null) {
        cancelAnimationFrame(updateRafRef.current);
      }
    };
  }, []);

  const handlePhotoPointerDown = (
    e: React.PointerEvent<HTMLDivElement | HTMLButtonElement>,
    targetBlock: Block,
    photoIdx: number,
    bAdj: ImageAdjustment
  ) => {
    if (!isEditable) return;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    const container = e.currentTarget.closest(".photoCard") || e.currentTarget.parentElement || e.currentTarget;
    setDraggingItem({
      type: "photo",
      blockId: targetBlock.id,
      photoIdx,
      startX: e.clientX,
      startY: e.clientY,
      initialX: typeof bAdj.x === "number" ? bAdj.x : 50,
      initialY: typeof bAdj.y === "number" ? bAdj.y : 50,
      hasMoved: false,
      containerRect: (container as HTMLElement).getBoundingClientRect()
    });
  };

  const handlePhotoPointerMove = (e: React.PointerEvent<HTMLDivElement | HTMLButtonElement>, targetBlock: Block) => {
    if (!draggingItem || draggingItem.type !== "photo" || draggingItem.blockId !== targetBlock.id) return;
    const deltaX = e.clientX - draggingItem.startX;
    const deltaY = e.clientY - draggingItem.startY;

    if (!draggingItem.hasMoved && Math.hypot(deltaX, deltaY) > 12) {
      draggingItem.hasMoved = true;
    }

    if (draggingItem.hasMoved && onUpdateBlock) {
      const boxW = draggingItem.containerRect?.width || 360;
      const boxH = draggingItem.containerRect?.height || 360;
      const dxPct = (deltaX / boxW) * 70;
      const dyPct = (deltaY / boxH) * 70;
      const newX = Math.round(Math.max(5, Math.min(95, draggingItem.initialX + dxPct)));
      const newY = Math.round(Math.max(5, Math.min(95, draggingItem.initialY + dyPct)));

      const photoKey = String(draggingItem.photoIdx ?? 0);
      const prevAdj: ImageAdjustment =
        targetBlock.imageAdjustments?.[photoKey] ??
        (draggingItem.photoIdx === 0 ? targetBlock.imageAdjustments?.["hero"] : undefined) ??
        { scale: 100, x: 50, y: 50, opacity: 100, rotation: 0 };
      const updatedAdj: ImageAdjustment = { ...prevAdj, x: newX, y: newY };
      const newAdjustments = {
        ...(targetBlock.imageAdjustments || {}),
        [photoKey]: updatedAdj
      };
      if (draggingItem.photoIdx === 0) {
        newAdjustments["hero"] = updatedAdj;
      }
      scheduleBlockUpdate(targetBlock.id, { imageAdjustments: newAdjustments });
    }
  };

  const handlePhotoPointerUp = (
    e: React.PointerEvent<HTMLDivElement | HTMLButtonElement>,
    targetBlock: Block,
    photoIdx: number
  ) => {
    if (!draggingItem) return;
    flushBlockUpdate();
    try {
      if ((e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      }
    } catch {}

    if (draggingItem.hasMoved) {
      setPinnedBadge({ text: "📌 Photo Position Fixed & Saved", x: e.clientX, y: e.clientY });
      setTimeout(() => setPinnedBadge(null), 1800);
    } else if (isEditable) {
      if (onSelectElement) {
        onSelectElement(targetBlock.id, "photo", photoIdx);
      } else if (onEditSection) {
        onEditSection(targetBlock.id);
      }
    }
    setDraggingItem(null);
  };

  const handleTextPointerDown = (
    e: React.PointerEvent<HTMLButtonElement | HTMLHeadingElement | HTMLDivElement>,
    targetBlock: Block,
    role: string
  ) => {
    if (!isEditable) return;
    const custom =
      targetBlock.textStyles?.[role] ||
      (role === "eyebrow" ? targetBlock.textStyles?.["subtitle"] : undefined) ||
      (role === "subtitle" ? targetBlock.textStyles?.["eyebrow"] : undefined) ||
      (role === "title" ? targetBlock.textStyles?.["kicker"] : undefined) ||
      (role === "kicker" ? targetBlock.textStyles?.["title"] : undefined) ||
      (role === "heading" ? targetBlock.textStyles?.["letterHeading"] : undefined) ||
      (role === "letterHeading" ? targetBlock.textStyles?.["heading"] : undefined) ||
      (role === "body" ? targetBlock.textStyles?.["text"] : undefined) ||
      (role === "text" ? targetBlock.textStyles?.["body"] : undefined) ||
      (role === "emoji" ? targetBlock.textStyles?.["emoji"] : undefined) ||
      {};
    const isLocked = Boolean(positionsLocked || custom.locked);
    if (isLocked) {
      const targetRole = role === "letterHeading" ? "heading" : role === "eyebrow" ? "subtitle" : role === "sectionKicker" ? "kicker" : role;
      if (onSelectElement) {
        onSelectElement(targetBlock.id, targetRole);
      } else if (onEditSection) {
        onEditSection(targetBlock.id);
      }
      return;
    }
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    setDraggingItem({
      type: "text",
      blockId: targetBlock.id,
      role,
      startX: e.clientX,
      startY: e.clientY,
      initialX: custom.offsetX || 0,
      initialY: custom.offsetY || 0,
      hasMoved: false
    });
  };

  const handleTextPointerMove = (
    e: React.PointerEvent<HTMLButtonElement | HTMLHeadingElement | HTMLDivElement>,
    targetBlock: Block
  ) => {
    if (!draggingItem || draggingItem.type !== "text" || draggingItem.blockId !== targetBlock.id) return;
    const deltaX = e.clientX - draggingItem.startX;
    const deltaY = e.clientY - draggingItem.startY;

    if (!draggingItem.hasMoved && Math.hypot(deltaX, deltaY) > 12) {
      draggingItem.hasMoved = true;
    }

    if (draggingItem.hasMoved && onUpdateBlock && draggingItem.role) {
      const newOffsetX = Math.round(Math.max(-600, Math.min(600, draggingItem.initialX + deltaX)));
      const newOffsetY = Math.round(Math.max(-500, Math.min(500, draggingItem.initialY + deltaY)));
      const role = draggingItem.role;
      const currentStyles = targetBlock.textStyles || {};
      const prevRoleStyle = currentStyles[role] || {};
      const updatedStyles = {
        ...currentStyles,
        [role]: { ...prevRoleStyle, offsetX: newOffsetX, offsetY: newOffsetY }
      };
      if (role === "subtitle") updatedStyles["eyebrow"] = { ...(currentStyles["eyebrow"] || {}), offsetX: newOffsetX, offsetY: newOffsetY };
      if (role === "eyebrow") updatedStyles["subtitle"] = { ...(currentStyles["subtitle"] || {}), offsetX: newOffsetX, offsetY: newOffsetY };
      if (role === "kicker") updatedStyles["title"] = { ...(currentStyles["title"] || {}), offsetX: newOffsetX, offsetY: newOffsetY };
      if (role === "title") updatedStyles["kicker"] = { ...(currentStyles["kicker"] || {}), offsetX: newOffsetX, offsetY: newOffsetY };
      if (role === "body") updatedStyles["text"] = { ...(currentStyles["text"] || {}), offsetX: newOffsetX, offsetY: newOffsetY };
      if (role === "text") updatedStyles["body"] = { ...(currentStyles["body"] || {}), offsetX: newOffsetX, offsetY: newOffsetY };
      if (role === "heading") updatedStyles["letterHeading"] = { ...(currentStyles["letterHeading"] || {}), offsetX: newOffsetX, offsetY: newOffsetY };
      if (role === "letterHeading") updatedStyles["heading"] = { ...(currentStyles["heading"] || {}), offsetX: newOffsetX, offsetY: newOffsetY };
      scheduleBlockUpdate(targetBlock.id, { textStyles: updatedStyles });
    }
  };

  const handleTextPointerUp = (
    e: React.PointerEvent<HTMLButtonElement | HTMLHeadingElement | HTMLDivElement>,
    targetBlock: Block,
    role: string
  ) => {
    if (!draggingItem) return;
    flushBlockUpdate();
    try {
      if ((e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      }
    } catch {}

    if (draggingItem.hasMoved) {
      setPinnedBadge({ text: "📌 Text Position Fixed & Saved", x: e.clientX, y: e.clientY });
      setTimeout(() => setPinnedBadge(null), 1800);
    } else if (isEditable) {
      const targetRole =
        role === "letterHeading"
          ? "heading"
          : role === "eyebrow"
          ? "subtitle"
          : role === "sectionKicker"
          ? "kicker"
          : role === "secretMessage" || role === "secret"
          ? "secretMessage"
          : role;
      if (onSelectElement) {
        onSelectElement(targetBlock.id, targetRole);
      } else if (onEditSection) {
        onEditSection(targetBlock.id);
      }
    }
    setDraggingItem(null);
  };

  const handleCakePointerDown = (
    e: React.PointerEvent<HTMLElement>,
    targetBlock: Block
  ) => {
    if (!isEditable) return;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    setDraggingItem({
      type: "cake",
      blockId: targetBlock.id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: typeof targetBlock.cakeOffsetX === "number" ? targetBlock.cakeOffsetX : 0,
      initialY: typeof targetBlock.cakeOffsetY === "number" ? targetBlock.cakeOffsetY : 0,
      hasMoved: false
    });
  };

  const handleCakePointerMove = (e: React.PointerEvent<HTMLElement>, targetBlock: Block) => {
    if (!draggingItem || draggingItem.type !== "cake" || draggingItem.blockId !== targetBlock.id) return;
    const deltaX = e.clientX - draggingItem.startX;
    const deltaY = e.clientY - draggingItem.startY;

    if (!draggingItem.hasMoved && Math.hypot(deltaX, deltaY) > 5) {
      draggingItem.hasMoved = true;
    }

    if (draggingItem.hasMoved && onUpdateBlock) {
      const newOffsetX = Math.round(Math.max(-600, Math.min(600, draggingItem.initialX + deltaX)));
      const newOffsetY = Math.round(Math.max(-500, Math.min(500, draggingItem.initialY + deltaY)));
      scheduleBlockUpdate(targetBlock.id, { cakeOffsetX: newOffsetX, cakeOffsetY: newOffsetY });
    }
  };

  const handleCakePointerUp = (
    e: React.PointerEvent<HTMLElement>,
    targetBlock: Block
  ) => {
    if (!draggingItem || draggingItem.type !== "cake") return;
    flushBlockUpdate();
    try {
      if ((e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      }
    } catch {}

    if (draggingItem.hasMoved) {
      setPinnedBadge({ text: "📌 Cake Position Fixed & Saved", x: e.clientX, y: e.clientY });
      setTimeout(() => setPinnedBadge(null), 1800);
    } else if (isEditable) {
      if (onSelectElement) {
        onSelectElement(targetBlock.id, "cake");
      } else if (onEditSection) {
        onEditSection(targetBlock.id);
      }
    }
    setDraggingItem(null);
  };

  const handleCardPointerDown = (
    e: React.PointerEvent<HTMLElement>,
    targetBlock: Block,
    cardIdx: number,
    r: ReasonItem
  ) => {
    if (!isEditable) return;
    const cardKey = r.id || String(cardIdx);
    const blockPos = targetBlock.reasonCardPositions?.[cardKey];
    const isLocked = Boolean(positionsLocked || r.locked || blockPos?.locked);
    if (isLocked) {
      if (onSelectElement) onSelectElement(targetBlock.id, "reasons", cardIdx);
      return;
    }
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    const curX = typeof r.x === "number" ? r.x : (blockPos?.x ?? 0);
    const curY = typeof r.y === "number" ? r.y : (blockPos?.y ?? 0);
    setDraggingItem({
      type: "card",
      blockId: targetBlock.id,
      cardIdx,
      startX: e.clientX,
      startY: e.clientY,
      initialX: curX,
      initialY: curY,
      hasMoved: false
    });
  };

  const handleCardPointerMove = (
    e: React.PointerEvent<HTMLElement>,
    targetBlock: Block,
    cardIdx: number
  ) => {
    if (!draggingItem || draggingItem.type !== "card" || draggingItem.blockId !== targetBlock.id || draggingItem.cardIdx !== cardIdx) return;
    const deltaX = e.clientX - draggingItem.startX;
    const deltaY = e.clientY - draggingItem.startY;

    if (!draggingItem.hasMoved && Math.hypot(deltaX, deltaY) > 8) {
      draggingItem.hasMoved = true;
    }

    if (draggingItem.hasMoved && onUpdateBlock) {
      const newX = Math.round(Math.max(-280, Math.min(280, draggingItem.initialX + deltaX)));
      const newY = Math.round(Math.max(-250, Math.min(250, draggingItem.initialY + deltaY)));
      const list = targetBlock.items ? [...targetBlock.items] : [];
      const item = list[cardIdx];
      const cardKey = item?.id || String(cardIdx);
      if (item) {
        list[cardIdx] = { ...item, x: newX, y: newY };
      }
      const newPosMap = {
        ...(targetBlock.reasonCardPositions || {}),
        [cardKey]: {
          ...(targetBlock.reasonCardPositions?.[cardKey] || {}),
          x: newX,
          y: newY
        }
      };
      scheduleBlockUpdate(targetBlock.id, { items: list, reasonCardPositions: newPosMap });
    }
  };

  const handleCardPointerUp = (
    e: React.PointerEvent<HTMLElement>,
    targetBlock: Block,
    cardIdx: number
  ) => {
    if (!draggingItem || draggingItem.type !== "card" || draggingItem.blockId !== targetBlock.id || draggingItem.cardIdx !== cardIdx) return;
    flushBlockUpdate();
    try {
      if ((e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      }
    } catch {}

    if (draggingItem.hasMoved) {
      setPinnedBadge({ text: "📌 Card Position Placed & Saved", x: e.clientX, y: e.clientY });
      setTimeout(() => setPinnedBadge(null), 1800);
    } else if (isEditable) {
      if (onSelectElement) {
        onSelectElement(targetBlock.id, "reasons", cardIdx);
      } else if (onEditSection) {
        onEditSection(targetBlock.id);
      }
    }
    setDraggingItem(null);
  };

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

  // Preload image aspect ratios for all images across blocks (cached to prevent re-instantiation)
  const preloadedAspectUrlsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    visibleBlocks.forEach((b) => {
      const imgList = Array.isArray(b.images) && b.images.length > 0 ? b.images : b.image ? [b.image] : [];
      imgList.forEach((src) => {
        if (!src || preloadedAspectUrlsRef.current.has(src) || imageAspects[src]) return;
        preloadedAspectUrlsRef.current.add(src);
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

  // Keyboard Escape listener for Lightbox and body lock/hide disturbances
  useEffect(() => {
    if (galleryViewer) {
      document.body.classList.add("photo-lightbox-active");
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setGalleryViewer(null);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.classList.remove("photo-lightbox-active");
        document.body.style.overflow = prevOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
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
  const blowSpecificCandle = (index: number, countOverride?: number) => {
    const totalCount = Math.max(1, countOverride ?? (currentBlock?.type === "cake" ? getBlockCandleCount(currentBlock) : activeCandleCount));
    const curr = Array.from({ length: totalCount }, (_, i) => Boolean(candles[i]));
    if (curr[index]) return;

    curr[index] = true;
    setCandles(curr);
    setSmoke((v) => (v.includes(index) ? v : [...v, index]));

    window.setTimeout(() => {
      setSmoke((v) => v.filter((x) => x !== index));
    }, 2200);

    // If all available candles on this cake are extinguished, open the greeting card!
    if (curr.every(Boolean)) {
      setConfettiActive(true);
      setCakeCelebrated(true);
      partyCelebrationRef.current?.triggerBurst();
      window.setTimeout(() => {
        setConfettiActive(false);
      }, 4500);
    }
  };

  const blowCandle = (countOverride?: number) => {
    const totalCount = Math.max(1, countOverride ?? (currentBlock?.type === "cake" ? getBlockCandleCount(currentBlock) : activeCandleCount));
    const curr = Array.from({ length: totalCount }, (_, i) => Boolean(candles[i]));
    const idx = curr.findIndex((x) => !x);
    if (idx < 0) {
      setConfettiActive(true);
      setCakeCelebrated(true);
      partyCelebrationRef.current?.triggerBurst();
      return;
    }
    blowSpecificCandle(idx, totalCount);
  };

  const blowAllCandles = (countOverride?: number) => {
    const totalCount = Math.max(1, countOverride ?? (currentBlock?.type === "cake" ? getBlockCandleCount(currentBlock) : activeCandleCount));
    setCandles(Array(totalCount).fill(true));
    setSmoke(Array.from({ length: totalCount }, (_, i) => i));
    setConfettiActive(true);
    setCakeCelebrated(true);
    partyCelebrationRef.current?.triggerBurst();
    window.setTimeout(() => {
      setSmoke([]);
      setConfettiActive(false);
    }, 4500);
  };

  const ensureDustAnimationRunning = () => {
    const canvas = dustCanvasRef.current;
    if (!canvas || dustAnimRef.current !== null) return;

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
        p.vy += 0.05; // gravity
        p.vx *= 0.978; // drag
        p.alpha -= p.decay;
        p.size = Math.max(0.2, p.size * 0.988);
        p.rotation += p.vRot;

        if (p.alpha > 0.01 && p.size > 0.2) {
          alive.push(p);

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));

          if (p.isSparkle) {
            // Draw dainty 4-point sparkle star without expensive CPU shadowBlur
            const s = p.size * 0.95;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.moveTo(0, -s * 1.5);
            ctx.quadraticCurveTo(0, 0, s * 1.5, 0);
            ctx.quadraticCurveTo(0, 0, 0, s * 1.5);
            ctx.quadraticCurveTo(0, 0, -s * 1.5, 0);
            ctx.quadraticCurveTo(0, 0, 0, -s * 1.5);
            ctx.closePath();
            ctx.fill();

            // Center highlight
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(0, 0, Math.max(0.4, s * 0.3), 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(0, 0, p.size, 0, Math.PI * 2);
            ctx.fill();
          }

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
  };

  // Dedicated Rich Sparkle Burst Generator
  const triggerSparkleBurst = (centerX: number, centerY: number, count = 60, spreadRadius = 40) => {
    const canvas = dustCanvasRef.current;
    if (!canvas) return;

    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    const sparkleColors = [
      "#ffffff",
      "#ffd700",
      "#ffe066",
      "#ff8fa3",
      "#ff4f8b",
      "#f472b6",
      "#c084fc",
      "#38bdf8",
      "#fef08a"
    ];

    const newParticles: DustParticle[] = [];

    // 1. Radiant 4-point sparkle star bursts exploding outward
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.0 + Math.random() * 3.2;
      const r = (Math.random() - 0.5) * spreadRadius;
      newParticles.push({
        x: centerX + Math.cos(angle) * (r * 0.5),
        y: centerY + Math.sin(angle) * (r * 0.5),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.9,
        size: 1.1 + Math.random() * 2.2,
        alpha: 1.0,
        decay: 0.007 + Math.random() * 0.010,
        color: sparkleColors[Math.floor(Math.random() * sparkleColors.length)],
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.12,
        isSparkle: true,
        sparkleScale: 1
      });
    }

    // 2. Floating stardust motes
    for (let i = 0; i < Math.floor(count * 0.65); i++) {
      const angle = (Math.random() - 0.5) * Math.PI * 1.6;
      const speed = 0.6 + Math.random() * 2.0;
      newParticles.push({
        x: centerX + (Math.random() - 0.5) * spreadRadius * 1.8,
        y: centerY + (Math.random() - 0.5) * spreadRadius * 0.8,
        vx: Math.sin(angle) * speed,
        vy: -Math.cos(angle) * speed * 0.9 - Math.random() * 0.8,
        size: 1.4 + Math.random() * 2.5,
        alpha: 0.98,
        decay: 0.006 + Math.random() * 0.008,
        color: sparkleColors[Math.floor(Math.random() * sparkleColors.length)],
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.08,
        isSparkle: Math.random() < 0.65,
        sparkleScale: 1
      });
    }

    dustParticlesRef.current.push(...newParticles);
    ensureDustAnimationRunning();
  };

  const handleSecretToggle = (
    reveal: boolean,
    e?: React.MouseEvent<HTMLElement> | React.PointerEvent<HTMLElement> | HTMLElement | null
  ) => {
    setSecretRevealed(reveal);
    if (reveal) {
      setConfettiActive(true);
      window.setTimeout(() => setConfettiActive(false), 2500);

      // Determine tap / click coordinates
      let clickX = window.innerWidth / 2;
      let clickY = window.innerHeight * 0.55;
      if (e) {
        if ("clientX" in e && typeof e.clientX === "number" && (e.clientX !== 0 || e.clientY !== 0)) {
          clickX = e.clientX;
          clickY = e.clientY;
        } else if ("currentTarget" in e && e.currentTarget instanceof HTMLElement) {
          const rect = e.currentTarget.getBoundingClientRect();
          clickX = rect.left + rect.width / 2;
          clickY = rect.top + rect.height / 2;
        } else if (e instanceof HTMLElement) {
          const rect = e.getBoundingClientRect();
          clickX = rect.left + rect.width / 2;
          clickY = rect.top + rect.height / 2;
        }
      }

      // 1. Immediate vibrant burst on tap!
      triggerSparkleBurst(clickX, clickY, 70, 40);

      // 2. Cascading sparkle showers while the card is opening
      window.setTimeout(() => {
        triggerSparkleBurst(clickX, clickY - 45, 45, 140);
      }, 100);

      window.setTimeout(() => {
        triggerSparkleBurst(clickX, clickY - 15, 60, 240);
      }, 260);

      window.setTimeout(() => {
        triggerSparkleBurst(clickX, clickY + 35, 50, 280);
      }, 450);

      window.setTimeout(() => {
        triggerSparkleBurst(clickX, clickY, 35, 180);
      }, 650);
    }
  };

  // Cinematic Matter-to-Dust & Glowing Sparkle Particle Disintegration
  const triggerDustDisintegration = (targetElement: HTMLElement, clickX?: number, clickY?: number) => {
    const canvas = dustCanvasRef.current;
    if (!canvas) return;

    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    const targetRect = targetElement.getBoundingClientRect();
    const w = targetRect.width || 120;
    const h = targetRect.height || 120;
    const centerX = typeof clickX === "number" ? clickX : (targetRect.left + w / 2);
    const centerY = typeof clickY === "number" ? clickY : (targetRect.top + h / 2);
    const relX = targetRect.left;
    const relY = targetRect.top;

    const count = 65;
    const sparkleColors = [
      "#ffffff",
      "#ffd700",
      "#ffe066",
      "#ff8fa3",
      "#ff4f8b",
      "#f472b6",
      "#c084fc",
      "#38bdf8",
      "#fef08a"
    ];

    const newParticles: DustParticle[] = [];

    // 1. Radiant Sparkle Star Bursts exploding outward from tap center
    for (let i = 0; i < 36; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.8 + Math.random() * 1.8;
      newParticles.push({
        x: centerX + (Math.random() - 0.5) * (w * 0.3),
        y: centerY + (Math.random() - 0.5) * (h * 0.3),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.6,
        size: 0.9 + Math.random() * 1.4,
        alpha: 1.0,
        decay: 0.008 + Math.random() * 0.010,
        color: sparkleColors[Math.floor(Math.random() * sparkleColors.length)],
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.08,
        isSparkle: true,
        sparkleScale: 1
      });
    }

    // 2. Disintegration Dust Floating Motes across Photo Area
    for (let i = 0; i < count; i++) {
      const px = relX + Math.random() * w;
      const py = relY + Math.random() * h;
      const angle = (Math.random() - 0.5) * Math.PI * 1.1;
      const speed = 0.5 + Math.random() * 1.8;

      newParticles.push({
        x: px,
        y: py,
        vx: Math.sin(angle) * speed + (Math.random() - 0.5) * 0.9,
        vy: -Math.cos(angle) * speed * 0.7 - Math.random() * 0.8,
        size: 1.4 + Math.random() * 2.8,
        alpha: 0.98,
        decay: 0.007 + Math.random() * 0.009,
        color: sparkleColors[Math.floor(Math.random() * sparkleColors.length)],
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.08,
        isSparkle: Math.random() < 0.35,
        sparkleScale: 1
      });
    }

    dustParticlesRef.current.push(...newParticles);

    // Subtle scale pop on the tapped image
    targetElement.classList.add("photo-sparkle-tap");
    setTimeout(() => targetElement.classList.remove("photo-sparkle-tap"), 600);

    ensureDustAnimationRunning();
  };

  // Universal Image interactions: Sparkle + Dust Disintegration + Open Photo Lightbox
  const openGalleryPhoto = (
    images: string[],
    index: number,
    isScattered: boolean,
    targetElement?: HTMLElement,
    e?: React.MouseEvent | React.PointerEvent
  ) => {
    if (targetElement) {
      triggerDustDisintegration(targetElement, e?.clientX, e?.clientY);
    }
    if (isScattered) {
      setGalleryScatter(true);
      setDustedPhotos((v) => (v.includes(index) ? v : [...v, index]));
      window.setTimeout(() => setGalleryScatter(false), 1200);
    }
    // Open photo viewer in lightbox smoothly with sparkles
    setTimeout(() => {
      setGalleryViewer({ images, index });
    }, 180);
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
  const activeBg = currentBlock?.background || project.background || "aurora";

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

  const activeBaseColor = currentBlock?.backgroundBaseColor || project.backgroundBaseColor || themeColors[0];
  const activeBg1 = currentBlock?.bgColor1 || project.bgColor1 || themeColors[1];
  const activeBg2 = currentBlock?.bgColor2 || project.bgColor2 || themeColors[2];
  const activeBg3 = currentBlock?.bgColor3 || project.bgColor3 || (project.theme === "light" ? "#e8f7ff" : "#38bdf8");
  const activeBg4 = currentBlock?.bgColor4 || project.bgColor4 || (project.theme === "light" ? "#fff0f5" : "#f59e0b");
  const activeBg5 = currentBlock?.bgColor5 || project.bgColor5 || (project.theme === "light" ? "#fce7f3" : "#10b981");

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
    "--bg5": activeBg5,
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

  // Auto-adjust outer card width and sizing to tightly hug reason cards when adjusted
  if (currentBlock?.type === "reasons") {
    let maxVisualW = 0;
    (currentBlock.items ?? []).forEach((it, idx) => {
      const cKey = it.id || String(idx);
      const bp = currentBlock.reasonCardPositions?.[cKey];
      const wd = typeof it.width === "number" ? it.width : (bp?.width ?? currentBlock.reasonCardWidth);
      const sc = typeof it.scale === "number" ? it.scale : (bp?.scale ?? (currentBlock.reasonCardScale ?? 100));
      if (typeof wd === "number") {
        const eff = Math.round(wd * (sc / 100));
        if (eff > maxVisualW) maxVisualW = eff;
      }
    });
    if (maxVisualW > 0 && maxVisualW < 420) {
      containerStyle.maxWidth = `${Math.max(280, Math.min(450, maxVisualW + 48))}px`;
    }
  }

  const getSectionStyle = (b: Block): CSSProperties => {
    const effectiveCardOpacity = typeof b.cardOpacity === "number" ? b.cardOpacity : (project.globalCardOpacity ?? 14);
    const headingFont = b.headingFont || b.font || project.globalFont || "serif";
    const bodyFont = b.bodyFont || project.globalFont || "sans";
    const titleFont = b.titleFont || project.globalFont || "sans";
    const subtitleFont = b.subtitleFont || project.globalFont || "sans";
    const letterFont = b.letterFont || project.globalFont || "serif";

    const isLightTheme = project.theme === "light";
    const activeAccent = b.accent || themeColors[1];
    const activeAccent2 = themeColors[2];
    const titleColor = b.titleColor || b.kickerColor || (isLightTheme ? "#be185d" : activeAccent2 || "#ff9fc2");
    const headingColor = b.headingColor || project.globalTextColor || themeColors[3];
    const subtitleColor = b.subtitleColor || (isLightTheme ? "#be185d" : activeAccent2 || "#ff9fc2");
    const bodyColor = b.bodyColor || project.globalTextColor || themeColors[3];
    const emojiColor = b.emojiColor || (isLightTheme ? "#db2777" : activeAccent || "#ff86b0");
    const letterColor = b.letterColor || "#2d2024";
    const buttonTextColor = b.buttonColor || (isLightTheme ? "#2d2027" : "#ffffff");

    return {
      fontFamily: getFont(headingFont),
      "--title-font": getFont(titleFont),
      "--subtitle-font": getFont(subtitleFont),
      "--heading-font": getFont(headingFont),
      "--body-font": getFont(bodyFont),
      "--letter-font": getFont(letterFont),
      "--local": activeAccent,
      "--accent": activeAccent,
      "--accent2": activeAccent2,
      "--btn-text-color": buttonTextColor,
      "--btn-back-bg": isLightTheme
        ? `color-mix(in srgb, ${activeAccent} 12%, rgba(255, 255, 255, 0.85))`
        : `color-mix(in srgb, ${activeAccent} 20%, rgba(255, 255, 255, 0.12))`,
      "--btn-back-border": isLightTheme
        ? `color-mix(in srgb, ${activeAccent} 35%, rgba(0, 0, 0, 0.15))`
        : `color-mix(in srgb, ${activeAccent} 48%, rgba(255, 255, 255, 0.45))`,
      "--btn-back-hover-bg": isLightTheme
        ? `color-mix(in srgb, ${activeAccent} 22%, rgba(255, 255, 255, 0.95))`
        : `color-mix(in srgb, ${activeAccent} 35%, rgba(255, 255, 255, 0.22))`,
      "--btn-primary-bg": `linear-gradient(135deg, ${activeAccent} 0%, color-mix(in srgb, ${activeAccent} 70%, #900048) 100%)`,
      "--btn-primary-shadow": `0 8px 26px color-mix(in srgb, ${activeAccent} 38%, transparent)`,
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
    const custom =
      b.textStyles?.[role] ||
      (role === "eyebrow" ? b.textStyles?.["subtitle"] : undefined) ||
      (role === "subtitle" ? b.textStyles?.["eyebrow"] : undefined) ||
      (role === "title" ? b.textStyles?.["kicker"] : undefined) ||
      (role === "kicker" ? b.textStyles?.["title"] : undefined) ||
      (role === "heading" ? b.textStyles?.["letterHeading"] : undefined) ||
      (role === "letterHeading" ? b.textStyles?.["heading"] : undefined) ||
      (role === "letterBody" ? b.textStyles?.["letter"] : undefined) ||
      (role === "letter" ? b.textStyles?.["letterBody"] : undefined) ||
      (role === "body" ? b.textStyles?.["text"] : undefined) ||
      (role === "text" ? b.textStyles?.["body"] : undefined) ||
      (role === "secretMessage" ? b.textStyles?.["secretText"] || b.textStyles?.["secret"] : undefined) ||
      (role === "secretText" ? b.textStyles?.["secretMessage"] || b.textStyles?.["secret"] : undefined) ||
      (role === "secret" ? b.textStyles?.["secretMessage"] || b.textStyles?.["secretText"] : undefined) ||
      (role === "emoji" ? b.textStyles?.["emoji"] : undefined) ||
      (role === "button" ? b.textStyles?.["buttons"] : undefined) ||
      (role === "backButton" ? b.textStyles?.["buttons"] : undefined) ||
      (role === "keepGoingButton" ? b.textStyles?.["buttons"] : undefined);

    let baseStyle: CSSProperties = { ...fallback };

    const titleColor = b.titleColor || b.kickerColor || (project.theme === "light" ? "#be185d" : "#ff9fc2");
    const headingColor = b.headingColor || project.globalTextColor || themeColors[3];
    const subtitleColor = b.subtitleColor || (project.theme === "light" ? "#be185d" : "#ff9fc2");
    const bodyColor = b.bodyColor || project.globalTextColor || themeColors[3];
    const letterColor = b.letterColor || "#2d2024";
    const buttonColor = b.buttonColor || "#ffffff";
    const reasonTitleColor = b.reasonTitleColor || headingColor;
    const reasonTextColor = b.reasonTextColor || bodyColor;
    const incidentTitleColor = b.incidentTitleColor || headingColor;
    const incidentTextColor = b.incidentTextColor || bodyColor;
    const secretTextColor = b.secretTextColor || bodyColor;
    const cakeSubtitleColor = b.cakeSubtitleColor || subtitleColor;
    const cakeTextColor = b.cakeTextColor || bodyColor;

    if (role === "emoji") {
      baseStyle = {
        fontSize: `${b.emojiSize ?? 48}px`,
        lineHeight: 1.35,
        overflow: "visible",
        ...fallback
      };
    } else if (role === "heading" || role === "letterHeading") {
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
        fontFamily: getFont(b.font || project.globalFont || "sans"),
        color: buttonColor,
        ...fallback
      };
    } else if (role === "reasonTitle") {
      baseStyle = {
        fontFamily: getFont(b.reasonTitleFont || b.headingFont || b.font || project.globalFont),
        fontSize: `${b.reasonTitleSize ?? 17}px`,
        color: reasonTitleColor,
        ...(typeof b.reasonTextOpacity === "number" ? { opacity: b.reasonTextOpacity / 100 } : {}),
        ...fallback
      };
    } else if (role === "reasonText") {
      baseStyle = {
        fontFamily: getFont(b.reasonTextFont || b.bodyFont || b.font || project.globalFont),
        fontSize: `${b.reasonTextSize ?? 14}px`,
        color: reasonTextColor,
        ...(typeof b.reasonTextOpacity === "number" ? { opacity: b.reasonTextOpacity / 100 } : {}),
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
      const secretFont = b.secretTextFont || b.bodyFont || b.font || project.globalFont;
      baseStyle = {
        fontFamily: getFont(secretFont),
        fontSize: `${b.secretTextSize ?? 28}px`,
        color: secretTextColor,
        lineHeight: b.secretTextLineHeight ?? 1.35,
        letterSpacing: typeof b.secretTextLetterSpacing === "number" ? `${b.secretTextLetterSpacing}px` : undefined,
        textAlign: b.secretTextAlign || "center",
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
      ...(custom.align ? {
        textAlign: custom.align,
        alignSelf: custom.align === "left" ? "flex-start" : custom.align === "right" ? "flex-end" : "center"
      } : {}),
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

    const renderEditableTextBtn = (
      targetBlock: Block,
      role: string,
      className: string,
      content: React.ReactNode,
      extraStyle: CSSProperties = {}
    ) => {
      const isDraggingThis = draggingItem?.type === "text" && draggingItem?.blockId === targetBlock.id && draggingItem?.role === role;
      const customStyle = targetBlock.textStyles?.[role] || {};
      const isLocked = Boolean(positionsLocked || customStyle.locked);
      const targetRole = role === "letterHeading" ? "heading" : role === "eyebrow" ? "subtitle" : role === "sectionKicker" ? "kicker" : role;
      return (
        <button
          type="button"
          className={`editableText ${className} ${isDraggingThis ? "is-dragging" : ""} ${isEditable && isLocked ? "is-position-locked" : ""}`}
          onPointerDown={(e) => isEditable && handleTextPointerDown(e, targetBlock, targetRole)}
          onPointerMove={(e) => isEditable && handleTextPointerMove(e, targetBlock)}
          onPointerUp={(e) => isEditable && handleTextPointerUp(e, targetBlock, targetRole)}
          onPointerCancel={(e) => isEditable && handleTextPointerUp(e, targetBlock, targetRole)}
          onClick={(e) => {
            if (isEditable) {
              e.stopPropagation();
              if (onSelectElement) {
                onSelectElement(targetBlock.id, targetRole);
              } else if (onEditSection) {
                onEditSection(targetBlock.id);
              }
            }
          }}
          title={isEditable ? (isLocked ? "Position locked (click to edit style)" : "Drag to reposition • Click to edit style") : undefined}
          style={{
            position: "relative",
            zIndex: isDraggingThis ? 80 : 20,
            cursor: isEditable ? (isLocked ? "pointer" : (isDraggingThis ? "grabbing" : "grab")) : "default",
            touchAction: isEditable ? (isLocked ? "auto" : "none") : "auto",
            userSelect: isEditable ? "none" : "auto",
            outline: isDraggingThis ? "2px dashed var(--accent, #ff4f8b)" : "none",
            transition: isDraggingThis ? "none" : "transform 0.15s ease",
            ...extraStyle,
            ...getElementStyle(targetBlock, role)
          }}
        >
          {content}
        </button>
      );
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

            const isDraggingThis = draggingItem?.type === "photo" && draggingItem?.blockId === targetBlock.id && draggingItem?.photoIdx === idx;
            const isPhotoLocked = Boolean(positionsLocked || bAdj.locked);

            return (
              <div
                key={`${idx}-${src.slice(-15)}`}
                className={`foregroundPhotoMediaBox sectionPhotoMediaWrap ${isDraggingThis ? "is-dragging" : ""} ${isEditable && isPhotoLocked ? "is-position-locked" : ""}`}
                onPointerDown={(e) => isEditable && handlePhotoPointerDown(e, targetBlock, idx, bAdj)}
                onPointerMove={(e) => isEditable && handlePhotoPointerMove(e, targetBlock)}
                onPointerUp={(e) => isEditable && handlePhotoPointerUp(e, targetBlock, idx)}
                onPointerCancel={(e) => isEditable && handlePhotoPointerUp(e, targetBlock, idx)}
                onClick={(e) => {
                  if (!draggingItem?.hasMoved) {
                    openGalleryPhoto(imagesList, idx, false, e.currentTarget, e);
                    if (isEditable && onSelectElement) {
                      onSelectElement(targetBlock.id, "photo", idx);
                    }
                  }
                }}
                title={isEditable ? (isPhotoLocked ? "Photo position locked (click to view with sparkles)" : "Drag photo to move • Click to view with sparkles") : "Tap photo to explore with sparkles ❤️"}
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
                  boxShadow: isDraggingThis ? "0 14px 36px rgba(0, 0, 0, 0.5)" : "none",
                  outline: isDraggingThis ? "2px dashed var(--accent, #ff4f8b)" : "none",
                  padding: 0,
                  margin: idx > 0 ? "12px 0 0 0" : "0",
                  cursor: isEditable ? (isPhotoLocked ? "pointer" : (isDraggingThis ? "grabbing" : "grab")) : "pointer",
                  touchAction: isEditable ? (isPhotoLocked ? "auto" : "none") : "auto",
                  userSelect: isEditable ? "none" : "auto"
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
      <div className="actions" style={{ position: "relative", zIndex: 100, pointerEvents: "auto", overflow: "visible", paddingBottom: "16px", marginTop: "16px" }}>
        <button
          type="button"
          className="btn backNavBtn"
          disabled={currentSceneIndex === 0}
          onClick={() => setScene(currentSceneIndex - 1)}
          style={{
            position: "relative",
            zIndex: 100,
            pointerEvents: "auto",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            overflow: "visible",
            boxSizing: "border-box",
            ...getElementStyle(b, "backButton")
          }}
        >
          <ArrowLeft size={16} strokeWidth={2.4} style={{ color: "currentColor", stroke: "currentColor" }} /> {b.backButtonText || "Back"}
        </button>
        {currentSceneIndex < visibleBlocks.length - 1 ? (
          <button
            type="button"
            className="btn primary"
            onClick={() => setScene(currentSceneIndex + 1)}
            style={{ position: "relative", zIndex: 100, pointerEvents: "auto", overflow: "visible", boxSizing: "border-box", ...getElementStyle(b, "keepGoingButton") }}
          >
            {b.keepGoingButtonText || "Keep going"} <ArrowRight size={16} />
          </button>
        ) : (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center", position: "relative", zIndex: 100, pointerEvents: "auto", overflow: "visible" }}>
            {!isEditable && onOpenResponseModal && (
              <button
                type="button"
                className="btn primary replyBtn"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenResponseModal();
                }}
                style={{ background: "linear-gradient(135deg, #ff4f8b 0%, #7c5cff 100%)", color: "#fff", fontWeight: 600, position: "relative", zIndex: 100, pointerEvents: "auto", overflow: "visible", boxSizing: "border-box" }}
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
              style={{ position: "relative", zIndex: 100, pointerEvents: "auto", overflow: "visible", boxSizing: "border-box", ...getElementStyle(b, "replayButton") }}
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
                {b.emoji ? renderEditableTextBtn(b, "emoji", "editableDecor", <span className={`emoji-anim-${emojiAnim}`} style={{ display: "inline-block" }}>{b.emoji}</span>) : null}
                {renderEditableTextBtn(b, "kicker", "sectionKicker", b.title)}
                {renderEditableTextBtn(b, "subtitle", "eyebrow", b.subtitle)}
                {renderEditableTextBtn(b, "heading", "heroTitle", b.heading)}
                <div className={`heroTextWrap ${isEditable ? "" : "customScrollbar"}`} style={{ position: "relative", zIndex: 20, overflow: isEditable ? "visible" : "auto" }}>
                  {renderEditableTextBtn(b, "body", "heroText", b.text)}
                </div>
              </>
            ) : (
              <>
                {b.emoji ? (
                  <div className="publicEmoji" style={{ position: "relative", zIndex: 10, ...getElementStyle(b, "emoji") }}>
                    <span className={`emoji-anim-${emojiAnim}`} style={{ display: "inline-block" }}>{b.emoji}</span>
                  </div>
                ) : null}
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

            {(() => {
              const cardGap = typeof b.reasonCardGap === "number" ? b.reasonCardGap : 18;
              return (
                <div
                  className="cards"
                  style={{
                    position: "relative",
                    zIndex: 20,
                    width: "100%",
                    display: "grid",
                    gap: `${cardGap}px`,
                    marginTop: `${Math.round(cardGap * 1.1)}px`
                  }}
                >
                  {(b.items ?? []).map((r, i) => {
                    const cardKey = r.id || String(i);
                    const blockPos = b.reasonCardPositions?.[cardKey];
                    const posX = typeof r.x === "number" ? r.x : (blockPos?.x ?? 0);
                    const posY = typeof r.y === "number" ? r.y : (blockPos?.y ?? 0);
                    const rot = typeof r.rotation === "number" ? r.rotation : (blockPos?.rotation ?? 0);
                    const cardScale = typeof r.scale === "number" ? r.scale : (blockPos?.scale ?? (b.reasonCardScale ?? 100));
                    const cardWidth = typeof r.width === "number" ? r.width : (blockPos?.width ?? b.reasonCardWidth);
                    const cardBgColor = r.cardColor || b.reasonCardColor || b.cardColor || "#ffffff";
                    const cardBgOpacity = typeof r.cardOpacity === "number" ? r.cardOpacity : (typeof b.reasonCardOpacity === "number" ? b.reasonCardOpacity : (project.globalCardOpacity ?? 14));
                    const cardRadius = typeof r.cardRadius === "number" ? r.cardRadius : (typeof b.reasonCardRadius === "number" ? b.reasonCardRadius : (b.radius ?? 21));
                    const cardPadding = typeof r.cardPadding === "number" ? r.cardPadding : (typeof b.reasonCardPadding === "number" ? b.reasonCardPadding : 22);
                    const cardTitleColor = r.titleColor || b.reasonTitleColor || b.headingColor;
                    const cardTextColor = r.textColor || b.reasonTextColor || b.bodyColor;
                    const emojiOpacity = typeof b.reasonEmojiOpacity === "number" ? b.reasonEmojiOpacity / 100 : 1;
                    const isLocked = Boolean(positionsLocked || r.locked || blockPos?.locked);
                    const isDraggingThisCard = draggingItem?.type === "card" && draggingItem?.blockId === b.id && draggingItem?.cardIdx === i;
                    const isSelectedCard = isEditable && typeof selectedCardIndex === "number" && selectedCardIndex === i;

                    const scaleFactor = cardScale / 100;
                    const verticalMarginComp = scaleFactor < 1
                      ? Math.round((scaleFactor - 1) * 38)
                      : (scaleFactor > 1 ? Math.round((scaleFactor - 1) * 16) : 0);

                    return (
                      <article
                        className={`memoryCard ${isDraggingThisCard ? "is-dragging" : ""} ${isEditable && isLocked ? "is-position-locked" : ""} ${isSelectedCard ? "is-selected-card" : ""}`}
                        key={r.id || i}
                        onPointerDown={(e) => isEditable && handleCardPointerDown(e, b, i, r)}
                        onPointerMove={(e) => isEditable && handleCardPointerMove(e, b, i)}
                        onPointerUp={(e) => isEditable && handleCardPointerUp(e, b, i)}
                        onPointerCancel={(e) => isEditable && handleCardPointerUp(e, b, i)}
                        onClick={() => (isEditable ? triggerSelect("reasons", i) : undefined)}
                        style={{
                          position: "relative",
                          zIndex: isDraggingThisCard ? 90 : 20,
                          cursor: isEditable ? (isLocked ? "pointer" : (isDraggingThisCard ? "grabbing" : "grab")) : "default",
                          touchAction: isEditable ? (isLocked ? "auto" : "none") : "auto",
                          userSelect: isEditable ? "none" : "auto",
                          transform: `translate3d(${posX}px, ${posY}px, 0) scale(${cardScale / 100}) rotate(${rot}deg)`,
                          transformOrigin: "center center",
                          transition: isDraggingThisCard ? "none" : "transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease",
                          outline: isDraggingThisCard ? "2px dashed var(--accent, #ff4f8b)" : "none",
                          backgroundColor: `color-mix(in srgb, ${cardBgColor} ${cardBgOpacity}%, transparent)`,
                          borderRadius: `${cardRadius}px`,
                          padding: `${cardPadding}px`,
                          marginTop: verticalMarginComp !== 0 ? `${verticalMarginComp}px` : undefined,
                          marginBottom: verticalMarginComp !== 0 ? `${verticalMarginComp}px` : undefined,
                          ...(typeof cardWidth === "number" ? { width: `${cardWidth}px`, maxWidth: "100%", marginInline: "auto" } : {})
                        }}
                      >
                        {isEditable && (
                          <div
                            className="cardEditControls"
                            onPointerDown={(e) => e.stopPropagation()}
                            onPointerMove={(e) => {
                              if (draggingItem?.type === "card") {
                                handleCardPointerMove(e, b, i);
                              } else {
                                e.stopPropagation();
                              }
                            }}
                            onPointerUp={(e) => {
                              if (draggingItem?.type === "card") {
                                handleCardPointerUp(e, b, i);
                              } else {
                                e.stopPropagation();
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              className="cardDragHandle"
                              title="Drag to reposition card manually anywhere"
                              onPointerDown={(e) => {
                                e.stopPropagation();
                                handleCardPointerDown(e, b, i, r);
                              }}
                              onPointerMove={(e) => {
                                if (isEditable && draggingItem?.type === "card") {
                                  handleCardPointerMove(e, b, i);
                                }
                              }}
                              onPointerUp={(e) => {
                                if (isEditable && draggingItem?.type === "card") {
                                  handleCardPointerUp(e, b, i);
                                }
                              }}
                              onPointerCancel={(e) => {
                                if (isEditable && draggingItem?.type === "card") {
                                  handleCardPointerUp(e, b, i);
                                }
                              }}
                            >
                              <GripVertical size={13} style={{ color: "#ff4f8b" }} />
                            </button>
                            <span style={{ fontSize: "10px", fontWeight: 800, color: isSelectedCard ? "#ff4f8b" : "var(--muted)", padding: "0 2px" }}>
                              #{i + 1}
                            </span>
                            <button
                              type="button"
                              className="cardSizeBtn"
                              title="Reduce this card's scale (-5%)"
                              onClick={(e) => {
                                e.stopPropagation();
                                const curScale = typeof r.scale === "number" ? r.scale : (blockPos?.scale ?? (b.reasonCardScale ?? 100));
                                const newScale = Math.max(50, curScale - 5);
                                const list = b.items ? [...b.items] : [];
                                if (list[i]) {
                                  list[i] = { ...list[i], scale: newScale };
                                }
                                const newPosMap = { ...(b.reasonCardPositions || {}) };
                                newPosMap[cardKey] = { ...(newPosMap[cardKey] || {}), scale: newScale };
                                onUpdateBlock?.(b.id, { items: list, reasonCardPositions: newPosMap });
                              }}
                            >
                              -
                            </button>
                            <span className="cardSizeBadge" title="Individual card scale">{cardScale}%</span>
                            <button
                              type="button"
                              className="cardSizeBtn"
                              title="Increase this card's scale (+5%)"
                              onClick={(e) => {
                                e.stopPropagation();
                                const curScale = typeof r.scale === "number" ? r.scale : (blockPos?.scale ?? (b.reasonCardScale ?? 100));
                                const newScale = Math.min(150, curScale + 5);
                                const list = b.items ? [...b.items] : [];
                                if (list[i]) {
                                  list[i] = { ...list[i], scale: newScale };
                                }
                                const newPosMap = { ...(b.reasonCardPositions || {}) };
                                newPosMap[cardKey] = { ...(newPosMap[cardKey] || {}), scale: newScale };
                                onUpdateBlock?.(b.id, { items: list, reasonCardPositions: newPosMap });
                              }}
                            >
                              +
                            </button>
                            <span style={{ color: "rgba(255, 255, 255, 0.25)", margin: "0 1px" }}>|</span>
                            {/* Card Distance / Spacing Steppers */}
                            <button
                              type="button"
                              className="cardSizeBtn"
                              title="Reduce card distance / spacing between cards (-2px)"
                              onClick={(e) => {
                                e.stopPropagation();
                                const curGap = typeof b.reasonCardGap === "number" ? b.reasonCardGap : 18;
                                onUpdateBlock?.(b.id, { reasonCardGap: Math.max(-10, curGap - 2) });
                              }}
                            >
                              ↕-
                            </button>
                            <span className="cardSizeBadge" title="Distance / spacing between cards">{cardGap}px</span>
                            <button
                              type="button"
                              className="cardSizeBtn"
                              title="Increase card distance / spacing between cards (+2px)"
                              onClick={(e) => {
                                e.stopPropagation();
                                const curGap = typeof b.reasonCardGap === "number" ? b.reasonCardGap : 18;
                                onUpdateBlock?.(b.id, { reasonCardGap: Math.min(60, curGap + 2) });
                              }}
                            >
                              ↕+
                            </button>
                            <span style={{ color: "rgba(255, 255, 255, 0.25)", margin: "0 1px" }}>|</span>
                            <button
                              type="button"
                              className="cardSizeBtn"
                              title="Narrow this card's width (-20px)"
                              style={{ fontSize: "10px" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                const curW = typeof r.width === "number" ? r.width : (blockPos?.width ?? (b.reasonCardWidth || 440));
                                const newW = Math.max(220, curW - 20);
                                const list = b.items ? [...b.items] : [];
                                if (list[i]) {
                                  list[i] = { ...list[i], width: newW };
                                }
                                const newPosMap = { ...(b.reasonCardPositions || {}) };
                                newPosMap[cardKey] = { ...(newPosMap[cardKey] || {}), width: newW };
                                onUpdateBlock?.(b.id, { items: list, reasonCardPositions: newPosMap });
                              }}
                            >
                              ‹
                            </button>
                            <span className="cardSizeBadge" title="Individual card width">
                              {typeof cardWidth === "number" ? `${cardWidth}px` : "Auto"}
                            </span>
                            <button
                              type="button"
                              className="cardSizeBtn"
                              title="Widen this card's width (+20px)"
                              style={{ fontSize: "10px" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                const curW = typeof r.width === "number" ? r.width : (blockPos?.width ?? (b.reasonCardWidth || 440));
                                const newW = Math.min(580, curW + 20);
                                const list = b.items ? [...b.items] : [];
                                if (list[i]) {
                                  list[i] = { ...list[i], width: newW };
                                }
                                const newPosMap = { ...(b.reasonCardPositions || {}) };
                                newPosMap[cardKey] = { ...(newPosMap[cardKey] || {}), width: newW };
                                onUpdateBlock?.(b.id, { items: list, reasonCardPositions: newPosMap });
                              }}
                            >
                              ›
                            </button>
                            {(posX !== 0 || posY !== 0 || rot !== 0) && (
                              <button
                                type="button"
                                className="cardResetPosBtn"
                                title="Reset card position to center"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const list = b.items ? [...b.items] : [];
                                  if (list[i]) {
                                    list[i] = { ...list[i], x: 0, y: 0, rotation: 0 };
                                  }
                                  const newPosMap = { ...(b.reasonCardPositions || {}) };
                                  delete newPosMap[cardKey];
                                  onUpdateBlock?.(b.id, { items: list, reasonCardPositions: newPosMap });
                                }}
                              >
                                X:{posX > 0 ? `+${posX}` : posX} Y:{posY > 0 ? `+${posY}` : posY} ↺
                              </button>
                            )}
                            <button
                              type="button"
                              className="cardEdit"
                              title="Customize this card in inspector"
                              onClick={(e) => {
                                e.stopPropagation();
                                triggerSelect("reasons", i);
                              }}
                            >
                              <Pencil size={11} />
                            </button>
                          </div>
                        )}
                    <h3 style={{ ...getElementStyle(b, "reasonTitle"), ...(cardTitleColor ? { color: cardTitleColor } : {}) }}>
                      {r.emoji ? (
                        <span
                          className={`emoji-anim-${emojiAnim}`}
                          style={{
                            display: "inline-block",
                            marginRight: "6px",
                            opacity: emojiOpacity
                          }}
                        >
                          {r.emoji}
                        </span>
                      ) : null}
                      {r.title}
                    </h3>
                    <p style={{ ...getElementStyle(b, "reasonText"), ...(cardTextColor ? { color: cardTextColor } : {}) }}>{r.text}</p>
                  </article>
                );
              })}
            </div>
          );
        })()}

            {isEditable && (
              <button
                type="button"
                className="addReasonPreview"
                style={{ position: "relative", zIndex: 20 }}
                onClick={onAddReason}
              >
                <Plus size={15} strokeWidth={2.5} />
                <span>Add another reason</span>
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
                {b.emoji ? renderEditableTextBtn(b, "emoji", "editableDecor", <span className={`emoji-anim-${emojiAnim}`} style={{ display: "inline-block" }}>{b.emoji}</span>) : null}
                {renderEditableTextBtn(b, "kicker", "sectionKicker", b.title)}
                {renderEditableTextBtn(b, "subtitle", "eyebrow", b.subtitle)}
                {renderEditableTextBtn(b, "heading", "heroTitle", b.heading)}
                <div className="heroTextWrap" style={{ position: "relative", zIndex: 20, overflow: "visible", maxHeight: "none", width: "100%" }}>
                  {renderEditableTextBtn(b, "body", "heroText", b.text)}
                </div>
              </>
            ) : (
              <>
                {b.emoji ? (
                  <div className="publicEmoji" style={{ position: "relative", zIndex: 10, ...getElementStyle(b, "emoji") }}>
                    <span className={`emoji-anim-${emojiAnim}`} style={{ display: "inline-block" }}>{b.emoji}</span>
                  </div>
                ) : null}
                <div className="sectionKicker" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "title") }}>{b.title}</div>
                <div className="eyebrow" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "eyebrow") }}>{b.subtitle}</div>
                <h1 className="heroTitle" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "heading") }}>{b.heading}</h1>
                <div className="heroTextWrap" style={{ position: "relative", zIndex: 20, overflow: "visible", maxHeight: "none", width: "100%" }}>
                  <p className="heroText" style={{ ...getElementStyle(b, "body"), overflow: "visible", whiteSpace: "normal" }}>{b.text}</p>
                </div>
              </>
            )}

            {/* Dedicated Photo Area BELOW Text */}
            {renderForegroundMediaLayer(b)}

            <div className="incidentCards" style={{ position: "relative", zIndex: 20, width: "100%" }}>
              {(b.incidents && b.incidents.length > 0 ? b.incidents : incidentDefaults).map((inc, i) => (
                <article
                  className="incidentCard"
                  key={inc.id || i}
                  onClick={() => (isEditable ? triggerSelect("incidents", i) : undefined)}
                  style={{ cursor: isEditable ? "pointer" : "default" }}
                >
                  {isEditable && (
                    <span className="cardEdit" title="Edit this memory story">
                      <Pencil size={12} />
                    </span>
                  )}
                  <div className="incidentCardHeader">
                    <span className="incidentTag" style={getElementStyle(b, "incidentTag")}>{inc.tag || `Memory #${i + 1}`}</span>
                    {inc.date && <span className="incidentDate" style={getElementStyle(b, "incidentDate")}>📅 {inc.date}</span>}
                  </div>
                  <h3 style={{ color: b.incidentTitleColor || undefined, ...getElementStyle(b, "incidentTitle") }}>
                    <span className={`emoji-anim-${emojiAnim}`} style={{ display: "inline-block", marginRight: "8px" }}>{inc.emoji}</span>
                    {inc.title}
                  </h3>
                  <p style={{ color: b.incidentTextColor || undefined, ...getElementStyle(b, "incidentText") }}>{inc.text}</p>
                  {inc.image && (
                    <div
                      className="incidentPhoto"
                      style={{ cursor: "pointer" }}
                      title="Tap photo to view"
                      onClick={(e) => {
                        e.stopPropagation();
                        openGalleryPhoto([inc.image!], 0, false, e.currentTarget, e);
                      }}
                    >
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
            return [{ x: 50, y: 50, rot: 0, w: mobile ? 180 : 220, h: mobile ? 135 : 165 }];
          }
          if (n === 2) {
            return [
              { x: 32, y: 50, rot: -4, w: mobile ? 145 : 180, h: mobile ? 110 : 135 },
              { x: 68, y: 50, rot: 4, w: mobile ? 145 : 180, h: mobile ? 110 : 135 }
            ];
          }
          if (n === 3) {
            return [
              { x: 50, y: 30, rot: 1, w: mobile ? 135 : 165, h: mobile ? 100 : 125 },
              { x: 28, y: 70, rot: -4, w: mobile ? 130 : 160, h: mobile ? 95 : 120 },
              { x: 72, y: 70, rot: 4, w: mobile ? 130 : 160, h: mobile ? 95 : 120 }
            ];
          }
          if (n === 4) {
            return [
              { x: 30, y: 30, rot: -3, w: mobile ? 125 : 155, h: mobile ? 90 : 115 },
              { x: 70, y: 30, rot: 3, w: mobile ? 125 : 155, h: mobile ? 90 : 115 },
              { x: 30, y: 70, rot: 3, w: mobile ? 125 : 155, h: mobile ? 90 : 115 },
              { x: 70, y: 70, rot: -3, w: mobile ? 125 : 155, h: mobile ? 90 : 115 }
            ];
          }
          if (n === 5) {
            return [
              { x: 28, y: 28, rot: -4, w: mobile ? 115 : 140, h: mobile ? 85 : 105 },
              { x: 72, y: 28, rot: 4, w: mobile ? 115 : 140, h: mobile ? 85 : 105 },
              { x: 50, y: 50, rot: 0, w: mobile ? 118 : 145, h: mobile ? 88 : 108 },
              { x: 28, y: 72, rot: 3, w: mobile ? 115 : 140, h: mobile ? 85 : 105 },
              { x: 72, y: 72, rot: -3, w: mobile ? 115 : 140, h: mobile ? 85 : 105 }
            ];
          }
          if (n === 6) {
            return [
              { x: 22, y: 30, rot: -4, w: mobile ? 110 : 135, h: mobile ? 80 : 100 },
              { x: 50, y: 28, rot: 1, w: mobile ? 110 : 135, h: mobile ? 80 : 100 },
              { x: 78, y: 30, rot: 4, w: mobile ? 110 : 135, h: mobile ? 80 : 100 },
              { x: 22, y: 70, rot: 3, w: mobile ? 110 : 135, h: mobile ? 80 : 100 },
              { x: 50, y: 72, rot: -2, w: mobile ? 110 : 135, h: mobile ? 80 : 100 },
              { x: 78, y: 70, rot: -3, w: mobile ? 110 : 135, h: mobile ? 80 : 100 }
            ];
          }
          if (n === 7) {
            return [
              { x: 22, y: 24, rot: -4, w: mobile ? 105 : 130, h: mobile ? 78 : 96 },
              { x: 50, y: 22, rot: 2, w: mobile ? 105 : 130, h: mobile ? 78 : 96 },
              { x: 78, y: 24, rot: 4, w: mobile ? 105 : 130, h: mobile ? 78 : 96 },
              { x: 36, y: 50, rot: -2, w: mobile ? 108 : 135, h: mobile ? 80 : 100 },
              { x: 64, y: 50, rot: 2, w: mobile ? 108 : 135, h: mobile ? 80 : 100 },
              { x: 28, y: 76, rot: 3, w: mobile ? 105 : 130, h: mobile ? 78 : 96 },
              { x: 72, y: 76, rot: -3, w: mobile ? 105 : 130, h: mobile ? 78 : 96 }
            ];
          }
          if (n === 8) {
            return [
              { x: 22, y: 24, rot: -4, w: mobile ? 105 : 128, h: mobile ? 76 : 94 },
              { x: 50, y: 22, rot: 2, w: mobile ? 105 : 128, h: mobile ? 76 : 94 },
              { x: 78, y: 24, rot: 4, w: mobile ? 105 : 128, h: mobile ? 76 : 94 },
              { x: 36, y: 50, rot: -2, w: mobile ? 105 : 128, h: mobile ? 76 : 94 },
              { x: 64, y: 50, rot: 3, w: mobile ? 105 : 128, h: mobile ? 76 : 94 },
              { x: 22, y: 76, rot: 3, w: mobile ? 105 : 128, h: mobile ? 76 : 94 },
              { x: 50, y: 78, rot: -2, w: mobile ? 105 : 128, h: mobile ? 76 : 94 },
              { x: 78, y: 76, rot: -4, w: mobile ? 105 : 128, h: mobile ? 76 : 94 }
            ];
          }

          // Fallback multi-row responsive scatter for 9+ photos
          const perRow = 3;
          const numRows = Math.ceil(n / perRow);
          const slots = [];
          for (let i = 0; i < n; i++) {
            const row = Math.floor(i / perRow);
            const col = i % perRow;
            const itemsInRow = (row === numRows - 1 && n % perRow !== 0) ? (n % perRow) : perRow;
            const x = itemsInRow === 1 ? 50 : itemsInRow === 2 ? (col === 0 ? 35 : 65) : (col === 0 ? 22 : col === 1 ? 50 : 78);
            const y = Math.round((100 / (numRows + 1)) * (row + 1));
            const rot = ((i * 7 + 3) % 9) - 4;
            const w = mobile ? 100 : 124;
            const h = Math.round(w * 0.74);
            slots.push({ x, y, rot, w, h });
          }
          return slots;
        };

        const baseSlots = getBaseSlots(count, isMobileView);

        // Stage physical dimensions
        const maxStageWidthPx = isMobileView ? 340 : count <= 1 ? 360 : count <= 2 ? 500 : 660;
        const baseStageHeightPx = isMobileView
          ? (count <= 1 ? 155 : count <= 2 ? 165 : count <= 3 ? 190 : count <= 4 ? 205 : count <= 5 ? 220 : count <= 6 ? 235 : count <= 8 ? 260 : 295)
          : (count <= 1 ? 175 : count <= 2 ? 185 : count <= 3 ? 210 : count <= 4 ? 225 : count <= 5 ? 240 : count <= 6 ? 255 : count <= 8 ? 285 : 320);

        // Calculate occupied bounds factoring per-photo scale & pan
        let minXRelative = 100;
        let maxXRelative = 0;
        let minYRelative = 100;
        let maxYRelative = 0;

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
            const maxHPx = isMobileView
              ? (count <= 2 ? 140 : count <= 4 ? 115 : 95)
              : (count <= 2 ? 170 : count <= 4 ? 140 : 115);
            photoHPx = Math.min(maxHPx, baseDim / aspect);
            photoWPx = Math.round(photoHPx * aspect);
          } else if (aspect > 1.35) {
            // Wide Landscape (e.g. 16:9, 4:3)
            const maxWPx = isMobileView
              ? (count <= 2 ? 160 : count <= 4 ? 135 : 115)
              : (count <= 2 ? 200 : count <= 4 ? 165 : 140);
            photoWPx = Math.min(maxWPx, baseDim * 1.1);
            photoHPx = Math.round(photoWPx / aspect);
          } else {
            // Square or Balanced
            const maxDim = isMobileView
              ? (count <= 2 ? 135 : count <= 4 ? 110 : 92)
              : (count <= 2 ? 165 : count <= 4 ? 135 : 112);
            photoWPx = Math.min(maxDim, baseDim * 0.95);
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

          // Relative vertical bounds in stage percentage space
          const halfHPct = ((photoHPx / 2) / baseStageHeightPx) * 100;
          const topBound = rawY - halfHPct;
          const bottomBound = rawY + halfHPct;

          if (topBound < minYRelative) minYRelative = topBound;
          if (bottomBound > maxYRelative) maxYRelative = bottomBound;

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

        // Absolute pixel placement for perfect bounding and zero text collision:
        const groupCenterPct = (minXRelative <= maxXRelative) ? ((minXRelative + maxXRelative) / 2) : 50;
        const shiftXPct = 50 - groupCenterPct;
        const groupCenterYPct = (minYRelative <= maxYRelative) ? ((minYRelative + maxYRelative) / 2) : 50;
        const shiftYPct = 50 - groupCenterYPct;

        // 1. Compute target center in pixels for each photo
        const targetCenters = calculatedItems.map((item) => {
          const rawCenterYPx = ((item.rawY + shiftYPct) / 100) * baseStageHeightPx;
          const rawCenterXPx = ((item.rawX + shiftXPct) / 100) * maxStageWidthPx;
          return {
            ...item,
            rawCenterXPx,
            rawCenterYPx
          };
        });

        // 2. Find minimum top bound across all photos (in pixels)
        const minTopPx = Math.min(...targetCenters.map((it) => it.rawCenterYPx - it.photoHPx / 2));
        // Headroom: ensure highest photo has at least 8px clearance below stage top
        const topShiftPx = minTopPx < 8 ? (8 - minTopPx) : 0;

        // 3. Find minimum left and maximum right bounds
        const minLeftPx = Math.min(...targetCenters.map((it) => it.rawCenterXPx - it.photoWPx / 2));
        const maxRightPx = Math.max(...targetCenters.map((it) => it.rawCenterXPx + it.photoWPx / 2));
        let leftShiftPx = 0;
        if (minLeftPx < 6) {
          leftShiftPx = 6 - minLeftPx;
        } else if (maxRightPx > maxStageWidthPx - 6) {
          leftShiftPx = (maxStageWidthPx - 6) - maxRightPx;
        }

        // 4. Calculate final stage height: exactly enough to fit the lowest photo + bottom safety margin
        const maxBottomPx = Math.max(
          ...targetCenters.map((it) => it.rawCenterYPx + topShiftPx + it.photoHPx / 2)
        );
        const finalStageHeightPx = Math.round(Math.max(isMobileView ? 140 : 160, maxBottomPx + 14));

        // 5. Convert back to percentage coordinates relative to finalStageHeightPx & maxStageWidthPx
        const positionedItems = targetCenters.map((item) => {
          const finalYPx = item.rawCenterYPx + topShiftPx;
          const finalXPx = item.rawCenterXPx + leftShiftPx;
          const finalY = Math.round((finalYPx / finalStageHeightPx) * 1000) / 10;
          const finalX = Math.round((finalXPx / maxStageWidthPx) * 1000) / 10;
          return {
            ...item,
            finalX,
            finalY
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
            padding: isMobile ? "8px 8px 12px" : "12px 14px 16px"
          }}
        >
          {editBadge}

          {/* 1. TEXT / CONTENT AREA (ALWAYS AT TOP - COMPACT) */}
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
                {b.emoji ? renderEditableTextBtn(b, "emoji", "editableDecor", <span className={`emoji-anim-${emojiAnim}`} style={{ display: "inline-block" }}>{b.emoji}</span>) : null}
                {b.title ? renderEditableTextBtn(b, "kicker", "sectionKicker", b.title) : null}
                {b.subtitle ? renderEditableTextBtn(b, "subtitle", "eyebrow", b.subtitle) : null}
                {b.heading ? renderEditableTextBtn(b, "heading", "heroTitle", b.heading) : null}
                {b.text ? (
                  <div className="heroTextWrap" style={{ position: "relative", zIndex: 20, overflow: "visible", maxHeight: "none", width: "100%" }}>
                    {renderEditableTextBtn(b, "body", "heroText", b.text)}
                  </div>
                ) : null}
              </>
            ) : (
              <>
                {b.emoji ? (
                  <div className="publicEmoji" style={{ position: "relative", zIndex: 10, ...getElementStyle(b, "emoji") }}>
                    <span className={`emoji-anim-${emojiAnim}`} style={{ display: "inline-block" }}>{b.emoji}</span>
                  </div>
                ) : null}
                {b.title ? <div className="sectionKicker" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "title") }}>{b.title}</div> : null}
                {b.subtitle ? <div className="eyebrow" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "eyebrow") }}>{b.subtitle}</div> : null}
                {b.heading ? <h1 className="heroTitle" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "heading") }}>{b.heading}</h1> : null}
                {b.text ? (
                  <div className="heroTextWrap" style={{ position: "relative", zIndex: 20, overflow: "visible", maxHeight: "none", width: "100%" }}>
                    <p className="heroText" style={{ ...getElementStyle(b, "body"), overflow: "visible", whiteSpace: "normal" }}>{b.text}</p>
                  </div>
                ) : null}
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
                {scatterLayout.items.map((item) => {
                  const { src, index: i, finalX, finalY, rotVal, photoWPx, photoHPx, aspect, adjustment, scaleVal } = item;
                  const isDusted = dustedPhotos.includes(i);
                  const opacityVal = (adjustment.opacity ?? b.imageOpacity ?? 100) / 100;
                  const radiusPx = adjustment.cornerRadius ?? 12;
                  const isCover = adjustment.isCustomCropped ? true : (adjustment.fit === "cover");
                  const fitMode = isCover ? "cover" : ((adjustment.fit || b.imageFit || "contain") as "cover" | "contain" | "natural" | "fill");
                  const isNatural = fitMode === "natural";
                  const cropX = adjustment.cropX ?? adjustment.crop?.cropX ?? 50;
                  const cropY = adjustment.cropY ?? adjustment.crop?.cropY ?? 50;
                  const cropScale = (adjustment.cropScale ?? adjustment.crop?.scale ?? 100) / 100;
                  const isHovered = hoveredPhotoIndex === i;
                  const isDraggingThis = draggingItem?.type === "photo" && draggingItem?.blockId === b.id && draggingItem?.photoIdx === i;

                  return (
                    <button
                      type="button"
                      className={`galleryPhoto scatteredPhoto galleryPhoto-${i + 1} ${
                        isDusted ? "photo-dusted" : ""
                      } ${isDraggingThis ? "is-dragging" : ""}`}
                      key={`${i}-${src.slice(-10)}`}
                      onPointerDown={(e) => isEditable && handlePhotoPointerDown(e, b, i, adjustment)}
                      onPointerMove={(e) => isEditable && handlePhotoPointerMove(e, b)}
                      onPointerUp={(e) => {
                        if (isEditable) {
                          if (!draggingItem?.hasMoved) {
                            openGalleryPhoto(images, i, true, e.currentTarget, e);
                          }
                          handlePhotoPointerUp(e, b, i);
                        } else {
                          openGalleryPhoto(images, i, true, e.currentTarget, e);
                        }
                      }}
                      onPointerCancel={(e) => isEditable && handlePhotoPointerUp(e, b, i)}
                      style={{
                        position: "absolute",
                        left: `${finalX}%`,
                        top: `${finalY}%`,
                        width: isNatural ? "auto" : `${Math.round(photoWPx)}px`,
                        maxWidth: "340px",
                        height: isCover ? `${Math.round(photoHPx)}px` : "auto",
                        maxHeight: `${Math.round(photoHPx)}px`,
                        aspectRatio: `${aspect}`,
                        transform: isDusted
                          ? `translate(-50%, -50%) rotate(${rotVal}deg) scale(1.15)`
                          : isHovered || isDraggingThis
                          ? `translate(-50%, -50%) rotate(${rotVal}deg) scale(1.12)`
                          : `translate(-50%, -50%) rotate(${rotVal}deg) scale(1)`,
                        transformOrigin: "center center",
                        zIndex: isDraggingThis ? 80 : isHovered ? 60 : (adjustment.zIndex ?? i) + 5,
                        opacity: opacityVal,
                        borderRadius: `${radiusPx}px`,
                        overflow: "hidden",
                        border: "none",
                        outline: isDraggingThis ? "2px dashed var(--accent, #ff4f8b)" : "none",
                        boxShadow: isHovered || isDraggingThis ? "0 18px 45px rgba(0, 0, 0, 0.6)" : "none",
                        padding: 0,
                        background: "transparent",
                        pointerEvents: "auto",
                        cursor: isEditable ? (isDraggingThis ? "grabbing" : "grab") : "pointer",
                        touchAction: isEditable ? "none" : "auto",
                        userSelect: isEditable ? "none" : "auto",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: isDraggingThis ? "none" : "transform 0.28s cubic-bezier(0.2, 0.9, 0.3, 1), box-shadow 0.28s ease, opacity 0.25s ease"
                      }}
                      onMouseEnter={() => setHoveredPhotoIndex(i)}
                      onMouseLeave={() => setHoveredPhotoIndex(null)}
                      aria-label={`Tap to dissolve memory ${i + 1}`}
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
                      {isEditable && (
                        <span className="galleryPhotoHint">
                          Photo {i + 1}
                        </span>
                      )}
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
                        e.stopPropagation();
                        openGalleryPhoto(images, i, false, e.currentTarget, e);
                        if (isEditable) {
                          triggerSelect("photo", i);
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
                      {isEditable && (
                        <span className="galleryPhotoHint">
                          Photo {i + 1}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Empty State / Add Photos Placeholder */}
            {images.length === 0 && (
              <div className="photoFrame" style={{ position: "relative", zIndex: 25, width: "100%", marginTop: "12px", display: "flex", justifyContent: "center" }}>
                {isEditable ? (
                  <button
                    type="button"
                    className="emptyPhotoAddBtn"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerSelect("photo", 0);
                    }}
                  >
                    <span>Tap here to add and edit photos</span>
                    <span style={{ fontSize: "24px" }}>📸</span>
                  </button>
                ) : (
                  <p style={{ padding: "30px 20px", color: "var(--muted)" }}>
                    No memory photos added yet.
                  </p>
                )}
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
      const hasHeading = Boolean(b.heading && b.heading.trim());
      const hasKicker = Boolean(b.title && b.title.trim());
      const hasSubtitle = Boolean(b.subtitle && b.subtitle.trim());

      return (
        <div className="sceneInner letterScene" style={style}>
          {editBadge}
          <div className="sectionContentLayer" style={{ position: "relative", zIndex: 20, width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            {isEditable ? (
              <>
                {b.emoji ? renderEditableTextBtn(b, "emoji", "editableDecor", <span className={`emoji-anim-${emojiAnim}`} style={{ display: "inline-block" }}>{b.emoji}</span>) : null}
                {hasKicker ? renderEditableTextBtn(b, "kicker", "sectionKicker", b.title) : null}
                {hasSubtitle ? renderEditableTextBtn(b, "subtitle", "eyebrow", b.subtitle) : null}
                <div
                  className="letter editableLetter"
                  style={{ position: "relative", zIndex: 20, width: "min(640px, 100%)", margin: "0 auto" }}
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      triggerSelect("letter");
                    }
                  }}
                >
                  {hasHeading && (
                    <div style={{ marginBottom: "14px" }}>
                      {renderEditableTextBtn(b, "heading", "letterHeading", b.heading, {
                        display: "block",
                        width: "100%",
                        textAlign: "inherit",
                        margin: 0
                      })}
                    </div>
                  )}
                  <div className="letterBodyWrap customScrollbar">
                    {renderEditableTextBtn(b, "letter", "letterBody", b.text || "Tap here to write your personal letter... ✍️", {
                      display: "block",
                      width: "100%",
                      textAlign: "inherit",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word"
                    })}
                  </div>
                </div>
              </>
            ) : (
              <>
                {b.emoji ? (
                  <div className="publicEmoji" style={{ position: "relative", zIndex: 10, ...getElementStyle(b, "emoji") }}>
                    <span className={`emoji-anim-${emojiAnim}`} style={{ display: "inline-block" }}>{b.emoji}</span>
                  </div>
                ) : null}
                {hasKicker ? <div className="sectionKicker" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "title") }}>{b.title}</div> : null}
                {hasSubtitle ? <div className="eyebrow" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "eyebrow") }}>{b.subtitle}</div> : null}
                <article className="letter" style={{ position: "relative", zIndex: 20, width: "min(640px, 100%)", margin: "0 auto" }}>
                  {hasHeading && (
                    <h2 className="letterHeading" style={{ margin: "0 0 14px", ...getElementStyle(b, "letterHeading") }}>
                      {b.heading}
                    </h2>
                  )}
                  <div className="letterBodyWrap customScrollbar">
                    <p style={getElementStyle(b, "letterBody") || getElementStyle(b, "body")}>{b.text}</p>
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
                {b.emoji ? renderEditableTextBtn(b, "emoji", "editableDecor secretHeart", <span className={`emoji-anim-${emojiAnim}`} style={{ display: "inline-block" }}>{b.emoji}</span>) : null}
                {renderEditableTextBtn(b, "kicker", "sectionKicker", b.title)}
                {renderEditableTextBtn(b, "subtitle", "eyebrow", b.subtitle)}
                {renderEditableTextBtn(b, "heading", "heroTitle", b.heading)}
              </>
            ) : (
              <>
                {b.emoji ? (
                  <div className="publicEmoji secretHeart" style={{ position: "relative", zIndex: 10, ...getElementStyle(b, "emoji") }}>
                    <span className={`emoji-anim-${emojiAnim}`} style={{ display: "inline-block" }}>{b.emoji}</span>
                  </div>
                ) : null}
                <div className="sectionKicker" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "title") }}>{b.title}</div>
                <div className="eyebrow" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "eyebrow") }}>{b.subtitle}</div>
                <h1 className="heroTitle" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "heading") }}>{b.heading}</h1>
              </>
            )}

            {!secretRevealed ? (
              <button
                type="button"
                className="btn primary revealBtn"
                style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "revealButton") }}
                onClick={(e) => handleSecretToggle(true, e)}
              >
                {b.revealButtonText || "Tap to reveal"} <span>♥</span>
              </button>
            ) : (
              <div className="secretReveal secretCardBlooming" style={{ position: "relative", zIndex: 20 }} onClick={() => isEditable && triggerSelect("secret")}>
                <div className="secretSparkleEmitter" aria-hidden="true">
                  <span className="secretSparkleFloat s-1">✨</span>
                  <span className="secretSparkleFloat s-2">✦</span>
                  <span className="secretSparkleFloat s-3">🌟</span>
                  <span className="secretSparkleFloat s-4">✨</span>
                  <span className="secretSparkleFloat s-5">✦</span>
                  <span className="secretSparkleFloat s-6">⭐</span>
                </div>
                <span className="secretSparkle">✦</span>
                {isEditable ? (
                  <div className="editableSecretWrapper">
                    {renderEditableTextBtn(b, "secretMessage", "secretRevealText", b.text)}
                    <div className="inlineSecretControls">
                      <button
                        type="button"
                        className="inlineSecretSizeBtn"
                        title="Decrease text size (A-)"
                        onClick={(e) => {
                          e.stopPropagation();
                          const cur = b.secretTextSize ?? 28;
                          const next = Math.max(14, cur - 2);
                          onUpdateBlock?.(b.id, {
                            secretTextSize: next,
                            textStyles: {
                              ...(b.textStyles || {}),
                              secretText: { ...(b.textStyles?.secretText || {}), size: next },
                              secretMessage: { ...(b.textStyles?.secretMessage || {}), size: next }
                            }
                          });
                        }}
                      >
                        A-
                      </button>
                      <span className="inlineSecretSizeBadge" title="Secret message font size">
                        {b.secretTextSize ?? 28}px
                      </span>
                      <button
                        type="button"
                        className="inlineSecretSizeBtn"
                        title="Increase text size (A+)"
                        onClick={(e) => {
                          e.stopPropagation();
                          const cur = b.secretTextSize ?? 28;
                          const next = Math.min(72, cur + 2);
                          onUpdateBlock?.(b.id, {
                            secretTextSize: next,
                            textStyles: {
                              ...(b.textStyles || {}),
                              secretText: { ...(b.textStyles?.secretText || {}), size: next },
                              secretMessage: { ...(b.textStyles?.secretMessage || {}), size: next }
                            }
                          });
                        }}
                      >
                        A+
                      </button>
                      <button
                        type="button"
                        className="inlineQuickEditPencil"
                        title="Edit secret message & typography in inspector"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerSelect("secretMessage");
                        }}
                      >
                        <Pencil size={13} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <h2 className="secretRevealText" style={getElementStyle(b, "secretMessage")}>{b.text}</h2>
                )}
                {/* Dedicated Photo Area in reveal */}
                {renderForegroundMediaLayer(b)}
                {(b.secretImage || (b.type === "secret" && b.image)) && (
                  <div
                    className="secretPhotoMount"
                    style={{ cursor: "pointer" }}
                    title="Tap photo to view"
                    onClick={(e) => {
                      e.stopPropagation();
                      const img = (b.secretImage || b.image) as string;
                      openGalleryPhoto([img], 0, false, e.currentTarget, e);
                    }}
                  >
                    <img src={(b.secretImage || b.image) as string} alt="Secret memory" style={{ opacity: (b.imageOpacity ?? 100) / 100 }} />
                  </div>
                )}
                {(b.secretVideo || (b.type === "secret" && (b.memoryVideo || b.video))) && (
                  <video
                    className="secretVideo"
                    src={
                      typeof (b.secretVideo || b.memoryVideo || b.video) === "string"
                        ? ((b.secretVideo || b.memoryVideo || b.video) as string)
                        : ""
                    }
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

                {/* In Editor: Quick Discovery Buttons for Media - always accessible */}
                {isEditable && (
                  <div style={{ display: "flex", gap: "8px", justifyContent: "center", margin: "14px 0 6px", flexWrap: "wrap", position: "relative", zIndex: 30 }}>
                    <button
                      type="button"
                      className="btn small ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerSelect("photo");
                      }}
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        background: "rgba(255, 255, 255, 0.12)",
                        border: "1px dashed rgba(255, 255, 255, 0.45)",
                        color: "#ffffff",
                        borderRadius: "999px",
                        padding: "5px 14px",
                        cursor: "pointer"
                      }}
                    >
                      + 📸 {b.secretImage || b.image || (b.images && b.images.length > 0) ? "Add More Secret Photos" : "Add Secret Photo"}
                    </button>
                    {!b.secretVideo && !b.video && !b.memoryVideo ? (
                      <button
                        type="button"
                        className="btn small ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerSelect("video");
                        }}
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          background: "rgba(255, 255, 255, 0.12)",
                          border: "1px dashed rgba(255, 255, 255, 0.45)",
                          color: "#ffffff",
                          borderRadius: "999px",
                          padding: "5px 14px",
                          cursor: "pointer"
                        }}
                      >
                        + 🎥 Add Secret Video
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn small ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerSelect("video");
                        }}
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          background: "rgba(255, 79, 139, 0.25)",
                          border: "1px solid rgba(255, 79, 139, 0.8)",
                          color: "#ffffff",
                          borderRadius: "999px",
                          padding: "5px 14px",
                          cursor: "pointer"
                        }}
                      >
                        🎥 Edit Secret Video
                      </button>
                    )}
                  </div>
                )}
                <button
                  type="button"
                  className="btn ghost small secretHideBtn"
                  onClick={() => handleSecretToggle(false)}
                  style={{
                    marginTop: "16px",
                    background: "rgba(255, 255, 255, 0.18)",
                    border: "1px solid rgba(255, 255, 255, 0.45)",
                    color: "#ffffff",
                    fontWeight: 600,
                    fontSize: "13px",
                    padding: "8px 22px",
                    borderRadius: "999px",
                    backdropFilter: "blur(12px)",
                    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.3)",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <span>🙈</span> {b.secretHideButtonText || "Hide again"}
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
                {b.emoji ? renderEditableTextBtn(b, "cakeEmoji", "editableDecor cakeHeart", <span className={`emoji-anim-${emojiAnim}`} style={{ display: "inline-block" }}>{b.emoji}</span>) : null}
                {renderEditableTextBtn(b, "kicker", "sectionKicker", b.title)}
                {renderEditableTextBtn(b, "subtitle", "eyebrow", b.subtitle)}
                {renderEditableTextBtn(b, "heading", "heroTitle", b.heading)}
              </>
            ) : (
              <>
                {b.emoji ? (
                  <div className="publicEmoji cakeHeart" style={{ position: "relative", zIndex: 10, ...getElementStyle(b, "emoji") }}>
                    <span className={`emoji-anim-${emojiAnim}`} style={{ display: "inline-block" }}>{b.emoji}</span>
                  </div>
                ) : null}
                <div className="sectionKicker" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "title") }}>{b.title}</div>
                <div className="eyebrow" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "eyebrow") }}>{b.subtitle}</div>
                <h1 className="heroTitle" style={{ position: "relative", zIndex: 20, ...getElementStyle(b, "heading") }}>{b.heading}</h1>
              </>
            )}

            {/* Fully Customizable Cake Graphic: Size, Texture, Color & Candles */}
            {(() => {
              const cakeScale = (b.cakeScale ?? 100) / 100;
              const cakeOffsetX = b.cakeOffsetX || 0;
              const cakeOffsetY = b.cakeOffsetY || 0;
              const isDraggingCake = draggingItem?.type === "cake" && draggingItem?.blockId === b.id;
              const cakeBaseColor = b.cakeColor || "#ff6f9e";
              const cakeDarker = `color-mix(in srgb, ${cakeBaseColor} 65%, #000)`;
              const cakeDeepest = `color-mix(in srgb, ${cakeBaseColor} 35%, #000)`;
              const cakeTopColor = b.cakeTopColor || `color-mix(in srgb, ${cakeBaseColor} 75%, #ffffff)`;
              const cakeCreamColor = b.cakeCreamColor || "rgba(255, 248, 251, 0.75)";
              const cakePlateColor = b.cakePlateColor || "rgba(255, 255, 255, 0.24)";
              const texture = b.cakeTexture || "smooth";
              const isComic = b.cakeModel === "comic-2d";
              const isRacing = b.cakeModel === "racing-3d";
              const isRoyalGold = b.cakeModel === "royal-gold" || texture === "gold";
              const hasCherries = Boolean(b.cakeCherries || isComic);
              const hasRacingTrack = Boolean(b.cakeRacingTrack || isRacing);
              const candleShape = b.cakeCandleShape || (isRacing ? "racing" : isComic ? "comic" : b.cakeModel === "romantic-hearts" ? "heart" : isRoyalGold ? "sparkler" : "standard");
              const hasHeartSwags = Boolean(b.cakeHeartSwags || b.cakeTexture === "hearts" || b.cakeModel === "romantic-hearts");
              const candleCount = getBlockCandleCount(b);
              const candleColor = b.cakeCandleColor || (isRacing ? "#0284c7" : isComic ? "#ffffff" : isRoyalGold ? "#fffbeb" : candleShape === "heart" || candleShape === "double-heart" ? "#fff0f5" : "#fff1f7");
              const candleStripeColor = b.cakeCandleStripeColor || (isRacing ? "#f97316" : isComic ? "#ff4f8b" : isRoyalGold ? "#ffd700" : candleShape === "heart" || candleShape === "double-heart" ? "#ff4d79" : "#ff6f9e");
              const flameStyle = isRacing ? "gold" : isComic ? "comic" : (b.cakeFlameColor || "gold");
              const candleHeight = b.cakeCandleHeight || (isComic ? 76 : candleShape === "heart" ? 68 : isRacing ? 58 : 64);
              const isSparkler = Boolean(b.cakeSparkler || flameStyle === "sparkler" || candleShape === "sparkler");

              const renderSparklerFlame = (off: boolean, bottom: number | string, customLeft?: string, customRight?: string) => {
                const spkScale = typeof b.cakeSparklerScale === "number" ? Math.max(0.2, Math.min(1.2, b.cakeSparklerScale / 100)) : 0.46;
                const svgDim = Math.round(150 * spkScale);
                const halfDim = Math.round(svgDim / 2);
                const centerGlowDim = Math.round(24 * spkScale);
                const coronaDim = Math.round(12 * spkScale);

                return (
                  <span
                    className={`candleSparklerFlame ${off ? "sparklerOff" : ""}`}
                    style={{
                      bottom,
                      ...(customLeft ? { left: customLeft } : {}),
                      ...(customRight ? { right: customRight } : {}),
                      ...(!customLeft && !customRight ? { left: "50%", transform: "translateX(-50%)" } : {})
                    }}
                    aria-hidden="true"
                  >
                    <span
                      className="sparklerCenterGlow"
                      style={{
                        width: `${centerGlowDim}px`,
                        height: `${centerGlowDim}px`
                      }}
                    />
                    <span
                      className="sparklerCorona"
                      style={{
                        width: `${coronaDim}px`,
                        height: `${coronaDim}px`
                      }}
                    />

                    <svg
                      className="sparklerSvg"
                      viewBox="0 0 160 160"
                      style={{
                        position: "absolute",
                        left: `-${halfDim}px`,
                        top: `-${halfDim}px`,
                        width: `${svgDim}px`,
                        height: `${svgDim}px`,
                        overflow: "visible",
                        pointerEvents: "none"
                      }}
                    >
                    <defs>
                      <filter id={`spkGlow-${b.id}`} x="-60%" y="-60%" width="220%" height="220%">
                        <feGaussianBlur stdDeviation="1.6" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    <g className="sparklerRaysGroupA" filter={`url(#spkGlow-${b.id})`}>
                      <line x1="80" y1="80" x2="80" y2="10" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
                      <line x1="80" y1="80" x2="72" y2="22" stroke="#ffeb3b" strokeWidth="1.6" strokeLinecap="round" />
                      <line x1="80" y1="80" x2="88" y2="18" stroke="#fff9c4" strokeWidth="1.8" strokeLinecap="round" />
                      <line x1="80" y1="80" x2="62" y2="28" stroke="#ffa000" strokeWidth="1.4" strokeLinecap="round" />
                      <line x1="80" y1="80" x2="98" y2="24" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />

                      <line x1="80" y1="80" x2="136" y2="24" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                      <line x1="80" y1="80" x2="124" y2="38" stroke="#ffca28" strokeWidth="1.5" strokeLinecap="round" />
                      <line x1="80" y1="80" x2="148" y2="50" stroke="#fffde7" strokeWidth="1.8" strokeLinecap="round" />
                      <line x1="80" y1="80" x2="116" y2="56" stroke="#ff8f00" strokeWidth="1.3" strokeLinecap="round" />

                      <line x1="80" y1="80" x2="24" y2="24" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                      <line x1="80" y1="80" x2="36" y2="38" stroke="#ffca28" strokeWidth="1.5" strokeLinecap="round" />
                      <line x1="80" y1="80" x2="12" y2="50" stroke="#fffde7" strokeWidth="1.8" strokeLinecap="round" />
                      <line x1="80" y1="80" x2="44" y2="56" stroke="#ff8f00" strokeWidth="1.3" strokeLinecap="round" />

                      <line x1="80" y1="80" x2="150" y2="78" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
                      <line x1="80" y1="80" x2="132" y2="92" stroke="#ffd54f" strokeWidth="1.4" strokeLinecap="round" />
                      <line x1="80" y1="80" x2="10" y2="78" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
                      <line x1="80" y1="80" x2="28" y2="92" stroke="#ffd54f" strokeWidth="1.4" strokeLinecap="round" />

                      <line x1="80" y1="80" x2="124" y2="126" stroke="#ffb300" strokeWidth="1.4" strokeLinecap="round" />
                      <line x1="80" y1="80" x2="104" y2="140" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
                      <line x1="80" y1="80" x2="36" y2="126" stroke="#ffb300" strokeWidth="1.4" strokeLinecap="round" />
                      <line x1="80" y1="80" x2="56" y2="140" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
                    </g>

                    <g className="sparklerRaysGroupB" filter={`url(#spkGlow-${b.id})`}>
                      <line x1="80" y1="80" x2="76" y2="14" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
                      <line x1="80" y1="80" x2="84" y2="16" stroke="#ffeb3b" strokeWidth="1.7" strokeLinecap="round" />
                      <line x1="80" y1="80" x2="142" y2="32" stroke="#fff9c4" strokeWidth="1.9" strokeLinecap="round" />
                      <line x1="80" y1="80" x2="110" y2="30" stroke="#ffab00" strokeWidth="1.4" strokeLinecap="round" />
                      <line x1="80" y1="80" x2="18" y2="32" stroke="#fff9c4" strokeWidth="1.9" strokeLinecap="round" />
                      <line x1="80" y1="80" x2="50" y2="30" stroke="#ffab00" strokeWidth="1.4" strokeLinecap="round" />
                      <line x1="80" y1="80" x2="144" y2="66" stroke="#ffffff" strokeWidth="1.7" strokeLinecap="round" />
                      <line x1="80" y1="80" x2="16" y2="66" stroke="#ffffff" strokeWidth="1.7" strokeLinecap="round" />
                      <line x1="80" y1="80" x2="134" y2="110" stroke="#ff8f00" strokeWidth="1.5" strokeLinecap="round" />
                      <line x1="80" y1="80" x2="26" y2="110" stroke="#ff8f00" strokeWidth="1.5" strokeLinecap="round" />
                    </g>

                    <g className="sparklerStarburstTips">
                      <path d="M80 4 L81.5 9 L86.5 10 L81.5 11 L80 16 L78.5 11 L73.5 10 L78.5 9 Z" fill="#ffffff" />
                      <path d="M136 20 L137.5 23.5 L141.5 24 L137.5 25.5 L136 29 L134.5 25.5 L130.5 24 L134.5 23.5 Z" fill="#ffffff" />
                      <path d="M24 20 L25.5 23.5 L29.5 24 L25.5 25.5 L24 29 L22.5 25.5 L18.5 24 L22.5 23.5 Z" fill="#ffffff" />
                      <path d="M150 74 L151 77.5 L155 78 L151 79.5 L150 83 L149 79.5 L145 78 L149 77.5 Z" fill="#ffffff" />
                      <path d="M10 74 L11 77.5 L15 78 L11 79.5 L10 83 L9 79.5 L5 78 L9 77.5 Z" fill="#ffffff" />
                      <path d="M148 46 L149 49.5 L152.5 50 L149 51.5 L148 55 L147 51.5 L143.5 50 L147 49.5 Z" fill="#fff9c4" />
                      <path d="M12 46 L13 49.5 L16.5 50 L13 51.5 L12 55 L11 51.5 L7.5 50 L11 49.5 Z" fill="#fff9c4" />
                      <path d="M104 136 L105 139.5 L108.5 140 L105 141.5 L104 145 L103 141.5 L99.5 140 L103 139.5 Z" fill="#ffd54f" />
                      <path d="M56 136 L57 139.5 L60.5 140 L57 141.5 L56 145 L55 141.5 L51.5 140 L55 139.5 Z" fill="#ffd54f" />
                    </g>
                  </svg>

                  <span className="sparklerEmbers">
                    <span className="spkDot spkDot1" />
                    <span className="spkDot spkDot2" />
                    <span className="spkDot spkDot3" />
                    <span className="spkDot spkDot4" />
                    <span className="spkDot spkDot5" />
                    <span className="spkDot spkDot6" />
                  </span>
                </span>
              );
            };

              const candleGap = candleShape === "double-heart" ? 18 : candleCount <= 1 ? 0 : candleCount <= 3 ? 40 : candleCount <= 5 ? 24 : candleCount <= 7 ? 14 : 8;
              const candleWidth = isComic ? 20 : candleShape === "heart" ? (candleCount > 7 ? 22 : candleCount > 4 ? 28 : 34) : isRacing ? 15 : (candleCount > 7 ? 10 : candleCount > 5 ? 12 : 14);

              return (
                <div
                  ref={cakeContainerRef}
                  className={`cakeGraphic ${isComic ? "cake-model-comic-2d" : ""} ${isRacing ? "cake-model-racing-3d" : ""} ${isRoyalGold ? "cake-model-royal-gold" : ""} ${isDraggingCake ? "is-dragging" : ""}`}
                  style={{
                    position: "relative",
                    zIndex: isDraggingCake ? 80 : 20,
                    transform: `translate(${cakeOffsetX}px, ${cakeOffsetY}px) scale(${cakeScale})`,
                    transformOrigin: "center bottom",
                    cursor: isEditable ? (isDraggingCake ? "grabbing" : "grab") : "default",
                    touchAction: isEditable ? "none" : "auto",
                    userSelect: isEditable ? "none" : "auto",
                    outline: isDraggingCake ? "2px dashed var(--accent, #ff4f8b)" : "none",
                    transition: isDraggingCake ? "none" : "transform 0.15s ease",
                    filter: isComic ? "drop-shadow(0 14px 0 rgba(0, 0, 0, 0.3))" : isRacing ? "drop-shadow(0 14px 28px rgba(2, 132, 199, 0.45))" : "drop-shadow(0 -8px 24px rgba(255, 185, 90, 0.28))"
                  }}
                  onPointerDown={(e) => isEditable && handleCakePointerDown(e, b)}
                  onPointerMove={(e) => isEditable && handleCakePointerMove(e, b)}
                  onPointerUp={(e) => isEditable && handleCakePointerUp(e, b)}
                  onPointerCancel={(e) => isEditable && handleCakePointerUp(e, b)}
                  onClick={(e) => {
                    if (isEditable) {
                      e.stopPropagation();
                      if (onSelectElement) onSelectElement(b.id, "cake");
                      else if (onEditSection) onEditSection(b.id);
                    }
                  }}
                  title={isEditable ? "Drag cake manually anywhere on canvas • Click to customize" : undefined}
                >
                  {isEditable && (
                    <div
                      className="cakeFloatingPill"
                      onPointerDown={(e) => e.stopPropagation()}
                      onPointerMove={(e) => {
                        if (draggingItem?.type === "cake") {
                          handleCakePointerMove(e, b);
                        } else {
                          e.stopPropagation();
                        }
                      }}
                      onPointerUp={(e) => {
                        if (draggingItem?.type === "cake") {
                          handleCakePointerUp(e, b);
                        } else {
                          e.stopPropagation();
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="cardDragHandle"
                        title="Drag cake manually anywhere on canvas"
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          handleCakePointerDown(e, b);
                        }}
                        onPointerMove={(e) => {
                          if (isEditable && draggingItem?.type === "cake") {
                            handleCakePointerMove(e, b);
                          }
                        }}
                        onPointerUp={(e) => {
                          if (isEditable && draggingItem?.type === "cake") {
                            handleCakePointerUp(e, b);
                          }
                        }}
                        onPointerCancel={(e) => {
                          if (isEditable && draggingItem?.type === "cake") {
                            handleCakePointerUp(e, b);
                          }
                        }}
                      >
                        <GripVertical size={13} style={{ color: "#ff4f8b" }} />
                        <span style={{ fontSize: "10px", fontWeight: 700, marginLeft: "2px", color: "#ffffff" }}>Move Cake</span>
                      </button>
                      <span style={{ color: "rgba(255, 255, 255, 0.25)", margin: "0 1px" }}>|</span>
                      <button
                        type="button"
                        className="cardSizeBtn"
                        title="Reduce cake scale (-5%)"
                        onClick={(e) => {
                          e.stopPropagation();
                          const cur = b.cakeScale ?? 100;
                          onUpdateBlock?.(b.id, { cakeScale: Math.max(50, cur - 5) });
                        }}
                      >
                        -
                      </button>
                      <span className="cardSizeBadge">{b.cakeScale ?? 100}%</span>
                      <button
                        type="button"
                        className="cardSizeBtn"
                        title="Increase cake scale (+5%)"
                        onClick={(e) => {
                          e.stopPropagation();
                          const cur = b.cakeScale ?? 100;
                          onUpdateBlock?.(b.id, { cakeScale: Math.min(160, cur + 5) });
                        }}
                      >
                        +
                      </button>
                      {(cakeOffsetX !== 0 || cakeOffsetY !== 0) && (
                        <>
                          <span style={{ color: "rgba(255, 255, 255, 0.25)", margin: "0 1px" }}>|</span>
                          <button
                            type="button"
                            className="cardResetPosBtn"
                            title="Reset cake position to center"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateBlock?.(b.id, { cakeOffsetX: 0, cakeOffsetY: 0 });
                            }}
                          >
                            X:{cakeOffsetX > 0 ? `+${cakeOffsetX}` : cakeOffsetX} Y:{cakeOffsetY > 0 ? `+${cakeOffsetY}` : cakeOffsetY} ↺
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        className="cardEdit"
                        title="Customize cake in inspector"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectElement) onSelectElement(b.id, "cake");
                          else if (onEditSection) onEditSection(b.id);
                        }}
                      >
                        <Pencil size={11} />
                      </button>
                    </div>
                  )}
                  {/* Whipped Cream Puffs & Cherries Layer on Top */}
                  {hasCherries && (
                    <div className="cakeComicCherriesLayer">
                      {[0, 1, 2, 3].map((ci) => (
                        <div key={ci} className="comicCreamDollop">
                          <svg viewBox="0 0 36 38" style={{ width: "32px", height: "34px" }}>
                            <circle cx="18" cy="12" r="10" fill="#dc2626" stroke="#121214" strokeWidth="2.5" />
                            <ellipse cx="14" cy="9" rx="3.5" ry="2" fill="#ffffff" transform="rotate(-20 14 9)" />
                            <path d="M18,3 Q23,-2 26,-4" fill="none" stroke="#121214" strokeWidth="2" strokeLinecap="round" />
                            <path d="M4,22 C4,17 10,16 18,16 C26,16 32,17 32,22 C32,27 28,32 18,32 C8,32 4,27 4,22 Z" fill="#ffffff" stroke="#121214" strokeWidth="2.5" />
                            <path d="M8,26 C12,30 24,30 28,26" fill="none" stroke="#121214" strokeWidth="1.5" />
                          </svg>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 3D Curving Asphalt Ramp & Cars wrapping gracefully along right flank */}
                  {hasRacingTrack && (
                    <div
                      className="cakeRacingRampLayer"
                      style={{
                        position: "absolute",
                        inset: "-15px -25px -10px -25px",
                        pointerEvents: "none",
                        zIndex: 8
                      }}
                    >
                      <svg viewBox="0 0 460 250" style={{ width: "100%", height: "100%", overflow: "visible" }}>
                        <defs>
                          <filter id="rampDropShadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="8" stdDeviation="5" floodOpacity="0.55" floodColor="#000000" />
                          </filter>
                          <linearGradient id="rampAsphaltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#1e293b" />
                            <stop offset="50%" stopColor="#334155" />
                            <stop offset="100%" stopColor="#0f172a" />
                          </linearGradient>
                        </defs>

                        {/* 1. Track Shadow */}
                        <path
                          d="M 22,232 C 75,246 150,248 230,238 C 315,226 385,205 405,170 C 420,140 395,114 330,110 C 290,108 260,110 235,112"
                          fill="none"
                          stroke="#000000"
                          strokeWidth="24"
                          strokeLinecap="round"
                          opacity="0.45"
                          transform="translate(0, 6)"
                        />

                        {/* 2. Track Bevel Base / Roadbed Thickness */}
                        <path
                          d="M 22,232 C 75,246 150,248 230,238 C 315,226 385,205 405,170 C 420,140 395,114 330,110 C 290,108 260,110 235,112"
                          fill="none"
                          stroke="#090d16"
                          strokeWidth="24"
                          strokeLinecap="round"
                        />

                        {/* 3. Asphalt Roadway Surface */}
                        <path
                          d="M 22,232 C 75,246 150,248 230,238 C 315,226 385,205 405,170 C 420,140 395,114 330,110 C 290,108 260,110 235,112"
                          fill="none"
                          stroke="url(#rampAsphaltGrad)"
                          strokeWidth="20"
                          strokeLinecap="round"
                          filter="url(#rampDropShadow)"
                        />

                        {/* 4. Red and White Racing Curbs (Dashed Edge) */}
                        <path
                          d="M 22,232 C 75,246 150,248 230,238 C 315,226 385,205 405,170 C 420,140 395,114 330,110 C 290,108 260,110 235,112"
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="22"
                          strokeLinecap="round"
                          strokeDasharray="6 6"
                          opacity="0.75"
                        />

                        {/* 5. Center Dashed White Line */}
                        <path
                          d="M 22,232 C 75,246 150,248 230,238 C 315,226 385,205 405,170 C 420,140 395,114 330,110 C 290,108 260,110 235,112"
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeDasharray="6 8"
                        />

                        {/* Yellow GT Roadster Climbing Ramp */}
                        <g transform="translate(395, 150) rotate(-55) scale(0.95)" filter="url(#rampDropShadow)">
                          {/* Wheels */}
                          <rect x="-15" y="-9" width="6.5" height="4" rx="1.5" fill="#000" />
                          <rect x="9" y="-9" width="6.5" height="4" rx="1.5" fill="#000" />
                          <rect x="-15" y="6" width="6.5" height="4" rx="1.5" fill="#000" />
                          <rect x="9" y="6" width="6.5" height="4" rx="1.5" fill="#000" />
                          {/* Car Body */}
                          <rect x="-19" y="-7" width="38" height="14" rx="4.5" fill="#eab308" stroke="#18181b" strokeWidth="1.6" />
                          {/* Red racing stripes */}
                          <rect x="-17" y="-2" width="34" height="4.5" fill="#ef4444" />
                          {/* Windshield */}
                          <rect x="-4" y="-5" width="10" height="10" rx="2" fill="#1e293b" />
                          {/* Rear Spoiler */}
                          <rect x="-19" y="-8" width="3" height="16" rx="1" fill="#18181b" />
                          {/* Headlights */}
                          <circle cx="17" cy="-4.5" r="1.8" fill="#ffffff" />
                          <circle cx="17" cy="4.5" r="1.8" fill="#ffffff" />
                        </g>

                        {/* Cyan Supercar at Base Pit Stop */}
                        <g transform="translate(85, 236) rotate(6) scale(0.95)" filter="url(#rampDropShadow)">
                          <rect x="-14" y="-8" width="5.5" height="3.5" rx="1" fill="#000" />
                          <rect x="9" y="-8" width="5.5" height="3.5" rx="1" fill="#000" />
                          <rect x="-14" y="5.5" width="5.5" height="3.5" rx="1" fill="#000" />
                          <rect x="9" y="5.5" width="5.5" height="3.5" rx="1" fill="#000" />
                          <rect x="-17" y="-6" width="35" height="12" rx="4" fill="#06b6d4" stroke="#18181b" strokeWidth="1.4" />
                          <rect x="-4" y="-4" width="9" height="8" rx="1.8" fill="#0f172a" />
                          <rect x="-17" y="-7" width="3.5" height="14" rx="1" fill="#18181b" />
                          <circle cx="16" cy="-3.5" r="1.5" fill="#ffffff" />
                          <circle cx="16" cy="3.5" r="1.5" fill="#ffffff" />
                        </g>

                        {/* Orange Traffic Safety Cones */}
                        <g transform="translate(38, 216) scale(0.85)">
                          <polygon points="0,0 6,-18 12,0" fill="#f97316" stroke="#c2410c" strokeWidth="0.8" />
                          <polygon points="2,-6 6,-18 10,-6" fill="#ffffff" />
                          <polygon points="3.5,-11 6,-18 8.5,-11" fill="#f97316" />
                          <rect x="-2" y="0" width="16" height="3" rx="1" fill="#ea580c" />
                        </g>
                        <g transform="translate(248, 226) scale(0.85)">
                          <polygon points="0,0 6,-18 12,0" fill="#f97316" stroke="#c2410c" strokeWidth="0.8" />
                          <polygon points="2,-6 6,-18 10,-6" fill="#ffffff" />
                          <polygon points="3.5,-11 6,-18 8.5,-11" fill="#f97316" />
                          <rect x="-2" y="0" width="16" height="3" rx="1" fill="#ea580c" />
                        </g>
                        <g transform="translate(325, 96) scale(0.8)">
                          <polygon points="0,0 6,-18 12,0" fill="#f97316" stroke="#c2410c" strokeWidth="0.8" />
                          <polygon points="2,-6 6,-18 10,-6" fill="#ffffff" />
                          <polygon points="3.5,-11 6,-18 8.5,-11" fill="#f97316" />
                          <rect x="-2" y="0" width="16" height="3" rx="1" fill="#ea580c" />
                        </g>
                      </svg>
                    </div>
                  )}

                  {/* Top Deck Stunt Loop & Ring of Fire Arch Toppers */}
                  {hasRacingTrack && (
                    <div
                      className="cakeRacingStuntTopLayer"
                      style={{
                        position: "absolute",
                        left: "50%",
                        transform: "translateX(-50%)",
                        bottom: "122px",
                        width: "320px",
                        height: "92px",
                        pointerEvents: "none",
                        zIndex: 4
                      }}
                    >
                      <svg viewBox="0 0 320 92" style={{ width: "100%", height: "100%", overflow: "visible" }}>
                        <defs>
                          <filter id="stunt3dShadow" x="-30%" y="-30%" width="160%" height="160%">
                            <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.5" floodColor="#000" />
                          </filter>
                          <linearGradient id="stuntLoopAsphalt" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#334155" />
                            <stop offset="50%" stopColor="#1e293b" />
                            <stop offset="100%" stopColor="#0f172a" />
                          </linearGradient>
                          <radialGradient id="ringFireGlow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#ffffff" />
                            <stop offset="25%" stopColor="#fef08a" />
                            <stop offset="55%" stopColor="#f97316" />
                            <stop offset="85%" stopColor="#dc2626" />
                            <stop offset="100%" stopColor="#7f1d1d" />
                          </radialGradient>
                        </defs>

                        {/* LEFT: 360° Stunt Loop-the-Loop */}
                        <g transform="translate(68, 48)" filter="url(#stunt3dShadow)">
                          <ellipse cx="0" cy="0" rx="34" ry="42" fill="none" stroke="url(#stuntLoopAsphalt)" strokeWidth="18" strokeLinecap="round" />
                          <ellipse cx="0" cy="0" rx="42" ry="50" fill="none" stroke="#475569" strokeWidth="1.5" />
                          <ellipse cx="0" cy="0" rx="26" ry="34" fill="none" stroke="#475569" strokeWidth="1.5" />
                          <ellipse cx="0" cy="0" rx="34" ry="42" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeDasharray="5 6" />

                          {/* 5 Bold Red Racing Stars Crowned over the Loop Peak */}
                          {[-30, -15, 0, 15, 30].map((starX, sidx) => {
                            const starY = -42 + Math.abs(starX) * 0.35;
                            return (
                              <g key={sidx} transform={`translate(${starX}, ${starY}) scale(0.85)`}>
                                <polygon
                                  points="0,-8 2.4,-2.5 8,-2.5 3.6,1.5 5.5,7 0,3.6 -5.5,7 -3.6,1.5 -8,-2.5 -2.4,-2.5"
                                  fill="#ef4444"
                                  stroke="#7f1d1d"
                                  strokeWidth="1"
                                  filter="drop-shadow(0 1px 2px rgba(0,0,0,0.5))"
                                />
                              </g>
                            );
                          })}

                          {/* Red Stunt Muscle Car jumping out of Loop */}
                          <g transform="translate(6, 12) rotate(18) scale(0.92)" filter="url(#stunt3dShadow)">
                            <rect x="-14" y="-7" width="5" height="3" rx="1" fill="#000" />
                            <rect x="9" y="-7" width="5" height="3" rx="1" fill="#000" />
                            <rect x="-14" y="5" width="5" height="3" rx="1" fill="#000" />
                            <rect x="9" y="5" width="5" height="3" rx="1" fill="#000" />
                            <rect x="-18" y="-5" width="36" height="11" rx="3.5" fill="#dc2626" stroke="#18181b" strokeWidth="1.2" />
                            <rect x="-16" y="-1.5" width="32" height="3" fill="#ffffff" />
                            <rect x="-3" y="-3.5" width="9" height="7" rx="1.5" fill="#18181b" />
                            <rect x="-18" y="-6" width="3" height="13" rx="1" fill="#18181b" />
                          </g>
                        </g>

                        {/* RIGHT: Fiery Ring of Fire Arch */}
                        <g transform="translate(252, 46)" filter="url(#stunt3dShadow)">
                          <path
                            d="M -34,44 C -34,-12 -22,-38 0,-38 C 22,-38 34,-12 34,44 C 22,38 14,-10 0,-10 C -14,-10 -22,38 -34,44 Z"
                            fill="url(#ringFireGlow)"
                            stroke="#b91c1c"
                            strokeWidth="1.5"
                          />
                          <path
                            d="M -22,44 C -22,4 -14,-18 0,-18 C 14,-18 22,4 22,44 C 14,38 8,0 0,0 C -8,0 -14,38 -22,44 Z"
                            fill="#fef08a"
                            opacity="0.9"
                          />
                          <path d="M -28,8 Q -40,-4 -24,-14 Q -16,-26 -4,-34 Q 4,-44 8,-32 Q 22,-24 16,-10 Q 32,2 26,16" fill="none" stroke="#ea580c" strokeWidth="3" strokeLinecap="round" />
                          <path d="M -14,-8 Q -6,-28 0,-34 Q 6,-28 14,-8" fill="none" stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" />
                          <circle cx="-18" cy="-28" r="2" fill="#fef08a" />
                          <circle cx="22" cy="-24" r="2.2" fill="#facc15" />
                          <circle cx="2" cy="-42" r="2.5" fill="#ffffff" />
                        </g>
                        </svg>
                      </div>
                    )}

                  {/* Luxury Celebration Cake Tiers */}
                  <div className="luxuryCakeWrapper">
                    {/* Top Tier */}
                    <div
                      className={`cakeTier cakeTierTop cake-texture-${texture}`}
                      style={{
                        background: isRacing
                          ? `linear-gradient(180deg, #38bdf8 0%, #0284c7 60%, #0369a1 100%)`
                          : isComic
                          ? (cakeBaseColor || "#ff4f8b")
                          : texture === "striped"
                          ? `repeating-linear-gradient(45deg, ${cakeBaseColor} 0px, ${cakeBaseColor} 14px, color-mix(in srgb, ${cakeBaseColor} 80%, #ffffff) 14px, color-mix(in srgb, ${cakeBaseColor} 80%, #ffffff) 28px)`
                          : (texture === "gold" || isRoyalGold)
                          ? `linear-gradient(180deg, #fffbeb 0%, #fde047 16%, #eab308 40%, #ca8a04 68%, #92400e 92%, #451a03 100%)`
                          : texture === "velvet"
                          ? `linear-gradient(180deg, color-mix(in srgb, ${cakeBaseColor} 90%, #fff) 0%, ${cakeBaseColor} 28%, color-mix(in srgb, ${cakeBaseColor} 75%, #701a75) 68%, color-mix(in srgb, ${cakeBaseColor} 60%, #3b0764) 100%)`
                          : `linear-gradient(180deg, color-mix(in srgb, ${cakeBaseColor} 85%, #fff), ${cakeBaseColor} 50%, ${cakeDarker} 85%, ${cakeDeepest} 100%)`
                      }}
                    >
                      <div className="cakeTierLighting" />
                      <div
                        className="cakeTierTopSurface"
                        style={{
                          background: isRacing
                            ? `radial-gradient(ellipse at 50% 35%, #bae6fd 0%, #38bdf8 55%, #0284c7 100%)`
                            : isComic
                            ? (cakeBaseColor || "#ff4f8b")
                            : (texture === "gold" || isRoyalGold)
                            ? `radial-gradient(ellipse at 50% 35%, #ffffff 0%, #fef08a 28%, #eab308 60%, #a16207 100%)`
                            : texture === "velvet"
                            ? `radial-gradient(ellipse at 50% 35%, #ffffff 0%, color-mix(in srgb, ${cakeTopColor} 80%, #fff) 45%, ${cakeDarker} 100%)`
                            : `radial-gradient(ellipse at 50% 35%, #ffffff 0%, ${cakeTopColor} 55%, ${cakeDarker} 100%)`
                        }}
                      />
                      {isComic && (
                        <svg className="cakeComicDrip" viewBox="0 0 200 48" preserveAspectRatio="none">
                          <path
                            d="M 0,0 L 200,0 L 200,16 Q 190,44 180,18 Q 170,44 160,20 Q 150,48 140,22 Q 130,42 120,18 Q 110,46 100,22 Q 90,44 80,18 Q 70,46 60,20 Q 50,42 40,18 Q 30,46 20,20 Q 10,40 0,16 Z"
                            fill={cakeBaseColor || "#ff4f8b"}
                            stroke="#121214"
                            strokeWidth="3.5"
                            strokeLinejoin="round"
                          />
                          <path d="M 15,6 Q 40,8 70,6" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                      )}
                      {(texture === "drip" && !isComic) && <div className="cakeTierDripTop" style={{ background: cakeCreamColor }} />}
                      {(texture === "sprinkles" || isComic || texture === "comic-pop") && <div className={isComic ? "cakeComicSprinklesOverlay" : "cakeSprinklesOverlay"} />}
                      {texture === "stars" && <div className="cakeStarsOverlay" />}
                      {(texture === "gold" || isRoyalGold) && <div className="cakeGoldOverlay" />}
                      {texture === "hearts" && <div className="cakeHeartsOverlay" />}
                      {texture === "velvet" && <div className="cakeVelvetOverlay cakeVelvetTop" />}
                      {(isRacing || texture === "checkered") && <div className="cakeCheckeredOverlay" style={{ height: "24px" }} />}
                      
                      {/* Draped Heart Swags Top Tier */}
                      {hasHeartSwags && (
                        <svg className="cakeHeartSwagsTop" viewBox="0 0 200 42" preserveAspectRatio="none">
                          <path d="M 12,6 Q 52,32 98,8" fill="none" stroke="rgba(255, 115, 155, 0.8)" strokeWidth="3" strokeLinecap="round" />
                          <path d="M 102,8 Q 148,32 188,6" fill="none" stroke="rgba(255, 115, 155, 0.8)" strokeWidth="3" strokeLinecap="round" />
                          <g transform="translate(12, 6) scale(0.65)"><path d="M0,0 C-3,-6 -10,-4 -10,1 C-10,6 0,11 0,14 C0,11 10,6 10,1 C10,-4 3,-6 0,0 Z" fill="#ff3366" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.3))" /></g>
                          <g transform="translate(55, 20) scale(0.75)"><path d="M0,0 C-3,-6 -10,-4 -10,1 C-10,6 0,11 0,14 C0,11 10,6 10,1 C10,-4 3,-6 0,0 Z" fill="#ff4d79" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.3))" /></g>
                          <g transform="translate(100, 8) scale(0.8)"><path d="M0,0 C-3,-6 -10,-4 -10,1 C-10,6 0,11 0,14 C0,11 10,6 10,1 C10,-4 3,-6 0,0 Z" fill="#ff2a55" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.3))" /></g>
                          <g transform="translate(145, 20) scale(0.75)"><path d="M0,0 C-3,-6 -10,-4 -10,1 C-10,6 0,11 0,14 C0,11 10,6 10,1 C10,-4 3,-6 0,0 Z" fill="#ff4d79" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.3))" /></g>
                          <g transform="translate(188, 6) scale(0.65)"><path d="M0,0 C-3,-6 -10,-4 -10,1 C-10,6 0,11 0,14 C0,11 10,6 10,1 C10,-4 3,-6 0,0 Z" fill="#ff3366" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.3))" /></g>
                        </svg>
                      )}

                      {/* Royal Gold Baroque Swags Top Tier */}
                      {isRoyalGold && (
                        <svg className="cakeRoyalGoldSwagsTop" viewBox="0 0 200 36" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="goldSwagGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#d97706" />
                              <stop offset="50%" stopColor="#fef08a" />
                              <stop offset="100%" stopColor="#b45309" />
                            </linearGradient>
                          </defs>
                          <path d="M 16,4 Q 54,26 100,6" fill="none" stroke="url(#goldSwagGrad)" strokeWidth="3" strokeLinecap="round" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.5))" />
                          <path d="M 100,6 Q 146,26 184,4" fill="none" stroke="url(#goldSwagGrad)" strokeWidth="3" strokeLinecap="round" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.5))" />
                          <circle cx="16" cy="6" r="3.5" fill="#fef08a" stroke="#b45309" strokeWidth="1" />
                          <circle cx="58" cy="17" r="4.5" fill="#ffd700" stroke="#78350f" strokeWidth="1" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.45))" />
                          <circle cx="100" cy="8" r="5.5" fill="#fef08a" stroke="#78350f" strokeWidth="1.2" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.45))" />
                          <circle cx="142" cy="17" r="4.5" fill="#ffd700" stroke="#78350f" strokeWidth="1" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.45))" />
                          <circle cx="184" cy="6" r="3.5" fill="#fef08a" stroke="#b45309" strokeWidth="1" />
                        </svg>
                      )}

                      <div className="cakePipedBeadTrim cakePipedBeadTrimTop" />
                    </div>

                    {/* Bottom Tier */}
                    <div
                      className={`cakeTier cakeTierBottom cake-texture-${texture}`}
                      style={{
                        background: isRacing
                          ? `linear-gradient(180deg, #38bdf8 0%, #0284c7 60%, #0369a1 100%)`
                          : isComic
                          ? "#ffffff"
                          : texture === "striped"
                          ? `repeating-linear-gradient(45deg, ${cakeBaseColor} 0px, ${cakeBaseColor} 16px, color-mix(in srgb, ${cakeBaseColor} 80%, #ffffff) 16px, color-mix(in srgb, ${cakeBaseColor} 80%, #ffffff) 32px)`
                          : (texture === "gold" || isRoyalGold)
                          ? `linear-gradient(180deg, #fffbeb 0%, #fde047 16%, #eab308 40%, #ca8a04 68%, #92400e 92%, #451a03 100%)`
                          : texture === "velvet"
                          ? `linear-gradient(180deg, color-mix(in srgb, ${cakeBaseColor} 90%, #fff) 0%, ${cakeBaseColor} 28%, color-mix(in srgb, ${cakeBaseColor} 75%, #701a75) 68%, color-mix(in srgb, ${cakeBaseColor} 60%, #3b0764) 100%)`
                          : `linear-gradient(180deg, color-mix(in srgb, ${cakeBaseColor} 85%, #fff), ${cakeBaseColor} 50%, ${cakeDarker} 85%, ${cakeDeepest} 100%)`
                      }}
                    >
                      <div className="cakeTierLighting" />
                      <div
                        className="cakeTierTopSurface"
                        style={{
                          background: isRacing
                            ? `radial-gradient(ellipse at 50% 35%, #bae6fd 0%, #38bdf8 55%, #0284c7 100%)`
                            : isComic
                            ? (cakeBaseColor || "#ff4f8b")
                            : (texture === "gold" || isRoyalGold)
                            ? `radial-gradient(ellipse at 50% 35%, #ffffff 0%, #fef08a 28%, #eab308 60%, #a16207 100%)`
                            : texture === "velvet"
                            ? `radial-gradient(ellipse at 50% 35%, #ffffff 0%, color-mix(in srgb, ${cakeTopColor} 80%, #fff) 45%, ${cakeDarker} 100%)`
                            : `radial-gradient(ellipse at 50% 35%, #ffffff 0%, ${cakeTopColor} 55%, ${cakeDarker} 100%)`
                        }}
                      />
                      {/* 3D Tier Ambient Contact Shadow from Top Tier */}
                      <div className="cakeTierContactShadow" />

                      {(texture === "drip" && !isComic) && <div className="cakeTierDripBottom" style={{ background: cakeCreamColor }} />}
                      {(texture === "sprinkles" || isComic || texture === "comic-pop") && <div className={isComic ? "cakeComicSprinklesOverlay" : "cakeSprinklesOverlay"} />}
                      {texture === "stars" && <div className="cakeStarsOverlay" />}
                      {(texture === "gold" || isRoyalGold) && <div className="cakeGoldOverlay" />}
                      {texture === "hearts" && <div className="cakeHeartsOverlay" />}
                      {texture === "velvet" && <div className="cakeVelvetOverlay cakeVelvetBottom" />}
                      {(isRacing || texture === "checkered") && <div className="cakeCheckeredOverlay" />}

                      {/* Hot Wheels Racing Logo on Lower Tier Front */}
                      {(isRacing || hasRacingTrack) && (
                        <div
                          className="cakeHotWheelsBadge"
                          style={{
                            position: "absolute",
                            left: "50%",
                            transform: "translateX(-50%)",
                            bottom: "24px",
                            zIndex: 6,
                            pointerEvents: "none"
                          }}
                        >
                          <svg viewBox="0 0 160 48" style={{ width: "138px", height: "42px", filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.6))" }}>
                            <defs>
                              <linearGradient id="hwFlameGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#dc2626" />
                                <stop offset="45%" stopColor="#ea580c" />
                                <stop offset="85%" stopColor="#facc15" />
                                <stop offset="100%" stopColor="#ffffff" />
                              </linearGradient>
                              <linearGradient id="hwTextGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#ffffff" />
                                <stop offset="25%" stopColor="#fef08a" />
                                <stop offset="70%" stopColor="#facc15" />
                                <stop offset="100%" stopColor="#eab308" />
                              </linearGradient>
                            </defs>
                            {/* Dynamic Red Flame Silhouette Wings */}
                            <path
                              d="M 12,24 C 4,21 2,13 14,11 C 24,9 32,15 42,15 C 54,15 62,7 80,7 C 102,7 114,13 134,11 C 148,9 158,17 156,24 C 154,31 142,38 128,36 C 106,34 96,40 76,40 C 56,40 48,32 38,32 C 28,32 20,38 10,36 C 2,34 4,27 12,24 Z"
                              fill="url(#hwFlameGrad)"
                              stroke="#7f1d1d"
                              strokeWidth="2.2"
                            />
                            {/* Orange/Yellow Flame Core */}
                            <path
                              d="M 22,24 C 28,17 44,15 78,15 C 112,15 132,17 142,24 C 132,31 112,33 78,33 C 44,33 28,31 22,24 Z"
                              fill="#f97316"
                              opacity="0.9"
                            />
                            <path
                              d="M 32,24 C 38,19 52,18 78,18 C 104,18 120,19 130,24 C 120,29 104,30 78,30 C 52,30 38,29 32,24 Z"
                              fill="#fef08a"
                              opacity="0.95"
                            />
                            {/* Stylized Italic Bold Hot Wheels Lettering */}
                            <text
                              x="80"
                              y="29"
                              textAnchor="middle"
                              fill="url(#hwTextGrad)"
                              stroke="#78350f"
                              strokeWidth="1.2"
                              style={{
                                fontFamily: "Impact, sans-serif",
                                fontSize: "16px",
                                fontStyle: "italic",
                                fontWeight: 900,
                                letterSpacing: "-0.5px"
                              }}
                            >
                              HOT WHEELS
                            </text>
                          </svg>
                        </div>
                      )}

                      {/* Royal Gold Baroque Swags Bottom Tier */}
                      {isRoyalGold && (
                        <svg className="cakeRoyalGoldSwagsBottom" viewBox="0 0 260 42" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="goldSwagGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#d97706" />
                              <stop offset="50%" stopColor="#fef08a" />
                              <stop offset="100%" stopColor="#b45309" />
                            </linearGradient>
                          </defs>
                          <path d="M 18,6 Q 72,32 130,8" fill="none" stroke="url(#goldSwagGrad2)" strokeWidth="3.5" strokeLinecap="round" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.5))" />
                          <path d="M 130,8 Q 188,32 242,6" fill="none" stroke="url(#goldSwagGrad2)" strokeWidth="3.5" strokeLinecap="round" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.5))" />
                          <circle cx="18" cy="8" r="4" fill="#fef08a" stroke="#b45309" strokeWidth="1" />
                          <circle cx="74" cy="21" r="5" fill="#ffd700" stroke="#78350f" strokeWidth="1" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.45))" />
                          <circle cx="130" cy="10" r="6" fill="#fef08a" stroke="#78350f" strokeWidth="1.2" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.45))" />
                          <circle cx="186" cy="21" r="5" fill="#ffd700" stroke="#78350f" strokeWidth="1" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.45))" />
                          <circle cx="242" cy="8" r="4" fill="#fef08a" stroke="#b45309" strokeWidth="1" />
                        </svg>
                      )}

                      {/* Royal Gold 3D Crown Medallion on Lower Tier Front */}
                      {isRoyalGold && (
                        <div
                          className="cakeRoyalGoldMedallion"
                          style={{
                            position: "absolute",
                            left: "50%",
                            transform: "translateX(-50%)",
                            bottom: "16px",
                            zIndex: 6,
                            pointerEvents: "none"
                          }}
                        >
                          <div style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            background: "radial-gradient(circle at 35% 35%, #fffbeb 0%, #ffd700 40%, #b45309 85%, #78350f 100%)",
                            border: "1.5px solid #fffbeb",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.45), inset 0 1px 3px rgba(255,255,255,0.8)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "18px"
                          }}>
                            👑
                          </div>
                        </div>
                      )}

                      {/* Draped Heart Swags Bottom Tier */}
                      {hasHeartSwags && (
                        <svg className="cakeHeartSwagsBottom" viewBox="0 0 260 48" preserveAspectRatio="none">
                          <path d="M 16,8 Q 52,36 90,10" fill="none" stroke="rgba(255, 115, 155, 0.8)" strokeWidth="3.5" strokeLinecap="round" />
                          <path d="M 90,10 Q 128,38 168,10" fill="none" stroke="rgba(255, 115, 155, 0.8)" strokeWidth="3.5" strokeLinecap="round" />
                          <path d="M 168,10 Q 206,36 240,8" fill="none" stroke="rgba(255, 115, 155, 0.8)" strokeWidth="3.5" strokeLinecap="round" />
                          <g transform="translate(12, 8) scale(0.7)"><path d="M0,0 C-3,-6 -10,-4 -10,1 C-10,6 0,11 0,14 C0,11 10,6 10,1 C10,-4 3,-6 0,0 Z" fill="#ff3366" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.3))" /></g>
                          <g transform="translate(50, 24) scale(0.8)"><path d="M0,0 C-3,-6 -10,-4 -10,1 C-10,6 0,11 0,14 C0,11 10,6 10,1 C10,-4 3,-6 0,0 Z" fill="#ff4d79" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.3))" /></g>
                          <g transform="translate(89, 10) scale(0.85)"><path d="M0,0 C-3,-6 -10,-4 -10,1 C-10,6 0,11 0,14 C0,11 10,6 10,1 C10,-4 3,-6 0,0 Z" fill="#ff2a55" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.3))" /></g>
                          <g transform="translate(128, 26) scale(0.9)"><path d="M0,0 C-3,-6 -10,-4 -10,1 C-10,6 0,11 0,14 C0,11 10,6 10,1 C10,-4 3,-6 0,0 Z" fill="#ff3366" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.3))" /></g>
                          <g transform="translate(167, 10) scale(0.85)"><path d="M0,0 C-3,-6 -10,-4 -10,1 C-10,6 0,11 0,14 C0,11 10,6 10,1 C10,-4 3,-6 0,0 Z" fill="#ff2a55" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.3))" /></g>
                          <g transform="translate(205, 24) scale(0.8)"><path d="M0,0 C-3,-6 -10,-4 -10,1 C-10,6 0,11 0,14 C0,11 10,6 10,1 C10,-4 3,-6 0,0 Z" fill="#ff4d79" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.3))" /></g>
                          <g transform="translate(240, 8) scale(0.7)"><path d="M0,0 C-3,-6 -10,-4 -10,1 C-10,6 0,11 0,14 C0,11 10,6 10,1 C10,-4 3,-6 0,0 Z" fill="#ff3366" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.3))" /></g>
                        </svg>
                      )}

                      <div className="cakePipedBeadTrim cakePipedBeadTrimBottom" />
                    </div>

                    {/* Luxury Cake Stand */}
                    <div
                      className="cakePlate"
                      style={{
                        background: isRacing
                          ? `linear-gradient(180deg, #1e293b 0%, #0f172a 60%, #000000 100%)`
                          : isComic
                          ? "#ffffff"
                          : isRoyalGold
                          ? `linear-gradient(180deg, #fffbeb 0%, #ffd700 35%, #b45309 75%, #78350f 100%)`
                          : `linear-gradient(180deg, ${cakePlateColor}, color-mix(in srgb, ${cakePlateColor} 30%, transparent))`
                      }}
                    />
                  </div>

                  {/* Clearly Visible Birthday Candles on Top Deck */}
                  {candleShape === "double-heart" ? (
                    <div className="candles" style={{ bottom: "122px", justifyContent: "center", zIndex: 12 }}>
                      {(() => {
                        const offLeft = candles[0] ?? false;
                        const offRight = candles[1] ?? false;
                        const allOff = offLeft && offRight;
                        return (
                          <div className="doubleHeartTopperWrap" style={{ width: "80px", height: "80px" }}>
                            {/* Dual flames for the interlocking peaks */}
                            {isSparkler ? (
                              <>
                                {renderSparklerFlame(offLeft, "52px", "15px")}
                                {renderSparklerFlame(offRight, "54px", undefined, "15px")}
                              </>
                            ) : (
                              <>
                                <span className={`flame flame-${flameStyle} ${offLeft ? "flameOff" : ""}`} style={{ left: "15px", bottom: "52px" }} />
                                <span className={`flame flame-${flameStyle} ${offRight ? "flameOff" : ""}`} style={{ right: "15px", bottom: "54px" }} />
                              </>
                            )}
                            {(smoke.includes(0) || smoke.includes(1)) && (
                              <span className="smokePuff" style={{ left: "28px", bottom: "58px" }} />
                            )}
                            <button
                              type="button"
                              aria-label="Interlocking Heart Candles"
                              className={`doubleHeartBtn ${allOff ? "off" : ""}`}
                              onClick={() => {
                                if (!offLeft) blowSpecificCandle(0, 2);
                                else if (!offRight) blowSpecificCandle(1, 2);
                                else blowSpecificCandle(0, 2);
                              }}
                            >
                              <svg viewBox="0 0 76 52" style={{ width: "76px", height: "52px", filter: "drop-shadow(0 4px 10px rgba(255, 61, 120, 0.45))" }}>
                                <defs>
                                  <linearGradient id="dhGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#fff5f8" />
                                    <stop offset={candleStripeColor || "#ff5b8f"} />
                                    <stop offset="100%" stopColor={`color-mix(in srgb, ${candleStripeColor || "#ff5b8f"} 75%, #000)`} />
                                  </linearGradient>
                                  <linearGradient id="dhGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#fff9fa" />
                                    <stop offset={candleColor || "#ff86b0"} />
                                    <stop offset="100%" stopColor={`color-mix(in srgb, ${candleColor || "#ff86b0"} 75%, #000)`} />
                                  </linearGradient>
                                </defs>
                                <path
                                  d="M26 12 C18 1.5, 2 3.5, 2 19 C2 31, 18 39, 26 46 C34 39, 50 31, 50 19 C50 3.5, 34 1.5, 26 12 Z"
                                  fill="rgba(255, 105, 180, 0.22)"
                                  stroke="url(#dhGrad1)"
                                  strokeWidth="5"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M50 14 C42 3.5, 26 5.5, 26 21 C26 33, 42 41, 50 48 C58 41, 74 33, 74 21 C74 5.5, 58 3.5, 50 14 Z"
                                  fill="rgba(255, 182, 193, 0.25)"
                                  stroke="url(#dhGrad2)"
                                  strokeWidth="4.5"
                                  strokeLinejoin="round"
                                />
                                <path d="M10 14 C10 8, 18 5, 23 8" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.85" />
                                <path d="M58 12 C64 12, 68 16, 68 22" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.85" />
                                <line x1="26" y1="12" x2="26" y2="4" stroke="#4a3728" strokeWidth="2.5" strokeLinecap="round" />
                                <line x1="50" y1="14" x2="50" y2="6" stroke="#4a3728" strokeWidth="2.5" strokeLinecap="round" />
                              </svg>
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div
                      className="candles"
                      style={{
                        gap: `${candleGap}px`,
                        bottom: candleShape === "heart" ? "120px" : "122px",
                        zIndex: 12
                      }}
                    >
                      {Array.from({ length: candleCount }).map((_, i) => {
                        const off = candles[i] ?? false;

                        if (candleShape === "heart") {
                          return (
                            <span className="candleWrap" key={i} style={{ width: `${candleWidth}px`, height: `${candleHeight + 31}px` }}>
                              {isSparkler ? (
                                renderSparklerFlame(off, `${candleHeight - 2}px`)
                              ) : (
                                <span className={`flame flame-${flameStyle} ${off ? "flameOff" : ""}`} style={{ bottom: `${candleHeight - 2}px` }} />
                              )}
                              {smoke.includes(i) && <span className="smokePuff" style={{ bottom: `${candleHeight + 8}px` }} />}
                              <button
                                type="button"
                                aria-label={`Heart Candle ${i + 1}`}
                                className={`candleHeartBtn ${off ? "off" : ""}`}
                                onClick={() => blowSpecificCandle(i, candleCount)}
                                style={{ width: `${candleWidth}px`, height: `${candleHeight}px` }}
                                title="Click to blow out candle"
                              >
                                <svg viewBox="0 0 36 44" className="candleHeartSvg" style={{ width: `${candleWidth}px`, height: `${candleHeight}px` }}>
                                  <defs>
                                    <linearGradient id={`hCandleGrad-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                      <stop offset="0%" stopColor={candleColor || "#fff5f8"} />
                                      <stop offset="55%" stopColor={candleStripeColor || "#ff4d79"} />
                                      <stop offset="100%" stopColor={`color-mix(in srgb, ${candleStripeColor || "#ff4d79"} 70%, #000)`} />
                                    </linearGradient>
                                  </defs>
                                  <rect x="16" y="32" width="4" height="12" rx="2" fill={`color-mix(in srgb, ${candleStripeColor || "#ff4d79"} 60%, #fff)`} />
                                  <path
                                    d="M18 10 C12 2, 1 4, 1 16 C1 25, 12 30, 18 35 C24 30, 35 25, 35 16 C35 4, 24 2, 18 10 Z"
                                    fill={`url(#hCandleGrad-${i})`}
                                  />
                                  <path d="M7 13 C7 8, 13 6, 16 9" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.85" />
                                  <line x1="18" y1="10" x2="18" y2="3" stroke="#4a3728" strokeWidth="2.5" strokeLinecap="round" />
                                </svg>
                              </button>
                            </span>
                          );
                        }

                        return (
                          <span className="candleWrap" key={i} style={{ width: `${candleWidth}px`, height: `${candleHeight + 31}px` }}>
                            {isSparkler ? (
                              renderSparklerFlame(off, `${candleHeight}px`)
                            ) : (
                              <span className={`flame flame-${flameStyle} ${off ? "flameOff" : ""}`} style={{ bottom: `${candleHeight}px` }} />
                            )}
                            {smoke.includes(i) && <span className="smokePuff" style={{ bottom: `${candleHeight + 10}px` }} />}
                            <button
                              type="button"
                              aria-label={`Candle ${i + 1}`}
                              className={`candleStick ${off ? "off" : ""} ${isComic || candleShape === "comic" ? "candleComic" : isRacing || candleShape === "racing" ? "candleRacing" : candleShape === "spiral" ? "candleSpiral" : candleShape === "sparkler" ? "candleSparkler" : ""}`}
                              onClick={() => blowSpecificCandle(i, candleCount)}
                              title="Click to blow out candle"
                              style={{
                                width: `${candleWidth}px`,
                                height: `${candleHeight}px`,
                                background:
                                  isComic || candleShape === "comic"
                                    ? `repeating-linear-gradient(45deg, #ffffff 0 10px, ${candleStripeColor || "#ff4f8b"} 10px 20px)`
                                    : isRacing || candleShape === "racing"
                                    ? `repeating-linear-gradient(135deg, #ffffff 0 5px, ${candleColor || "#0284c7"} 5px 12px, ${candleStripeColor || "#f97316"} 12px 18px)`
                                    : candleShape === "spiral"
                                    ? `repeating-linear-gradient(45deg, #fff 0 6px, ${candleStripeColor} 6px 12px, ${candleColor} 12px 18px)`
                                    : candleShape === "sparkler"
                                    ? `linear-gradient(180deg, #ffd700 0%, #ffaa00 40%, #c59b27 100%)`
                                    : `repeating-linear-gradient(135deg, ${candleColor} 0 7px, ${candleStripeColor} 7px 14px)`
                              }}
                            />
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {cakeCelebrated ? (
              <div
                className="cakeCelebrationScreen"
                onClick={(e) => {
                  if (isEditable) triggerSelect("cake");
                  partyCelebrationRef.current?.triggerBurst(e.clientX, e.clientY);
                }}
              >
                <div className="cakeCelebrationBadge">
                  <span>🎉</span>
                  <span>Party Time • Wish Granted</span>
                  <span>🥳</span>
                </div>

                {/* Radiant Sparkle Row */}
                <div className="cakeScreenSparkleRow">
                  <span>✨</span>
                  <span>✦</span>
                  <span>🌟</span>
                  <span>✦</span>
                  <span>✨</span>
                </div>

                <div className="cakeCelebrationEmoji">
                  {isEditable ? (
                    renderEditableTextBtn(
                      b,
                      "cakeCelebrationEmoji",
                      "cakeCelebrationEmojiText",
                      b.cakeCelebrationEmoji || "🎂✨❤️"
                    )
                  ) : (
                    <span>{b.cakeCelebrationEmoji || "🎂✨❤️"}</span>
                  )}
                </div>

                {isEditable ? (
                  renderEditableTextBtn(
                    b,
                    "cakeSubtitle",
                    "cakeCelebrationTitle",
                    b.cakeWishHeading || b.subtitle || "Happy Birthday, once again!"
                  )
                ) : (
                  <h2 className="cakeCelebrationTitle" style={getElementStyle(b, "cakeSubtitle")}>
                    {b.cakeWishHeading || b.subtitle || "Happy Birthday, once again!"}
                  </h2>
                )}

                {isEditable ? (
                  renderEditableTextBtn(
                    b,
                    "cakeText",
                    "cakeCelebrationSub",
                    b.cakeWishText || b.text || "May your year ahead be filled with immense joy, laughter, and every dream fulfilled! 🎉"
                  )
                ) : (
                  <p className="cakeCelebrationSub" style={getElementStyle(b, "cakeText")}>
                    {b.cakeWishText || b.text || "May your year ahead be filled with immense joy, laughter, and every dream fulfilled! 🎉"}
                  </p>
                )}

                {/* Photos & Videos Nested Inside the Opened Screen */}
                <div className="cakeCelebrationMediaHolder">
                  {renderForegroundMediaLayer(b)}

                  {(b.memoryVideo || b.video || resolvedVideo) && (
                    <video
                      className="sectionVideo cakeScreenVideo"
                      src={typeof resolvedVideo === "string" ? resolvedVideo : ""}
                      controls
                      playsInline
                      preload="metadata"
                      autoPlay={b.videoAutoplay ?? false}
                      muted={b.videoMuted ?? true}
                      loop={b.videoLoop ?? false}
                      onClick={(e) => { e.stopPropagation(); isEditable && triggerSelect("video"); }}
                      style={{
                        display: "block",
                        margin: "14px auto",
                        maxWidth: `${b.videoWidth ?? 100}%`,
                        maxHeight: "340px",
                        width: "auto",
                        height: "auto",
                        objectFit: b.videoFit === "contain" ? "contain" : b.videoFit === "fill" ? "fill" : "cover",
                        borderRadius: `${b.videoRadius ?? 16}px`,
                        border: "1px solid rgba(255, 255, 255, 0.35)",
                        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.35)"
                      }}
                    />
                  )}

                  {/* Quick Media Upload Discovery in Editor - always accessible even after adding photos */}
                  {isEditable && (
                    <div style={{ display: "flex", gap: "8px", justifyContent: "center", margin: "10px 0 6px", flexWrap: "wrap", position: "relative", zIndex: 30 }}>
                      <button
                        type="button"
                        className="btn small ghost celebrationMediaBtn"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerSelect("photo");
                        }}
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                          background: "rgba(255, 255, 255, 0.22)",
                          border: "1.5px dashed rgba(255, 255, 255, 0.85)",
                          color: "#ffffff",
                          textShadow: "0 1px 3px rgba(0, 0, 0, 0.75)",
                          borderRadius: "999px",
                          padding: "6px 14px",
                          cursor: "pointer",
                          backdropFilter: "blur(12px)",
                          boxShadow: "0 4px 14px rgba(0, 0, 0, 0.3)"
                        }}
                      >
                        + 📸 {b.image || (b.images && b.images.length > 0) ? "Add More Photos" : "Add Photo"}
                      </button>
                      {!b.video && !b.memoryVideo ? (
                        <button
                          type="button"
                          className="btn small ghost celebrationMediaBtn"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerSelect("video");
                          }}
                          style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                            background: "rgba(255, 255, 255, 0.22)",
                            border: "1.5px dashed rgba(255, 255, 255, 0.85)",
                            color: "#ffffff",
                            textShadow: "0 1px 3px rgba(0, 0, 0, 0.75)",
                            borderRadius: "999px",
                            padding: "6px 14px",
                            cursor: "pointer",
                            backdropFilter: "blur(12px)",
                            boxShadow: "0 4px 14px rgba(0, 0, 0, 0.3)"
                          }}
                        >
                          + 🎥 Add Video
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn small ghost celebrationMediaBtn"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerSelect("video");
                          }}
                          style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            background: "rgba(255, 79, 139, 0.25)",
                            border: "1.5px solid rgba(255, 79, 139, 0.8)",
                            color: "#ffffff",
                            borderRadius: "999px",
                            padding: "6px 14px",
                            cursor: "pointer"
                          }}
                        >
                          🎥 Edit Video
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "10px", flexWrap: "wrap", alignItems: "center" }}>
                  <button
                    type="button"
                    className="partyLaunchBtn"
                    onClick={(e) => {
                      e.stopPropagation();
                      partyCelebrationRef.current?.triggerBurst(e.clientX, e.clientY);
                    }}
                    title="Blast more celebration sparkles and confetti!"
                  >
                    <span>🎉</span>
                    <span>Launch Party Fun!</span>
                    <span>✨</span>
                  </button>

                  <button
                    type="button"
                    className="btn ghost small cakeResetBtn"
                    onClick={(e) => {
                      e.stopPropagation();
                      const count = getBlockCandleCount(b);
                      setCandles(Array(count).fill(false));
                      setCakeCelebrated(false);
                    }}
                    style={{
                      marginTop: "0",
                      background: "rgba(255, 255, 255, 0.28)",
                      border: "1.5px solid rgba(255, 255, 255, 0.85)",
                      color: "#ffffff",
                      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                      textShadow: "0 1px 4px rgba(0, 0, 0, 0.75)",
                      fontWeight: 700,
                      fontSize: "12px",
                      padding: "6px 18px",
                      borderRadius: "999px",
                      backdropFilter: "blur(14px)",
                      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.6)",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <span>🕯️</span> {b.cakeResetButtonText || "Light candles again"}
                  </button>
                </div>
              </div>
            ) : (() => {
              const candleCount = getBlockCandleCount(b);
              const isComic = b.cakeModel === "comic-2d";
              const isRacing = b.cakeModel === "racing-3d";
              const candleShape = b.cakeCandleShape || (isRacing ? "racing" : isComic ? "comic" : b.cakeModel === "romantic-hearts" ? "heart" : "standard");
              const isRomantic = b.cakeModel === "romantic-hearts" || candleShape === "heart" || candleShape === "double-heart";
              const currentCandles = Array.from({ length: candleCount }, (_, idx) => Boolean(candles[idx]));
              const remainingCandles = currentCandles.filter((x) => !x).length;

              // If all candles are already blown out, blow button is no longer available
              if (remainingCandles === 0) {
                return (
                  <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "14px", flexWrap: "wrap", position: "relative", zIndex: 20 }}>
                    <button
                      type="button"
                      className="btn primary small"
                      onClick={() => {
                        setConfettiActive(true);
                        setCakeCelebrated(true);
                        partyCelebrationRef.current?.triggerBurst();
                      }}
                      style={{
                        background: isComic
                          ? "linear-gradient(135deg, #ff4f8b 0%, #ff2a70 100%)"
                          : isRacing
                          ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                          : isRomantic
                          ? "linear-gradient(135deg, #ff4d79 0%, #ff2a55 100%)"
                          : undefined,
                        border: isComic ? "2.5px solid #121214" : undefined,
                        boxShadow: isComic ? "0 4px 0 #121214" : undefined
                      }}
                    >
                      🎉 Open Celebration Card
                    </button>
                    {isEditable && (
                      <button
                        type="button"
                        className="btn ghost small"
                        onClick={() => {
                          setCandles(Array(candleCount).fill(false));
                          setCakeCelebrated(false);
                        }}
                        style={{ background: "rgba(255, 255, 255, 0.16)", border: "1px solid rgba(255, 255, 255, 0.4)", color: "#ffffff" }}
                      >
                        🕯️ Light again
                      </button>
                    )}
                  </div>
                );
              }

              // Build button text and styling based on CAKE and AVAILABLE CANDLES
              let blowButtonText = "";
              let blowButtonIcon = "";
              let blowButtonStyle: React.CSSProperties = {};
              let blowAllButtonStyle: React.CSSProperties = {};

              if (candleCount === 1) {
                // Exactly 1 candle on this cake
                if (isComic) {
                  blowButtonIcon = "💥";
                  blowButtonText = "Blow the candle";
                  blowButtonStyle = {
                    background: "linear-gradient(135deg, #ff4f8b 0%, #ff2a70 100%)",
                    border: "2.5px solid #121214",
                    boxShadow: "0 4px 0 #121214, 0 8px 20px rgba(255, 79, 139, 0.4)",
                    color: "#ffffff",
                    fontWeight: 900,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase"
                  };
                } else if (isRacing) {
                  blowButtonIcon = "🏎️";
                  blowButtonText = "Blow the candle";
                  blowButtonStyle = {
                    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 60%, #b91c1c 100%)",
                    border: "1.5px solid #facc15",
                    boxShadow: "0 4px 18px rgba(220, 38, 38, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.6)",
                    color: "#ffffff",
                    fontWeight: 800,
                    fontStyle: "italic",
                    letterSpacing: "0.5px"
                  };
                } else if (isRomantic) {
                  blowButtonIcon = "💖";
                  blowButtonText = "Make a wish & blow";
                  blowButtonStyle = {
                    background: "linear-gradient(135deg, #ff4d79 0%, #ff2a55 100%)",
                    border: "1.5px solid #ffb3c6",
                    boxShadow: "0 4px 22px rgba(255, 77, 121, 0.55), inset 0 1px 1px rgba(255, 255, 255, 0.7)",
                    color: "#ffffff",
                    fontWeight: 700
                  };
                } else {
                  blowButtonIcon = "🌬️";
                  blowButtonText = "Blow the candle";
                  blowButtonStyle = {
                    boxShadow: "0 4px 18px rgba(255, 79, 139, 0.4)"
                  };
                }
              } else {
                // Multiple candles on this cake (candleCount > 1)
                const isFirst = remainingCandles === candleCount;
                if (isComic) {
                  blowButtonIcon = "💥";
                  blowButtonText = isFirst ? `Blow a candle (${remainingCandles})` : `Blow next candle (${remainingCandles} left)`;
                  blowButtonStyle = {
                    background: "linear-gradient(135deg, #ff4f8b 0%, #ff2a70 100%)",
                    border: "2.5px solid #121214",
                    boxShadow: "0 4px 0 #121214, 0 8px 20px rgba(255, 79, 139, 0.4)",
                    color: "#ffffff",
                    fontWeight: 900,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase"
                  };
                  blowAllButtonStyle = {
                    background: "linear-gradient(135deg, #facc15 0%, #eab308 100%)",
                    border: "2.5px solid #121214",
                    boxShadow: "0 4px 0 #121214",
                    color: "#121214",
                    fontWeight: 900,
                    textTransform: "uppercase"
                  };
                } else if (isRacing) {
                  blowButtonIcon = "🏎️";
                  blowButtonText = isFirst ? `Blow a candle (${remainingCandles})` : `Blow next candle (${remainingCandles} left)`;
                  blowButtonStyle = {
                    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 60%, #b91c1c 100%)",
                    border: "1.5px solid #facc15",
                    boxShadow: "0 4px 18px rgba(220, 38, 38, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.6)",
                    color: "#ffffff",
                    fontWeight: 800,
                    fontStyle: "italic",
                    letterSpacing: "0.5px"
                  };
                  blowAllButtonStyle = {
                    background: "rgba(15, 23, 42, 0.85)",
                    border: "1.5px dashed #facc15",
                    color: "#fef08a",
                    boxShadow: "0 4px 14px rgba(0, 0, 0, 0.5)",
                    fontStyle: "italic",
                    fontWeight: 800
                  };
                } else if (isRomantic) {
                  blowButtonIcon = "💖";
                  blowButtonText = isFirst ? `Blow a candle (${remainingCandles})` : `Blow next candle (${remainingCandles} left)`;
                  blowButtonStyle = {
                    background: "linear-gradient(135deg, #ff4d79 0%, #ff2a55 100%)",
                    border: "1.5px solid #ffb3c6",
                    boxShadow: "0 4px 22px rgba(255, 77, 121, 0.55), inset 0 1px 1px rgba(255, 255, 255, 0.7)",
                    color: "#ffffff",
                    fontWeight: 700
                  };
                  blowAllButtonStyle = {
                    background: "rgba(255, 255, 255, 0.2)",
                    border: "1px solid rgba(255, 255, 255, 0.55)",
                    color: "#ffffff",
                    boxShadow: "0 4px 14px rgba(255, 105, 180, 0.35)",
                    fontWeight: 700
                  };
                } else {
                  blowButtonIcon = "🌬️";
                  blowButtonText = isFirst ? `Blow a candle (${remainingCandles})` : `Blow next candle (${remainingCandles} left)`;
                  blowAllButtonStyle = {
                    background: "rgba(255, 255, 255, 0.16)",
                    border: "1px solid rgba(255, 255, 255, 0.4)",
                    color: "#ffffff"
                  };
                }
              }

              return (
                <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "14px", flexWrap: "wrap", position: "relative", zIndex: 20 }}>
                  <button
                    type="button"
                    className="btn primary small"
                    onClick={() => blowCandle(candleCount)}
                    style={blowButtonStyle}
                  >
                    {blowButtonIcon} {blowButtonText}
                  </button>

                  {/* Show "Blow all candles" ONLY if multiple candles exist AND > 1 are still lit */}
                  {candleCount > 1 && remainingCandles > 1 && (
                    <button
                      type="button"
                      className="btn ghost small"
                      onClick={() => blowAllCandles(candleCount)}
                      style={blowAllButtonStyle}
                    >
                      {isComic ? `💨 Blow all ${remainingCandles} candles` : isRacing ? `🏁 Blow all ${remainingCandles} candles` : isRomantic ? `✨ Blow all candles` : `💨 Blow all ${remainingCandles} candles`}
                    </button>
                  )}

                  {isEditable && (
                    <button
                      type="button"
                      className="btn ghost small"
                      onClick={() => {
                        setConfettiActive(true);
                        setCakeCelebrated(true);
                        partyCelebrationRef.current?.triggerBurst();
                      }}
                      style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px dashed rgba(255, 255, 255, 0.45)", color: "#ffffff" }}
                      title="Preview how the opened greeting card message & memories appear"
                    >
                      📖 Preview Opened Card
                    </button>
                  )}
                </div>
              );
            })()}
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
              {b.emoji ? renderEditableTextBtn(b, "emoji", "editableDecor", <span className={`emoji-anim-${emojiAnim}`} style={{ display: "inline-block" }}>{b.emoji}</span>) : null}
              {renderEditableTextBtn(b, "kicker", "sectionKicker", b.title)}
              {renderEditableTextBtn(b, "subtitle", "eyebrow", b.subtitle)}
              {renderEditableTextBtn(b, "heading", "heroTitle", b.heading)}
              <div className={`heroTextWrap ${isEditable ? "" : "customScrollbar"}`} style={{ position: "relative", zIndex: 20, overflow: isEditable ? "visible" : "auto" }}>
                {renderEditableTextBtn(b, "body", "heroText", b.text)}
              </div>
            </>
          ) : (
            <>
              {b.emoji ? (
                <div className="publicEmoji" style={{ position: "relative", zIndex: 10, ...getElementStyle(b, "emoji") }}>
                  <span className={`emoji-anim-${emojiAnim}`} style={{ display: "inline-block" }}>{b.emoji}</span>
                </div>
              ) : null}
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

          {/* Quick Media Upload Discovery in Editor */}
          {isEditable && (
            <div style={{ display: "flex", gap: "8px", justifyContent: "center", margin: "10px 0 6px", flexWrap: "wrap", position: "relative", zIndex: 30 }}>
              <button
                type="button"
                className="btn small ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerSelect("photo");
                }}
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  background: "rgba(255, 255, 255, 0.12)",
                  border: "1px dashed rgba(255, 255, 255, 0.45)",
                  color: "#ffffff",
                  borderRadius: "999px",
                  padding: "5px 14px",
                  cursor: "pointer"
                }}
              >
                + 📸 {b.image || (b.images && b.images.length > 0) ? "Add More Photos" : "Add Photo"}
              </button>
              {!b.video && !b.memoryVideo ? (
                <button
                  type="button"
                  className="btn small ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerSelect("video");
                  }}
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    background: "rgba(255, 255, 255, 0.12)",
                    border: "1px dashed rgba(255, 255, 255, 0.45)",
                    color: "#ffffff",
                    borderRadius: "999px",
                    padding: "5px 14px",
                    cursor: "pointer"
                  }}
                >
                  + 🎥 Add Video
                </button>
              ) : (
                <button
                  type="button"
                  className="btn small ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerSelect("video");
                  }}
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    background: "rgba(255, 79, 139, 0.25)",
                    border: "1px solid rgba(255, 79, 139, 0.8)",
                    color: "#ffffff",
                    borderRadius: "999px",
                    padding: "5px 14px",
                    cursor: "pointer"
                  }}
                >
                  🎥 Edit Video
                </button>
              )}
            </div>
          )}

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
      className={`preview preview-${previewDevice} preview-${currentBlock?.type || "generic"} bg-${activeBg} theme-${
        project.theme || "dark"
      } motion-${project.globalMotion || "liquid-glass"}`}
      style={containerStyle}
    >
      {/* Lightbox for gallery & photos - Portaled to document.body to cover all bars/tools */}
      {mounted && typeof document !== "undefined" && galleryViewer && createPortal(
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
            <X size={22} />
          </button>
          {galleryViewer.images.length > 1 && (
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
          )}
          <div className="galleryLightboxContent" onClick={(e) => e.stopPropagation()}>
            <img
              key={galleryViewer.index}
              src={galleryViewer.images[galleryViewer.index]}
              alt={`Photo view ${galleryViewer.index + 1}`}
            />
          </div>
          {galleryViewer.images.length > 1 && (
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
          )}
        </div>,
        document.body
      )}

      {/* Background Custom Wallpaper Layer */}
      {activeCustomBg && (
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
      )}

      {/* Darken / Dim Overlay Layer - Active for all background presets & custom wallpapers */}
      {(activeBgOverlay ?? 0) > 0 && (
        <div
          className="backgroundOverlayLayer"
          style={{
            opacity: (activeBgOverlay ?? 18) / 100,
            zIndex: 1,
            pointerEvents: "none",
            transition: "opacity 0.15s ease"
          }}
        />
      )}

      {/* Optimized Particles */}
      {activeBg === "petals" && <Particles type="petals" count={22} />}
      {activeBg === "stars" && <Particles type="stars" count={25} />}
      {confettiActive && <Particles type="confetti" count={40} />}
      <PartyCelebration ref={partyCelebrationRef} active={cakeCelebrated} cakeRef={cakeContainerRef} />

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

      {/* Liquid Glass Dynamic Transition Sheen Sweep */}
      <div key={`sheen-${currentSceneIndex}`} className="liquidGlassSheenWave" aria-hidden="true" />

      {/* Current Scene Content with guaranteed transition key */}
      {currentBlock && (
        <div
          key={`scene-stage-${currentBlock.id || currentSceneIndex}`}
          className={`sceneTransitionStage dir-${transitionDir}`}
          style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}
        >
          {renderSectionContent(currentBlock)}
        </div>
      )}

      {/* Touch-to-Fix Pinned Notification Toast */}
      {pinnedBadge && (
        <div
          style={{
            position: "fixed",
            left: `${pinnedBadge.x}px`,
            top: `${pinnedBadge.y - 30}px`,
            transform: "translate(-50%, -100%)",
            background: "rgba(20, 16, 28, 0.94)",
            backdropFilter: "blur(12px)",
            color: "#fff",
            border: "1px solid var(--accent, #ff4f8b)",
            boxShadow: "0 10px 28px rgba(0, 0, 0, 0.55)",
            padding: "7px 14px",
            borderRadius: "24px",
            fontSize: "12px",
            fontWeight: 600,
            pointerEvents: "none",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          {pinnedBadge.text}
        </div>
      )}

      {/* Global Sparkle & Matter-to-Dust Particle Canvas - Portaled to document.body */}
      {mounted && typeof document !== "undefined"
        ? createPortal(
            <canvas
              ref={dustCanvasRef}
              className="globalDustSparkleCanvas"
              aria-hidden="true"
            />,
            document.body
          )
        : null}
    </section>
  );
}
