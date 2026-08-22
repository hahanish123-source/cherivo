"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import type { ChangeEvent } from "react";
import Link from "next/link";
import type {
  Block,
  BlockType,
  ElementTextStyle,
  FontName,
  GreetingDraft,
  GreetingProject,
  ImageAdjustment,
  IncidentItem,
  MediaValue,
  ReasonItem
} from "@/lib/types";
import {
  defaultBlocks,
  incidentDefaults,
  normalizeBlock,
  normalizeProject,
  reasonDefaults,
  themes,
  uid
} from "@/lib/greetingConfig";
import GreetingView from "@/components/GreetingView";
import {
  getSupabaseClient,
  signInWithGoogle,
  signOut
} from "@/lib/supabaseClient";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Cake,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  FolderOpen,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  Lock,
  LogOut,
  Mail,
  Maximize2,
  Minimize2,
  Music,
  Music2,
  Palette,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Sliders,
  Sparkles,
  Trash2,
  Type,
  Upload,
  User as UserIcon,
  Video,
  Volume2,
  X
} from "lucide-react";

type CurrentUser = {
  id: string;
  email: string;
  name: string;
  avatar?: string;
};

export default function CreatePage() {
  // Core greeting state
  const [blocks, setBlocks] = useState<Block[]>(defaultBlocks);
  const [selected, setSelected] = useState(0);
  const [scene, setScene] = useState(0);
  const [activeInspectorTab, setActiveInspectorTab] = useState<"section" | "design" | "story">("section");

  // Global Design & Theme
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

  // Custom colors
  const [backgroundBaseColor, setBackgroundBaseColor] = useState("#100917");
  const [bgColor1, setBgColor1] = useState("#ff4f8b");
  const [bgColor2, setBgColor2] = useState("#7c5cff");
  const [bgColor3, setBgColor3] = useState("#38bdf8");
  const [bgColor4, setBgColor4] = useState("#f59e0b");
  const [backgroundOverlay, setBackgroundOverlay] = useState(18);

  // Global Wallpaper
  const [customBg, setCustomBg] = useState("");
  const [customBgName, setCustomBgName] = useState("");
  const [customBgOpacity, setCustomBgOpacity] = useState(100);
  const [customBgScale, setCustomBgScale] = useState(100);
  const [customBgPositionX, setCustomBgPositionX] = useState(50);
  const [customBgPositionY, setCustomBgPositionY] = useState(50);
  const [customBgRotation, setCustomBgRotation] = useState(0);

  // Global Audio
  const [audioName, setAudioName] = useState("");
  const [audioUrl, setAudioUrl] = useState<MediaValue>("");
  const [audioPreviewUrl, setAudioPreviewUrl] = useState("");
  const [audioError, setAudioError] = useState("");

  // Media previews & sizes
  const [memoryVideoPreview, setMemoryVideoPreview] = useState<Record<string, string>>({});
  const [customBgPreviews, setCustomBgPreviews] = useState<Record<string, string>>({});
  const [mediaFileSizes, setMediaFileSizes] = useState<Record<string, number>>({});
  const [mediaUploading, setMediaUploading] = useState(false);
  const [uploadProgressMsg, setUploadProgressMsg] = useState("");

  // Event & Reminders
  const [momentTitle, setMomentTitle] = useState("A Hanora moment");
  const [targetEventDate, setTargetEventDate] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [targetEventTitle, setTargetEventTitle] = useState("");

  // User & Draft State
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [draftId, setDraftId] = useState<string>("");
  const [draftStatus, setDraftStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [draftsList, setDraftsList] = useState<GreetingDraft[]>([]);
  const [draftsModalOpen, setDraftsModalOpen] = useState(false);

  // Studio UI state
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [previewOnly, setPreviewOnly] = useState(false);
  const [mobileStoryFlowOpen, setMobileStoryFlowOpen] = useState(false);
  const [mobileEditOpen, setMobileEditOpen] = useState(false);
  const [addSectionModalOpen, setAddSectionModalOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState<number>(0);

  // Left Sidebar Accordion Groups (Text & Element Inspector)
  const [leftAccordion, setLeftAccordion] = useState<Record<string, boolean>>({
    heading: true,
    eyebrow: false,
    body: false,
    title: false,
    buttons: false
  });

  const toggleLeftAccordion = (key: string) => {
    setLeftAccordion((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Publish / Share Modal
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishedLink, setPublishedLink] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  // File Inputs
  const heroPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const wallpaperInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const secretPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const secretVideoInputRef = useRef<HTMLInputElement | null>(null);
  const sectionBgInputRef = useRef<HTMLInputElement | null>(null);
  const incidentPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const [activeIncidentIdx, setActiveIncidentIdx] = useState<number | null>(null);
  const inspectorBodyRef = useRef<HTMLDivElement | null>(null);
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null);

  const scrollToEditorSection = (sectionKey: "wallpaper" | "photo" | "video" | "audio") => {
    if (sectionKey === "audio") {
      setActiveInspectorTab("design");
    } else {
      setActiveInspectorTab("section");
    }
    setMobileEditOpen(true);
    setHighlightedSection(sectionKey);

    setTimeout(() => {
      const container = inspectorBodyRef.current;
      if (!container) return;
      const targetEl = container.querySelector(`[data-editor-section="${sectionKey}"]`) as HTMLElement;
      if (targetEl) {
        const containerRect = container.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        const scrollOffset = targetRect.top - containerRect.top + container.scrollTop - 14;
        container.scrollTo({
          top: Math.max(0, scrollOffset),
          behavior: "smooth"
        });
      }
    }, 80);

    setTimeout(() => {
      setHighlightedSection((prev) => (prev === sectionKey ? null : prev));
    }, 2200);
  };

  // Font options helper
  const fontOptions = (
    <>
      <optgroup label="Standard Fonts">
        <option value="sans">DM Sans (Modern Sans)</option>
        <option value="serif">Playfair Display (Editorial Serif)</option>
      </optgroup>
      <optgroup label="Cursive & Handwritten">
        <option value="great-vibes">Great Vibes (Romantic Cursive)</option>
        <option value="dancing-script">Dancing Script (Playful Script)</option>
        <option value="caveat">Caveat (Handwritten)</option>
        <option value="pacifico">Pacifico (Vintage Brush)</option>
        <option value="satisfy">Satisfy (Fluid Calligraphy)</option>
        <option value="allura">Allura (Elegant Flow)</option>
        <option value="sacramento">Sacramento (Delicate Monoline)</option>
      </optgroup>
    </>
  );

  const visibleBlocks = useMemo(() => blocks.filter((b) => b.visible !== false), [blocks]);
  const current = normalizeBlock(blocks[selected] ?? defaultBlocks[0], selected, globalFont);

  // Count total videos across project (Limit: max 3 videos)
  const totalVideoCount = useMemo(() => {
    let count = 0;
    for (const b of blocks) {
      if (b.video || b.memoryVideo) count++;
      if (b.secretVideo) count++;
    }
    return count;
  }, [blocks]);

  // Aggregate Media Storage Size calculation (Limit: ~300 MB)
  const totalMediaBytes = useMemo(() => {
    return Object.values(mediaFileSizes).reduce((acc, size) => acc + (size || 0), 0);
  }, [mediaFileSizes]);

  const totalMediaMB = (totalMediaBytes / (1024 * 1024)).toFixed(1);

  // Supabase Auth listener
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) {
        const u = data.session.user;
        setCurrentUser({
          id: u.id,
          email: u.email || "",
          name: u.user_metadata?.full_name || u.email?.split("@")[0] || "Creator",
          avatar: u.user_metadata?.avatar_url || ""
        });
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const u = session.user;
        setCurrentUser({
          id: u.id,
          email: u.email || "",
          name: u.user_metadata?.full_name || u.email?.split("@")[0] || "Creator",
          avatar: u.user_metadata?.avatar_url || ""
        });
      } else {
        setCurrentUser(null);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  // Toast notification auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // Build Project Data Representation
  function projectData(): GreetingProject {
    return normalizeProject({
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
      backgroundOverlay,
      targetEventDate,
      reminderDate,
      targetEventTitle: targetEventTitle || momentTitle,
      blocks: blocks.map((b) => ({
        ...b,
        font: b.font || globalFont,
        bodyFont: b.bodyFont || globalFont,
        titleFont: b.titleFont || "sans",
        subtitleFont: b.subtitleFont || "sans",
        headingFont: b.headingFont || globalFont,
        letterFont: b.letterFont || "serif",
        headingColor: b.headingColor || globalTextColor,
        bodyColor: b.bodyColor || globalTextColor,
        emojiAnimation: b.emojiAnimation || emojiAnimation,
        cardOpacity: typeof b.cardOpacity === "number" ? b.cardOpacity : globalCardOpacity
      }))
    });
  }

  // Section State Updaters
  function updateCurrent(patch: Partial<Block>) {
    setBlocks((prev) =>
      prev.map((b, idx) => (idx === selected ? { ...b, ...patch } : b))
    );
    setDraftStatus("unsaved");
  }

  function updateElementStyle(role: string, patch: Partial<ElementTextStyle>) {
    const currentStyles = current.textStyles || {};
    const prevRoleStyle = currentStyles[role] || {};
    const updatedStyles = {
      ...currentStyles,
      [role]: { ...prevRoleStyle, ...patch }
    };
    updateCurrent({ textStyles: updatedStyles });
  }

  function getRoleStyle(role: string): ElementTextStyle {
    return current.textStyles?.[role] || {};
  }

  function updateBlockById(id: string, patch: Partial<Block>) {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...patch } : b))
    );
    setDraftStatus("unsaved");
  }

  // Story Flow Reordering & Management
  function moveBlock(fromIndex: number, direction: "up" | "down") {
    const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= blocks.length) return;
    const copy = [...blocks];
    const item = copy.splice(fromIndex, 1)[0];
    copy.splice(toIndex, 0, item);
    setBlocks(copy);
    setSelected(toIndex);
    setDraftStatus("unsaved");
  }

  function duplicateBlock(idx: number) {
    const original = blocks[idx];
    if (!original) return;
    const copy: Block = {
      ...JSON.parse(JSON.stringify(original)),
      id: uid(),
      title: `${original.title} (Copy)`
    };
    const nextBlocks = [...blocks];
    nextBlocks.splice(idx + 1, 0, copy);
    setBlocks(nextBlocks);
    setSelected(idx + 1);
    setDraftStatus("unsaved");
    setToast("Section duplicated ✨");
  }

  function removeBlock(idx: number) {
    if (blocks.length <= 1) {
      setToast("A greeting requires at least one section.");
      return;
    }
    const nextBlocks = blocks.filter((_, i) => i !== idx);
    setBlocks(nextBlocks);
    setSelected(Math.min(selected, nextBlocks.length - 1));
    setDraftStatus("unsaved");
    setToast("Section removed.");
  }

  function toggleVisible(idx: number) {
    setBlocks((prev) =>
      prev.map((b, i) => (i === idx ? { ...b, visible: !b.visible } : b))
    );
    setDraftStatus("unsaved");
  }

  function addBlock(type: BlockType) {
    const titles: Record<BlockType, string> = {
      welcome: "Welcome",
      reasons: "What I Love",
      memories: "Our Memories",
      gallery: "Photo Gallery",
      incidents: "Our Story",
      letter: "A Little Letter",
      secret: "A Secret Reveal",
      cake: "Make a Wish",
      text: "A Little Note",
      image: "A Memory",
      music: "Our Song",
      custom: "Special Moment"
    };

    const newBlock = normalizeBlock({
      id: uid(),
      type,
      title: titles[type] ?? "Special Moment",
      subtitle: "A moment together",
      heading: type === "letter" ? "A little letter" : type === "cake" ? "Make a Wish" : "Happy Birthday",
      text: type === "secret" ? "I have a little secret to share with you..." : "Write something from the heart here.",
      emoji: type === "image" ? "📸" : type === "letter" ? "💌" : type === "cake" ? "🎂" : type === "secret" ? "🔒" : type === "incidents" ? "📖" : "✨",
      font: globalFont,
      headingFont: globalFont,
      bodyFont: globalFont,
      visible: true
    }, blocks.length, globalFont);

    setBlocks((prev) => [...prev, newBlock]);
    setSelected(blocks.length);
    setAddSectionModalOpen(false);
    setDraftStatus("unsaved");
    setToast(`Added ${titles[type]} section! ✨`);
  }

  // Click section inside preview canvas to select and inspect
  function handleSelectSectionById(blockId: string) {
    const idx = blocks.findIndex((b) => b.id === blockId);
    if (idx >= 0) {
      setSelected(idx);
      setActiveInspectorTab("section");
      if (previewDevice === "mobile") {
        setMobileEditOpen(true);
      }
    }
  }

  // Upload Handlers with Strict Limit Validations
  async function handleMediaUpload(file: File, kind: "image" | "memory-video" | "audio") {
    // 1. Client-Side Size Validations
    if (kind === "image" && file.size > 15 * 1024 * 1024) {
      setToast("Image is too large. Image must be 15 MB or smaller.");
      return null;
    }
    if (kind === "memory-video" && file.size > 50 * 1024 * 1024) {
      setToast("Video is too large. Video must be 50 MB or smaller.");
      return null;
    }
    if (kind === "memory-video" && totalVideoCount >= 3) {
      setToast("Maximum 3 videos allowed per greeting.");
      return null;
    }
    if (kind === "audio" && file.size > 20 * 1024 * 1024) {
      setToast("Audio is too large. Audio must be 20 MB or smaller.");
      return null;
    }

    // 2. Aggregate Quota Check (300 MB)
    if (totalMediaBytes + file.size > 300 * 1024 * 1024) {
      setToast("Total greeting media limit reached (~300 MB). Please remove unused media.");
      return null;
    }

    setMediaUploading(true);
    setUploadProgressMsg(`Uploading ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)...`);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("kind", kind);

      const res = await fetch("/api/media", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Upload failed.");
      }

      // Track size for live quota meter
      const mediaId = typeof data.media === "object" && data.media.path ? data.media.path : file.name;
      setMediaFileSizes((prev) => ({ ...prev, [mediaId]: file.size }));

      setToast(`Uploaded ${file.name} successfully! ✨`);
      return data;
    } catch (err: any) {
      setToast(`Upload failed: ${err?.message || "Unknown error"}`);
      return null;
    } finally {
      setMediaUploading(false);
      setUploadProgressMsg("");
    }
  }

  // Specific Upload Triggers
  async function uploadHeroPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await handleMediaUpload(file, "image");
    if (result) {
      updateCurrent({
        image: result.previewUrl || result.media
      });
      setDraftStatus("unsaved");
    }
  }

  async function uploadWallpaper(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await handleMediaUpload(file, "image");
    if (result) {
      setCustomBg(result.previewUrl || result.media);
      setCustomBgName(file.name);
      setDraftStatus("unsaved");
    }
  }

  async function uploadSectionWallpaper(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await handleMediaUpload(file, "image");
    if (result) {
      updateCurrent({
        customBg: result.previewUrl || result.media,
        customBgName: file.name,
        customBgOpacity: 100,
        customBgScale: 100,
        customBgPositionX: 50,
        customBgPositionY: 50,
        customBgFit: "cover"
      });
      setCardBackgroundMode("different");
      scrollToEditorSection("wallpaper");
      setToast("Section wallpaper uploaded! ✨");
    }
  }

  async function uploadAudioTrack(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await handleMediaUpload(file, "audio");
    if (result) {
      setAudioUrl(result.media);
      setAudioName(file.name.replace(/\.[^/.]+$/, ""));
      setAudioPreviewUrl(result.previewUrl || "");
      setDraftStatus("unsaved");
    }
  }

  async function uploadGalleryPhotos(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      const result = await handleMediaUpload(file, "image");
      if (result) {
        const photoUrl = result.previewUrl || result.media;
        const currentImages = Array.isArray(current.images) ? [...current.images] : current.image ? [current.image] : [];
        currentImages.push(photoUrl);
        updateCurrent({ images: currentImages, image: currentImages[0] });
      }
    }
  }

  async function uploadVideoTrack(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await handleMediaUpload(file, "memory-video");
    if (result) {
      updateCurrent({
        video: result.previewUrl || result.media,
        memoryVideo: result.previewUrl || result.media,
        videoName: file.name,
        videoOpacity: 100,
        videoScale: 100,
        videoPositionX: 50,
        videoPositionY: 50,
        videoFit: "cover",
        videoAutoplay: false,
        videoMuted: true,
        videoLoop: false
      });
      scrollToEditorSection("video");
      setToast("Video uploaded successfully! 🎥");
    }
  }

  async function uploadSecretPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await handleMediaUpload(file, "image");
    if (result) {
      updateCurrent({ secretImage: result.previewUrl || result.media });
      scrollToEditorSection("photo");
    }
  }

  async function uploadSecretVideo(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await handleMediaUpload(file, "memory-video");
    if (result) {
      updateCurrent({
        secretVideo: result.previewUrl || result.media,
        videoName: file.name,
        videoOpacity: 100,
        videoScale: 100,
        videoPositionX: 50,
        videoPositionY: 50,
        videoFit: "cover",
        videoAutoplay: false,
        videoMuted: true,
        videoLoop: false
      });
      scrollToEditorSection("video");
      setToast("Secret video attached! 🔒🎥");
    }
  }

  async function uploadIncidentPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || activeIncidentIdx === null) return;
    const result = await handleMediaUpload(file, "image");
    if (result) {
      const incidents = current.incidents ? [...current.incidents] : [...incidentDefaults];
      if (incidents[activeIncidentIdx]) {
        incidents[activeIncidentIdx].image = result.previewUrl || result.media;
        updateCurrent({ incidents });
      }
    }
  }

  // Draft Management Handlers
  async function saveDraft() {
    setDraftStatus("saving");
    try {
      const currentDraftId = draftId || uid();
      const payload: GreetingDraft = {
        id: currentDraftId,
        userId: currentUser?.id || "anonymous",
        title: momentTitle || "A Hanora moment",
        targetEventDate,
        reminderDate,
        targetEventTitle: targetEventTitle || momentTitle,
        updatedAt: new Date().toISOString(),
        project: projectData()
      };

      const res = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save draft.");

      setDraftId(currentDraftId);
      setDraftStatus("saved");
      setToast("Draft saved successfully! 💾");
    } catch (err: any) {
      setDraftStatus("unsaved");
      setToast(`Could not save draft: ${err?.message}`);
    }
  }

  async function loadDraftsList() {
    try {
      const userId = currentUser?.id || "anonymous";
      const res = await fetch(`/api/drafts?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.drafts)) {
        setDraftsList(data.drafts);
      }
    } catch (err) {
      console.warn("Could not fetch drafts:", err);
    }
  }

  function openDraft(draft: GreetingDraft) {
    if (!draft?.project) return;
    const p = normalizeProject(draft.project);
    setMomentTitle(draft.title || "A Hanora moment");
    setTargetEventDate(draft.targetEventDate || p.targetEventDate || "");
    setReminderDate(draft.reminderDate || p.reminderDate || "");
    setTargetEventTitle(draft.targetEventTitle || p.targetEventTitle || "");
    setTheme(p.theme || "dark");
    setBackground(p.background || "aurora");
    setCardBackgroundMode(p.cardBackgroundMode || "same");
    setEmojiAnimation(p.emojiAnimation || "floating");
    setGlobalFont(p.globalFont || "serif");
    setGlobalTextColor(p.globalTextColor || "#fff8fc");
    setGlobalCardOpacity(p.globalCardOpacity ?? 14);
    setGlobalRadius(p.globalRadius ?? 21);
    setGlobalSpacing(p.globalSpacing ?? 18);
    setGlobalMotion(p.globalMotion || "cinematic");
    setCustomBg(p.customBg || "");
    setCustomBgName(p.customBgName || "");
    setCustomBgOpacity(p.customBgOpacity ?? 100);
    setCustomBgScale(p.customBgScale ?? 100);
    setCustomBgPositionX(p.customBgPositionX ?? 50);
    setCustomBgPositionY(p.customBgPositionY ?? 50);
    setAudioName(p.audioName || "");
    setAudioUrl(p.audioUrl || "");
    setBlocks(p.blocks && p.blocks.length > 0 ? p.blocks : defaultBlocks);
    setSelected(0);
    setScene(0);
    setDraftId(draft.id);
    setDraftStatus("saved");
    setDraftsModalOpen(false);
    setToast(`Loaded draft: "${draft.title}" ✨`);
  }

  async function deleteDraft(id: string) {
    try {
      const res = await fetch(`/api/drafts?id=${encodeURIComponent(id)}&userId=${encodeURIComponent(currentUser?.id || "anonymous")}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setDraftsList((prev) => prev.filter((d) => d.id !== id));
        if (draftId === id) setDraftId("");
        setToast("Draft deleted.");
      }
    } catch (err) {
      setToast("Failed to delete draft.");
    }
  }

  // Publish & Generate Private Link
  async function publishGreeting() {
    setPublishing(true);
    setPublishError("");
    try {
      const res = await fetch("/api/greetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: momentTitle || "A Hanora moment",
          project: projectData(),
          userId: currentUser?.id,
          targetEventDate,
          reminderDate
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate link.");

      setPublishedLink(data.url || `${window.location.origin}/g/${data.token}`);
      setToast("Private greeting link generated! 🔐");
    } catch (err: any) {
      setPublishError(err?.message || "Could not publish greeting.");
    } finally {
      setPublishing(false);
    }
  }

  function copyGreetingLink() {
    if (!publishedLink) return;
    navigator.clipboard.writeText(publishedLink);
    setCopiedLink(true);
    setToast("Link copied to clipboard! 📋");
    setTimeout(() => setCopiedLink(false), 2500);
  }

  return (
    <main className={`studioRoot theme-${theme} motion-${globalMotion}`}>
      {/* Toast Notification Banner */}
      {toast && (
        <div className="studioToast">
          <span>{toast}</span>
          <button type="button" onClick={() => setToast("")}><X size={14} /></button>
        </div>
      )}

      {/* Upload Progress Overlay Banner */}
      {mediaUploading && (
        <div className="uploadProgressBanner">
          <div className="uploadSpinner" />
          <span>{uploadProgressMsg || "Uploading media..."}</span>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input ref={heroPhotoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={uploadHeroPhoto} />
      <input ref={wallpaperInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={uploadWallpaper} />
      <input ref={sectionBgInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={uploadSectionWallpaper} />
      <input ref={audioInputRef} type="file" accept="audio/mpeg,audio/mp3" style={{ display: "none" }} onChange={uploadAudioTrack} />
      <input ref={galleryInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={uploadGalleryPhotos} />
      <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/quicktime,video/x-m4v,video/m4v,video/*" style={{ display: "none" }} onChange={uploadVideoTrack} />
      <input ref={secretPhotoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={uploadSecretPhoto} />
      <input ref={secretVideoInputRef} type="file" accept="video/mp4,video/webm,video/quicktime,video/x-m4v,video/m4v,video/*" style={{ display: "none" }} onChange={uploadSecretVideo} />
      <input ref={incidentPhotoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={uploadIncidentPhoto} />

      {/* ========================================================================= */}
      {/* TOP HEADER                                                                */}
      {/* ========================================================================= */}
      <header className="studioHeader">
        <div className="studioHeaderLeft">
          <Link href="/" className="studioLogo">
            <span>HANORA<span>•</span></span>
          </Link>
          <div className="studioTitleEdit">
            <input
              type="text"
              value={momentTitle}
              onChange={(e) => {
                setMomentTitle(e.target.value);
                setDraftStatus("unsaved");
              }}
              placeholder="Moment Title..."
              aria-label="Moment Title"
            />
          </div>
          <div className="draftBadge">
            {draftStatus === "saving" && <span className="saving">● Saving...</span>}
            {draftStatus === "saved" && <span className="saved">● Draft Saved</span>}
            {draftStatus === "unsaved" && <span className="unsaved">● Unsaved</span>}
          </div>
        </div>

        <div className="studioHeaderRight">
          {/* Drafts Modal Button */}
          <button
            type="button"
            className="btn small ghost"
            onClick={() => {
              loadDraftsList();
              setDraftsModalOpen(true);
            }}
          >
            <FolderOpen size={14} /> Drafts
          </button>

          {/* Save Draft Button */}
          <button
            type="button"
            className="btn small"
            onClick={saveDraft}
            title="Save draft"
          >
            <Save size={14} /> Save
          </button>

          {/* Preview Toggle */}
          <button
            type="button"
            className={`btn small ${previewOnly ? "primary" : "ghost"}`}
            onClick={() => setPreviewOnly(!previewOnly)}
          >
            {previewOnly ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            {previewOnly ? "Edit Studio" : "Preview"}
          </button>

          {/* User Account / Google Auth */}
          {currentUser ? (
            <div className="userProfileBadge">
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt={currentUser.name} className="userAvatar" />
              ) : (
                <UserIcon size={14} />
              )}
              <span className="userName">{currentUser.name}</span>
              <button
                type="button"
                className="logoutBtn"
                onClick={() => signOut()}
                title="Sign out"
              >
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn small ghost googleLoginBtn"
              onClick={async () => {
                try {
                  await signInWithGoogle();
                } catch (err: any) {
                  setToast(
                    err?.message ||
                    "Supabase Google Sign-In requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY configured."
                  );
                }
              }}
            >
              Sign in with Google
            </button>
          )}

          {/* Generate Private Link CTA */}
          <button
            type="button"
            className="btn small primary generateLinkBtn"
            onClick={() => {
              setPublishOpen(true);
              publishGreeting();
            }}
          >
            <Lock size={14} /> Generate Link
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MOBILE TOP BAR                                                            */}
      {/* ========================================================================= */}
      <div className="studioMobileHeader">
        <button
          type="button"
          className="mobileHeaderBtn"
          onClick={() => setMobileStoryFlowOpen(!mobileStoryFlowOpen)}
        >
          <Layers size={16} />
          <span>Story Flow ({blocks.length})</span>
        </button>

        <span className="mobileLogo">HANORA<span>•</span></span>

        <button
          type="button"
          className="mobileHeaderBtn"
          onClick={() => setMobileEditOpen(!mobileEditOpen)}
        >
          <Sliders size={16} />
          <span>Edit •••</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 3-COLUMN CREATOR STUDIO (DESKTOP & RESPONSIVE CANVAS)                      */}
      {/* ========================================================================= */}
      <div className={`studioGrid ${previewOnly ? "previewOnlyMode" : ""}`}>
        {/* ----------------------------------------------------------------------- */}
        {/* LEFT COLUMN: STORY FLOW TIMELINE                                        */}
        {/* ----------------------------------------------------------------------- */}
        <aside className={`studioLeft ${mobileStoryFlowOpen ? "mobileOpen" : ""}`}>
          <div className="studioLeftHeader">
            <span className="storyFlowTitle">
              <Layers size={14} /> Story Flow ({blocks.length})
            </span>
            <button
              type="button"
              className="btn small"
              onClick={() => setAddSectionModalOpen(true)}
              title="Add a new moment to the story"
            >
              <Plus size={14} /> Add
            </button>
          </div>

          <div className="storyFlowList customScrollbar">
            {blocks.map((b, idx) => (
              <div
                key={b.id}
                className={`storyFlowCard ${selected === idx ? "active" : ""} ${b.visible === false ? "hiddenCard" : ""}`}
                onClick={() => {
                  setSelected(idx);
                  if (mobileStoryFlowOpen) setMobileStoryFlowOpen(false);
                }}
              >
                <span className="cardSeqNum">{idx + 1}</span>
                <span className="cardEmoji">{b.emoji || "✨"}</span>
                <div className="cardInfo">
                  <span className="cardTitle">{b.title || `Section ${idx + 1}`}</span>
                  <span className="cardTypeBadge">{b.type}</span>
                </div>
                <div className="cardQuickActions" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    title={b.visible !== false ? "Hide section" : "Show section"}
                    onClick={() => toggleVisible(idx)}
                  >
                    {b.visible !== false ? <Eye size={12} /> : <EyeOff size={12} />}
                  </button>
                  <button
                    type="button"
                    title="Duplicate section"
                    onClick={() => duplicateBlock(idx)}
                  >
                    <Copy size={12} />
                  </button>
                  <button
                    type="button"
                    title="Delete section"
                    disabled={blocks.length <= 1}
                    onClick={() => removeBlock(idx)}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="storyFlowFooter">
            <button
              type="button"
              className="btn small full"
              onClick={() => setAddSectionModalOpen(true)}
            >
              <Plus size={14} /> Add Moment Section
            </button>
          </div>
        </aside>

        {/* ----------------------------------------------------------------------- */}
        {/* CENTER COLUMN: GREETING CANVAS VIEWPORT                                 */}
        {/* ----------------------------------------------------------------------- */}
        <section className="studioCenter">
          <div className="canvasToolbar">
            <div className="activeSectionIndicator">
              <span className="pulseDot" />
              <span>Editing: <strong>{current.title}</strong> ({selected + 1} / {blocks.length})</span>
            </div>

            <div className="canvasDeviceToggle">
              <button
                type="button"
                className={previewDevice === "desktop" ? "active" : ""}
                onClick={() => setPreviewDevice("desktop")}
                title="Desktop View"
              >
                Desktop
              </button>
              <button
                type="button"
                className={previewDevice === "mobile" ? "active" : ""}
                onClick={() => setPreviewDevice("mobile")}
                title="Mobile View"
              >
                Mobile (2:3)
              </button>
            </div>
          </div>

          {/* Controlled Greeting Viewport */}
          <div className={`greetingViewportWrapper device-${previewDevice}`}>
            <div className="greetingCanvasContainer">
              <GreetingView
                project={projectData()}
                sceneIndex={scene}
                onSceneChange={setScene}
                isEditable={!previewOnly}
                onEditSection={handleSelectSectionById}
                onAddReason={() => {
                  const reasons = current.items ? [...current.items] : [...reasonDefaults];
                  reasons.push({
                    id: uid(),
                    title: `Reason #${reasons.length + 1}`,
                    text: "Something you adore about them...",
                    emoji: "💖"
                  });
                  updateCurrent({ items: reasons });
                  setToast("Added new reason card! 💖");
                }}
                previewDevice={previewDevice}
                title={momentTitle}
                memoryVideoPreviews={memoryVideoPreview}
                customBgPreviews={customBgPreviews}
              />
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------------------- */}
        {/* RIGHT COLUMN: CONTEXTUAL EDIT OPTIONS INSPECTOR                         */}
        {/* ----------------------------------------------------------------------- */}
        <aside className={`studioRight ${mobileEditOpen ? "mobileOpen" : ""}`}>
          <div className="studioRightHeader">
            <div className="inspectorTabs">
              <button
                type="button"
                className={activeInspectorTab === "section" ? "active" : ""}
                onClick={() => setActiveInspectorTab("section")}
                title="Contextual settings for selected section"
              >
                <Sliders size={14} /> ✏️ Edit
              </button>
              <button
                type="button"
                className={activeInspectorTab === "design" ? "active" : ""}
                onClick={() => setActiveInspectorTab("design")}
                title="Global themes, colors, wallpaper and fonts"
              >
                <Palette size={14} /> 🎨 Design & Theme
              </button>
              <button
                type="button"
                className={activeInspectorTab === "story" ? "active" : ""}
                onClick={() => setActiveInspectorTab("story")}
                title="Manage section sequence and flow"
              >
                <Layers size={14} /> 📑 Story
              </button>
            </div>
            {mobileEditOpen && (
              <button
                type="button"
                className="closeDrawerBtn"
                onClick={() => setMobileEditOpen(false)}
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="inspectorBody customScrollbar" ref={inspectorBodyRef}>
            {activeInspectorTab === "section" ? (
              /* ================================================================= */
              /* TAB 1: SECTION CONTENT & CUSTOMIZATIONS                           */
              /* ================================================================= */
              <div className="inspectorSectionGroup">
                <div className="sectionHeaderCard">
                  <div className="sectionEmojiPicker">
                    <input
                      type="text"
                      value={current.emoji || "✨"}
                      onChange={(e) => updateCurrent({ emoji: e.target.value })}
                      title="Section Emoji"
                    />
                  </div>
                  <div className="sectionHeaderDetails">
                    <input
                      type="text"
                      className="sectionTitleInput"
                      value={current.title || ""}
                      onChange={(e) => updateCurrent({ title: e.target.value })}
                      placeholder="Section Title"
                    />
                    <span className="sectionTypeLabel">Type: {current.type}</span>
                  </div>
                </div>

                {/* Emoji Customization */}
                <div className="controlCard">
                  <span className="controlGroupTitle">✨ Emoji & Icon Appearance</span>
                  <div className="fieldRow">
                    <label className="fieldLabel">
                      Emoji Size ({current.emojiSize ?? 48}px)
                      <input
                        type="range"
                        min="24"
                        max="96"
                        value={current.emojiSize ?? 48}
                        onChange={(e) => updateCurrent({ emojiSize: Number(e.target.value) })}
                      />
                    </label>
                    <label className="fieldLabel">
                      Emoji Animation
                      <select
                        value={current.emojiAnimation || emojiAnimation}
                        onChange={(e) => updateCurrent({ emojiAnimation: e.target.value })}
                      >
                        <option value="floating">🌊 Floating Gentle</option>
                        <option value="bouncing">🎈 Bouncing Playful</option>
                        <option value="pulse">💓 Pulsing Glow</option>
                        <option value="sparkle">✨ Sparkle Shimmer</option>
                        <option value="wiggle">💃 Wiggle Dance</option>
                        <option value="spin">🌀 Gentle Spin</option>
                        <option value="none">⏹ Static (No Animation)</option>
                      </select>
                    </label>
                  </div>
                </div>

                {/* Text Content */}
                <div className="controlCard">
                  <span className="controlGroupTitle">✍️ Text & Story</span>

                  {/* Heading */}
                  <label className="fieldLabel">
                    Heading
                    <input
                      type="text"
                      value={current.heading || ""}
                      onChange={(e) => updateCurrent({ heading: e.target.value })}
                      placeholder="e.g. Happy Birthday!"
                    />
                  </label>
                  <div className="fieldRow">
                    <label className="fieldLabel">
                      Heading Font
                      <select
                        value={current.headingFont || globalFont}
                        onChange={(e) => updateCurrent({ headingFont: e.target.value as FontName })}
                      >
                        <option value="sans">DM Sans (Clean)</option>
                        <option value="serif">Playfair Display (Serif)</option>
                        <option value="great-vibes">Great Vibes (Romantic Script)</option>
                        <option value="dancing-script">Dancing Script (Playful)</option>
                        <option value="caveat">Caveat (Handwritten)</option>
                        <option value="pacifico">Pacifico (Bold Script)</option>
                        <option value="satisfy">Satisfy (Brush Calligraphy)</option>
                        <option value="allura">Allura (Elegant Flow)</option>
                        <option value="sacramento">Sacramento (Vintage Script)</option>
                      </select>
                    </label>
                    <label className="fieldLabel">
                      Font Size ({current.headingSize ?? 70}px)
                      <input
                        type="range"
                        min="20"
                        max="120"
                        value={current.headingSize ?? 70}
                        onChange={(e) => updateCurrent({ headingSize: Number(e.target.value) })}
                      />
                    </label>
                  </div>
                  <div className="fieldRow">
                    <label className="fieldLabel">
                      Heading Color
                      <input
                        type="color"
                        value={current.headingColor || globalTextColor}
                        onChange={(e) => updateCurrent({ headingColor: e.target.value })}
                      />
                    </label>
                  </div>

                  {/* Subtitle */}
                  <label className="fieldLabel" style={{ marginTop: "10px" }}>
                    Subtitle / Kicker
                    <input
                      type="text"
                      value={current.subtitle || ""}
                      onChange={(e) => updateCurrent({ subtitle: e.target.value })}
                      placeholder="e.g. A special moment"
                    />
                  </label>
                  <div className="fieldRow">
                    <label className="fieldLabel">
                      Subtitle Font
                      <select
                        value={current.subtitleFont || globalFont}
                        onChange={(e) => updateCurrent({ subtitleFont: e.target.value as FontName })}
                      >
                        <option value="sans">DM Sans (Clean)</option>
                        <option value="serif">Playfair Display (Serif)</option>
                        <option value="great-vibes">Great Vibes (Romantic Script)</option>
                        <option value="dancing-script">Dancing Script (Playful)</option>
                        <option value="caveat">Caveat (Handwritten)</option>
                        <option value="pacifico">Pacifico (Bold Script)</option>
                        <option value="satisfy">Satisfy (Brush Calligraphy)</option>
                        <option value="allura">Allura (Elegant Flow)</option>
                        <option value="sacramento">Sacramento (Vintage Script)</option>
                      </select>
                    </label>
                    <label className="fieldLabel">
                      Subtitle Size ({current.subtitleSize ?? 14}px)
                      <input
                        type="range"
                        min="10"
                        max="48"
                        value={current.subtitleSize ?? 14}
                        onChange={(e) => updateCurrent({ subtitleSize: Number(e.target.value) })}
                      />
                    </label>
                  </div>
                  <div className="fieldRow">
                    <label className="fieldLabel">
                      Subtitle Color
                      <input
                        type="color"
                        value={current.subtitleColor || "#ff9fc2"}
                        onChange={(e) => updateCurrent({ subtitleColor: e.target.value })}
                      />
                    </label>
                  </div>

                  {/* Message / Story */}
                  <label className="fieldLabel" style={{ marginTop: "10px" }}>
                    Message / Story
                    <textarea
                      rows={4}
                      value={current.text || ""}
                      onChange={(e) => updateCurrent({ text: e.target.value })}
                      placeholder="Write your heartfelt message..."
                    />
                  </label>
                  <div className="fieldRow">
                    <label className="fieldLabel">
                      Body Font
                      <select
                        value={current.bodyFont || globalFont}
                        onChange={(e) => updateCurrent({ bodyFont: e.target.value as FontName })}
                      >
                        <option value="sans">DM Sans (Clean)</option>
                        <option value="serif">Playfair Display (Serif)</option>
                        <option value="great-vibes">Great Vibes (Romantic Script)</option>
                        <option value="dancing-script">Dancing Script (Playful)</option>
                        <option value="caveat">Caveat (Handwritten)</option>
                        <option value="pacifico">Pacifico (Bold Script)</option>
                        <option value="satisfy">Satisfy (Brush Calligraphy)</option>
                        <option value="allura">Allura (Elegant Flow)</option>
                        <option value="sacramento">Sacramento (Vintage Script)</option>
                      </select>
                    </label>
                    <label className="fieldLabel">
                      Body Size ({current.bodySize ?? 17}px)
                      <input
                        type="range"
                        min="12"
                        max="40"
                        value={current.bodySize ?? 17}
                        onChange={(e) => updateCurrent({ bodySize: Number(e.target.value) })}
                      />
                    </label>
                  </div>
                  <div className="fieldRow">
                    <label className="fieldLabel">
                      Body Color
                      <input
                        type="color"
                        value={current.bodyColor || globalTextColor}
                        onChange={(e) => updateCurrent({ bodyColor: e.target.value })}
                      />
                    </label>
                  </div>
                </div>



                {/* Hero Photo Controls */}
                {(current.type === "welcome" || current.image) && (
                  <div
                    className={`controlCard ${highlightedSection === "photo" ? "sectionHighlightGlow" : ""}`}
                    data-editor-section="photo"
                  >
                    <span className="controlGroupTitle">🖼️ Hero Photo</span>
                    {current.image ? (
                      <>
                        <div className="miniMediaRow">
                          <img src={current.image} alt="Hero" className="miniThumb" style={{ width: "36px", height: "36px", borderRadius: "6px", objectFit: "cover" }} />
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              type="button"
                              className="btn small"
                              onClick={() => heroPhotoInputRef.current?.click()}
                              title="Replace hero photo"
                            >
                              Replace
                            </button>
                            <button
                              type="button"
                              className="btn small danger"
                              onClick={() => updateCurrent({ image: "" })}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        <label className="fieldLabel" style={{ marginTop: "8px" }}>
                          Photo Opacity ({(current.imageAdjustments?.["hero"]?.opacity ?? current.imageOpacity ?? 100)}%)
                          <input
                            type="range"
                            min="10"
                            max="100"
                            value={current.imageAdjustments?.["hero"]?.opacity ?? current.imageOpacity ?? 100}
                            onChange={(e) => {
                              const prev = current.imageAdjustments?.["hero"] ?? { scale: 100, x: 50, y: 50, rotation: 0 };
                              updateCurrent({
                                imageOpacity: Number(e.target.value),
                                imageAdjustments: {
                                  ...current.imageAdjustments,
                                  hero: { ...prev, opacity: Number(e.target.value) }
                                }
                              });
                            }}
                          />
                        </label>
                        <label className="fieldLabel">
                          Photo Scale ({(current.imageAdjustments?.["hero"]?.scale ?? 100)}%)
                          <input
                            type="range"
                            min="50"
                            max="250"
                            value={current.imageAdjustments?.["hero"]?.scale ?? 100}
                            onChange={(e) => {
                              const prev = current.imageAdjustments?.["hero"] ?? { scale: 100, x: 50, y: 50, rotation: 0 };
                              updateCurrent({
                                imageAdjustments: {
                                  ...current.imageAdjustments,
                                  hero: { ...prev, scale: Number(e.target.value) }
                                }
                              });
                            }}
                          />
                        </label>
                        <div className="fieldRow">
                          <label className="fieldLabel">
                            Position X ({(current.imageAdjustments?.["hero"]?.x ?? 50)}%)
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={current.imageAdjustments?.["hero"]?.x ?? 50}
                              onChange={(e) => {
                                const prev = current.imageAdjustments?.["hero"] ?? { scale: 100, x: 50, y: 50, rotation: 0 };
                                updateCurrent({
                                  imageAdjustments: {
                                    ...current.imageAdjustments,
                                    hero: { ...prev, x: Number(e.target.value) }
                                  }
                                });
                              }}
                            />
                          </label>
                          <label className="fieldLabel">
                            Position Y ({(current.imageAdjustments?.["hero"]?.y ?? 50)}%)
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={current.imageAdjustments?.["hero"]?.y ?? 50}
                              onChange={(e) => {
                                const prev = current.imageAdjustments?.["hero"] ?? { scale: 100, x: 50, y: 50, rotation: 0 };
                                updateCurrent({
                                  imageAdjustments: {
                                    ...current.imageAdjustments,
                                    hero: { ...prev, y: Number(e.target.value) }
                                  }
                                });
                              }}
                            />
                          </label>
                        </div>
                        <label className="fieldLabel">
                          Photo Rotation ({(current.imageAdjustments?.["hero"]?.rotation ?? 0)}°)
                          <input
                            type="range"
                            min="-180"
                            max="180"
                            value={current.imageAdjustments?.["hero"]?.rotation ?? 0}
                            onChange={(e) => {
                              const prev = current.imageAdjustments?.["hero"] ?? { scale: 100, x: 50, y: 50, rotation: 0 };
                              updateCurrent({
                                imageAdjustments: {
                                  ...current.imageAdjustments,
                                  hero: { ...prev, rotation: Number(e.target.value) }
                                }
                              });
                            }}
                          />
                        </label>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="btn small full"
                        onClick={() => heroPhotoInputRef.current?.click()}
                      >
                        📷 Upload Hero Photo (up to 15 MB)
                      </button>
                    )}
                  </div>
                )}

                {/* Card Specific Controls */}
                {/* 1. REASONS / WHAT I LOVE */}
                {current.type === "reasons" && (
                  <div className="controlCard">
                    <span className="controlGroupTitle">💖 Reasons List ({current.items?.length || 0})</span>
                    {(current.items ?? reasonDefaults).map((item, idx) => (
                      <div className="nestedItemCard" key={item.id || idx}>
                        <div className="nestedItemHeader">
                          <input
                            type="text"
                            className="nestedEmojiInput"
                            value={item.emoji || "💖"}
                            onChange={(e) => {
                              const items = current.items ? [...current.items] : [...reasonDefaults];
                              items[idx].emoji = e.target.value;
                              updateCurrent({ items });
                            }}
                          />
                          <input
                            type="text"
                            className="nestedTitleInput"
                            value={item.title}
                            onChange={(e) => {
                              const items = current.items ? [...current.items] : [...reasonDefaults];
                              items[idx].title = e.target.value;
                              updateCurrent({ items });
                            }}
                            placeholder="Reason Title"
                          />
                          <button
                            type="button"
                            className="dangerIconBtn"
                            onClick={() => {
                              const items = current.items ? [...current.items] : [...reasonDefaults];
                              items.splice(idx, 1);
                              updateCurrent({ items });
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={item.text}
                          onChange={(e) => {
                            const items = current.items ? [...current.items] : [...reasonDefaults];
                            items[idx].text = e.target.value;
                            updateCurrent({ items });
                          }}
                          placeholder="Describe what makes this special..."
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn small full"
                      onClick={() => {
                        const items = current.items ? [...current.items] : [...reasonDefaults];
                        items.push({
                          id: uid(),
                          title: `Reason #${items.length + 1}`,
                          text: "Another reason why you mean so much...",
                          emoji: "✨"
                        });
                        updateCurrent({ items });
                      }}
                    >
                      <Plus size={14} /> Add Another Reason
                    </button>
                  </div>
                )}

                {/* 2. INCIDENTS / OUR STORY */}
                {current.type === "incidents" && (
                  <div className="controlCard">
                    <span className="controlGroupTitle">📖 Memorable Incidents ({current.incidents?.length || 0})</span>
                    {(current.incidents ?? incidentDefaults).map((inc, idx) => (
                      <div className="nestedItemCard" key={inc.id || idx}>
                        <div className="nestedItemHeader">
                          <input
                            type="text"
                            className="nestedEmojiInput"
                            value={inc.emoji || "☕"}
                            onChange={(e) => {
                              const incidents = current.incidents ? [...current.incidents] : [...incidentDefaults];
                              incidents[idx].emoji = e.target.value;
                              updateCurrent({ incidents });
                            }}
                          />
                          <input
                            type="text"
                            className="nestedTitleInput"
                            value={inc.title}
                            onChange={(e) => {
                              const incidents = current.incidents ? [...current.incidents] : [...incidentDefaults];
                              incidents[idx].title = e.target.value;
                              updateCurrent({ incidents });
                            }}
                            placeholder="Incident Title"
                          />
                          <button
                            type="button"
                            className="dangerIconBtn"
                            onClick={() => {
                              const incidents = current.incidents ? [...current.incidents] : [...incidentDefaults];
                              incidents.splice(idx, 1);
                              updateCurrent({ incidents });
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <div className="fieldRow">
                          <input
                            type="text"
                            value={inc.tag || ""}
                            onChange={(e) => {
                              const incidents = current.incidents ? [...current.incidents] : [...incidentDefaults];
                              incidents[idx].tag = e.target.value;
                              updateCurrent({ incidents });
                            }}
                            placeholder="Tag (e.g. Core Memory)"
                          />
                          <input
                            type="text"
                            value={inc.date || ""}
                            onChange={(e) => {
                              const incidents = current.incidents ? [...current.incidents] : [...incidentDefaults];
                              incidents[idx].date = e.target.value;
                              updateCurrent({ incidents });
                            }}
                            placeholder="Date (e.g. Summer 2024)"
                          />
                        </div>
                        <textarea
                          rows={2}
                          value={inc.text}
                          onChange={(e) => {
                            const incidents = current.incidents ? [...current.incidents] : [...incidentDefaults];
                            incidents[idx].text = e.target.value;
                            updateCurrent({ incidents });
                          }}
                          placeholder="Tell the story of what happened..."
                        />
                        <div className="incidentPhotoRow">
                          {inc.image ? (
                            <div className="miniPhotoPreview">
                              <img src={inc.image} alt="Incident" />
                              <button
                                type="button"
                                className="dangerSmallBtn"
                                onClick={() => {
                                  const incidents = current.incidents ? [...current.incidents] : [...incidentDefaults];
                                  delete incidents[idx].image;
                                  updateCurrent({ incidents });
                                }}
                              >
                                Remove Photo
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="btn small ghost"
                              onClick={() => {
                                setActiveIncidentIdx(idx);
                                incidentPhotoInputRef.current?.click();
                              }}
                            >
                              📷 Add Photo to Incident
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn small full"
                      onClick={() => {
                        const incidents = current.incidents ? [...current.incidents] : [...incidentDefaults];
                        incidents.push({
                          id: uid(),
                          title: `Unforgettable Moment #${incidents.length + 1}`,
                          tag: "Special Memory",
                          date: "That day",
                          text: "We had the best time...",
                          emoji: "🌟"
                        });
                        updateCurrent({ incidents });
                      }}
                    >
                      <Plus size={14} /> Add Incident Story
                    </button>
                  </div>
                )}

                {/* 3. PHOTO GALLERY & MEMORIES */}
                {(current.type === "gallery" || current.type === "memories") && (
                  <div
                    className={`controlCard ${highlightedSection === "photo" ? "sectionHighlightGlow" : ""}`}
                    data-editor-section="photo"
                  >
                    <span className="controlGroupTitle">📸 Photo Gallery Layout</span>
                    <label className="fieldLabel">
                      Gallery Style
                      <select
                        value={current.galleryLayout || "collage"}
                        onChange={(e) => updateCurrent({ galleryLayout: e.target.value })}
                      >
                        <option value="collage">🎨 Dynamic Collage</option>
                        <option value="scattered">✨ Scattered Memories (Tap to Disintegrate)</option>
                        <option value="grid">▦ Clean Grid</option>
                        <option value="masonry">🧱 Masonry Wall</option>
                      </select>
                    </label>

                    <div className="galleryPhotosGrid">
                      {(current.images || (current.image ? [current.image] : [])).map((img, idx) => (
                        <div
                          className={`galleryThumbCard ${selectedPhotoIdx === idx ? "activeThumb" : ""}`}
                          key={idx}
                          onClick={() => setSelectedPhotoIdx(idx)}
                          style={{
                            cursor: "pointer",
                            outline: selectedPhotoIdx === idx ? "2px solid var(--accent)" : "none",
                            borderRadius: "8px"
                          }}
                        >
                          <img src={img} alt={`Memory ${idx + 1}`} />
                          <button
                            type="button"
                            className="removeThumbBtn"
                            onClick={(e) => {
                              e.stopPropagation();
                              const imgs = [...(current.images || (current.image ? [current.image] : []))];
                              imgs.splice(idx, 1);
                              updateCurrent({ images: imgs, image: imgs[0] || "" });
                              if (selectedPhotoIdx >= imgs.length) {
                                setSelectedPhotoIdx(Math.max(0, imgs.length - 1));
                              }
                            }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="btn small primary full"
                      onClick={() => galleryInputRef.current?.click()}
                    >
                      <Upload size={14} /> Upload Photos (up to 15 MB each)
                    </button>

                    {/* Individual Photo Selection & Customization Controls */}
                    {((current.images || (current.image ? [current.image] : [])).length > 0) && (
                      <div style={{ marginTop: "14px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--accent)" }}>
                            Selected: Photo {selectedPhotoIdx + 1} of {(current.images || [current.image]).length}
                          </span>
                          <div style={{ display: "flex", gap: "4px" }}>
                            {(current.images || [current.image]).map((_, pIdx) => (
                              <button
                                key={pIdx}
                                type="button"
                                className={`btn small ${selectedPhotoIdx === pIdx ? "primary" : "ghost"}`}
                                style={{ padding: "3px 8px", fontSize: "11px", minWidth: "auto" }}
                                onClick={() => setSelectedPhotoIdx(pIdx)}
                              >
                                #{pIdx + 1}
                              </button>
                            ))}
                          </div>
                        </div>

                        {(() => {
                          const pKey = String(selectedPhotoIdx);
                          const curAdj: ImageAdjustment = current.imageAdjustments?.[pKey] ?? current.imageAdjustments?.[`photo_${selectedPhotoIdx}`] ?? {
                            scale: 100,
                            x: 50,
                            y: 50,
                            opacity: 100,
                            rotation: 0
                          };
                          const updatePhotoAdj = (patch: Partial<ImageAdjustment>) => {
                            const prev = current.imageAdjustments ?? {};
                            updateCurrent({
                              imageAdjustments: {
                                ...prev,
                                [pKey]: { ...curAdj, ...patch }
                              }
                            });
                          };

                          return (
                            <>
                              <label className="fieldLabel">
                                Photo {selectedPhotoIdx + 1} Scale ({curAdj.scale ?? 100}%)
                                <input
                                  type="range"
                                  min="50"
                                  max="250"
                                  value={curAdj.scale ?? 100}
                                  onChange={(e) => updatePhotoAdj({ scale: Number(e.target.value) })}
                                />
                              </label>

                              <label className="fieldLabel">
                                Photo {selectedPhotoIdx + 1} Opacity ({curAdj.opacity ?? current.imageOpacity ?? 100}%)
                                <input
                                  type="range"
                                  min="10"
                                  max="100"
                                  value={curAdj.opacity ?? current.imageOpacity ?? 100}
                                  onChange={(e) => updatePhotoAdj({ opacity: Number(e.target.value) })}
                                />
                              </label>

                              <div className="fieldRow">
                                <label className="fieldLabel">
                                  Position X ({curAdj.x ?? 50}%)
                                  <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={curAdj.x ?? 50}
                                    onChange={(e) => updatePhotoAdj({ x: Number(e.target.value) })}
                                  />
                                </label>
                                <label className="fieldLabel">
                                  Position Y ({curAdj.y ?? 50}%)
                                  <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={curAdj.y ?? 50}
                                    onChange={(e) => updatePhotoAdj({ y: Number(e.target.value) })}
                                  />
                                </label>
                              </div>

                              <label className="fieldLabel">
                                Rotation ({curAdj.rotation ?? 0}°)
                                <input
                                  type="range"
                                  min="-180"
                                  max="180"
                                  value={curAdj.rotation ?? 0}
                                  onChange={(e) => updatePhotoAdj({ rotation: Number(e.target.value) })}
                                />
                              </label>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. TAP-TO-REVEAL SECRET */}
                {current.type === "secret" && (
                  <div
                    className={`controlCard ${highlightedSection === "photo" || highlightedSection === "video" ? "sectionHighlightGlow" : ""}`}
                    data-editor-section="photo"
                  >
                    <span className="controlGroupTitle">🔒 Secret Tap-to-Reveal Media</span>
                    <label className="fieldLabel">
                      Secret Photo
                      {current.secretImage ? (
                        <div className="miniMediaRow">
                          <img src={current.secretImage} alt="Secret" className="miniThumb" />
                          <button
                            type="button"
                            className="btn small danger"
                            onClick={() => updateCurrent({ secretImage: "" })}
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn small full"
                          onClick={() => secretPhotoInputRef.current?.click()}
                        >
                          📷 Upload Secret Photo (up to 15 MB)
                        </button>
                      )}
                    </label>

                    <label className="fieldLabel" style={{ marginTop: "10px" }}>
                      Secret Video
                      {current.secretVideo ? (
                        <div className="miniMediaRow">
                          <span>🎥 Video Attached</span>
                          <button
                            type="button"
                            className="btn small danger"
                            onClick={() => updateCurrent({ secretVideo: "" })}
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn small full"
                          onClick={() => secretVideoInputRef.current?.click()}
                        >
                          🎥 Upload Secret Video (up to 50 MB)
                        </button>
                      )}
                    </label>
                  </div>
                )}

                {/* 5. VIDEO SECTION */}
                {(current.video || current.memoryVideo || current.type === "music") && (
                  <div
                    className={`controlCard ${highlightedSection === "video" ? "sectionHighlightGlow" : ""}`}
                    data-editor-section="video"
                  >
                    <span className="controlGroupTitle">🎥 Section Video (Max 3)</span>
                    {(current.video || current.memoryVideo) ? (
                      <>
                        <div className="miniMediaRow">
                          <span style={{ fontSize: "12px", color: "var(--text)", fontWeight: 500 }}>
                            🎥 {current.videoName || "Section Video"}
                          </span>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              type="button"
                              className="btn small"
                              onClick={() => videoInputRef.current?.click()}
                              title="Replace video"
                            >
                              Replace
                            </button>
                            <button
                              type="button"
                              className="btn small danger"
                              onClick={() => {
                                updateCurrent({
                                  video: "",
                                  memoryVideo: "",
                                  videoName: ""
                                });
                                setToast("Video removed! 🗑️");
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>

                        <label className="fieldLabel" style={{ marginTop: "10px" }}>
                          Fit / Display Mode
                          <select
                            value={current.videoFit || "cover"}
                            onChange={(e) => updateCurrent({ videoFit: e.target.value as "cover" | "contain" | "fill" })}
                          >
                            <option value="cover">Cover (Fill & Clean Crop)</option>
                            <option value="contain">Contain (Show Whole Video)</option>
                            <option value="fill">Fill (Stretch to Fit)</option>
                          </select>
                        </label>

                        <label className="fieldLabel">
                          Video Opacity ({current.videoOpacity ?? 100}%)
                          <input
                            type="range"
                            min="10"
                            max="100"
                            value={current.videoOpacity ?? 100}
                            onChange={(e) => updateCurrent({ videoOpacity: Number(e.target.value) })}
                          />
                        </label>

                        <label className="fieldLabel">
                          Video Scale / Zoom ({current.videoScale ?? 100}%)
                          <input
                            type="range"
                            min="50"
                            max="250"
                            value={current.videoScale ?? 100}
                            onChange={(e) => updateCurrent({ videoScale: Number(e.target.value) })}
                          />
                        </label>

                        <div className="fieldRow">
                          <label className="fieldLabel">
                            Video Width ({current.videoWidth ?? 100}%)
                            <input
                              type="range"
                              min="40"
                              max="100"
                              value={current.videoWidth ?? 100}
                              onChange={(e) => updateCurrent({ videoWidth: Number(e.target.value) })}
                            />
                          </label>
                          <label className="fieldLabel">
                            Corner Radius ({current.videoRadius ?? 18}px)
                            <input
                              type="range"
                              min="0"
                              max="32"
                              value={current.videoRadius ?? 18}
                              onChange={(e) => updateCurrent({ videoRadius: Number(e.target.value) })}
                            />
                          </label>
                        </div>

                        <div className="fieldRow">
                          <label className="fieldLabel">
                            Position X ({current.videoPositionX ?? 50}%)
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={current.videoPositionX ?? 50}
                              onChange={(e) => updateCurrent({ videoPositionX: Number(e.target.value) })}
                            />
                          </label>
                          <label className="fieldLabel">
                            Position Y ({current.videoPositionY ?? 50}%)
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={current.videoPositionY ?? 50}
                              onChange={(e) => updateCurrent({ videoPositionY: Number(e.target.value) })}
                            />
                          </label>
                        </div>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="btn small primary full"
                        disabled={totalVideoCount >= 3}
                        onClick={() => videoInputRef.current?.click()}
                      >
                        🎥 Upload Video (up to 50 MB, Max 3)
                      </button>
                    )}
                  </div>
                )}

                {/* 6. LETTER SECTION */}
                {current.type === "letter" && (
                  <div className="controlCard">
                    <span className="controlGroupTitle">💌 Letter Customization</span>
                    <div className="fieldRow">
                      <label className="fieldLabel">
                        Letter Font Style
                        <select
                          value={current.letterFont || "serif"}
                          onChange={(e) => updateCurrent({ letterFont: e.target.value as FontName })}
                        >
                          {fontOptions}
                        </select>
                      </label>
                      <label className="fieldLabel">
                        Letter Size ({current.letterSize ?? 17}px)
                        <input
                          type="range"
                          min="13"
                          max="28"
                          value={current.letterSize ?? 17}
                          onChange={(e) => updateCurrent({ letterSize: Number(e.target.value) })}
                        />
                      </label>
                    </div>
                    <div className="fieldRow">
                      <label className="fieldLabel">
                        Text Align
                        <select
                          value={current.letterAlign || "left"}
                          onChange={(e) => updateCurrent({ letterAlign: e.target.value as "left" | "center" | "right" })}
                        >
                          <option value="left">Left Align</option>
                          <option value="center">Center Align</option>
                          <option value="right">Right Align</option>
                        </select>
                      </label>
                      <label className="fieldLabel">
                        Letter Color
                        <input
                          type="color"
                          value={current.letterColor || "#2d2024"}
                          onChange={(e) => updateCurrent({ letterColor: e.target.value })}
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* 7. BIRTHDAY CAKE SECTION */}
                {current.type === "cake" && (
                  <div className="controlCard">
                    <span className="controlGroupTitle">🎂 Birthday Cake Finale</span>
                    <label className="fieldLabel">
                      Celebration Message after Candle Blowout
                      <input
                        type="text"
                        value={current.subtitle || "Happy Birthday, once again! 🎂✨❤️"}
                        onChange={(e) => updateCurrent({ subtitle: e.target.value })}
                        placeholder="e.g. Happy Birthday, once again! 🎂✨❤️"
                      />
                    </label>
                  </div>
                )}

                {/* Section Specific Wallpaper */}
                <div
                  className={`controlCard ${highlightedSection === "wallpaper" ? "sectionHighlightGlow" : ""}`}
                  data-editor-section="wallpaper"
                >
                  <span className="controlGroupTitle">🎨 Section Wallpaper</span>
                  <label className="fieldLabel">
                    Preset Background
                    <select
                      value={current.background || background}
                      onChange={(e) => {
                        updateCurrent({ background: e.target.value });
                        setCardBackgroundMode("different");
                      }}
                    >
                      <option value="aurora">🌌 Aurora Borealis</option>
                      <option value="mesh">🫧 Liquid Gradient Mesh</option>
                      <option value="stars">✨ Deep Space Stars</option>
                      <option value="petals">🌸 Floating Cherry Petals</option>
                      <option value="gradient">🎨 Radiant Gradient</option>
                      <option value="minimal">◌ Minimal Dark Glow</option>
                    </select>
                  </label>

                  <div style={{ marginTop: "8px" }}>
                    {current.customBg ? (
                      <>
                        <div className="miniMediaRow">
                          <span style={{ fontSize: "12px", color: "var(--text)", fontWeight: 500 }}>
                            🖼️ {current.customBgName || "Section Wallpaper"}
                          </span>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              type="button"
                              className="btn small"
                              onClick={() => {
                                updateCurrent({
                                  customBgOpacity: 100,
                                  customBgScale: 100,
                                  customBgPositionX: 50,
                                  customBgPositionY: 50,
                                  customBgFit: "cover"
                                });
                                setToast("Wallpaper settings reset! 🔄");
                              }}
                              title="Reset wallpaper opacity, scale, and position"
                            >
                              Reset
                            </button>
                            <button
                              type="button"
                              className="btn small danger"
                              onClick={() => updateCurrent({ customBg: "", customBgName: "" })}
                            >
                              Remove
                            </button>
                          </div>
                        </div>

                        <label className="fieldLabel" style={{ marginTop: "10px" }}>
                          Fit / Display Mode
                          <select
                            value={current.customBgFit || "cover"}
                            onChange={(e) => updateCurrent({ customBgFit: e.target.value as "cover" | "contain" | "fill" })}
                          >
                            <option value="cover">Cover (Fill & Crop Cleanly)</option>
                            <option value="contain">Contain (Fit Whole Image)</option>
                            <option value="fill">Fill (Stretch to Fit Card)</option>
                          </select>
                        </label>

                        <label className="fieldLabel">
                          Wallpaper Opacity ({current.customBgOpacity ?? 100}%)
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={current.customBgOpacity ?? 100}
                            onChange={(e) => updateCurrent({ customBgOpacity: Number(e.target.value) })}
                          />
                        </label>

                        <label className="fieldLabel">
                          Wallpaper Scale / Zoom ({current.customBgScale ?? 100}%)
                          <input
                            type="range"
                            min="50"
                            max="300"
                            value={current.customBgScale ?? 100}
                            onChange={(e) => updateCurrent({ customBgScale: Number(e.target.value) })}
                          />
                        </label>

                        <div className="fieldRow">
                          <label className="fieldLabel">
                            Horizontal Position X ({current.customBgPositionX ?? 50}%)
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={current.customBgPositionX ?? 50}
                              onChange={(e) => updateCurrent({ customBgPositionX: Number(e.target.value) })}
                            />
                          </label>
                          <label className="fieldLabel">
                            Vertical Position Y ({current.customBgPositionY ?? 50}%)
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={current.customBgPositionY ?? 50}
                              onChange={(e) => updateCurrent({ customBgPositionY: Number(e.target.value) })}
                            />
                          </label>
                        </div>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="btn small full"
                        onClick={() => sectionBgInputRef.current?.click()}
                      >
                        🖼️ Choose Section Photo
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : activeInspectorTab === "design" ? (
              /* ================================================================= */
              /* TAB 2: GLOBAL DESIGN & THEME PALETTES                             */
              /* ================================================================= */
              <div className="inspectorDesignGroup">
                {/* Theme Presets */}
                <div className="controlCard">
                  <span className="controlGroupTitle">🎭 Theme Presets</span>
                  <div className="themePresetGrid">
                    {Object.entries(themes).map(([key, colors]) => (
                      <button
                        type="button"
                        key={key}
                        className={`themePresetButton ${theme === key ? "active" : ""}`}
                        onClick={() => {
                          setTheme(key);
                          setBackgroundBaseColor(colors[0]);
                          setBgColor1(colors[1]);
                          setBgColor2(colors[2]);
                          setBgColor3(colors[3]);
                          setGlobalTextColor(colors[3]);
                        }}
                      >
                        <div className="themePreviewSwatches">
                          <span style={{ background: colors[0] }} />
                          <span style={{ background: colors[1] }} />
                          <span style={{ background: colors[2] }} />
                        </div>
                        <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Color Palette */}
                <div className="controlCard">
                  <span className="controlGroupTitle">🎨 Custom Palette</span>
                  <div className="fieldRow">
                    <label className="fieldLabel">
                      Base Background
                      <input
                        type="color"
                        value={backgroundBaseColor}
                        onChange={(e) => setBackgroundBaseColor(e.target.value)}
                      />
                    </label>
                    <label className="fieldLabel">
                      Text Color
                      <input
                        type="color"
                        value={globalTextColor}
                        onChange={(e) => setGlobalTextColor(e.target.value)}
                      />
                    </label>
                  </div>
                  <div className="fieldRow">
                    <label className="fieldLabel">
                      Accent Glow 1
                      <input type="color" value={bgColor1} onChange={(e) => setBgColor1(e.target.value)} />
                    </label>
                    <label className="fieldLabel">
                      Accent Glow 2
                      <input type="color" value={bgColor2} onChange={(e) => setBgColor2(e.target.value)} />
                    </label>
                  </div>
                </div>

                {/* Global Typography & Sliders */}
                <div className="controlCard">
                  <span className="controlGroupTitle">🔤 Global Typography</span>
                  <label className="fieldLabel">
                    Primary Font
                    <select
                      value={globalFont}
                      onChange={(e) => setGlobalFont(e.target.value as FontName)}
                    >
                      {fontOptions}
                    </select>
                  </label>
                  <label className="fieldLabel">
                    Card Background Opacity ({globalCardOpacity}%)
                    <input
                      type="range"
                      min="0"
                      max="80"
                      value={globalCardOpacity}
                      onChange={(e) => setGlobalCardOpacity(Number(e.target.value))}
                    />
                  </label>
                  <label className="fieldLabel">
                    Card Corner Radius ({globalRadius}px)
                    <input
                      type="range"
                      min="8"
                      max="36"
                      value={globalRadius}
                      onChange={(e) => setGlobalRadius(Number(e.target.value))}
                    />
                  </label>
                </div>

                {/* Global Wallpaper & Music */}
                <div className="controlCard">
                  <span className="controlGroupTitle">🖼️ Global Wallpaper & Music</span>
                  <div style={{ marginBottom: "12px" }}>
                    {customBg ? (
                      <div className="miniMediaRow">
                        <span>🖼️ {customBgName || "Global Wallpaper"}</span>
                        <button
                          type="button"
                          className="btn small danger"
                          onClick={() => {
                            setCustomBg("");
                            setCustomBgName("");
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn small full"
                        onClick={() => wallpaperInputRef.current?.click()}
                      >
                        🖼️ Upload Global Wallpaper (up to 15 MB)
                      </button>
                    )}
                  </div>

                  {customBg && (
                    <>
                      <label className="fieldLabel">
                        Wallpaper Opacity ({customBgOpacity}%)
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={customBgOpacity}
                          onChange={(e) => setCustomBgOpacity(Number(e.target.value))}
                        />
                      </label>
                      <label className="fieldLabel">
                        Wallpaper Scale ({customBgScale}%)
                        <input
                          type="range"
                          min="100"
                          max="200"
                          value={customBgScale}
                          onChange={(e) => setCustomBgScale(Number(e.target.value))}
                        />
                      </label>
                    </>
                  )}

                  <div style={{ marginTop: "14px" }}>
                    {audioUrl ? (
                      <div className="miniMediaRow">
                        <span>🎵 {audioName || "Background Song"}</span>
                        <button
                          type="button"
                          className="btn small danger"
                          onClick={() => {
                            setAudioUrl("");
                            setAudioName("");
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn small full"
                        onClick={() => audioInputRef.current?.click()}
                      >
                        🎵 Upload Song MP3 (up to 20 MB)
                      </button>
                    )}
                  </div>
                </div>

                {/* Event Celebration Date & Reminders */}
                <div className="controlCard">
                  <span className="controlGroupTitle">📅 Celebration Event & Reminders</span>
                  <label className="fieldLabel">
                    Target Event Date
                    <input
                      type="date"
                      value={targetEventDate}
                      onChange={(e) => {
                        const newDate = e.target.value;
                        setTargetEventDate(newDate);
                        if (newDate) {
                          const d = new Date(newDate);
                          d.setDate(d.getDate() - 1);
                          const calculatedReminder = d.toISOString().split("T")[0];
                          setReminderDate(calculatedReminder);
                        }
                        setDraftStatus("unsaved");
                      }}
                    />
                  </label>
                  <label className="fieldLabel">
                    1-Day Advance Reminder
                    <input
                      type="date"
                      value={reminderDate}
                      onChange={(e) => {
                        setReminderDate(e.target.value);
                        setDraftStatus("unsaved");
                      }}
                    />
                  </label>
                </div>
              </div>
            ) : (
              /* ================================================================= */
              /* TAB 3: STORY FLOW / TIMELINE REORDERING                           */
              /* ================================================================= */
              <div className="inspectorSectionGroup">
                <div className="controlCard">
                  <span className="controlGroupTitle">📑 Story Structure & Sequence</span>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px" }}>
                    Reorder, duplicate, or delete greeting sections.
                  </p>
                  <div className="storyFlowList">
                    {blocks.map((b, idx) => (
                      <div
                        key={b.id}
                        className={`storyFlowItemCard ${selected === idx ? "active" : ""}`}
                        onClick={() => {
                          setSelected(idx);
                          setActiveInspectorTab("section");
                        }}
                      >
                        <span className="dragHandle">⋮⋮</span>
                        <div className="cardInfo">
                          <span className="cardTitle">{b.title || `Section ${idx + 1}`}</span>
                          <span className="cardTypeBadge">{b.type}</span>
                        </div>
                        <div className="cardQuickActions" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            title="Move Up"
                            disabled={idx === 0}
                            onClick={() => moveBlock(idx, "up")}
                          >
                            <ArrowUp size={13} />
                          </button>
                          <button
                            type="button"
                            title="Move Down"
                            disabled={idx === blocks.length - 1}
                            onClick={() => moveBlock(idx, "down")}
                          >
                            <ArrowDown size={13} />
                          </button>
                          <button
                            type="button"
                            title={b.visible !== false ? "Hide Section" : "Show Section"}
                            onClick={() => toggleVisible(idx)}
                          >
                            {b.visible !== false ? <Eye size={13} /> : <EyeOff size={13} />}
                          </button>
                          <button
                            type="button"
                            title="Duplicate"
                            onClick={() => duplicateBlock(idx)}
                          >
                            <Copy size={13} />
                          </button>
                          <button
                            type="button"
                            className="dangerBtn"
                            title="Delete"
                            disabled={blocks.length <= 1}
                            onClick={() => removeBlock(idx)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM TRAY: MEDIA UPLOAD & LIVE STORAGE QUOTA METER                     */}
      {/* ========================================================================= */}
      <footer className="studioBottomTray">
        <div className="mediaUploadActions">
          <button
            type="button"
            className="mediaActionBtn"
            onClick={() => {
              setActiveInspectorTab("section");
              setMobileEditOpen(true);
              if (current.type === "gallery" || current.type === "memories") {
                galleryInputRef.current?.click();
              } else if (current.type === "secret") {
                secretPhotoInputRef.current?.click();
              } else {
                heroPhotoInputRef.current?.click();
              }
            }}
            title="Upload photo for selected section (up to 15 MB)"
          >
            <ImageIcon size={15} />
            <span>Photo (15 MB)</span>
          </button>

          <button
            type="button"
            className="mediaActionBtn"
            disabled={totalVideoCount >= 3 && !current.video && !current.memoryVideo && !current.secretVideo}
            onClick={() => {
              if (totalVideoCount >= 3 && !current.video && !current.memoryVideo && !current.secretVideo) {
                setToast("Maximum 3 videos allowed per greeting.");
                return;
              }
              setActiveInspectorTab("section");
              setMobileEditOpen(true);
              if (current.type === "secret") {
                secretVideoInputRef.current?.click();
              } else {
                videoInputRef.current?.click();
              }
            }}
            title="Upload video for selected section (up to 50 MB, max 3)"
          >
            <Video size={15} />
            <span>Video (50 MB)</span>
          </button>

          <button
            type="button"
            className="mediaActionBtn"
            onClick={() => {
              setActiveInspectorTab("design");
              setMobileEditOpen(true);
              audioInputRef.current?.click();
            }}
            title="Upload background song (up to 20 MB)"
          >
            <Music2 size={15} />
            <span>Audio (20 MB)</span>
          </button>

          <button
            type="button"
            className="mediaActionBtn"
            onClick={() => {
              setActiveInspectorTab("section");
              setMobileEditOpen(true);
              sectionBgInputRef.current?.click();
            }}
            title="Upload custom section wallpaper"
          >
            <Palette size={15} />
            <span>Wallpaper</span>
          </button>
        </div>

        {/* Live Storage Meter */}
        <div className="storageQuotaMeter">
          <div className="quotaLabel">
            <span>Storage: <strong>{totalMediaMB} MB / 300 MB</strong></span>
            <span className="videoCount">Videos: {totalVideoCount} / 3</span>
          </div>
          <div className="quotaProgressBar">
            <div
              className="quotaProgressFill"
              style={{ width: `${Math.min(100, (totalMediaBytes / (300 * 1024 * 1024)) * 100)}%` }}
            />
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* MODAL: ADD SECTION TEMPLATE PICKER                                        */}
      {/* ========================================================================= */}
      {addSectionModalOpen && (
        <div className="studioModalBackdrop" onClick={() => setAddSectionModalOpen(false)}>
          <div className="studioModalContent" onClick={(e) => e.stopPropagation()}>
            <div className="studioModalHeader">
              <h3>✨ Add a Special Moment Section</h3>
              <button type="button" onClick={() => setAddSectionModalOpen(false)}><X size={18} /></button>
            </div>
            <div className="templateCardsGrid">
              <button type="button" className="templateCard" onClick={() => addBlock("welcome")}>
                <span className="templateEmoji">🌟</span>
                <h4>Hero Opening</h4>
                <p>Personalized birthday wish & animated greeting</p>
              </button>
              <button type="button" className="templateCard" onClick={() => addBlock("reasons")}>
                <span className="templateEmoji">💖</span>
                <h4>What I Love</h4>
                <p>Beautiful reason cards why they are so special</p>
              </button>
              <button type="button" className="templateCard" onClick={() => addBlock("gallery")}>
                <span className="templateEmoji">📸</span>
                <h4>Photo Gallery</h4>
                <p>Collage, grid, masonry, or scattered memories</p>
              </button>
              <button type="button" className="templateCard" onClick={() => addBlock("incidents")}>
                <span className="templateEmoji">📖</span>
                <h4>Our Story</h4>
                <p>Memorable incidents, funny moments & core memories</p>
              </button>
              <button type="button" className="templateCard" onClick={() => addBlock("letter")}>
                <span className="templateEmoji">💌</span>
                <h4>Little Letter</h4>
                <p>Long heartfelt personal letter with photo mount</p>
              </button>
              <button type="button" className="templateCard" onClick={() => addBlock("secret")}>
                <span className="templateEmoji">🔒</span>
                <h4>Tap to Reveal</h4>
                <p>Surprise secret message, photo, or private video</p>
              </button>
              <button type="button" className="templateCard" onClick={() => addBlock("cake")}>
                <span className="templateEmoji">🎂</span>
                <h4>Birthday Cake</h4>
                <p>Blowable candles, smoke puff & celebration finale</p>
              </button>
              <button type="button" className="templateCard" onClick={() => addBlock("music")}>
                <span className="templateEmoji">🎥</span>
                <h4>Memory Video</h4>
                <p>Dedicated cinematic video moment</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DRAFTS MANAGER                                                     */}
      {/* ========================================================================= */}
      {draftsModalOpen && (
        <div className="studioModalBackdrop" onClick={() => setDraftsModalOpen(false)}>
          <div className="studioModalContent" onClick={(e) => e.stopPropagation()}>
            <div className="studioModalHeader">
              <h3>📂 Your Saved Drafts</h3>
              <button type="button" onClick={() => setDraftsModalOpen(false)}><X size={18} /></button>
            </div>
            <div className="draftsListModal customScrollbar">
              {draftsList.length === 0 ? (
                <p style={{ textAlign: "center", color: "var(--muted)", padding: "30px" }}>
                  No saved drafts yet. Click "Save" to preserve your greeting draft.
                </p>
              ) : (
                draftsList.map((d) => (
                  <div className="draftRowCard" key={d.id}>
                    <div className="draftRowInfo">
                      <h4>{d.title || "Untitled Draft"}</h4>
                      <span>Last edited: {new Date(d.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="draftRowActions">
                      <button
                        type="button"
                        className="btn small primary"
                        onClick={() => openDraft(d)}
                      >
                        Open
                      </button>
                      <button
                        type="button"
                        className="btn small danger"
                        onClick={() => deleteDraft(d.id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PUBLISH & PRIVATE LINK GENERATION                                  */}
      {/* ========================================================================= */}
      {publishOpen && (
        <div className="studioModalBackdrop" onClick={() => setPublishOpen(false)}>
          <div className="studioModalContent publishModal" onClick={(e) => e.stopPropagation()}>
            <div className="studioModalHeader">
              <h3>🔐 Private Greeting Link</h3>
              <button type="button" onClick={() => setPublishOpen(false)}><X size={18} /></button>
            </div>
            <div className="publishModalBody">
              {publishing ? (
                <div className="publishLoading">
                  <div className="uploadSpinner" />
                  <p>Generating your secure private greeting link...</p>
                </div>
              ) : publishError ? (
                <div className="publishErrorCard">
                  <p>⚠️ {publishError}</p>
                  <button type="button" className="btn small" onClick={publishGreeting}>
                    Try Again
                  </button>
                </div>
              ) : publishedLink ? (
                <div className="publishedSuccess">
                  <div className="publishedIcon">🎉</div>
                  <h4>Your Private Greeting is Ready!</h4>
                  <p>Anyone with this unique private link can view the interactive greeting without logging in.</p>

                  <div className="linkCopyBar">
                    <input type="text" readOnly value={publishedLink} />
                    <button type="button" className="btn primary" onClick={copyGreetingLink}>
                      {copiedLink ? <Check size={15} /> : <Copy size={15} />}
                      {copiedLink ? "Copied" : "Copy"}
                    </button>
                  </div>

                  <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "16px" }}>
                    <a
                      href={publishedLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn ghost small"
                    >
                      <ExternalLink size={14} /> Open Greeting
                    </a>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
