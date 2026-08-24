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
  const [activeRightTab, setActiveRightTab] = useState<"design" | "story" | "select">("design");

  // Left Detailed Inspector element category state
  const [activeElementCategory, setActiveElementCategory] = useState<"text" | "photo" | "wallpaper" | "video" | "emoji" | "cards">("text");
  const [activeTextRole, setActiveTextRole] = useState<"heading" | "subtitle" | "kicker" | "body" | "letter" | "buttons" | "reasonTitle" | "incidentTitle" | "secretText" | "cakeText">("heading");
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState<number>(0);
  const [customizeSectionCards, setCustomizeSectionCards] = useState<Record<string, boolean>>({});

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
  const [replacePhotoIndex, setReplacePhotoIndex] = useState<number | null>(null);
  const inspectorBodyRef = useRef<HTMLDivElement | null>(null);

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
        titleColor: b.titleColor,
        kickerColor: b.kickerColor || b.titleColor,
        buttonColor: b.buttonColor,
        reasonTitleColor: b.reasonTitleColor,
        reasonTextColor: b.reasonTextColor,
        incidentTitleColor: b.incidentTitleColor,
        incidentTextColor: b.incidentTextColor,
        secretTextColor: b.secretTextColor,
        cakeSubtitleColor: b.cakeSubtitleColor,
        cakeTextColor: b.cakeTextColor,
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

  // Direct click-to-edit selection handler from GreetingView
  function handleSelectElement(sectionId: string, elementKey: string, extraIndex?: number) {
    const idx = blocks.findIndex((b) => b.id === sectionId);
    if (idx >= 0) {
      setSelected(idx);
      setScene(idx);
    }
    if (elementKey === "heading" || elementKey === "subtitle" || elementKey === "kicker" || elementKey === "body" || elementKey === "letter") {
      setActiveElementCategory("text");
      setActiveTextRole(elementKey as any);
    } else if (elementKey === "reasons") {
      setActiveElementCategory("text");
      setActiveTextRole("reasonTitle");
    } else if (elementKey === "incidents") {
      setActiveElementCategory("text");
      setActiveTextRole("incidentTitle");
    } else if (elementKey === "secret") {
      setActiveElementCategory("text");
      setActiveTextRole("secretText");
    } else if (elementKey === "cake") {
      setActiveElementCategory("text");
      setActiveTextRole("cakeText");
    } else if (elementKey === "buttons" || elementKey === "button" || elementKey === "backButton" || elementKey === "keepGoingButton") {
      setActiveElementCategory("text");
      setActiveTextRole("buttons");
    } else if (elementKey === "photo") {
      setActiveElementCategory("photo");
      if (typeof extraIndex === "number") {
        setSelectedPhotoIdx(extraIndex);
      }
    } else if (elementKey === "wallpaper") {
      setActiveElementCategory("wallpaper");
    } else if (elementKey === "video") {
      setActiveElementCategory("video");
    } else if (elementKey === "emoji") {
      setActiveElementCategory("emoji");
    }
    if (previewDevice === "mobile") {
      setMobileEditOpen(true);
    }
  }

  function handleSelectSectionById(blockId: string) {
    const idx = blocks.findIndex((b) => b.id === blockId);
    if (idx >= 0) {
      setSelected(idx);
      setScene(idx);
      if (previewDevice === "mobile") {
        setMobileEditOpen(true);
      }
    }
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

  // Upload Handlers with Strict Limit Validations
  async function handleMediaUpload(file: File, kind: "image" | "memory-video" | "audio") {
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
      const url = result.previewUrl || result.media;
      const curImgs = Array.isArray(current.images) && current.images.length > 0 ? [...current.images] : current.image ? [current.image] : [];
      if (replacePhotoIndex !== null && replacePhotoIndex >= 0 && replacePhotoIndex < curImgs.length) {
        curImgs[replacePhotoIndex] = url;
      } else {
        curImgs.push(url);
        setSelectedPhotoIdx(curImgs.length - 1);
      }
      updateCurrent({
        images: curImgs,
        image: curImgs[0] || ""
      });
      setReplacePhotoIndex(null);
      setActiveElementCategory("photo");
      setDraftStatus("unsaved");
      if (e.target) e.target.value = "";
    }
  }

  async function uploadWallpaper(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await handleMediaUpload(file, "image");
    if (result) {
      setCustomBg(result.previewUrl || result.media);
      setCustomBgName(file.name);
      setActiveRightTab("design");
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
      setActiveElementCategory("wallpaper");
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
      setActiveRightTab("design");
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
    setActiveElementCategory("photo");
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
      setActiveElementCategory("video");
      setToast("Video uploaded successfully! 🎥");
    }
  }

  async function uploadSecretPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await handleMediaUpload(file, "image");
    if (result) {
      updateCurrent({ secretImage: result.previewUrl || result.media });
      setActiveElementCategory("photo");
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
      setActiveElementCategory("video");
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
        incidents[activeIncidentIdx] = {
          ...incidents[activeIncidentIdx],
          image: result.previewUrl || result.media
        };
        updateCurrent({ incidents });
      }
    }
  }

  // Draft Management API
  async function loadDraftsList() {
    try {
      const res = await fetch("/api/drafts");
      if (res.ok) {
        const data = await res.json();
        setDraftsList(data.drafts || []);
      }
    } catch (e) {
      // ignore
    }
  }

  async function saveDraft() {
    setDraftStatus("saving");
    try {
      const proj = projectData();
      const res = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: draftId || undefined,
          title: momentTitle,
          project: proj
        })
      });

      const data = await res.json();
      if (res.ok && data.draft) {
        setDraftId(data.draft.id);
        setDraftStatus("saved");
        setToast("Draft saved successfully! 💾");
      } else {
        setDraftStatus("unsaved");
        setToast("Could not save draft.");
      }
    } catch (err: any) {
      setDraftStatus("unsaved");
      setToast(`Error saving draft: ${err.message}`);
    }
  }

  function openDraft(d: GreetingDraft) {
    if (d.project) {
      const p = d.project;
      setBlocks(p.blocks && p.blocks.length > 0 ? p.blocks : defaultBlocks);
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
      setAudioName(p.audioName || "");
      setAudioUrl(p.audioUrl || "");
      setCustomBg(p.customBg || "");
      setCustomBgName(p.customBgName || "");
      setCustomBgOpacity(p.customBgOpacity ?? 100);
      setCustomBgScale(p.customBgScale ?? 100);
      setCustomBgPositionX(p.customBgPositionX ?? 50);
      setCustomBgPositionY(p.customBgPositionY ?? 50);
      setCustomBgRotation(p.customBgRotation ?? 0);
      setBackgroundBaseColor(p.backgroundBaseColor || "#100917");
      setBgColor1(p.bgColor1 || "#ff4f8b");
      setBgColor2(p.bgColor2 || "#7c5cff");
      setBgColor3(p.bgColor3 || "#38bdf8");
      setBgColor4(p.bgColor4 || "#f59e0b");
      setBackgroundOverlay(p.backgroundOverlay ?? 18);
      setTargetEventDate(p.targetEventDate || "");
      setReminderDate(p.reminderDate || "");
      setTargetEventTitle(p.targetEventTitle || "");
    }
    setMomentTitle(d.title || "A Hanora moment");
    setDraftId(d.id);
    setSelected(0);
    setScene(0);
    setDraftsModalOpen(false);
    setDraftStatus("saved");
    setToast("Draft loaded! ✨");
  }

  async function deleteDraft(id: string) {
    try {
      const res = await fetch(`/api/drafts?id=${encodeURIComponent(id)}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setDraftsList((prev) => prev.filter((item) => item.id !== id));
        if (draftId === id) setDraftId("");
        setToast("Draft deleted.");
      }
    } catch (e) {
      setToast("Failed to delete draft.");
    }
  }

  // Publish Greeting & Generate Secure Private Link
  async function publishGreeting() {
    setPublishing(true);
    setPublishError("");
    try {
      const proj = projectData();
      const res = await fetch("/api/greetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: momentTitle,
          project: proj
        })
      });

      const data = await res.json();
      if (!res.ok || !data.token) {
        throw new Error(data.error || "Failed to generate link.");
      }

      const fullUrl = `${window.location.origin}/g/${data.token}`;
      setPublishedLink(fullUrl);
      setToast("Private greeting link generated! 🎉");
    } catch (err: any) {
      setPublishError(err.message || "Failed to generate link.");
    } finally {
      setPublishing(false);
    }
  }

  function copyGreetingLink() {
    if (!publishedLink) return;
    navigator.clipboard.writeText(publishedLink).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  }

  // Photo adjustment helper for current block
  const heroAdj = current.imageAdjustments?.["hero"] ?? current.imageAdjustments?.["0"] ?? { scale: 100, x: 50, y: 50, opacity: 100, rotation: 0, width: 60, cornerRadius: 0 };
  const galleryImages = Array.isArray(current.images) && current.images.length > 0 ? current.images : current.image ? [current.image] : [];
  const selectedPhotoAdj: ImageAdjustment =
    current.imageAdjustments?.[String(selectedPhotoIdx)] ??
    current.imageAdjustments?.[`photo_${selectedPhotoIdx}`] ??
    (selectedPhotoIdx === 0 ? current.imageAdjustments?.["hero"] ?? current.imageAdjustments?.["0"] : undefined) ??
    { scale: 100, x: 50, y: 50, opacity: 100, rotation: 0, width: 60, cornerRadius: 0 };

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
            <span style={{ fontFamily: "'Symphonie Calligraphy', 'Symphonie', 'Great Vibes', cursive", letterSpacing: "0.08em" }}>
              HANORA<span style={{ color: "var(--accent)" }}>•</span>
            </span>
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

        <span className="mobileLogo" style={{ fontFamily: "'Symphonie Calligraphy', 'Symphonie', 'Great Vibes', cursive" }}>
          HANORA<span style={{ color: "var(--accent)" }}>•</span>
        </span>

        <button
          type="button"
          className="mobileHeaderBtn"
          onClick={() => setMobileEditOpen(!mobileEditOpen)}
        >
          <Sliders size={16} />
          <span>Inspector</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 3-COLUMN CREATOR STUDIO (DESKTOP & RESPONSIVE WORKSPACE)                   */}
      {/* ========================================================================= */}
      <div className={`studioGrid ${previewOnly ? "previewOnlyMode" : ""}`}>
        {/* ======================================================================= */}
        {/* LEFT COLUMN: DETAILED ELEMENT INSPECTOR                                  */}
        {/* ======================================================================= */}
        <aside className={`studioLeft ${mobileEditOpen ? "mobileOpen" : ""}`}>
          <div className="studioLeftHeader">
            <div className="elementInspectorTitle">
              <span>{current.emoji || "✨"}</span>
              <span>{current.title || `Section ${selected + 1}`}</span>
              <span className="elementInspectorBadge">{current.type}</span>
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

          {/* Element SubNav Selector Pills */}
          <div className="elementSubNav">
            <button
              type="button"
              className={activeElementCategory === "text" ? "active" : ""}
              onClick={() => setActiveElementCategory("text")}
            >
              <Type size={12} /> Text
            </button>
            <button
              type="button"
              className={activeElementCategory === "photo" ? "active" : ""}
              onClick={() => setActiveElementCategory("photo")}
            >
              <ImageIcon size={12} /> Photos
            </button>
            <button
              type="button"
              className={activeElementCategory === "wallpaper" ? "active" : ""}
              onClick={() => setActiveElementCategory("wallpaper")}
            >
              <Palette size={12} /> Wallpaper
            </button>
            <button
              type="button"
              className={activeElementCategory === "video" ? "active" : ""}
              onClick={() => setActiveElementCategory("video")}
            >
              <Video size={12} /> Video
            </button>
            <button
              type="button"
              className={activeElementCategory === "emoji" ? "active" : ""}
              onClick={() => setActiveElementCategory("emoji")}
            >
              <Sparkles size={12} /> Emoji
            </button>
            {(current.type === "reasons" || current.type === "incidents" || current.type === "letter" || current.type === "cake" || current.type === "secret") && (
              <button
                type="button"
                className={activeElementCategory === "cards" ? "active" : ""}
                onClick={() => setActiveElementCategory("cards")}
              >
                <Sliders size={12} /> Cards
              </button>
            )}
          </div>

          <div className="inspectorBody customScrollbar" ref={inspectorBodyRef}>
            {/* ------------------------------------------------------------------- */}
            {/* 1. TEXT & INDEPENDENT TYPOGRAPHY INSPECTOR                          */}
            {/* ------------------------------------------------------------------- */}
            {activeElementCategory === "text" && (
              <div className="inspectorSectionGroup">
                {/* Role Tabs for granular text selection */}
                <div className="photoSubTabs">
                  <button
                    type="button"
                    className={`photoSubTabBtn ${activeTextRole === "heading" ? "active" : ""}`}
                    onClick={() => setActiveTextRole("heading")}
                  >
                    Heading
                  </button>
                  <button
                    type="button"
                    className={`photoSubTabBtn ${activeTextRole === "subtitle" ? "active" : ""}`}
                    onClick={() => setActiveTextRole("subtitle")}
                  >
                    Subtitle
                  </button>
                  <button
                    type="button"
                    className={`photoSubTabBtn ${activeTextRole === "kicker" ? "active" : ""}`}
                    onClick={() => setActiveTextRole("kicker")}
                  >
                    Kicker
                  </button>
                  <button
                    type="button"
                    className={`photoSubTabBtn ${activeTextRole === "body" ? "active" : ""}`}
                    onClick={() => setActiveTextRole("body")}
                  >
                    Body
                  </button>
                  {current.type === "letter" && (
                    <button
                      type="button"
                      className={`photoSubTabBtn ${activeTextRole === "letter" ? "active" : ""}`}
                      onClick={() => setActiveTextRole("letter")}
                    >
                      Letter
                    </button>
                  )}
                  <button
                    type="button"
                    className={`photoSubTabBtn ${activeTextRole === "buttons" ? "active" : ""}`}
                    onClick={() => setActiveTextRole("buttons")}
                  >
                    Buttons
                  </button>
                  {current.type === "reasons" && (
                    <button
                      type="button"
                      className={`photoSubTabBtn ${activeTextRole === "reasonTitle" ? "active" : ""}`}
                      onClick={() => setActiveTextRole("reasonTitle")}
                    >
                      Reasons
                    </button>
                  )}
                  {current.type === "incidents" && (
                    <button
                      type="button"
                      className={`photoSubTabBtn ${activeTextRole === "incidentTitle" ? "active" : ""}`}
                      onClick={() => setActiveTextRole("incidentTitle")}
                    >
                      Stories
                    </button>
                  )}
                  {current.type === "secret" && (
                    <button
                      type="button"
                      className={`photoSubTabBtn ${activeTextRole === "secretText" ? "active" : ""}`}
                      onClick={() => setActiveTextRole("secretText")}
                    >
                      Secret
                    </button>
                  )}
                  {current.type === "cake" && (
                    <button
                      type="button"
                      className={`photoSubTabBtn ${activeTextRole === "cakeText" ? "active" : ""}`}
                      onClick={() => setActiveTextRole("cakeText")}
                    >
                      Cake
                    </button>
                  )}
                </div>

                {/* ACTIVE ROLE: HEADING */}
                {activeTextRole === "heading" && (
                  <div className="controlCard">
                    <span className="controlGroupTitle">✍️ Heading Customization</span>
                    <label className="fieldLabel">
                      Heading Text
                      <input
                        type="text"
                        value={current.heading || ""}
                        onChange={(e) => updateCurrent({ heading: e.target.value })}
                        placeholder="e.g. Happy Birthday!"
                      />
                    </label>
                    <div className="fieldRow">
                      <label className="fieldLabel">
                        Font Family
                        <select
                          value={current.headingFont || current.font || globalFont}
                          onChange={(e) => updateCurrent({ headingFont: e.target.value as FontName })}
                        >
                          {fontOptions}
                        </select>
                      </label>
                      <label className="fieldLabel">
                        <div className="sliderHeader">
                          <span>Font Size</span>
                          <span className="valueBadge">{current.headingSize ?? 70}px</span>
                        </div>
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
                        Font Weight
                        <select
                          value={getRoleStyle("heading").weight || "700"}
                          onChange={(e) => updateElementStyle("heading", { weight: e.target.value })}
                        >
                          <option value="400">400 Regular</option>
                          <option value="500">500 Medium</option>
                          <option value="600">600 SemiBold</option>
                          <option value="700">700 Bold</option>
                          <option value="900">900 Black</option>
                        </select>
                      </label>
                      <label className="fieldLabel">
                        Heading Color
                        <input
                          type="color"
                          value={current.headingColor || globalTextColor}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateCurrent({ headingColor: val });
                            updateElementStyle("heading", { color: val });
                          }}
                        />
                      </label>
                    </div>
                    <div className="fieldRow">
                      <label className="fieldLabel">
                        <div className="sliderHeader">
                          <span>Opacity</span>
                          <span className="valueBadge">{getRoleStyle("heading").opacity ?? 100}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={getRoleStyle("heading").opacity ?? 100}
                          onChange={(e) => updateElementStyle("heading", { opacity: Number(e.target.value) })}
                        />
                      </label>
                      <label className="fieldLabel">
                        <div className="sliderHeader">
                          <span>Position X</span>
                          <span className="valueBadge">{getRoleStyle("heading").offsetX ?? 0}px</span>
                        </div>
                        <input
                          type="range"
                          min="-80"
                          max="80"
                          value={getRoleStyle("heading").offsetX ?? 0}
                          onChange={(e) => updateElementStyle("heading", { offsetX: Number(e.target.value) })}
                        />
                      </label>
                    </div>
                    <div className="fieldRow">
                      <label className="fieldLabel">
                        <div className="sliderHeader">
                          <span>Position Y</span>
                          <span className="valueBadge">{getRoleStyle("heading").offsetY ?? 0}px</span>
                        </div>
                        <input
                          type="range"
                          min="-60"
                          max="60"
                          value={getRoleStyle("heading").offsetY ?? 0}
                          onChange={(e) => updateElementStyle("heading", { offsetY: Number(e.target.value) })}
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* ACTIVE ROLE: SUBTITLE */}
                {activeTextRole === "subtitle" && (
                  <div className="controlCard">
                    <span className="controlGroupTitle">✍️ Subtitle Customization</span>
                    <label className="fieldLabel">
                      Subtitle Text
                      <input
                        type="text"
                        value={current.subtitle || ""}
                        onChange={(e) => updateCurrent({ subtitle: e.target.value })}
                        placeholder="e.g. A moment together"
                      />
                    </label>
                    <div className="fieldRow">
                      <label className="fieldLabel">
                        Font Family
                        <select
                          value={current.subtitleFont || globalFont}
                          onChange={(e) => updateCurrent({ subtitleFont: e.target.value as FontName })}
                        >
                          {fontOptions}
                        </select>
                      </label>
                      <label className="fieldLabel">
                        <div className="sliderHeader">
                          <span>Font Size</span>
                          <span className="valueBadge">{current.subtitleSize ?? 14}px</span>
                        </div>
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
                        Font Weight
                        <select
                          value={getRoleStyle("subtitle").weight || "700"}
                          onChange={(e) => updateElementStyle("subtitle", { weight: e.target.value })}
                        >
                          <option value="400">400 Regular</option>
                          <option value="500">500 Medium</option>
                          <option value="600">600 SemiBold</option>
                          <option value="700">700 Bold</option>
                          <option value="900">900 Black</option>
                        </select>
                      </label>
                      <label className="fieldLabel">
                        Subtitle Color
                        <input
                          type="color"
                          value={current.subtitleColor || (theme === "light" ? "#be185d" : "#ff9fc2")}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateCurrent({ subtitleColor: val });
                            updateElementStyle("subtitle", { color: val });
                            updateElementStyle("eyebrow", { color: val });
                          }}
                        />
                      </label>
                    </div>
                    <div className="fieldRow">
                      <label className="fieldLabel">
                        <div className="sliderHeader">
                          <span>Opacity</span>
                          <span className="valueBadge">{getRoleStyle("subtitle").opacity ?? 100}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={getRoleStyle("subtitle").opacity ?? 100}
                          onChange={(e) => updateElementStyle("subtitle", { opacity: Number(e.target.value) })}
                        />
                      </label>
                      <label className="fieldLabel">
                        <div className="sliderHeader">
                          <span>Position X</span>
                          <span className="valueBadge">{getRoleStyle("subtitle").offsetX ?? 0}px</span>
                        </div>
                        <input
                          type="range"
                          min="-80"
                          max="80"
                          value={getRoleStyle("subtitle").offsetX ?? 0}
                          onChange={(e) => updateElementStyle("subtitle", { offsetX: Number(e.target.value) })}
                        />
                      </label>
                    </div>
                    <div className="fieldRow">
                      <label className="fieldLabel">
                        <div className="sliderHeader">
                          <span>Position Y</span>
                          <span className="valueBadge">{getRoleStyle("subtitle").offsetY ?? 0}px</span>
                        </div>
                        <input
                          type="range"
                          min="-60"
                          max="60"
                          value={getRoleStyle("subtitle").offsetY ?? 0}
                          onChange={(e) => updateElementStyle("subtitle", { offsetY: Number(e.target.value) })}
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* ACTIVE ROLE: KICKER / EYEBROW */}
                {activeTextRole === "kicker" && (
                  <div className="controlCard">
                    <span className="controlGroupTitle">✍️ Section Kicker / Eyebrow</span>
                    <label className="fieldLabel">
                      Kicker Text
                      <input
                        type="text"
                        value={current.title || ""}
                        onChange={(e) => updateCurrent({ title: e.target.value })}
                        placeholder="e.g. Special Section"
                      />
                    </label>
                    <div className="fieldRow">
                      <label className="fieldLabel">
                        Font Family
                        <select
                          value={current.titleFont || "sans"}
                          onChange={(e) => updateCurrent({ titleFont: e.target.value as FontName })}
                        >
                          {fontOptions}
                        </select>
                      </label>
                      <label className="fieldLabel">
                        <div className="sliderHeader">
                          <span>Font Size</span>
                          <span className="valueBadge">{current.titleSize ?? 13}px</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="32"
                          value={current.titleSize ?? 13}
                          onChange={(e) => updateCurrent({ titleSize: Number(e.target.value) })}
                        />
                      </label>
                    </div>
                    <div className="fieldRow">
                      <label className="fieldLabel">
                        Font Weight
                        <select
                          value={getRoleStyle("kicker").weight || "700"}
                          onChange={(e) => {
                            updateElementStyle("kicker", { weight: e.target.value });
                            updateElementStyle("title", { weight: e.target.value });
                          }}
                        >
                          <option value="400">400 Regular</option>
                          <option value="500">500 Medium</option>
                          <option value="600">600 SemiBold</option>
                          <option value="700">700 Bold</option>
                          <option value="900">900 Black</option>
                        </select>
                      </label>
                      <label className="fieldLabel">
                        Kicker Color
                        <input
                          type="color"
                          value={current.titleColor || current.kickerColor || (theme === "light" ? "#be185d" : "#ff9fc2")}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateCurrent({ titleColor: val, kickerColor: val });
                            updateElementStyle("kicker", { color: val });
                            updateElementStyle("title", { color: val });
                          }}
                        />
                      </label>
                    </div>
                    <div className="fieldRow">
                      <label className="fieldLabel">
                        <div className="sliderHeader">
                          <span>Opacity</span>
                          <span className="valueBadge">{getRoleStyle("kicker").opacity ?? 100}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={getRoleStyle("kicker").opacity ?? 100}
                          onChange={(e) => {
                            updateElementStyle("kicker", { opacity: Number(e.target.value) });
                            updateElementStyle("title", { opacity: Number(e.target.value) });
                          }}
                        />
                      </label>
                      <label className="fieldLabel">
                        <div className="sliderHeader">
                          <span>Position X</span>
                          <span className="valueBadge">{getRoleStyle("kicker").offsetX ?? 0}px</span>
                        </div>
                        <input
                          type="range"
                          min="-80"
                          max="80"
                          value={getRoleStyle("kicker").offsetX ?? 0}
                          onChange={(e) => {
                            updateElementStyle("kicker", { offsetX: Number(e.target.value) });
                            updateElementStyle("title", { offsetX: Number(e.target.value) });
                          }}
                        />
                      </label>
                    </div>
                    <div className="fieldRow">
                      <label className="fieldLabel">
                        <div className="sliderHeader">
                          <span>Position Y</span>
                          <span className="valueBadge">{getRoleStyle("kicker").offsetY ?? 0}px</span>
                        </div>
                        <input
                          type="range"
                          min="-60"
                          max="60"
                          value={getRoleStyle("kicker").offsetY ?? 0}
                          onChange={(e) => {
                            updateElementStyle("kicker", { offsetY: Number(e.target.value) });
                            updateElementStyle("title", { offsetY: Number(e.target.value) });
                          }}
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* ACTIVE ROLE: BODY */}
                {activeTextRole === "body" && (
                  <div className="controlCard">
                    <span className="controlGroupTitle">✍️ Body / Message Story</span>
                    <label className="fieldLabel">
                      Message Content
                      <textarea
                        rows={4}
                        value={current.text || ""}
                        onChange={(e) => updateCurrent({ text: e.target.value })}
                        placeholder="Write your heartfelt greeting message..."
                      />
                    </label>
                    <div className="fieldRow">
                      <label className="fieldLabel">
                        Font Family
                        <select
                          value={current.bodyFont || globalFont}
                          onChange={(e) => updateCurrent({ bodyFont: e.target.value as FontName })}
                        >
                          {fontOptions}
                        </select>
                      </label>
                      <label className="fieldLabel">
                        <div className="sliderHeader">
                          <span>Font Size</span>
                          <span className="valueBadge">{current.bodySize ?? 17}px</span>
                        </div>
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
                        Font Weight
                        <select
                          value={getRoleStyle("body").weight || "400"}
                          onChange={(e) => updateElementStyle("body", { weight: e.target.value })}
                        >
                          <option value="400">400 Regular</option>
                          <option value="500">500 Medium</option>
                          <option value="600">600 SemiBold</option>
                          <option value="700">700 Bold</option>
                        </select>
                      </label>
                      <label className="fieldLabel">
                        Text Color
                        <input
                          type="color"
                          value={current.bodyColor || globalTextColor}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateCurrent({ bodyColor: val });
                            updateElementStyle("body", { color: val });
                          }}
                        />
                      </label>
                    </div>
                    <div className="fieldRow">
                      <label className="fieldLabel">
                        <div className="sliderHeader">
                          <span>Opacity</span>
                          <span className="valueBadge">{getRoleStyle("body").opacity ?? 100}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={getRoleStyle("body").opacity ?? 100}
                          onChange={(e) => updateElementStyle("body", { opacity: Number(e.target.value) })}
                        />
                      </label>
                      <label className="fieldLabel">
                        <div className="sliderHeader">
                          <span>Position X</span>
                          <span className="valueBadge">{getRoleStyle("body").offsetX ?? 0}px</span>
                        </div>
                        <input
                          type="range"
                          min="-80"
                          max="80"
                          value={getRoleStyle("body").offsetX ?? 0}
                          onChange={(e) => updateElementStyle("body", { offsetX: Number(e.target.value) })}
                        />
                      </label>
                    </div>
                    <div className="fieldRow">
                      <label className="fieldLabel">
                        <div className="sliderHeader">
                          <span>Position Y</span>
                          <span className="valueBadge">{getRoleStyle("body").offsetY ?? 0}px</span>
                        </div>
                        <input
                          type="range"
                          min="-60"
                          max="60"
                          value={getRoleStyle("body").offsetY ?? 0}
                          onChange={(e) => updateElementStyle("body", { offsetY: Number(e.target.value) })}
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* ACTIVE ROLE: LETTER */}
                {activeTextRole === "letter" && (
                  <div className="controlCard">
                    <span className="controlGroupTitle">💌 Long Letter Styling</span>
                    <div className="fieldRow">
                      <label className="fieldLabel">
                        Letter Font
                        <select
                          value={current.letterFont || "serif"}
                          onChange={(e) => updateCurrent({ letterFont: e.target.value as FontName })}
                        >
                          {fontOptions}
                        </select>
                      </label>
                      <label className="fieldLabel">
                        <div className="sliderHeader">
                          <span>Font Size</span>
                          <span className="valueBadge">{current.letterSize ?? 17}px</span>
                        </div>
                        <input
                          type="range"
                          min="12"
                          max="32"
                          value={current.letterSize ?? 17}
                          onChange={(e) => updateCurrent({ letterSize: Number(e.target.value) })}
                        />
                      </label>
                    </div>
                    <div className="fieldRow">
                      <label className="fieldLabel">
                        Font Weight
                        <select
                          value={getRoleStyle("letter").weight || "400"}
                          onChange={(e) => updateElementStyle("letter", { weight: e.target.value })}
                        >
                          <option value="400">400 Regular</option>
                          <option value="500">500 Medium</option>
                          <option value="600">600 SemiBold</option>
                          <option value="700">700 Bold</option>
                        </select>
                      </label>
                      <label className="fieldLabel">
                        Letter Color
                        <input
                          type="color"
                          value={current.letterColor || "#2d2024"}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateCurrent({ letterColor: val });
                            updateElementStyle("letter", { color: val });
                          }}
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
                        <div className="sliderHeader">
                          <span>Opacity</span>
                          <span className="valueBadge">{getRoleStyle("letter").opacity ?? 100}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={getRoleStyle("letter").opacity ?? 100}
                          onChange={(e) => updateElementStyle("letter", { opacity: Number(e.target.value) })}
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* ACTIVE ROLE: BUTTONS */}
                {activeTextRole === "buttons" && (
                  <div className="controlCard">
                    <span className="controlGroupTitle">🔘 Button Text & Color</span>
                    <label className="fieldLabel">
                      Back Button Text
                      <input
                        type="text"
                        value={current.backButtonText || "Back"}
                        onChange={(e) => updateCurrent({ backButtonText: e.target.value })}
                        placeholder="Back"
                      />
                    </label>
                    <label className="fieldLabel">
                      Keep Going Button Text
                      <input
                        type="text"
                        value={current.keepGoingButtonText || "Keep going"}
                        onChange={(e) => updateCurrent({ keepGoingButtonText: e.target.value })}
                        placeholder="Keep going"
                      />
                    </label>
                    <div className="fieldRow">
                      <label className="fieldLabel">
                        Font Weight
                        <select
                          value={getRoleStyle("buttons").weight || "600"}
                          onChange={(e) => updateElementStyle("buttons", { weight: e.target.value })}
                        >
                          <option value="400">400 Regular</option>
                          <option value="500">500 Medium</option>
                          <option value="600">600 SemiBold</option>
                          <option value="700">700 Bold</option>
                        </select>
                      </label>
                      <label className="fieldLabel">
                        Button Text Color
                        <input
                          type="color"
                          value={current.buttonColor || "#ffffff"}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateCurrent({ buttonColor: val });
                            updateElementStyle("buttons", { color: val });
                            updateElementStyle("backButton", { color: val });
                            updateElementStyle("keepGoingButton", { color: val });
                          }}
                        />
                      </label>
                    </div>
                    <div className="fieldRow">
                      <label className="fieldLabel">
                        <div className="sliderHeader">
                          <span>Opacity</span>
                          <span className="valueBadge">{getRoleStyle("buttons").opacity ?? 100}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={getRoleStyle("buttons").opacity ?? 100}
                          onChange={(e) => updateElementStyle("buttons", { opacity: Number(e.target.value) })}
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* ACTIVE ROLE: REASON CARDS */}
                {activeTextRole === "reasonTitle" && (
                  <div className="controlCard">
                    <span className="controlGroupTitle">💖 Reason Cards Text & Color</span>
                    <div className="fieldRow">
                      <label className="fieldLabel">
                        Reason Title Color
                        <input
                          type="color"
                          value={current.reasonTitleColor || current.headingColor || globalTextColor}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateCurrent({ reasonTitleColor: val });
                            updateElementStyle("reasonTitle", { color: val });
                          }}
                        />
                      </label>
                      <label className="fieldLabel">
                        Reason Description Color
                        <input
                          type="color"
                          value={current.reasonTextColor || current.bodyColor || globalTextColor}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateCurrent({ reasonTextColor: val });
                            updateElementStyle("reasonText", { color: val });
                          }}
                        />
                      </label>
                    </div>
                    <div className="fieldRow">
                      <label className="fieldLabel">
                        Title Weight
                        <select
                          value={getRoleStyle("reasonTitle").weight || "700"}
                          onChange={(e) => updateElementStyle("reasonTitle", { weight: e.target.value })}
                        >
                          <option value="400">400 Regular</option>
                          <option value="500">500 Medium</option>
                          <option value="600">600 SemiBold</option>
                          <option value="700">700 Bold</option>
                        </select>
                      </label>
                      <label className="fieldLabel">
                        <div className="sliderHeader">
                          <span>Card Text Opacity</span>
                          <span className="valueBadge">{getRoleStyle("reasonText").opacity ?? 100}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={getRoleStyle("reasonText").opacity ?? 100}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            updateElementStyle("reasonText", { opacity: v });
                            updateElementStyle("reasonTitle", { opacity: v });
                          }}
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* ACTIVE ROLE: STORY INCIDENTS */}
                {activeTextRole === "incidentTitle" && (
                  <div className="controlCard">
                    <span className="controlGroupTitle">📖 Story Incidents Text & Color</span>
                    <div className="fieldRow">
                      <label className="fieldLabel">
                        Story Title Color
                        <input
                          type="color"
                          value={current.incidentTitleColor || current.headingColor || globalTextColor}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateCurrent({ incidentTitleColor: val });
                            updateElementStyle("incidentTitle", { color: val });
                          }}
                        />
                      </label>
                      <label className="fieldLabel">
                        Story Description Color
                        <input
                          type="color"
                          value={current.incidentTextColor || current.bodyColor || globalTextColor}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateCurrent({ incidentTextColor: val });
                            updateElementStyle("incidentText", { color: val });
                          }}
                        />
                      </label>
                    </div>
                    <div className="fieldRow">
                      <label className="fieldLabel">
                        Story Tag Color
                        <input
                          type="color"
                          value={current.titleColor || (theme === "light" ? "#be185d" : "#ff9fc2")}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateCurrent({ titleColor: val });
                            updateElementStyle("incidentTag", { color: val });
                          }}
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* ACTIVE ROLE: SECRET REVEAL */}
                {activeTextRole === "secretText" && (
                  <div className="controlCard">
                    <span className="controlGroupTitle">🔒 Secret Reveal Text & Color</span>
                    <label className="fieldLabel">
                      Reveal Message Text
                      <textarea
                        rows={3}
                        value={current.text || ""}
                        onChange={(e) => updateCurrent({ text: e.target.value })}
                        placeholder="Write your secret reveal message..."
                      />
                    </label>
                    <div className="fieldRow">
                      <label className="fieldLabel">
                        Reveal Message Color
                        <input
                          type="color"
                          value={current.secretTextColor || current.bodyColor || globalTextColor}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateCurrent({ secretTextColor: val });
                            updateElementStyle("secretMessage", { color: val });
                            updateElementStyle("secretText", { color: val });
                          }}
                        />
                      </label>
                      <label className="fieldLabel">
                        Reveal Button Text
                        <input
                          type="text"
                          value={current.revealButtonText || "Tap to reveal"}
                          onChange={(e) => updateCurrent({ revealButtonText: e.target.value })}
                          placeholder="Tap to reveal"
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* ACTIVE ROLE: CAKE CELEBRATION */}
                {activeTextRole === "cakeText" && (
                  <div className="controlCard">
                    <span className="controlGroupTitle">🎂 Cake Finale Text & Color</span>
                    <label className="fieldLabel">
                      Celebration Heading
                      <input
                        type="text"
                        value={current.subtitle || ""}
                        onChange={(e) => updateCurrent({ subtitle: e.target.value })}
                        placeholder="Happy Birthday once again!"
                      />
                    </label>
                    <label className="fieldLabel">
                      Wish Subtext
                      <textarea
                        rows={2}
                        value={current.text || ""}
                        onChange={(e) => updateCurrent({ text: e.target.value })}
                        placeholder="May your year be filled with immense joy..."
                      />
                    </label>
                    <div className="fieldRow">
                      <label className="fieldLabel">
                        Celebration Heading Color
                        <input
                          type="color"
                          value={current.cakeSubtitleColor || current.subtitleColor || "#ff9fc2"}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateCurrent({ cakeSubtitleColor: val });
                            updateElementStyle("cakeSubtitle", { color: val });
                          }}
                        />
                      </label>
                      <label className="fieldLabel">
                        Wish Subtext Color
                        <input
                          type="color"
                          value={current.cakeTextColor || current.bodyColor || globalTextColor}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateCurrent({ cakeTextColor: val });
                            updateElementStyle("cakeText", { color: val });
                          }}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------------- */}
            {/* 2. PHOTO INSPECTOR                                                  */}
            {/* ------------------------------------------------------------------- */}
            {activeElementCategory === "photo" && (
              <div className="inspectorSectionGroup">
                <div className="controlCard">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span className="controlGroupTitle" style={{ margin: 0 }}>📸 Section Photos ({galleryImages.length})</span>
                    <button
                      type="button"
                      className="btn small primary"
                      onClick={() => {
                        setReplacePhotoIndex(null);
                        heroPhotoInputRef.current?.click();
                      }}
                    >
                      + Add Photo
                    </button>
                  </div>

                  {galleryImages.length === 0 ? (
                    <button
                      type="button"
                      className="btn small primary full"
                      onClick={() => {
                        setReplacePhotoIndex(null);
                        heroPhotoInputRef.current?.click();
                      }}
                    >
                      📸 Upload Photo (up to 15 MB)
                    </button>
                  ) : (
                    <>
                      {/* Photo Selector Strip */}
                      <div className="galleryPhotoListStrip" style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "8px", marginBottom: "12px" }}>
                        {galleryImages.map((src, i) => (
                          <button
                            key={i}
                            type="button"
                            className={`galleryThumbnailBtn ${selectedPhotoIdx === i ? "active" : ""}`}
                            onClick={() => setSelectedPhotoIdx(i)}
                            style={{
                              position: "relative",
                              width: "56px",
                              height: "56px",
                              borderRadius: "8px",
                              overflow: "hidden",
                              border: selectedPhotoIdx === i ? "2px solid var(--accent, #ff4f8b)" : "1px solid rgba(255,255,255,0.15)",
                              padding: 0,
                              background: "#111",
                              cursor: "pointer",
                              flexShrink: 0
                            }}
                          >
                            <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            <span style={{ position: "absolute", bottom: 0, left: 0, right: 0, fontSize: "10px", background: "rgba(0,0,0,0.7)", color: "#fff", textAlign: "center" }}>
                              #{i + 1}
                            </span>
                          </button>
                        ))}
                      </div>

                      {/* Selected Photo Actions */}
                      <div className="miniMediaRow" style={{ marginBottom: "12px" }}>
                        <span style={{ fontSize: "12px", color: "var(--text)" }}>Photo #{selectedPhotoIdx + 1} Selected</span>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            type="button"
                            className="btn small"
                            onClick={() => {
                              setReplacePhotoIndex(selectedPhotoIdx);
                              heroPhotoInputRef.current?.click();
                            }}
                          >
                            Replace
                          </button>
                          <button
                            type="button"
                            className="btn small danger"
                            onClick={() => {
                              const newImgs = galleryImages.filter((_, idx) => idx !== selectedPhotoIdx);
                              const newAdjustments = { ...(current.imageAdjustments || {}) };
                              delete newAdjustments[String(selectedPhotoIdx)];
                              delete newAdjustments[`photo_${selectedPhotoIdx}`];
                              if (selectedPhotoIdx === 0) delete newAdjustments["hero"];
                              setSelectedPhotoIdx(Math.max(0, selectedPhotoIdx - 1));
                              updateCurrent({
                                images: newImgs,
                                image: newImgs[0] || "",
                                imageAdjustments: newAdjustments
                              });
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      {/* Fit Mode */}
                      <label className="fieldLabel">
                        Fit / Display Mode
                        <div className="fitModeToggleGroup">
                          <button
                            type="button"
                            className={`fitModeToggleBtn ${selectedPhotoAdj.fit === "contain" || (!selectedPhotoAdj.fit && current.imageFit !== "cover") ? "active" : ""}`}
                            onClick={() => {
                              const adjustments = { ...(current.imageAdjustments || {}) };
                              adjustments[String(selectedPhotoIdx)] = { ...selectedPhotoAdj, fit: "contain" };
                              if (selectedPhotoIdx === 0) adjustments["hero"] = { ...selectedPhotoAdj, fit: "contain" };
                              updateCurrent({ imageAdjustments: adjustments });
                            }}
                          >
                            Contain (Full Image)
                          </button>
                          <button
                            type="button"
                            className={`fitModeToggleBtn ${selectedPhotoAdj.fit === "cover" || (!selectedPhotoAdj.fit && current.imageFit === "cover") ? "active" : ""}`}
                            onClick={() => {
                              const adjustments = { ...(current.imageAdjustments || {}) };
                              adjustments[String(selectedPhotoIdx)] = { ...selectedPhotoAdj, fit: "cover" };
                              if (selectedPhotoIdx === 0) adjustments["hero"] = { ...selectedPhotoAdj, fit: "cover" };
                              updateCurrent({ imageAdjustments: adjustments });
                            }}
                          >
                            Cover
                          </button>
                        </div>
                      </label>

                      {/* Width & Scale */}
                      <div className="fieldRow">
                        <label className="fieldLabel">
                          <div className="sliderHeader">
                            <span>Width</span>
                            <span className="valueBadge">{selectedPhotoAdj.width ?? 60}%</span>
                          </div>
                          <input
                            type="range"
                            min="20"
                            max="100"
                            value={selectedPhotoAdj.width ?? 60}
                            onChange={(e) => {
                              const adjustments = { ...(current.imageAdjustments || {}) };
                              const val = Number(e.target.value);
                              adjustments[String(selectedPhotoIdx)] = { ...selectedPhotoAdj, width: val };
                              if (selectedPhotoIdx === 0) adjustments["hero"] = { ...selectedPhotoAdj, width: val };
                              updateCurrent({ imageAdjustments: adjustments });
                            }}
                          />
                        </label>
                        <label className="fieldLabel">
                          <div className="sliderHeader">
                            <span>Scale / Zoom</span>
                            <span className="valueBadge">{selectedPhotoAdj.scale ?? 100}%</span>
                          </div>
                          <input
                            type="range"
                            min="30"
                            max="200"
                            value={selectedPhotoAdj.scale ?? 100}
                            onChange={(e) => {
                              const adjustments = { ...(current.imageAdjustments || {}) };
                              const val = Number(e.target.value);
                              adjustments[String(selectedPhotoIdx)] = { ...selectedPhotoAdj, scale: val };
                              if (selectedPhotoIdx === 0) adjustments["hero"] = { ...selectedPhotoAdj, scale: val };
                              updateCurrent({ imageAdjustments: adjustments });
                            }}
                          />
                        </label>
                      </div>

                      {/* Opacity & Corner Radius */}
                      <div className="fieldRow">
                        <label className="fieldLabel">
                          <div className="sliderHeader">
                            <span>Opacity</span>
                            <span className="valueBadge">{selectedPhotoAdj.opacity ?? 100}%</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="100"
                            value={selectedPhotoAdj.opacity ?? 100}
                            onChange={(e) => {
                              const adjustments = { ...(current.imageAdjustments || {}) };
                              const val = Number(e.target.value);
                              adjustments[String(selectedPhotoIdx)] = { ...selectedPhotoAdj, opacity: val };
                              if (selectedPhotoIdx === 0) adjustments["hero"] = { ...selectedPhotoAdj, opacity: val };
                              updateCurrent({ imageAdjustments: adjustments });
                            }}
                          />
                        </label>
                        <label className="fieldLabel">
                          <div className="sliderHeader">
                            <span>Corner Radius</span>
                            <span className="valueBadge">{selectedPhotoAdj.cornerRadius ?? 0}px</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="50"
                            value={selectedPhotoAdj.cornerRadius ?? 0}
                            onChange={(e) => {
                              const adjustments = { ...(current.imageAdjustments || {}) };
                              const val = Number(e.target.value);
                              adjustments[String(selectedPhotoIdx)] = { ...selectedPhotoAdj, cornerRadius: val };
                              if (selectedPhotoIdx === 0) adjustments["hero"] = { ...selectedPhotoAdj, cornerRadius: val };
                              updateCurrent({ imageAdjustments: adjustments });
                            }}
                          />
                        </label>
                      </div>

                      {/* Corner Position Presets (3x3 Grid) */}
                      <div className="presetPositionSection" style={{ marginTop: "12px", marginBottom: "8px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "6px" }}>
                          Position Presets
                        </span>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "4px" }}>
                          {[
                            { label: "↖ Top L", x: 20, y: 20 },
                            { label: "↑ Top C", x: 50, y: 20 },
                            { label: "↗ Top R", x: 80, y: 20 },
                            { label: "← Mid L", x: 20, y: 50 },
                            { label: "● Center", x: 50, y: 50 },
                            { label: "→ Mid R", x: 80, y: 50 },
                            { label: "↙ Bot L", x: 20, y: 80 },
                            { label: "↓ Bot C", x: 50, y: 80 },
                            { label: "↘ Bot R", x: 80, y: 80 }
                          ].map((preset, pIdx) => (
                            <button
                              key={pIdx}
                              type="button"
                              className="btn small ghost"
                              style={{
                                fontSize: "11px",
                                padding: "6px 2px",
                                borderRadius: "6px",
                                border: (selectedPhotoAdj.x === preset.x && selectedPhotoAdj.y === preset.y) ? "1px solid var(--accent, #ff4f8b)" : "1px solid rgba(255,255,255,0.08)",
                                background: (selectedPhotoAdj.x === preset.x && selectedPhotoAdj.y === preset.y) ? "rgba(255,79,139,0.15)" : "transparent"
                              }}
                              onClick={() => {
                                const adjustments = { ...(current.imageAdjustments || {}) };
                                adjustments[String(selectedPhotoIdx)] = { ...selectedPhotoAdj, x: preset.x, y: preset.y };
                                if (selectedPhotoIdx === 0) adjustments["hero"] = { ...selectedPhotoAdj, x: preset.x, y: preset.y };
                                updateCurrent({ imageAdjustments: adjustments });
                              }}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Position X & Position Y Sliders */}
                      <div className="fieldRow">
                        <label className="fieldLabel">
                          <div className="sliderHeader">
                            <span>Position X</span>
                            <span className="valueBadge">{selectedPhotoAdj.x ?? 50}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={selectedPhotoAdj.x ?? 50}
                            onChange={(e) => {
                              const adjustments = { ...(current.imageAdjustments || {}) };
                              const val = Number(e.target.value);
                              adjustments[String(selectedPhotoIdx)] = { ...selectedPhotoAdj, x: val };
                              if (selectedPhotoIdx === 0) adjustments["hero"] = { ...selectedPhotoAdj, x: val };
                              updateCurrent({ imageAdjustments: adjustments });
                            }}
                          />
                        </label>
                        <label className="fieldLabel">
                          <div className="sliderHeader">
                            <span>Position Y</span>
                            <span className="valueBadge">{selectedPhotoAdj.y ?? 50}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={selectedPhotoAdj.y ?? 50}
                            onChange={(e) => {
                              const adjustments = { ...(current.imageAdjustments || {}) };
                              const val = Number(e.target.value);
                              adjustments[String(selectedPhotoIdx)] = { ...selectedPhotoAdj, y: val };
                              if (selectedPhotoIdx === 0) adjustments["hero"] = { ...selectedPhotoAdj, y: val };
                              updateCurrent({ imageAdjustments: adjustments });
                            }}
                          />
                        </label>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------------- */}
            {/* 3. WALLPAPER INSPECTOR                                              */}
            {/* ------------------------------------------------------------------- */}
            {activeElementCategory === "wallpaper" && (
              <div className="inspectorSectionGroup">
                <div className="controlCard">
                  <span className="controlGroupTitle">🎨 Custom Section Wallpaper</span>
                  {current.customBg ? (
                    <>
                      <div className="miniMediaRow">
                        <span style={{ fontSize: "12px", color: "var(--text)" }}>
                          🖼️ {current.customBgName || "Section Wallpaper"}
                        </span>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            type="button"
                            className="btn small"
                            onClick={() => sectionBgInputRef.current?.click()}
                          >
                            Replace
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

                      <label className="fieldLabel">
                        Fit / Fill Mode
                        <div className="fitModeToggleGroup">
                          <button
                            type="button"
                            className={`fitModeToggleBtn ${(!current.customBgFit || current.customBgFit === "cover") ? "active" : ""}`}
                            onClick={() => updateCurrent({ customBgFit: "cover" })}
                          >
                            Cover
                          </button>
                          <button
                            type="button"
                            className={`fitModeToggleBtn ${current.customBgFit === "contain" ? "active" : ""}`}
                            onClick={() => updateCurrent({ customBgFit: "contain" })}
                          >
                            Contain
                          </button>
                          <button
                            type="button"
                            className={`fitModeToggleBtn ${current.customBgFit === "fill" ? "active" : ""}`}
                            onClick={() => updateCurrent({ customBgFit: "fill" })}
                          >
                            Fill
                          </button>
                        </div>
                      </label>

                      <div className="fieldRow">
                        <label className="fieldLabel">
                          <div className="sliderHeader">
                            <span>Wallpaper Opacity</span>
                            <span className="valueBadge">{current.customBgOpacity ?? 100}%</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="100"
                            value={current.customBgOpacity ?? 100}
                            onChange={(e) => updateCurrent({ customBgOpacity: Number(e.target.value) })}
                          />
                        </label>
                        <label className="fieldLabel">
                          <div className="sliderHeader">
                            <span>Scale / Zoom</span>
                            <span className="valueBadge">{current.customBgScale ?? 100}%</span>
                          </div>
                          <input
                            type="range"
                            min="50"
                            max="250"
                            value={current.customBgScale ?? 100}
                            onChange={(e) => updateCurrent({ customBgScale: Number(e.target.value) })}
                          />
                        </label>
                      </div>

                      <div className="fieldRow">
                        <label className="fieldLabel">
                          <div className="sliderHeader">
                            <span>Position X</span>
                            <span className="valueBadge">{current.customBgPositionX ?? 50}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={current.customBgPositionX ?? 50}
                            onChange={(e) => updateCurrent({ customBgPositionX: Number(e.target.value) })}
                          />
                        </label>
                        <label className="fieldLabel">
                          <div className="sliderHeader">
                            <span>Position Y</span>
                            <span className="valueBadge">{current.customBgPositionY ?? 50}%</span>
                          </div>
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
                      className="btn small primary full"
                      onClick={() => sectionBgInputRef.current?.click()}
                    >
                      🎨 Upload Section Wallpaper
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------------- */}
            {/* 4. VIDEO INSPECTOR                                                  */}
            {/* ------------------------------------------------------------------- */}
            {activeElementCategory === "video" && (
              <div className="inspectorSectionGroup">
                <div className="controlCard">
                  <span className="controlGroupTitle">🎥 Embedded Section Video</span>
                  {(current.video || current.memoryVideo) ? (
                    <>
                      <div className="miniMediaRow">
                        <span style={{ fontSize: "12px", color: "var(--text)" }}>
                          🎥 {current.videoName || "Section Video"}
                        </span>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            type="button"
                            className="btn small"
                            onClick={() => videoInputRef.current?.click()}
                          >
                            Replace
                          </button>
                          <button
                            type="button"
                            className="btn small danger"
                            onClick={() => updateCurrent({ video: "", memoryVideo: "", videoName: "" })}
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      <label className="fieldLabel">
                        Fit Mode
                        <div className="fitModeToggleGroup">
                          <button
                            type="button"
                            className={`fitModeToggleBtn ${(!current.videoFit || current.videoFit === "cover") ? "active" : ""}`}
                            onClick={() => updateCurrent({ videoFit: "cover" })}
                          >
                            Cover
                          </button>
                          <button
                            type="button"
                            className={`fitModeToggleBtn ${current.videoFit === "contain" ? "active" : ""}`}
                            onClick={() => updateCurrent({ videoFit: "contain" })}
                          >
                            Contain
                          </button>
                        </div>
                      </label>

                      <div className="fieldRow">
                        <label className="fieldLabel">
                          <div className="sliderHeader">
                            <span>Video Opacity</span>
                            <span className="valueBadge">{current.videoOpacity ?? 100}%</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="100"
                            value={current.videoOpacity ?? 100}
                            onChange={(e) => updateCurrent({ videoOpacity: Number(e.target.value) })}
                          />
                        </label>
                        <label className="fieldLabel">
                          <div className="sliderHeader">
                            <span>Scale / Zoom</span>
                            <span className="valueBadge">{current.videoScale ?? 100}%</span>
                          </div>
                          <input
                            type="range"
                            min="50"
                            max="150"
                            value={current.videoScale ?? 100}
                            onChange={(e) => updateCurrent({ videoScale: Number(e.target.value) })}
                          />
                        </label>
                      </div>

                      <div className="fieldRow">
                        <label className="fieldLabel">
                          <div className="sliderHeader">
                            <span>Position X</span>
                            <span className="valueBadge">{current.videoPositionX ?? 50}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={current.videoPositionX ?? 50}
                            onChange={(e) => updateCurrent({ videoPositionX: Number(e.target.value) })}
                          />
                        </label>
                        <label className="fieldLabel">
                          <div className="sliderHeader">
                            <span>Position Y</span>
                            <span className="valueBadge">{current.videoPositionY ?? 50}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={current.videoPositionY ?? 50}
                            onChange={(e) => updateCurrent({ videoPositionY: Number(e.target.value) })}
                          />
                        </label>
                      </div>

                      <label className="fieldLabel">
                        <div className="sliderHeader">
                          <span>Corner Radius</span>
                          <span className="valueBadge">{current.videoRadius ?? 16}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="40"
                          value={current.videoRadius ?? 16}
                          onChange={(e) => updateCurrent({ videoRadius: Number(e.target.value) })}
                        />
                      </label>
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
              </div>
            )}

            {/* ------------------------------------------------------------------- */}
            {/* 5. EMOJI INSPECTOR                                                  */}
            {/* ------------------------------------------------------------------- */}
            {activeElementCategory === "emoji" && (
              <div className="inspectorSectionGroup">
                <div className="controlCard">
                  <span className="controlGroupTitle">✨ Emoji & Icon Customization</span>
                  <label className="fieldLabel">
                    Section Emoji
                    <input
                      type="text"
                      value={current.emoji || "✨"}
                      onChange={(e) => updateCurrent({ emoji: e.target.value })}
                      style={{ fontSize: "20px", textAlign: "center", width: "60px" }}
                    />
                  </label>

                  <label className="fieldLabel">
                    <div className="sliderHeader">
                      <span>Emoji Size</span>
                      <span className="valueBadge">{current.emojiSize ?? 48}px</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="110"
                      value={current.emojiSize ?? 48}
                      onChange={(e) => updateCurrent({ emojiSize: Number(e.target.value) })}
                    />
                  </label>

                  <label className="fieldLabel">
                    Animation Effect
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
            )}

            {/* ------------------------------------------------------------------- */}
            {/* 6. CARDS & INTERACTIVE CONTENT INSPECTOR                            */}
            {/* ------------------------------------------------------------------- */}
            {activeElementCategory === "cards" && (
              <div className="inspectorSectionGroup">
                {/* REASONS SECTION */}
                {current.type === "reasons" && (
                  <div className="controlCard">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className="controlGroupTitle">💖 Reasons List</span>
                      <button
                        type="button"
                        className="btn small"
                        onClick={() => {
                          const reasons = current.items ? [...current.items] : [...reasonDefaults];
                          reasons.push({
                            id: uid(),
                            title: `Reason #${reasons.length + 1}`,
                            text: "Something you adore about them...",
                            emoji: "💖"
                          });
                          updateCurrent({ items: reasons });
                        }}
                      >
                        <Plus size={12} /> Add Reason
                      </button>
                    </div>

                    <div className="fieldRow" style={{ marginTop: "10px" }}>
                      <label className="fieldLabel">
                        Reason Title Color
                        <input
                          type="color"
                          value={current.reasonTitleColor || current.headingColor || globalTextColor}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateCurrent({ reasonTitleColor: val });
                            updateElementStyle("reasonTitle", { color: val });
                          }}
                        />
                      </label>
                      <label className="fieldLabel">
                        Reason Description Color
                        <input
                          type="color"
                          value={current.reasonTextColor || current.bodyColor || globalTextColor}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateCurrent({ reasonTextColor: val });
                            updateElementStyle("reasonText", { color: val });
                          }}
                        />
                      </label>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
                      {(current.items || reasonDefaults).map((r, i) => (
                        <div key={r.id || i} className="nestedItemCard">
                          <div className="nestedItemHeader">
                            <input
                              type="text"
                              className="nestedEmojiInput"
                              value={r.emoji || "💖"}
                              onChange={(e) => {
                                const reasons = current.items ? [...current.items] : [...reasonDefaults];
                                reasons[i] = { ...reasons[i], emoji: e.target.value };
                                updateCurrent({ items: reasons });
                              }}
                            />
                            <input
                              type="text"
                              className="nestedTitleInput"
                              value={r.title || ""}
                              onChange={(e) => {
                                const reasons = current.items ? [...current.items] : [...reasonDefaults];
                                reasons[i] = { ...reasons[i], title: e.target.value };
                                updateCurrent({ items: reasons });
                              }}
                              placeholder="Reason title"
                            />
                            <button
                              type="button"
                              className="dangerIconBtn"
                              onClick={() => {
                                const reasons = (current.items || reasonDefaults).filter((_, idx) => idx !== i);
                                updateCurrent({ items: reasons });
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                          <textarea
                            rows={2}
                            value={r.text || ""}
                            onChange={(e) => {
                              const reasons = current.items ? [...current.items] : [...reasonDefaults];
                              reasons[i] = { ...reasons[i], text: e.target.value };
                              updateCurrent({ items: reasons });
                            }}
                            placeholder="Why they are so special..."
                            style={{ width: "100%", fontSize: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--line)", borderRadius: "6px", color: "#fff", padding: "6px" }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* INCIDENTS SECTION */}
                {current.type === "incidents" && (
                  <div className="controlCard">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className="controlGroupTitle">📖 Story Incidents</span>
                      <button
                        type="button"
                        className="btn small"
                        onClick={() => {
                          const incidents = current.incidents ? [...current.incidents] : [...incidentDefaults];
                          incidents.push({
                            id: uid(),
                            title: "A Core Memory",
                            tag: `Story #${incidents.length + 1}`,
                            date: new Date().toISOString().split("T")[0],
                            text: "Write about this memorable moment...",
                            emoji: "✨"
                          });
                          updateCurrent({ incidents });
                        }}
                      >
                        <Plus size={12} /> Add Story
                      </button>
                    </div>

                    <div className="fieldRow" style={{ marginTop: "10px" }}>
                      <label className="fieldLabel">
                        Story Title Color
                        <input
                          type="color"
                          value={current.incidentTitleColor || current.headingColor || globalTextColor}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateCurrent({ incidentTitleColor: val });
                            updateElementStyle("incidentTitle", { color: val });
                          }}
                        />
                      </label>
                      <label className="fieldLabel">
                        Story Description Color
                        <input
                          type="color"
                          value={current.incidentTextColor || current.bodyColor || globalTextColor}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateCurrent({ incidentTextColor: val });
                            updateElementStyle("incidentText", { color: val });
                          }}
                        />
                      </label>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
                      {(current.incidents || incidentDefaults).map((inc, i) => (
                        <div key={inc.id || i} className="nestedItemCard">
                          <div className="nestedItemHeader">
                            <input
                              type="text"
                              className="nestedEmojiInput"
                              value={inc.emoji || "✨"}
                              onChange={(e) => {
                                const list = current.incidents ? [...current.incidents] : [...incidentDefaults];
                                list[i] = { ...list[i], emoji: e.target.value };
                                updateCurrent({ incidents: list });
                              }}
                            />
                            <input
                              type="text"
                              className="nestedTitleInput"
                              value={inc.title || ""}
                              onChange={(e) => {
                                const list = current.incidents ? [...current.incidents] : [...incidentDefaults];
                                list[i] = { ...list[i], title: e.target.value };
                                updateCurrent({ incidents: list });
                              }}
                              placeholder="Story Title"
                            />
                            <button
                              type="button"
                              className="dangerIconBtn"
                              onClick={() => {
                                const list = (current.incidents || incidentDefaults).filter((_, idx) => idx !== i);
                                updateCurrent({ incidents: list });
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                          <textarea
                            rows={2}
                            value={inc.text || ""}
                            onChange={(e) => {
                              const list = current.incidents ? [...current.incidents] : [...incidentDefaults];
                              list[i] = { ...list[i], text: e.target.value };
                              updateCurrent({ incidents: list });
                            }}
                            placeholder="What happened..."
                            style={{ width: "100%", fontSize: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--line)", borderRadius: "6px", color: "#fff", padding: "6px" }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CAKE FINALE SECTION */}
                {current.type === "cake" && (
                  <div className="controlCard">
                    <span className="controlGroupTitle">🎂 Cake Finale & Wish</span>
                    <label className="fieldLabel">
                      Post-Candle Message
                      <input
                        type="text"
                        value={current.subtitle || ""}
                        onChange={(e) => updateCurrent({ subtitle: e.target.value })}
                        placeholder="Happy Birthday once again!"
                      />
                    </label>
                    <label className="fieldLabel">
                      Wish Subtext
                      <textarea
                        rows={2}
                        value={current.text || ""}
                        onChange={(e) => updateCurrent({ text: e.target.value })}
                        placeholder="May your year be filled with immense joy..."
                      />
                    </label>
                    <div className="fieldRow">
                      <label className="fieldLabel">
                        Celebration Heading Color
                        <input
                          type="color"
                          value={current.cakeSubtitleColor || current.subtitleColor || "#ff9fc2"}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateCurrent({ cakeSubtitleColor: val });
                            updateElementStyle("cakeSubtitle", { color: val });
                          }}
                        />
                      </label>
                      <label className="fieldLabel">
                        Wish Subtext Color
                        <input
                          type="color"
                          value={current.cakeTextColor || current.bodyColor || globalTextColor}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateCurrent({ cakeTextColor: val });
                            updateElementStyle("cakeText", { color: val });
                          }}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* ======================================================================= */}
        {/* CENTER COLUMN: LIVE GREETING CANVAS VIEWPORT                            */}
        {/* ======================================================================= */}
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
                onSelectElement={handleSelectElement}
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

        {/* ======================================================================= */}
        {/* RIGHT COLUMN: GLOBAL DESIGN & STORY FLOW SIDEBAR                        */}
        {/* ======================================================================= */}
        <aside className={`studioRight ${mobileStoryFlowOpen ? "mobileOpen" : ""}`}>
          <div className="studioRightHeader">
            <div className="inspectorTabs">
              <button
                type="button"
                className={activeRightTab === "design" ? "active" : ""}
                onClick={() => setActiveRightTab("design")}
                title="Global themes, colors, wallpaper and fonts"
              >
                <Palette size={13} /> 🎨 Design & Theme
              </button>
              <button
                type="button"
                className={activeRightTab === "story" ? "active" : ""}
                onClick={() => setActiveRightTab("story")}
                title="Manage section sequence and story flow"
              >
                <Layers size={13} /> 📑 Story ({blocks.length})
              </button>
              <button
                type="button"
                className={activeRightTab === "select" ? "active" : ""}
                onClick={() => setActiveRightTab("select")}
                title="Jump directly to any section"
              >
                <Sliders size={13} /> ✏️ Quick Select
              </button>
            </div>
            {mobileStoryFlowOpen && (
              <button
                type="button"
                className="closeDrawerBtn"
                onClick={() => setMobileStoryFlowOpen(false)}
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="sidebarBody customScrollbar">
            {/* ------------------------------------------------------------------- */}
            {/* TAB 1: DESIGN & THEME                                               */}
            {/* ------------------------------------------------------------------- */}
            {activeRightTab === "design" && (
              <div className="inspectorSectionGroup">
                {/* Theme Preset Picker */}
                <div className="controlCard">
                  <span className="controlGroupTitle">🎨 Hanora Theme Presets</span>
                  <div className="themePresetGrid">
                    {[
                      { id: "dark", name: "Dark Velvet", cardColor: "#0b0810", accent: "#ff4f8b", accent2: "#ff9fc2", font: "serif" as FontName, textColor: "#fff7fb" },
                      { id: "romantic", name: "Rose Gold", cardColor: "#160914", accent: "#ff3d78", accent2: "#ff86b0", font: "great-vibes" as FontName, textColor: "#fff4f8" },
                      { id: "dreamy", name: "Twilight Glow", cardColor: "#0d1020", accent: "#9b7cff", accent2: "#cbbdff", font: "serif" as FontName, textColor: "#f7f5ff" },
                      { id: "system", name: "Midnight Sparkle", cardColor: "#101015", accent: "#e879a0", accent2: "#f4a6c0", font: "sans" as FontName, textColor: "#f8f7fb" },
                      { id: "light", name: "Minimalist Light", cardColor: "#fff7f4", accent: "#d34f75", accent2: "#a23d60", font: "sans" as FontName, textColor: "#2d2027" }
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        className={`themePresetButton ${theme === t.id ? "active" : ""}`}
                        onClick={() => {
                          setTheme(t.id);
                          setGlobalFont(t.font);
                          setGlobalTextColor(t.textColor || "#fff8fc");
                          setDraftStatus("unsaved");
                        }}
                      >
                        <div className="themePreviewSwatches">
                          <span style={{ background: t.cardColor }} />
                          <span style={{ background: t.accent }} />
                          <span style={{ background: t.accent2 }} />
                        </div>
                        <span>{t.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Card Background Mode */}
                <div className="controlCard">
                  <span className="controlGroupTitle">🎴 Card Background Style</span>
                  <label className="fieldLabel">
                    Background Mode
                    <select
                      value={cardBackgroundMode}
                      onChange={(e) => {
                        setCardBackgroundMode(e.target.value as "same" | "different");
                        setDraftStatus("unsaved");
                      }}
                    >
                      <option value="same">Same as Page Background (Clean Blend)</option>
                      <option value="different">Different Card Surface (Contrasting Glass)</option>
                    </select>
                  </label>
                  <label className="fieldLabel">
                    <div className="sliderHeader">
                      <span>Card Opacity</span>
                      <span className="valueBadge">{globalCardOpacity}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={globalCardOpacity}
                      onChange={(e) => setGlobalCardOpacity(Number(e.target.value))}
                    />
                  </label>
                  <label className="fieldLabel">
                    <div className="sliderHeader">
                      <span>Card Corner Radius</span>
                      <span className="valueBadge">{globalRadius}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      value={globalRadius}
                      onChange={(e) => setGlobalRadius(Number(e.target.value))}
                    />
                  </label>
                </div>

                {/* Background Effects & Particles */}
                <div className="controlCard">
                  <span className="controlGroupTitle">✨ Background Aura & Particles</span>
                  <label className="fieldLabel">
                    Aura Preset
                    <select
                      value={background}
                      onChange={(e) => {
                        setBackground(e.target.value);
                        setDraftStatus("unsaved");
                      }}
                    >
                      <option value="aurora">🌌 Aurora Borealis</option>
                      <option value="petals">🌸 Falling Rose Petals</option>
                      <option value="stars">✨ Cosmic Starfield</option>
                      <option value="minimal">🌑 Minimal Deep Glow</option>
                    </select>
                  </label>
                </div>

                {/* Global Typography */}
                <div className="controlCard">
                  <span className="controlGroupTitle">🔤 Global Typography & Colors</span>
                  <label className="fieldLabel">
                    Global Base Font
                    <select
                      value={globalFont}
                      onChange={(e) => {
                        setGlobalFont(e.target.value as FontName);
                        setDraftStatus("unsaved");
                      }}
                    >
                      {fontOptions}
                    </select>
                  </label>
                  <label className="fieldLabel">
                    Global Text Color
                    <input
                      type="color"
                      value={globalTextColor}
                      onChange={(e) => setGlobalTextColor(e.target.value)}
                    />
                  </label>
                </div>

                {/* Background Music Track */}
                <div className="controlCard">
                  <span className="controlGroupTitle">🎵 Background Song MP3</span>
                  {audioUrl ? (
                    <div className="miniMediaRow">
                      <span style={{ fontSize: "12px", color: "var(--text)" }}>
                        🎵 {audioName || "Song Track"}
                      </span>
                      <button
                        type="button"
                        className="btn small danger"
                        onClick={() => {
                          setAudioUrl("");
                          setAudioName("");
                          setDraftStatus("unsaved");
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
                          setReminderDate(d.toISOString().split("T")[0]);
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
            )}

            {/* ------------------------------------------------------------------- */}
            {/* TAB 2: STORY / SECTIONS SEQUENCE                                    */}
            {/* ------------------------------------------------------------------- */}
            {activeRightTab === "story" && (
              <div className="inspectorSectionGroup">
                <div className="controlCard">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span className="controlGroupTitle">📑 Story Structure & Flow</span>
                    <button
                      type="button"
                      className="btn small primary"
                      onClick={() => setAddSectionModalOpen(true)}
                    >
                      <Plus size={12} /> Add Section
                    </button>
                  </div>

                  <div className="storyFlowList">
                    {blocks.map((b, idx) => (
                      <div
                        key={b.id}
                        className={`storyFlowCard ${selected === idx ? "active" : ""} ${b.visible === false ? "hiddenCard" : ""}`}
                        onClick={() => {
                          setSelected(idx);
                          setScene(idx);
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
                            title="Move Up"
                            disabled={idx === 0}
                            onClick={() => moveBlock(idx, "up")}
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            type="button"
                            title="Move Down"
                            disabled={idx === blocks.length - 1}
                            onClick={() => moveBlock(idx, "down")}
                          >
                            <ArrowDown size={12} />
                          </button>
                          <button
                            type="button"
                            title={b.visible !== false ? "Hide Section" : "Show Section"}
                            onClick={() => toggleVisible(idx)}
                          >
                            {b.visible !== false ? <Eye size={12} /> : <EyeOff size={12} />}
                          </button>
                          <button
                            type="button"
                            title="Duplicate"
                            onClick={() => duplicateBlock(idx)}
                          >
                            <Copy size={12} />
                          </button>
                          <button
                            type="button"
                            className="dangerBtn"
                            title="Delete"
                            disabled={blocks.length <= 1}
                            onClick={() => removeBlock(idx)}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------------- */}
            {/* TAB 3: QUICK SELECT SECTION                                         */}
            {/* ------------------------------------------------------------------- */}
            {activeRightTab === "select" && (
              <div className="inspectorSectionGroup">
                <div className="controlCard">
                  <span className="controlGroupTitle">✏️ Jump to Section</span>
                  <div className="storyFlowList">
                    {blocks.map((b, idx) => (
                      <div
                        key={b.id}
                        className={`storyFlowCard ${selected === idx ? "active" : ""}`}
                        onClick={() => {
                          setSelected(idx);
                          setScene(idx);
                        }}
                      >
                        <span className="cardSeqNum">{idx + 1}</span>
                        <span className="cardEmoji">{b.emoji || "✨"}</span>
                        <div className="cardInfo">
                          <span className="cardTitle">{b.title}</span>
                          <span className="cardTypeBadge">{b.type}</span>
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
              setActiveElementCategory("photo");
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
            <ImageIcon size={14} />
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
              setActiveElementCategory("video");
              if (current.type === "secret") {
                secretVideoInputRef.current?.click();
              } else {
                videoInputRef.current?.click();
              }
            }}
            title="Upload video for selected section (up to 50 MB, max 3)"
          >
            <Video size={14} />
            <span>Video (50 MB)</span>
          </button>

          <button
            type="button"
            className="mediaActionBtn"
            onClick={() => {
              setActiveRightTab("design");
              audioInputRef.current?.click();
            }}
            title="Upload background song (up to 20 MB)"
          >
            <Music2 size={14} />
            <span>Audio (20 MB)</span>
          </button>

          <button
            type="button"
            className="mediaActionBtn"
            onClick={() => {
              setActiveElementCategory("wallpaper");
              sectionBgInputRef.current?.click();
            }}
            title="Upload custom section wallpaper"
          >
            <Palette size={14} />
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
