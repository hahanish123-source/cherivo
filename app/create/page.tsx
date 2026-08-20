"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import type { ChangeEvent } from "react";
import Link from "next/link";
import type { Block, BlockType, FontName, GreetingProject, ImageAdjustment, MediaValue, ReasonItem } from "@/lib/types";
import { defaultBlocks, normalizeBlock, normalizeProject, reasonDefaults, themes, uid } from "@/lib/greetingConfig";
import GreetingView from "@/components/GreetingView";
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Cake, Eye, EyeOff,
  Image as ImageIcon, Mail, Music2, Pencil, Plus, RotateCcw,
  Sparkles, Trash2, X, Play, Pause, Volume2, HelpCircle
} from "lucide-react";

export default function CreatePage() {
  const [blocks, setBlocks] = useState<Block[]>(defaultBlocks);
  const [selected, setSelected] = useState(0);
  const [selectedReason, setSelectedReason] = useState(0);
  const [scene, setScene] = useState(0);
  const [theme, setTheme] = useState("dark");
  const [background, setBackground] = useState("aurora");
  const [cardBackgroundMode, setCardBackgroundMode] = useState<"same" | "different">("same");
  const [emojiAnimation, setEmojiAnimation] = useState("floating");
  const [globalFont, setGlobalFont] = useState<FontName>("serif");
  const [globalTextColor, setGlobalTextColor] = useState("#fff8fc");
  const [globalCardOpacity, setGlobalCardOpacity] = useState(14);
  const [globalRadius, setGlobalRadius] = useState(21);
  const [globalSpacing, setGlobalSpacing] = useState(18);
  const [globalMotion, setGlobalMotion] = useState("cinematic");
  const [audioName, setAudioName] = useState("");
  const [audioUrl, setAudioUrl] = useState<MediaValue>("");
  const [audioPreviewUrl, setAudioPreviewUrl] = useState("");
  const [audioError, setAudioError] = useState("");
  const [audioPreviewPlaying, setAudioPreviewPlaying] = useState(false);
  const audioPreviewElRef = useRef<HTMLAudioElement | null>(null);

  const [mediaUploading, setMediaUploading] = useState(false);
  const [memoryVideoPreview, setMemoryVideoPreview] = useState<Record<string, string>>({});
  const [customBg, setCustomBg] = useState("");
  const [customBgName, setCustomBgName] = useState("");
  const [customBgOpacity, setCustomBgOpacity] = useState(100);
  const [customBgScale, setCustomBgScale] = useState(100);
  const [customBgPositionX, setCustomBgPositionX] = useState(50);
  const [customBgPositionY, setCustomBgPositionY] = useState(50);
  const [customBgRotation, setCustomBgRotation] = useState(0);
  const [backgroundBaseColor, setBackgroundBaseColor] = useState("#100917");
  const [bgColor1, setBgColor1] = useState("#ff4f8b");
  const [bgColor2, setBgColor2] = useState("#7c5cff");
  const [bgColor3, setBgColor3] = useState("#38bdf8");
  const [bgColor4, setBgColor4] = useState("#f59e0b");
  const [backgroundOverlay, setBackgroundOverlay] = useState(18);
  const [themeOverride, setThemeOverride] = useState(false);
  const [previewOnly, setPreviewOnly] = useState(false);
  const [toast, setToast] = useState("");
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishTitle, setPublishTitle] = useState("A Hanora moment");
  const [publishedLink, setPublishedLink] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [selectedGalleryImage, setSelectedGalleryImage] = useState(0);
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">("desktop");
  const bgFileInputRef = useRef<HTMLInputElement | null>(null);
  const sectionBgFileInputRef = useRef<HTMLInputElement | null>(null);

  const fontOptions = (
    <>
      <optgroup label="Standard Fonts">
        <option value="sans">DM Sans (Sans-Serif)</option>
        <option value="serif">Playfair Display (Serif)</option>
      </optgroup>
      <optgroup label="Cursive / Script">
        <option value="great-vibes">Great Vibes</option>
        <option value="dancing-script">Dancing Script</option>
        <option value="caveat">Caveat</option>
        <option value="pacifico">Pacifico</option>
        <option value="satisfy">Satisfy</option>
        <option value="allura">Allura</option>
        <option value="sacramento">Sacramento</option>
      </optgroup>
    </>
  );

  const visible = useMemo(() => blocks.filter((b) => b.visible), [blocks]);
  const current = normalizeBlock(blocks[selected] ?? defaultBlocks[0], 0, globalFont);

  // Collect all uploaded memory photos across the project for easy reuse in Letter
  const allMemoryPhotos = useMemo(() => {
    const photos: string[] = [];
    for (const b of blocks) {
      if (b.type === "memories" || b.type === "gallery") {
        if (Array.isArray(b.images)) {
          for (const img of b.images) {
            if (img && !photos.includes(img)) photos.push(img);
          }
        } else if (b.image && !photos.includes(b.image)) {
          photos.push(b.image);
        }
      }
    }
    return photos;
  }, [blocks]);

  // Project size calculation in bytes
  const projectBytes = useMemo(() => {
    try {
      const data = projectData();
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return 0;
    }
  }, [
    blocks, theme, background, cardBackgroundMode, emojiAnimation,
    globalFont, globalTextColor, globalCardOpacity, globalRadius, globalSpacing,
    globalMotion, audioName, audioUrl, customBg, customBgName, customBgOpacity,
    customBgScale, customBgPositionX, customBgPositionY, customBgRotation,
    backgroundBaseColor, bgColor1, bgColor2, bgColor3, bgColor4, backgroundOverlay
  ]);

  useEffect(() => {
    const saved = localStorage.getItem("hanora-project") ?? localStorage.getItem("cherivo-project");
    if (!saved) return;
    try {
      const x = JSON.parse(saved);
      const proj = normalizeProject(x);
      if (proj.blocks) setBlocks(proj.blocks);
      if (proj.theme && themes[proj.theme]) setTheme(proj.theme);
      if (proj.background) setBackground(proj.background);
      if (proj.cardBackgroundMode) setCardBackgroundMode(proj.cardBackgroundMode);
      if (proj.emojiAnimation) setEmojiAnimation(proj.emojiAnimation);
      if (proj.globalFont) setGlobalFont(proj.globalFont);
      if (proj.globalTextColor) setGlobalTextColor(proj.globalTextColor);
      if (proj.globalCardOpacity !== undefined) setGlobalCardOpacity(proj.globalCardOpacity);
      if (proj.globalRadius !== undefined) setGlobalRadius(proj.globalRadius);
      if (proj.globalSpacing !== undefined) setGlobalSpacing(proj.globalSpacing);
      if (proj.globalMotion) setGlobalMotion(proj.globalMotion);
      if (proj.audioName) setAudioName(proj.audioName);
      if (proj.audioUrl) setAudioUrl(proj.audioUrl);
      if (proj.customBg) setCustomBg(proj.customBg);
      if (proj.customBgName) setCustomBgName(proj.customBgName);
      if (proj.customBgOpacity !== undefined) setCustomBgOpacity(proj.customBgOpacity);
      if (proj.customBgScale !== undefined) setCustomBgScale(proj.customBgScale);
      if (proj.customBgPositionX !== undefined) setCustomBgPositionX(proj.customBgPositionX);
      if (proj.customBgPositionY !== undefined) setCustomBgPositionY(proj.customBgPositionY);
      if (proj.customBgRotation !== undefined) setCustomBgRotation(proj.customBgRotation);
      if (x.themeOverride) {
        setThemeOverride(true);
        if (proj.backgroundBaseColor) setBackgroundBaseColor(proj.backgroundBaseColor);
        if (proj.bgColor1) setBgColor1(proj.bgColor1);
        if (proj.bgColor2) setBgColor2(proj.bgColor2);
        if (proj.bgColor3) setBgColor3(proj.bgColor3);
        if (proj.bgColor4) setBgColor4(proj.bgColor4);
      }
      if (proj.backgroundOverlay !== undefined) setBackgroundOverlay(proj.backgroundOverlay);
    } catch {}
  }, []);

  useEffect(() => {
    const [bg, accent, accent2, text] = themes[theme] ?? themes.dark;
    document.documentElement.style.setProperty("--bg", bg);
    document.documentElement.style.setProperty("--accent", accent);
    document.documentElement.style.setProperty("--accent2", accent2);
    document.documentElement.style.setProperty("--global-theme-text", text);
    if (!themeOverride) {
      setBackgroundBaseColor(bg);
      setBgColor1(accent);
      setBgColor2(accent2);
      setBgColor3(theme === "light" ? "#e8f7ff" : "#38bdf8");
      setBgColor4(theme === "light" ? "#fff0f5" : "#f59e0b");
    }
  }, [theme, themeOverride]);

  useEffect(() => {
    if (scene > visible.length - 1) {
      setScene(Math.max(0, visible.length - 1));
    }
  }, [visible.length, scene]);

  // Clean up audio preview on unmount
  useEffect(() => {
    return () => {
      if (audioPreviewElRef.current) {
        audioPreviewElRef.current.pause();
        audioPreviewElRef.current.src = "";
      }
    };
  }, []);

  function notify(m: string) {
    setToast(m);
    window.setTimeout(() => setToast(""), 1600);
  }

  function stopAudioPreview() {
    if (audioPreviewElRef.current) {
      audioPreviewElRef.current.pause();
      audioPreviewElRef.current.src = "";
    }
    setAudioPreviewPlaying(false);
  }

  function toggleAudioPreview() {
    const targetUrl = audioPreviewUrl || (typeof audioUrl === "string" ? audioUrl : "");
    if (!targetUrl) return;

    if (audioPreviewPlaying) {
      stopAudioPreview();
    } else {
      if (!audioPreviewElRef.current) {
        audioPreviewElRef.current = new Audio();
        audioPreviewElRef.current.onended = () => setAudioPreviewPlaying(false);
        audioPreviewElRef.current.onerror = () => {
          setAudioPreviewPlaying(false);
          notify("Could not play audio preview");
        };
      }
      audioPreviewElRef.current.src = targetUrl;
      void audioPreviewElRef.current
        .play()
        .then(() => setAudioPreviewPlaying(true))
        .catch(() => {
          setAudioPreviewPlaying(false);
          notify("Could not start audio playback");
        });
    }
  }

  function selectBlock(i: number) {
    setSelected(i);
    setSelectedReason(0);
    const visibleIndex = visible.findIndex((v) => v.id === blocks[i]?.id);
    if (visibleIndex >= 0) setScene(visibleIndex);
  }

  function updateCurrent(patch: Partial<Block>) {
    setBlocks((prev) =>
      prev.map((b, i) => (i === selected ? normalizeBlock({ ...b, ...patch }, i, globalFont) : b))
    );
  }

  function updateReason(index: number, patch: Partial<ReasonItem>) {
    setBlocks((prev) =>
      prev.map((b, i) => {
        if (i !== selected || b.type !== "reasons") return b;
        const items = (b.items ?? reasonDefaults).map((r, j) =>
          j === index ? { ...r, ...patch } : r
        );
        return normalizeBlock({ ...b, items }, i, globalFont);
      })
    );
  }

  function addReason() {
    if (current.type !== "reasons") return;
    const item = {
      id: uid(),
      title: "A new reason",
      text: "Write what makes this person special.",
      emoji: "✨"
    };
    updateCurrent({ items: [...(current.items ?? []), item] });
    setSelectedReason((current.items ?? []).length);
    notify("Reason added ✨");
  }

  function deleteReason(index: number) {
    if (current.type !== "reasons") return;
    const next = (current.items ?? []).filter((_, i) => i !== index);
    updateCurrent({ items: next });
    setSelectedReason(Math.max(0, Math.min(selectedReason, next.length - 1)));
  }

  function projectData(): GreetingProject {
    return normalizeProject({
      blocks: blocks.map((b, idx) => normalizeBlock(b, idx, globalFont)),
      theme,
      background,
      cardBackgroundMode,
      emojiAnimation,
      globalFont,
      globalTextColor,
      globalCardOpacity,
      globalRadius,
      globalSpacing,
      globalMotion,
      audioName,
      audioUrl,
      customBg,
      customBgName,
      customBgOpacity,
      customBgScale,
      customBgPositionX,
      customBgPositionY,
      customBgRotation,
      backgroundBaseColor,
      bgColor1,
      bgColor2,
      bgColor3,
      bgColor4,
      backgroundOverlay
    });
  }

  function save() {
    const data = projectData();
    localStorage.setItem("hanora-project", JSON.stringify({ ...data, themeOverride }));
    localStorage.removeItem("cherivo-project");
    notify("Draft saved ✨");
  }

  function deleteDraft() {
    if (!window.confirm("Delete this draft?\n\nThis action cannot be undone.")) return;
    localStorage.removeItem("hanora-project");
    localStorage.removeItem("cherivo-project");
    window.location.href = "/";
  }

  async function publishGreeting() {
    setPublishError("");
    setPublishing(true);
    try {
      const project = projectData();
      const serialized = JSON.stringify(project);
      const bytes = new Blob([serialized]).size;
      if (bytes > 80_000_000) {
        throw new Error("This greeting is too large to publish (exceeds 80 MB). Reduce photo/video/audio sizes or remove unused media.");
      }

      const res = await fetch("/api/greetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: publishTitle, project })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not publish");

      setPublishedLink(data.url);
      setPublishOpen(true);
      await navigator.clipboard?.writeText(data.url).catch(() => {});
      notify("Private link created and copied 🔐");
    } catch (e: any) {
      const message = e?.message || "Publish failed";
      setPublishError(message);
      notify(message);
    } finally {
      setPublishing(false);
    }
  }

  async function uploadAudio(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20_000_000) {
      notify("Audio must be under 20MB");
      e.target.value = "";
      return;
    }
    const header = new Uint8Array(await file.slice(0, 32).arrayBuffer());
    const isValid =
      (header[0] === 0x49 && header[1] === 0x44 && header[2] === 0x33) ||
      (header[0] === 0xff && (header[1] & 0xe0) === 0xe0);
    if (file.type !== "audio/mpeg" || !file.name.toLowerCase().endsWith(".mp3") || !isValid) {
      notify("Choose a valid MP3 audio file");
      e.target.value = "";
      return;
    }

    stopAudioPreview();
    setMediaUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("kind", "audio");
      const response = await fetch("/api/media", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Media upload failed");
      setAudioUrl(data.media);
      setAudioPreviewUrl(data.previewUrl || "");
      setAudioError("");
      setAudioName(file.name);
      notify("Music added ✨");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Media upload failed");
    } finally {
      setMediaUploading(false);
      e.target.value = "";
    }
  }

  async function uploadMemoryVideo(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50_000_000) {
      notify("Video is too large. Please choose a video under 50 MB.");
      e.target.value = "";
      return;
    }
    const allowed = new Set(["video/mp4", "video/webm", "video/quicktime"]);
    if (!allowed.has(file.type)) {
      notify("Unsupported video type. Choose an MP4, WebM, or MOV video.");
      e.target.value = "";
      return;
    }
    setMediaUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("kind", "memory-video");
      const response = await fetch("/api/media", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Memory video upload failed");
      updateCurrent({ memoryVideo: data.media });
      setMemoryVideoPreview((prev) => ({ ...prev, [current.id]: data.previewUrl || "" }));
      notify("Memory video added ✨");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Memory video upload failed");
    } finally {
      setMediaUploading(false);
      e.target.value = "";
    }
  }

  function moveBlock(from: number, to: number) {
    if (to < 0 || to >= blocks.length) return;
    const next = [...blocks];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setBlocks(next);
    setSelected(to);
  }

  function removeBlock(i: number) {
    if (blocks.length <= 1) {
      notify("You need at least one section");
      return;
    }
    const next = blocks.filter((_, idx) => idx !== i);
    setBlocks(next);
    setSelected(Math.max(0, Math.min(selected, next.length - 1)));
    notify("Section removed");
  }

  function toggleVisible(i: number) {
    setBlocks((prev) =>
      prev.map((b, idx) => (idx === i ? { ...b, visible: !b.visible } : b))
    );
  }

  function addBlock(type: BlockType) {
    const titles: Record<BlockType, string> = {
      welcome: "Welcome",
      reasons: "What I Love",
      memories: "Our Memories",
      gallery: "Photo Gallery",
      letter: "A Little Letter",
      secret: "A Secret Reveal",
      cake: "Make a Wish",
      text: "A Little Note",
      image: "A Memory",
      music: "Our Song",
      custom: "Special Moment"
    };

    const block = normalizeBlock({
      id: uid(),
      type,
      title: titles[type] ?? "Special Moment",
      subtitle: "A little moment",
      heading: type === "letter" ? "A little letter" : "Happy Birthday",
      text: "Write something from the heart here.",
      emoji: type === "image" ? "📸" : type === "letter" ? "💌" : type === "cake" ? "🎂" : "✨",
      font: globalFont,
      titleFont: "sans",
      subtitleFont: "sans",
      headingFont: globalFont,
      bodyFont: "sans",
      accent: "#ff4f8b",
      headingColor: "",
      subtitleColor: "",
      bodyColor: "",
      emojiColor: "",
      headingSize: 70,
      bodySize: 17,
      lineHeight: 1.75,
      letterSpacing: 0,
      radius: 21,
      cardColor: "#ffffff",
      visible: true,
      items: type === "reasons" ? [] : undefined
    }, blocks.length, globalFont);
    setBlocks((prev) => [...prev, block]);
    setSelected(blocks.length);
    setAddOpen(false);
    notify("New section added ✨");
  }

  async function pickImage(
    e: ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void,
    nameSetter?: (name: string) => void,
    max = 20_000_000
  ) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > max) return notify(`Use a file under ${Math.round(max / 1_000_000)}MB`);
    try {
      if (nameSetter) nameSetter(f.name);
      setter(await compressImage(f, 1400, 0.78));
    } catch {
      notify("That image could not be processed");
    }
    e.target.value = "";
  }

  function compressImage(file: File, maxSide = 1200, quality = 0.75): Promise<string> {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onerror = () => reject(new Error("Could not read image"));
      r.onload = () => {
        const img = new window.Image();
        img.onload = () => {
          const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("Canvas unavailable"));
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = () => reject(new Error("Invalid image"));
        img.src = String(r.result);
      };
      r.readAsDataURL(file);
    });
  }

  async function pickGalleryImages(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    if (current.type !== "memories" && current.type !== "gallery") return;
    const existing = current.images ?? (current.image ? [current.image] : []);
    if (existing.length >= 20) return notify("You can add up to 20 photos");
    const chosen = files.slice(0, 20 - existing.length);
    try {
      const urls = await Promise.all(chosen.map((f) => compressImage(f, 1200, 0.75)));
      updateCurrent({ images: [...existing, ...urls], image: [...existing, ...urls][0] });
      notify(`${urls.length} photo${urls.length > 1 ? "s" : ""} added ✨`);
    } catch {
      notify("One of the photos could not be processed");
    }
    e.target.value = "";
  }

  function removeGalleryImage(index: number) {
    const imgs = (current.images ?? (current.image ? [current.image] : [])).filter(
      (_, i) => i !== index
    );
    updateCurrent({ images: imgs, image: imgs[0] ?? "" });
    notify("Photo removed");
  }

  function imageAdjustment(index: number): ImageAdjustment {
    return current.imageAdjustments?.[String(index)] ?? { scale: 100, x: 50, y: 50 };
  }

  function updateImageAdjustment(index: number, patch: Partial<ImageAdjustment>) {
    const next = {
      ...(current.imageAdjustments ?? {}),
      [String(index)]: { ...imageAdjustment(index), ...patch }
    };
    updateCurrent({ imageAdjustments: next });
  }

  function resetImageAdjustment(index: number) {
    updateImageAdjustment(index, { scale: 100, x: 50, y: 50 });
  }

  const reason = (current.items ?? reasonDefaults)[selectedReason];
  const heroAdjustment = current.imageAdjustments?.["hero"] ?? current.imageAdjustments?.["0"] ?? { scale: 100, x: 50, y: 50 };

  const emojiAnimationOptions = [
    { value: "floating", label: "1. Floating / Bobbing" },
    { value: "pendulum", label: "2. Pendulum Swing" },
    { value: "pulse", label: "3. Pulse / Heartbeat" },
    { value: "shimmer", label: "4. Shimmer / Sparkle" },
    { value: "wobble", label: "5. Wobble / Jiggle" },
    { value: "bounce", label: "6. Squash and Stretch / Bounce" },
    { value: "shake", label: "7. Horizontal Shake" },
    { value: "spin", label: "8. Spin / Continuous Rotation" },
    { value: "tada", label: "9. Tada / Pop" },
    { value: "drift", label: "10. Sinusoidal Drift / Float-Up" },
    { value: "none", label: "None (Static)" }
  ];

  return (
    <main className="creator">
      <header className="creatorTop">
        <Link href="/" className="logo">
          <span>
            HANORA<span>•</span>
          </span>
        </Link>
        <div className="topActions">
          <div className="capacityIndicator" style={{ fontSize: "11px", color: projectBytes > 70_000_000 ? "#ff4976" : "var(--muted)", marginRight: "8px", alignSelf: "center" }}>
            Project size: <strong>{(projectBytes / (1024 * 1024)).toFixed(1)} MB</strong> / 80 MB
          </div>
          <button
            type="button"
            className="btn small"
            onClick={() => setPreviewOnly(!previewOnly)}
          >
            {previewOnly ? <Pencil size={14} /> : <Eye size={14} />}
            {previewOnly ? "Show editor" : "Hide editor"}
          </button>
          <button
            type="button"
            className="btn small primary"
            onClick={publishGreeting}
            disabled={publishing}
          >
            {publishing ? "Creating link…" : "Create Greeting Link 🔐"}
          </button>
        </div>
      </header>

      <div className="creatorGrid">
        <aside className="sidePanel storyPanel">
          <div className="sideTitle">
            <h2>Story flow</h2>
            <p>Drag or reorder your greeting scenes.</p>
          </div>
          <div className="storyList">
            {blocks.map((b, i) => (
              <div
                className={`storyItem ${i === selected ? "selected" : ""}`}
                key={b.id}
                onClick={() => selectBlock(i)}
              >
                <button
                  type="button"
                  title="Move up"
                  onClick={(e) => {
                    e.stopPropagation();
                    moveBlock(i, i - 1);
                  }}
                  disabled={i === 0}
                >
                  <ArrowUp size={13} />
                </button>
                <button
                  type="button"
                  title="Move down"
                  onClick={(e) => {
                    e.stopPropagation();
                    moveBlock(i, i + 1);
                  }}
                  disabled={i === blocks.length - 1}
                >
                  <ArrowDown size={13} />
                </button>
                <div className="storyMain">
                  <b>{b.title}</b>
                  <small>{b.type}</small>
                </div>
                <button
                  type="button"
                  title={b.visible ? "Hide scene" : "Show scene"}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleVisible(i);
                  }}
                >
                  {b.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>
                <button
                  type="button"
                  title="Remove scene"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeBlock(i);
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="addAnything"
            onClick={() => setAddOpen(true)}
          >
            <Plus size={15} /> Add section
          </button>
        </aside>

        <div className="previewWrap">
          <div className="previewToolbar" style={{ marginBottom: "10px" }}>
            <div className="deviceToggle">
              <button
                type="button"
                className={previewDevice === "desktop" ? "active" : ""}
                onClick={() => setPreviewDevice("desktop")}
              >
                Desktop
              </button>
              <button
                type="button"
                className={previewDevice === "mobile" ? "active" : ""}
                onClick={() => setPreviewDevice("mobile")}
              >
                Mobile
              </button>
            </div>
          </div>

          <GreetingView
            project={projectData()}
            sceneIndex={scene}
            onSceneChange={setScene}
            isEditable={true}
            onEditSection={(blockId) => {
              const idx = blocks.findIndex((b) => b.id === blockId);
              if (idx >= 0) {
                setPreviewOnly(false);
                selectBlock(idx);
              }
            }}
            onEditReason={(blockId, reasonIdx) => {
              const idx = blocks.findIndex((b) => b.id === blockId);
              if (idx >= 0) {
                setPreviewOnly(false);
                setSelected(idx);
                setSelectedReason(reasonIdx);
              }
            }}
            onAddReason={addReason}
            previewDevice={previewDevice}
            title={publishTitle}
            memoryVideoPreviews={memoryVideoPreview}
          />
        </div>

        {!previewOnly && (
          <aside className="sidePanel editor">
            <div className="editorHead">
              <div>
                <h2>Edit anything</h2>
                <small>Selected: {current.title}</small>
              </div>
              <span>
                {selected + 1}/{blocks.length}
              </span>
            </div>
            <div className="editNotice">
              <Pencil size={14} />
              <span>Everything below is live. Change it and the preview updates instantly.</span>
            </div>
            {mediaUploading && <div className="mediaUploadStatus">Uploading media…</div>}

            <label>
              Section title
              <input
                value={current.title ?? "Untitled section"}
                onChange={(e) => updateCurrent({ title: e.target.value })}
              />
            </label>
            <label>
              Subtitle
              <input
                value={current.subtitle ?? "A little moment"}
                onChange={(e) => updateCurrent({ subtitle: e.target.value })}
              />
            </label>
            <label>
              Heading
              <input
                value={current.heading ?? "Your moment"}
                onChange={(e) => updateCurrent({ heading: e.target.value })}
              />
            </label>
            <label>
              Message
              <textarea
                value={current.text ?? "Write something beautiful."}
                onChange={(e) => updateCurrent({ text: e.target.value })}
              />
            </label>

            <div className="divider">🔤 Typography & Sizes</div>
            <p className="helperText">
              Customize fonts and individual font sizes for this section.
            </p>

            <div className="typographyControlGroup">
              <div className="typoItem">
                <div className="typoHeader">
                  <span>Title</span>
                  <span className="typoSizeVal">{current.titleSize ?? 12}px</span>
                </div>
                <div className="typoRow">
                  <select
                    value={current.titleFont ?? "sans"}
                    onChange={(e) => updateCurrent({ titleFont: e.target.value as FontName })}
                  >
                    {fontOptions}
                  </select>
                  <input
                    type="range"
                    min="9"
                    max="30"
                    value={current.titleSize ?? 12}
                    onChange={(e) => updateCurrent({ titleSize: Number(e.target.value) })}
                    title="Title size"
                  />
                </div>
              </div>

              <div className="typoItem">
                <div className="typoHeader">
                  <span>Subtitle</span>
                  <span className="typoSizeVal">{current.subtitleSize ?? 13}px</span>
                </div>
                <div className="typoRow">
                  <select
                    value={current.subtitleFont ?? "sans"}
                    onChange={(e) => updateCurrent({ subtitleFont: e.target.value as FontName })}
                  >
                    {fontOptions}
                  </select>
                  <input
                    type="range"
                    min="10"
                    max="36"
                    value={current.subtitleSize ?? 13}
                    onChange={(e) => updateCurrent({ subtitleSize: Number(e.target.value) })}
                    title="Subtitle size"
                  />
                </div>
              </div>

              <div className="typoItem">
                <div className="typoHeader">
                  <span>Heading</span>
                  <span className="typoSizeVal">{current.headingSize ?? 70}px</span>
                </div>
                <div className="typoRow">
                  <select
                    value={current.headingFont ?? current.font ?? globalFont}
                    onChange={(e) =>
                      updateCurrent({
                        headingFont: e.target.value as FontName,
                        font: e.target.value as FontName
                      })
                    }
                  >
                    {fontOptions}
                  </select>
                  <input
                    type="range"
                    min="24"
                    max="110"
                    value={current.headingSize ?? 70}
                    onChange={(e) => updateCurrent({ headingSize: Number(e.target.value) })}
                    title="Heading size"
                  />
                </div>
              </div>

              <div className="typoItem">
                <div className="typoHeader">
                  <span>Message</span>
                  <span className="typoSizeVal">{current.bodySize ?? 17}px</span>
                </div>
                <div className="typoRow">
                  <select
                    value={current.bodyFont ?? "sans"}
                    onChange={(e) => updateCurrent({ bodyFont: e.target.value as FontName })}
                  >
                    {fontOptions}
                  </select>
                  <input
                    type="range"
                    min="11"
                    max="36"
                    value={current.bodySize ?? 17}
                    onChange={(e) => updateCurrent({ bodySize: Number(e.target.value) })}
                    title="Message size"
                  />
                </div>
              </div>

              <div className="typoItem">
                <div className="typoHeader">
                  <span>Emoji / Icon Size</span>
                  <span className="typoSizeVal">{current.emojiSize ?? 48}px</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="120"
                  value={current.emojiSize ?? 48}
                  onChange={(e) => updateCurrent({ emojiSize: Number(e.target.value) })}
                  title="Emoji size"
                />
              </div>
            </div>

            <div className="two">
              <label>
                Emoji
                <input
                  value={current.emoji ?? "✨"}
                  onChange={(e) => updateCurrent({ emoji: e.target.value })}
                />
              </label>
              <label>
                Emoji Animation (this section)
                <select
                  value={current.emojiAnimation ?? emojiAnimation}
                  onChange={(e) => updateCurrent({ emojiAnimation: e.target.value })}
                >
                  {emojiAnimationOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Section-specific Background if Different Mode is active */}
            {cardBackgroundMode === "different" && (
              <div className="sectionBackgroundEditor" style={{ marginTop: "14px", padding: "14px", border: "1px solid var(--line)", borderRadius: "14px", background: "rgba(255,255,255,0.02)" }}>
                <div className="divider" style={{ marginTop: 0 }}>🎨 Section Background</div>
                <p className="helperText">Choose a distinct background preset or photo for this specific section.</p>

                <label style={{ marginTop: "8px" }}>
                  Background Preset
                  <select
                    value={current.background ?? background}
                    onChange={(e) => updateCurrent({ background: e.target.value })}
                  >
                    <option value="aurora">🌌 Aurora</option>
                    <option value="mesh">🫧 Liquid mesh</option>
                    <option value="stars">✨ Starfield</option>
                    <option value="petals">🌸 Floating petals</option>
                    <option value="gradient">🎨 Gradient</option>
                    <option value="minimal">◌ Minimal glow</option>
                  </select>
                </label>

                <div style={{ marginTop: "12px" }}>
                  <label style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600 }}>Section Background Photo</label>
                  <input
                    ref={sectionBgFileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) =>
                      pickImage(
                        e,
                        (url) => updateCurrent({ customBg: url }),
                        (name) => updateCurrent({ customBgName: name }),
                        20_000_000
                      )
                    }
                  />

                  {!current.customBg ? (
                    <button
                      type="button"
                      className="btn full small"
                      style={{ marginTop: "6px" }}
                      onClick={() => sectionBgFileInputRef.current?.click()}
                    >
                      📷 Choose background photo for this section
                    </button>
                  ) : (
                    <div style={{ marginTop: "8px", padding: "10px", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px", background: "rgba(0,0,0,0.25)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontSize: "11px", color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          🖼️ {current.customBgName || "section-bg.jpg"}
                        </span>
                        <div style={{ display: "flex", gap: "4px" }}>
                          <button
                            type="button"
                            className="btn small"
                            style={{ padding: "3px 8px", fontSize: "11px" }}
                            onClick={() => sectionBgFileInputRef.current?.click()}
                          >
                            Replace
                          </button>
                          <button
                            type="button"
                            className="btn danger small"
                            style={{ padding: "3px 8px", fontSize: "11px" }}
                            onClick={() =>
                              updateCurrent({
                                customBg: "",
                                customBgName: ""
                              })
                            }
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      <label>
                        Zoom / Scale <strong>{current.customBgScale ?? 100}%</strong>
                        <input
                          type="range"
                          min="100"
                          max="250"
                          value={current.customBgScale ?? 100}
                          onChange={(e) => updateCurrent({ customBgScale: Number(e.target.value) })}
                        />
                      </label>
                      <label>
                        Horizontal position X <strong>{current.customBgPositionX ?? 50}%</strong>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={current.customBgPositionX ?? 50}
                          onChange={(e) => updateCurrent({ customBgPositionX: Number(e.target.value) })}
                        />
                      </label>
                      <label>
                        Vertical position Y <strong>{current.customBgPositionY ?? 50}%</strong>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={current.customBgPositionY ?? 50}
                          onChange={(e) => updateCurrent({ customBgPositionY: Number(e.target.value) })}
                        />
                      </label>
                      <label>
                        Rotation <strong>{current.customBgRotation ?? 0}°</strong>
                        <input
                          type="range"
                          min="-180"
                          max="180"
                          value={current.customBgRotation ?? 0}
                          onChange={(e) => updateCurrent({ customBgRotation: Number(e.target.value) })}
                        />
                      </label>
                      <label>
                        Photo opacity <strong>{current.customBgOpacity ?? 100}%</strong>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={current.customBgOpacity ?? 100}
                          onChange={(e) => updateCurrent({ customBgOpacity: Number(e.target.value) })}
                        />
                      </label>
                      <label>
                        Background overlay <strong>{current.backgroundOverlay ?? 18}%</strong>
                        <input
                          type="range"
                          min="0"
                          max="60"
                          value={current.backgroundOverlay ?? 18}
                          onChange={(e) => updateCurrent({ backgroundOverlay: Number(e.target.value) })}
                        />
                      </label>
                      <button
                        type="button"
                        className="btn small full"
                        style={{ marginTop: "6px" }}
                        onClick={() =>
                          updateCurrent({
                            customBgScale: 100,
                            customBgPositionX: 50,
                            customBgPositionY: 50,
                            customBgRotation: 0,
                            customBgOpacity: 100,
                            backgroundOverlay: 18
                          })
                        }
                      >
                        Reset section background framing
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(current.type === "gallery" || current.type === "memories") && (
              <div className="divider">🖼️ Photo page</div>
            )}
            {(current.type === "gallery" || current.type === "memories") && (
              <>
                <label>
                  Photo layout
                  <select
                    value={current.galleryLayout ?? "collage"}
                    onChange={(e) => updateCurrent({ galleryLayout: e.target.value })}
                  >
                    <option value="collage">✨ Auto collage</option>
                    <option value="grid">▦ Clean grid</option>
                    <option value="masonry">▥ Masonry wall</option>
                    <option value="polaroid">▱ Polaroid pile</option>
                    <option value="filmstrip">▤ Film strip</option>
                    <option value="scattered">✦ Scattered memories</option>
                    <option value="hero">🖼️ Hero photo</option>
                  </select>
                </label>

                <label>
                  Gallery Frame Background
                  <select
                    value={current.galleryBackground ?? "transparent"}
                    onChange={(e) => updateCurrent({ galleryBackground: e.target.value })}
                  >
                    <option value="transparent">◌ Transparent / None</option>
                    <option value="black">◼ Black</option>
                    <option value="white">◻ White</option>
                  </select>
                </label>
                <p className="helperText">
                  Choose the background behind your memory photos in framed layouts.
                </p>

                <div className="photoManager">
                  <div className="photoManagerTop">
                    <b>Memory photos</b>
                    <span>
                      {(current.images ?? (current.image ? [current.image] : [])).length}/20
                    </span>
                  </div>
                  <p className="helperText">
                    Choose up to 20 photos. Hanora automatically arranges them into the selected collage.
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={pickGalleryImages}
                    disabled={
                      (current.images ?? (current.image ? [current.image] : [])).length >= 20
                    }
                  />
                  {(current.images ?? (current.image ? [current.image] : [])).length > 0 && (
                    <div className="thumbGrid">
                      {(current.images ?? (current.image ? [current.image] : [])).map(
                        (src, i) => (
                          <div className="thumbItem" key={`${i}-${src.slice(-12)}`}>
                            <img src={src} alt={`Memory ${i + 1}`} />
                            <button
                              type="button"
                              title="Remove photo"
                              onClick={() => removeGalleryImage(i)}
                            >
                              <Trash2 size={13} />
                            </button>
                            <small>{i + 1}</small>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {current.type === "reasons" && (
              <div className="reasonEditor">
                <div className="divider">💗 Edit every reason</div>
                {(current.items ?? []).map((r, i) => (
                  <div
                    className={`reasonRow ${i === selectedReason ? "active" : ""}`}
                    key={r.id}
                  >
                    <button
                      type="button"
                      className="reasonRowMain"
                      onClick={() => setSelectedReason(i)}
                    >
                      <span>{r.emoji}</span>
                      <b>{r.title}</b>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedReason(i)}
                      title="Edit reason"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteReason(i)}
                      title="Delete reason"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                <button type="button" className="smallAdd" onClick={addReason}>
                  <Plus size={14} /> Add reason
                </button>
                {reason && (
                  <div className="reasonFields">
                    <label>
                      Reason title
                      <input
                        value={reason.title}
                        onChange={(e) => updateReason(selectedReason, { title: e.target.value })}
                      />
                    </label>
                    <label>
                      Reason text
                      <textarea
                        value={reason.text}
                        onChange={(e) => updateReason(selectedReason, { text: e.target.value })}
                      />
                    </label>
                    <label>
                      Reason emoji
                      <input
                        value={reason.emoji}
                        onChange={(e) => updateReason(selectedReason, { emoji: e.target.value })}
                      />
                    </label>
                  </div>
                )}
              </div>
            )}

            <div className="two">
              <label>
                Accent
                <input
                  className="color"
                  type="color"
                  value={current.accent ?? "#ff4f8b"}
                  onChange={(e) => updateCurrent({ accent: e.target.value })}
                />
              </label>
              <label>
                Heading colour
                <input
                  className="color"
                  type="color"
                  value={current.headingColor || globalTextColor}
                  onChange={(e) => updateCurrent({ headingColor: e.target.value })}
                />
              </label>
            </div>
            <div className="two">
              <label>
                Subtitle colour
                <input
                  className="color"
                  type="color"
                  value={current.subtitleColor || (theme === "light" ? "#be185d" : "#ff9fc2")}
                  onChange={(e) => updateCurrent({ subtitleColor: e.target.value })}
                />
              </label>
              <label>
                Message colour
                <input
                  className="color"
                  type="color"
                  value={current.bodyColor || globalTextColor}
                  onChange={(e) => updateCurrent({ bodyColor: e.target.value })}
                />
              </label>
            </div>
            <div className="two">
              <label>
                Emoji / icon colour
                <input
                  className="color"
                  type="color"
                  value={current.emojiColor || (theme === "light" ? "#db2777" : "#ff86b0")}
                  onChange={(e) => updateCurrent({ emojiColor: e.target.value })}
                />
              </label>
              <label>
                Photo opacity <strong>{current.imageOpacity}%</strong>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={current.imageOpacity ?? 100}
                  onChange={(e) => updateCurrent({ imageOpacity: Number(e.target.value) })}
                />
              </label>
            </div>

            {(current.type === "gallery" || current.type === "memories") &&
              (current.images?.length ?? 0) > 0 && (
                <div className="imageAdjustmentEditor">
                  <div className="divider">Photo framing</div>
                  <label>
                    Photo
                    <select
                      value={selectedGalleryImage}
                      onChange={(e) => setSelectedGalleryImage(Number(e.target.value))}
                    >
                      {(current.images ?? []).map((_, i) => (
                        <option key={i} value={i}>
                          Photo {i + 1}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Zoom <strong>{imageAdjustment(selectedGalleryImage).scale}%</strong>
                    <input
                      type="range"
                      min="100"
                      max="220"
                      value={imageAdjustment(selectedGalleryImage).scale}
                      onChange={(e) =>
                        updateImageAdjustment(selectedGalleryImage, {
                          scale: Number(e.target.value)
                        })
                      }
                    />
                  </label>
                  <label>
                    Horizontal position <strong>{imageAdjustment(selectedGalleryImage).x}%</strong>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={imageAdjustment(selectedGalleryImage).x}
                      onChange={(e) =>
                        updateImageAdjustment(selectedGalleryImage, {
                          x: Number(e.target.value)
                        })
                      }
                    />
                  </label>
                  <label>
                    Vertical position <strong>{imageAdjustment(selectedGalleryImage).y}%</strong>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={imageAdjustment(selectedGalleryImage).y}
                      onChange={(e) =>
                        updateImageAdjustment(selectedGalleryImage, {
                          y: Number(e.target.value)
                        })
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => resetImageAdjustment(selectedGalleryImage)}
                  >
                    Reset photo framing
                  </button>
                </div>
              )}

            {current.type !== "gallery" && current.type !== "memories" && current.type !== "letter" && (
              <div className="heroPhotoEditor">
                <div className="divider">🖼️ Page photo & framing</div>
                <p className="helperText">
                  For Welcome / Hero pages this is the main hero photo. You can replace, remove, or adjust zoom and positioning.
                </p>
                <label>
                  Choose hero photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => pickImage(e, (url) => updateCurrent({ image: url }))}
                  />
                </label>
                {current.image && (
                  <>
                    <div className="selectedMediaRow">
                      <img src={current.image} alt="Selected page photo" />
                      <button
                        type="button"
                        className="btn danger small"
                        onClick={() => updateCurrent({ image: "" })}
                      >
                        Remove photo
                      </button>
                    </div>
                    <label>
                      Hero Zoom <strong>{heroAdjustment.scale}%</strong>
                      <input
                        type="range"
                        min="100"
                        max="240"
                        value={heroAdjustment.scale}
                        onChange={(e) => {
                          updateCurrent({
                            imageAdjustments: {
                              ...(current.imageAdjustments ?? {}),
                              hero: { ...heroAdjustment, scale: Number(e.target.value) },
                              "0": { ...heroAdjustment, scale: Number(e.target.value) }
                            }
                          });
                        }}
                      />
                    </label>
                    <label>
                      Horizontal position <strong>{heroAdjustment.x}%</strong>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={heroAdjustment.x}
                        onChange={(e) => {
                          updateCurrent({
                            imageAdjustments: {
                              ...(current.imageAdjustments ?? {}),
                              hero: { ...heroAdjustment, x: Number(e.target.value) },
                              "0": { ...heroAdjustment, x: Number(e.target.value) }
                            }
                          });
                        }}
                      />
                    </label>
                    <label>
                      Vertical position <strong>{heroAdjustment.y}%</strong>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={heroAdjustment.y}
                        onChange={(e) => {
                          updateCurrent({
                            imageAdjustments: {
                              ...(current.imageAdjustments ?? {}),
                              hero: { ...heroAdjustment, y: Number(e.target.value) },
                              "0": { ...heroAdjustment, y: Number(e.target.value) }
                            }
                          });
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => {
                        updateCurrent({
                          imageAdjustments: {
                            ...(current.imageAdjustments ?? {}),
                            hero: { scale: 100, x: 50, y: 50 },
                            "0": { scale: 100, x: 50, y: 50 }
                          }
                        });
                      }}
                    >
                      Reset photo framing
                    </button>
                  </>
                )}
              </div>
            )}

            {current.type === "letter" && (
              <div className="letterControls">
                <div className="divider">💌 Letter styling</div>
                <div className="two">
                  <label>
                    Letter text colour
                    <input
                      className="color"
                      type="color"
                      value={current.letterColor ?? "#2d2024"}
                      onChange={(e) => updateCurrent({ letterColor: e.target.value })}
                    />
                  </label>
                  <label>
                    Letter background colour
                    <input
                      className="color"
                      type="color"
                      value={current.cardColor ?? "#fff8ea"}
                      onChange={(e) => updateCurrent({ cardColor: e.target.value })}
                    />
                  </label>
                </div>
                <div className="two">
                  <label>
                    Letter title font
                    <select
                      value={current.headingFont ?? "great-vibes"}
                      onChange={(e) =>
                        updateCurrent({ headingFont: e.target.value as FontName })
                      }
                    >
                      {fontOptions}
                    </select>
                  </label>
                  <label>
                    Letter body font
                    <select
                      value={current.bodyFont ?? "serif"}
                      onChange={(e) =>
                        updateCurrent({ bodyFont: e.target.value as FontName })
                      }
                    >
                      {fontOptions}
                    </select>
                  </label>
                </div>
                <div className="two">
                  <label>
                    Letter size <strong>{current.letterSize ?? 17}px</strong>
                    <input
                      type="range"
                      min="12"
                      max="36"
                      value={current.letterSize ?? 17}
                      onChange={(e) => updateCurrent({ letterSize: Number(e.target.value) })}
                    />
                  </label>
                  <label>
                    Line spacing <strong>{Number(current.letterLineHeight ?? 1.8).toFixed(2)}</strong>
                    <input
                      type="range"
                      min="1"
                      max="2.5"
                      step=".05"
                      value={current.letterLineHeight ?? 1.8}
                      onChange={(e) =>
                        updateCurrent({ letterLineHeight: Number(e.target.value) })
                      }
                    />
                  </label>
                </div>
                <label>
                  Letter alignment
                  <select
                    value={current.letterAlign ?? "left"}
                    onChange={(e) =>
                      updateCurrent({ letterAlign: e.target.value as Block["letterAlign"] })
                    }
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </label>

                <div className="divider">🖼️ Memory photo in letter</div>
                <p className="helperText">
                  Attach a cherished photo to this letter. You can pick from your uploaded memory photos or upload a dedicated photo.
                </p>

                {allMemoryPhotos.length > 0 && (
                  <div className="memoryPicker" style={{ marginBottom: "12px" }}>
                    <label style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "6px", display: "block" }}>
                      Select from memory photos:
                    </label>
                    <div className="thumbGrid" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
                      {allMemoryPhotos.map((src, i) => (
                        <button
                          type="button"
                          key={i}
                          className="thumbItem"
                          style={{
                            border: current.image === src ? "2px solid var(--accent)" : "1px solid var(--line)",
                            boxShadow: current.image === src ? "0 0 10px var(--accent)" : "none",
                            cursor: "pointer",
                            padding: 0
                          }}
                          onClick={() => updateCurrent({ image: current.image === src ? "" : src })}
                          title="Click to select this memory photo for the letter"
                        >
                          <img src={src} alt={`Memory ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          {current.image === src && (
                            <small style={{ background: "var(--accent)", color: "#fff", right: "4px", bottom: "4px", left: "auto" }}>
                              ✓
                            </small>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <label>
                  Or upload a new photo for letter
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => pickImage(e, (url) => updateCurrent({ image: url }))}
                  />
                </label>

                {current.image && (
                  <div className="selectedMediaRow">
                    <img src={current.image} alt="Letter attached photo" />
                    <button
                      type="button"
                      className="btn danger small"
                      onClick={() => updateCurrent({ image: "" })}
                    >
                      Remove letter photo
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="memoryVideoEditor">
              <div className="divider">Memory Video</div>
              <p className="helperText">
                Optional personal video for this page. It is shown inside the greeting, never as a background.
              </p>
              <label>
                Upload video (up to 50MB)
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                  onChange={uploadMemoryVideo}
                  disabled={mediaUploading}
                />
              </label>
              {current.memoryVideo && (
                <>
                  <video
                    className="memoryVideoPreview"
                    src={
                      typeof current.memoryVideo === "string"
                        ? current.memoryVideo
                        : memoryVideoPreview[current.id] || ""
                    }
                    controls
                    playsInline
                    preload="metadata"
                  />
                  <button
                    type="button"
                    className="btn danger small full"
                    onClick={() => {
                      updateCurrent({ memoryVideo: undefined });
                      setMemoryVideoPreview((prev) => {
                        const next = { ...prev };
                        delete next[current.id];
                        return next;
                      });
                    }}
                  >
                    Remove memory video
                  </button>
                </>
              )}
            </div>

            <div className="divider">🧱 Card Transparency & Spacing</div>
            <p className="helperText">
              Controls how see-through your content cards are. Lower values let more of the background show through, while higher values make the card more solid.
            </p>
            <div className="two">
              <label>
                Card radius <strong>{current.radius}px</strong>
                <input
                  type="range"
                  min="0"
                  max="48"
                  value={current.radius ?? 21}
                  onChange={(e) => updateCurrent({ radius: Number(e.target.value) })}
                />
              </label>
              <label>
                Card colour
                <input
                  className="color"
                  type="color"
                  value={current.cardColor ?? "#ffffff"}
                  onChange={(e) => updateCurrent({ cardColor: e.target.value })}
                />
              </label>
            </div>
            <label>
              Card Transparency (this section) <strong>{current.cardOpacity ?? globalCardOpacity}%</strong>
              <input
                type="range"
                min="0"
                max="100"
                value={current.cardOpacity ?? globalCardOpacity}
                onChange={(e) => updateCurrent({ cardOpacity: Number(e.target.value) })}
              />
            </label>
            <label>
              Card Transparency (global default) <strong>{globalCardOpacity}%</strong>
              <input
                type="range"
                min="0"
                max="100"
                value={globalCardOpacity}
                onChange={(e) => setGlobalCardOpacity(Number(e.target.value))}
              />
            </label>
            <label>
              Section spacing <strong>{globalSpacing}px</strong>
              <input
                type="range"
                min="6"
                max="50"
                value={globalSpacing}
                onChange={(e) => setGlobalSpacing(Number(e.target.value))}
              />
            </label>
            <p className="helperText">
              Controls the amount of space between content inside your greeting sections. Increase it for a more open design or decrease it to fit more content.
            </p>

            <div className="divider">🔤 Global Typography & Text</div>
            <p className="helperText">
              Global Font is the default typeface used throughout your greeting. Individual sections can override it with their own font.
            </p>
            <label>
              Global font
              <select
                value={globalFont}
                onChange={(e) => setGlobalFont(e.target.value as FontName)}
              >
                {fontOptions}
              </select>
            </label>
            <label>
              Greeting Text Colour
              <input
                className="color"
                type="color"
                value={globalTextColor}
                onChange={(e) => setGlobalTextColor(e.target.value)}
              />
            </label>
            <p className="helperText">
              Sets the main text colour used across your greeting. Individual sections can override it when needed.
            </p>

            <div className="divider">🎭 Emoji Motion System</div>
            <p className="helperText">
              Choose the continuous animation applied to emojis and decorative hearts across your greeting.
            </p>
            <select
              value={emojiAnimation}
              onChange={(e) => setEmojiAnimation(e.target.value)}
            >
              {emojiAnimationOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <div className="divider">🎬 Global Motion Style</div>
            <select
              value={globalMotion}
              onChange={(e) => setGlobalMotion(e.target.value)}
            >
              <option value="cinematic">Cinematic</option>
              <option value="soft">Soft</option>
              <option value="snappy">Snappy</option>
              <option value="none">None</option>
            </select>

            <div className="divider">🎨 Greeting Theme</div>
            <div className="themeGrid">
              {[
                ["dark", "Dark"],
                ["light", "Light"],
                ["system", "System default"],
                ["romantic", "Romantic"],
                ["dreamy", "Dreamy"]
              ].map(([v, l]) => (
                <button
                  type="button"
                  key={v}
                  className={`themeOption ${theme === v ? "active" : ""}`}
                  onClick={() => {
                    setTheme(v);
                    setThemeOverride(false);
                  }}
                >
                  <span className={`themeSwatch sw-${v}`} />
                  {l}
                </button>
              ))}
            </div>

            <div className="divider">🖼️ Card Background Mode</div>
            <p className="helperText">
              Choose whether all greeting cards share one background or each section has its own background.
            </p>
            <div style={{ display: "flex", gap: "12px", margin: "8px 0 14px" }}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px" }}>
                <input
                  type="radio"
                  name="cardBgMode"
                  checked={cardBackgroundMode === "same"}
                  onChange={() => setCardBackgroundMode("same")}
                />
                Same background for all sections
              </label>
              <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px" }}>
                <input
                  type="radio"
                  name="cardBgMode"
                  checked={cardBackgroundMode === "different"}
                  onChange={() => setCardBackgroundMode("different")}
                />
                Different background for each section
              </label>
            </div>

            <div className="divider">🌈 Background Preset & Gradient</div>
            <div className="backgroundOptions">
              {Object.entries({
                aurora: "🌌 Aurora",
                mesh: "🫧 Liquid mesh",
                stars: "✨ Starfield",
                petals: "🌸 Floating petals",
                gradient: "🎨 Gradient",
                minimal: "◌ Minimal glow"
              }).map(([v, l]) => (
                <button
                  type="button"
                  key={v}
                  className={`bgOption ${background === v ? "active" : ""}`}
                  onClick={() => setBackground(v)}
                >
                  {l}
                </button>
              ))}
            </div>

            <div className="divider">🎨 Gradient Colours</div>
            <p className="helperText">
              These colours are blended together to create your animated background. Using multiple colours creates a richer gradient transition. You can repeat a colour if you want a simpler look.
            </p>
            <div className="colorPanel">
              <label>
                Base colour
                <input
                  className="color"
                  type="color"
                  value={backgroundBaseColor}
                  onChange={(e) => {
                    setThemeOverride(true);
                    setBackgroundBaseColor(e.target.value);
                  }}
                />
              </label>
              <label>
                Colour 1
                <input
                  className="color"
                  type="color"
                  value={bgColor1}
                  onChange={(e) => {
                    setThemeOverride(true);
                    setBgColor1(e.target.value);
                  }}
                />
              </label>
              <label>
                Colour 2
                <input
                  className="color"
                  type="color"
                  value={bgColor2}
                  onChange={(e) => {
                    setThemeOverride(true);
                    setBgColor2(e.target.value);
                  }}
                />
              </label>
              <label>
                Colour 3
                <input
                  className="color"
                  type="color"
                  value={bgColor3}
                  onChange={(e) => {
                    setThemeOverride(true);
                    setBgColor3(e.target.value);
                  }}
                />
              </label>
              <label>
                Colour 4
                <input
                  className="color"
                  type="color"
                  value={bgColor4}
                  onChange={(e) => {
                    setThemeOverride(true);
                    setBgColor4(e.target.value);
                  }}
                />
              </label>
            </div>
            <label>
              Background overlay <strong>{backgroundOverlay}%</strong>
              <input
                type="range"
                min="0"
                max="60"
                value={backgroundOverlay}
                onChange={(e) => setBackgroundOverlay(Number(e.target.value))}
              />
            </label>

            <div className="divider">🖼️ Custom Background Photo</div>
            <p className="helperText">
              Upload a background image that covers the screen. You can zoom, rotate, and reposition it freely.
            </p>
            <input
              ref={bgFileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => pickImage(e, setCustomBg, setCustomBgName, 20_000_000)}
            />

            {!customBg ? (
              <button
                type="button"
                className="btn full"
                style={{ marginTop: "6px" }}
                onClick={() => bgFileInputRef.current?.click()}
              >
                Choose background photo
              </button>
            ) : (
              <div className="customBgManager" style={{ marginTop: "8px", padding: "12px", border: "1px solid var(--line)", borderRadius: "14px", background: "rgba(255,255,255,0.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "12px", fontWeight: 600, color: "#fff" }}>
                    🖼️ {customBgName || "background.jpg"}
                  </div>
                  <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                    <button
                      type="button"
                      className="btn small"
                      onClick={() => bgFileInputRef.current?.click()}
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      className="btn danger small"
                      onClick={() => {
                        setCustomBg("");
                        setCustomBgName("");
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <label>
                  Zoom / Scale <strong>{customBgScale}%</strong>
                  <input
                    type="range"
                    min="100"
                    max="250"
                    value={customBgScale}
                    onChange={(e) => setCustomBgScale(Number(e.target.value))}
                  />
                </label>
                <label>
                  Horizontal position X <strong>{customBgPositionX}%</strong>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={customBgPositionX}
                    onChange={(e) => setCustomBgPositionX(Number(e.target.value))}
                  />
                </label>
                <label>
                  Vertical position Y <strong>{customBgPositionY}%</strong>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={customBgPositionY}
                    onChange={(e) => setCustomBgPositionY(Number(e.target.value))}
                  />
                </label>
                <label>
                  Rotation <strong>{customBgRotation}°</strong>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={customBgRotation}
                    onChange={(e) => setCustomBgRotation(Number(e.target.value))}
                  />
                </label>
                <label>
                  Photo opacity <strong>{customBgOpacity}%</strong>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={customBgOpacity}
                    onChange={(e) => setCustomBgOpacity(Number(e.target.value))}
                  />
                </label>
                <button
                  type="button"
                  className="btn small full"
                  style={{ marginTop: "6px" }}
                  onClick={() => {
                    setCustomBgScale(100);
                    setCustomBgPositionX(50);
                    setCustomBgPositionY(50);
                    setCustomBgRotation(0);
                    setCustomBgOpacity(100);
                  }}
                >
                  Reset background framing
                </button>
              </div>
            )}

            <div className="divider">🎵 Music</div>
            <p className="helperText">Upload an MP3 song to play softly with this greeting.</p>
            <label>
              Upload MP3 (up to 20MB)
              <input
                type="file"
                accept="audio/mpeg,.mp3"
                onChange={uploadAudio}
                disabled={mediaUploading}
              />
            </label>
            {(audioUrl || audioPreviewUrl) && (
              <div className="audioControlCard">
                <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                  <Volume2 size={16} style={{ flexShrink: 0, color: "var(--accent)" }} />
                  <b style={{ fontSize: "12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {audioName || "Selected music"}
                  </b>
                </div>
                <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                  <button
                    type="button"
                    className={`btn small ${audioPreviewPlaying ? "primary" : ""}`}
                    onClick={toggleAudioPreview}
                    title={audioPreviewPlaying ? "Pause preview" : "Play preview"}
                  >
                    {audioPreviewPlaying ? <Pause size={13} /> : <Play size={13} />}
                    {audioPreviewPlaying ? "Pause" : "Preview"}
                  </button>
                  <button
                    type="button"
                    className="btn danger small"
                    onClick={() => {
                      stopAudioPreview();
                      setAudioName("");
                      setAudioUrl("");
                      setAudioPreviewUrl("");
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}

            <div className="draftActions">
              <button type="button" className="btn" onClick={save}>
                Save changes
              </button>
              <button type="button" className="btn danger" onClick={deleteDraft}>
                Delete draft
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* Add Section Modal */}
      {addOpen && (
        <div className="modal" onClick={() => setAddOpen(false)}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <div className="modalTop">
              <div>
                <h2>Add a section</h2>
                <p>Choose the type of memory or moment you want to create.</p>
              </div>
              <button type="button" onClick={() => setAddOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="addGrid">
              {[
                ["welcome", "🌸 Welcome / Hero", "The opening scene for your greeting."],
                ["reasons", "💗 What I Love", "A list of reasons why someone is special."],
                ["memories", "📸 Memories Collage", "Multiple photos in artful collages."],
                ["letter", "💌 A Little Letter", "A personal note with optional memory photo."],
                ["secret", "🎁 Secret Reveal", "A tap-to-reveal surprise message."],
                ["cake", "🎂 Cake & Candles", "Interactive birthday cake with blowable candles."]
              ].map(([t, l, d]) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => addBlock(t as BlockType)}
                >
                  <b>{l}</b>
                  <p>{d}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Publish Modal */}
      {publishOpen && (
        <div className="modal" onClick={() => setPublishOpen(false)}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <div className="modalTop">
              <div>
                <h2>Private Link Created</h2>
                <p>Your greeting is live and ready to share with that special person.</p>
              </div>
              <button type="button" onClick={() => setPublishOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="publishedLinkBox">
              <span>{publishedLink}</span>
              <button
                type="button"
                className="btn primary small"
                onClick={async () => {
                  await navigator.clipboard.writeText(publishedLink);
                  notify("Copied to clipboard 📋");
                }}
              >
                Copy link
              </button>
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
              <a
                href={publishedLink}
                target="_blank"
                rel="noreferrer"
                className="btn primary full"
              >
                Open link in new tab ↗
              </a>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
