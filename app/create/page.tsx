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
import PhotoCropModal from "@/components/PhotoCropModal";
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
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Crop,
  ExternalLink,
  Eye,
  EyeOff,
  FolderOpen,
  GripVertical,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  Lock,
  Unlock,
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
  Sun,
  Moon,
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
  const [activeRightTab, setActiveRightTab] = useState<"design" | "story">("design");

  // Left Detailed Inspector element category state
  const [activeElementCategory, setActiveElementCategory] = useState<"text" | "photo" | "wallpaper" | "video" | "emoji" | "cards">("text");
  const [activeTextRole, setActiveTextRole] = useState<"heading" | "subtitle" | "kicker" | "body" | "letter" | "buttons" | "reasonTitle" | "incidentTitle" | "secretText" | "cakeText">("heading");
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState<number>(0);
  const [selectedReasonIdx, setSelectedReasonIdx] = useState<number>(0);
  const [cardEditScope, setCardEditScope] = useState<"selected" | "all">("selected");
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
  const [positionsLocked, setPositionsLocked] = useState(false);

  // Overall Website Theme Mode (Light/Bright Baby Pink vs Dark)
  const [websiteTheme, setWebsiteTheme] = useState<"dark" | "bright">("bright");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("hamora-website-theme");
      if (saved === "dark") {
        setWebsiteTheme("dark");
        document.documentElement.setAttribute("data-website-theme", "dark");
      } else {
        setWebsiteTheme("bright");
        document.documentElement.setAttribute("data-website-theme", "bright");
      }
    }
  }, []);

  function setWebsiteThemeMode(mode: "dark" | "bright") {
    setWebsiteTheme(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("hamora-website-theme", mode);
      document.documentElement.setAttribute("data-website-theme", mode);
    }
    setToast(mode === "bright" ? "Switched website to Baby Pink Mode! 🌸" : "Switched website to Dark Mode! 🌙");
  }

  function toggleWebsiteTheme() {
    setWebsiteThemeMode(websiteTheme === "bright" ? "dark" : "bright");
  }

  // Custom colors
  const [backgroundBaseColor, setBackgroundBaseColor] = useState("#100917");
  const [bgColor1, setBgColor1] = useState("#ff4f8b");
  const [bgColor2, setBgColor2] = useState("#7c5cff");
  const [bgColor3, setBgColor3] = useState("#38bdf8");
  const [bgColor4, setBgColor4] = useState("#f59e0b");
  const [bgColor5, setBgColor5] = useState("#10b981");
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
  const [momentTitle, setMomentTitle] = useState("A Hamora moment");
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
  const [mobileDrawerHeight, setMobileDrawerHeight] = useState<"half" | "full">("half");
  const [addSectionModalOpen, setAddSectionModalOpen] = useState(false);
  const [draggedStoryIdx, setDraggedStoryIdx] = useState<number | null>(null);
  const [dragOverStoryIdx, setDragOverStoryIdx] = useState<number | null>(null);
  const [toast, setToast] = useState("");

  // Publish / Share Modal
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishedLink, setPublishedLink] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  // Photo Crop Modal State
  const [cropModalData, setCropModalData] = useState<{
    isOpen: boolean;
    imageSrc: string;
    photoTitle: string;
    photoKey: string;
    initialAdjustment?: ImageAdjustment;
  }>({
    isOpen: false,
    imageSrc: "",
    photoTitle: "",
    photoKey: ""
  });

  const handleSaveCrop = (adjustment: ImageAdjustment) => {
    const adjustments = { ...(current.imageAdjustments || {}) };
    adjustments[cropModalData.photoKey] = adjustment;
    if (cropModalData.photoKey === "0" || cropModalData.photoKey === "hero") {
      adjustments["0"] = adjustment;
      adjustments["hero"] = adjustment;
    }
    updateCurrent({
      imageAdjustments: adjustments,
      imageFit: adjustment.fit || "cover"
    });
    setToast("Photo crop & framing saved! ✂️");
  };

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
      bgColor5,
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

  const memoizedProject = useMemo(() => projectData(), [
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
    bgColor5,
    backgroundOverlay,
    targetEventDate,
    reminderDate,
    targetEventTitle,
    momentTitle,
    blocks
  ]);

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
    if (role === "subtitle") {
      updatedStyles["eyebrow"] = { ...(currentStyles["eyebrow"] || {}), ...patch };
    } else if (role === "eyebrow") {
      updatedStyles["subtitle"] = { ...(currentStyles["subtitle"] || {}), ...patch };
    } else if (role === "kicker") {
      updatedStyles["title"] = { ...(currentStyles["title"] || {}), ...patch };
    } else if (role === "title") {
      updatedStyles["kicker"] = { ...(currentStyles["kicker"] || {}), ...patch };
    } else if (role === "heading") {
      updatedStyles["letterHeading"] = { ...(currentStyles["letterHeading"] || {}), ...patch };
    } else if (role === "letterHeading") {
      updatedStyles["heading"] = { ...(currentStyles["heading"] || {}), ...patch };
    } else if (role === "letter") {
      updatedStyles["letterBody"] = { ...(currentStyles["letterBody"] || {}), ...patch };
    } else if (role === "letterBody") {
      updatedStyles["letter"] = { ...(currentStyles["letter"] || {}), ...patch };
    } else if (role === "body") {
      updatedStyles["text"] = { ...(currentStyles["text"] || {}), ...patch };
    } else if (role === "text") {
      updatedStyles["body"] = { ...(currentStyles["body"] || {}), ...patch };
    } else if (role === "secretText") {
      updatedStyles["secretMessage"] = { ...(currentStyles["secretMessage"] || {}), ...patch };
      updatedStyles["secret"] = { ...(currentStyles["secret"] || {}), ...patch };
    } else if (role === "secretMessage") {
      updatedStyles["secretText"] = { ...(currentStyles["secretText"] || {}), ...patch };
      updatedStyles["secret"] = { ...(currentStyles["secret"] || {}), ...patch };
    } else if (role === "secret") {
      updatedStyles["secretText"] = { ...(currentStyles["secretText"] || {}), ...patch };
      updatedStyles["secretMessage"] = { ...(currentStyles["secretMessage"] || {}), ...patch };
    }
    updateCurrent({ textStyles: updatedStyles });
  }

  function getRoleStyle(role: string): ElementTextStyle {
    return (
      current.textStyles?.[role] ||
      (role === "secretText" ? current.textStyles?.["secretMessage"] || current.textStyles?.["secret"] : undefined) ||
      (role === "secretMessage" ? current.textStyles?.["secretText"] || current.textStyles?.["secret"] : undefined) ||
      (role === "secret" ? current.textStyles?.["secretMessage"] || current.textStyles?.["secretText"] : undefined) ||
      (role === "subtitle" ? current.textStyles?.["eyebrow"] : undefined) ||
      (role === "eyebrow" ? current.textStyles?.["subtitle"] : undefined) ||
      (role === "title" ? current.textStyles?.["kicker"] : undefined) ||
      (role === "kicker" ? current.textStyles?.["title"] : undefined) ||
      (role === "heading" ? current.textStyles?.["letterHeading"] : undefined) ||
      (role === "letterHeading" ? current.textStyles?.["heading"] : undefined) ||
      (role === "letter" ? current.textStyles?.["letterBody"] : undefined) ||
      (role === "letterBody" ? current.textStyles?.["letter"] : undefined) ||
      (role === "body" ? current.textStyles?.["text"] : undefined) ||
      (role === "text" ? current.textStyles?.["body"] : undefined) ||
      {}
    );
  }

  // Direct click-to-edit selection handler from GreetingView
  function handleSelectElement(sectionId: string, elementKey: string, extraIndex?: number) {
    const idx = blocks.findIndex((b) => b.id === sectionId);
    if (idx >= 0) {
      setSelected(idx);
      setScene(idx);
    }
    if (
      elementKey === "heading" ||
      elementKey === "letterHeading" ||
      elementKey === "subtitle" ||
      elementKey === "eyebrow" ||
      elementKey === "kicker" ||
      elementKey === "title" ||
      elementKey === "body" ||
      elementKey === "letter"
    ) {
      setActiveElementCategory("text");
      const normalizedRole =
        elementKey === "letterHeading"
          ? "heading"
          : elementKey === "eyebrow"
          ? "subtitle"
          : elementKey === "title"
          ? "kicker"
          : (elementKey as any);
      setActiveTextRole(normalizedRole);
      if (inspectorBodyRef.current) {
        inspectorBodyRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else if (elementKey === "reasons") {
      setActiveElementCategory("cards");
      setCardEditScope("selected");
      if (typeof extraIndex === "number") {
        setSelectedReasonIdx(extraIndex);
        setTimeout(() => {
          const el = document.getElementById(`reason-item-editor-${extraIndex}`);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 120);
      }
    } else if (elementKey === "incidents") {
      setActiveElementCategory("cards");
      setActiveTextRole("incidentTitle");
      if (typeof extraIndex === "number") {
        setActiveIncidentIdx(extraIndex);
        setTimeout(() => {
          const el = document.getElementById(`incident-item-editor-${extraIndex}`);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 120);
      }
    } else if (
      elementKey === "secret" ||
      elementKey === "secretMessage" ||
      elementKey === "secretRevealText" ||
      elementKey === "secretText"
    ) {
      setActiveElementCategory("text");
      setActiveTextRole("secretText");
      if (previewDevice === "mobile" || (typeof window !== "undefined" && window.innerWidth <= 850)) {
        setMobileEditOpen(true);
      }
      setTimeout(() => {
        const el = (document.getElementById("secret-reveal-textarea") || document.getElementById("secret-reveal-textarea-cards")) as HTMLTextAreaElement | null;
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.focus();
          el.select();
        }
      }, 100);
    } else if (
      elementKey === "cake" ||
      elementKey === "cakeEmoji" ||
      elementKey === "cakeCelebrationEmoji" ||
      elementKey === "cakeSubtitle" ||
      elementKey === "cakeText" ||
      elementKey === "candles"
    ) {
      setActiveElementCategory("cards");
      setActiveTextRole("cakeText");
      setTimeout(() => {
        const el = document.getElementById("cake-customizer-panel");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 80);
    } else if (elementKey === "buttons" || elementKey === "button" || elementKey === "backButton" || elementKey === "keepGoingButton") {
      setActiveElementCategory("text");
      setActiveTextRole("buttons");
    } else if (elementKey === "photo") {
      setActiveElementCategory("photo");
      if (typeof extraIndex === "number") {
        setSelectedPhotoIdx(extraIndex);
      }
      const targetBlock = blocks.find((b) => b.id === sectionId);
      const hasPhotos = (Array.isArray(targetBlock?.images) && targetBlock.images.length > 0) || Boolean(targetBlock?.image);
      if (!hasPhotos) {
        setReplacePhotoIndex(null);
        setTimeout(() => {
          heroPhotoInputRef.current?.click();
        }, 50);
      }
    } else if (elementKey === "wallpaper") {
      setActiveElementCategory("wallpaper");
    } else if (elementKey === "video") {
      setActiveElementCategory("video");
    } else if (elementKey === "emoji") {
      setActiveElementCategory("emoji");
    }
    if (previewDevice === "mobile" || (typeof window !== "undefined" && window.innerWidth <= 850)) {
      setMobileEditOpen(true);
    }
  }

  function selectSection(idx: number) {
    if (idx < 0 || idx >= blocks.length) return;
    setSelected(idx);
    setScene(idx);
    const target = blocks[idx];
    if (target) {
      if (target.type === "reasons") {
        setActiveElementCategory("cards");
        setActiveTextRole("reasonTitle");
      } else if (target.type === "incidents") {
        setActiveElementCategory("cards");
        setActiveTextRole("incidentTitle");
      } else if (target.type === "letter") {
        setActiveElementCategory("text");
        setActiveTextRole("letter");
      } else if (target.type === "cake") {
        setActiveElementCategory("cards");
        setActiveTextRole("cakeText");
      } else if (target.type === "secret") {
        setActiveElementCategory("cards");
        setActiveTextRole("secretText");
      } else if (target.type === "memories" || target.type === "gallery") {
        setActiveElementCategory("photo");
      } else {
        setActiveElementCategory("text");
        setActiveTextRole("heading");
      }
    }
    if (previewDevice === "mobile") {
      setMobileEditOpen(true);
    }
  }

  function handleSelectSectionById(blockId: string) {
    const idx = blocks.findIndex((b) => b.id === blockId);
    if (idx >= 0) {
      selectSection(idx);
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
    selectSection(toIndex);
    setDraftStatus("unsaved");
  }

  function handleStoryReorder(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= blocks.length || toIndex >= blocks.length) return;
    const copy = [...blocks];
    const [moved] = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, moved);
    setBlocks(copy);
    selectSection(toIndex);
    setDraftStatus("unsaved");
    setToast(`Reordered section to step ${toIndex + 1} 📑`);
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
    selectSection(idx + 1);
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
      incidents: "Memory Story",
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
      subtitle: type === "incidents" ? "Memories Together" : "A moment together",
      heading: type === "letter" ? "A little letter" : type === "cake" ? "Make a Wish" : type === "incidents" ? "Our Memory Story" : "Happy Birthday",
      text: type === "secret" ? "I have a little secret to share with you..." : type === "incidents" ? "Every special moment, milestone, and cherished memory we have shared together." : "Write something from the heart here.",
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

  // Specific Upload Triggers (Full Multi-Photo Upload Support)
  async function uploadHeroPhoto(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setMediaUploading(true);
    const uploadedUrls: string[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (files.length > 1) {
          setUploadProgressMsg(`Uploading photo ${i + 1} of ${files.length} (${(file.size / (1024 * 1024)).toFixed(1)} MB)...`);
        }
        const result = await handleMediaUpload(file, "image");
        if (result) {
          const url = result.previewUrl || result.media;
          if (url) uploadedUrls.push(url);
        }
      }

      if (uploadedUrls.length > 0) {
        const curImgs = Array.isArray(current.images) && current.images.length > 0 ? [...current.images] : current.image ? [current.image] : [];
        if (replacePhotoIndex !== null && replacePhotoIndex >= 0 && replacePhotoIndex < curImgs.length) {
          curImgs[replacePhotoIndex] = uploadedUrls[0];
          if (uploadedUrls.length > 1) {
            curImgs.push(...uploadedUrls.slice(1));
          }
        } else {
          curImgs.push(...uploadedUrls);
          setSelectedPhotoIdx(curImgs.length - 1);
        }

        updateCurrent({
          images: curImgs,
          image: curImgs[0] || ""
        });
        setReplacePhotoIndex(null);
        setActiveElementCategory("photo");
        setDraftStatus("unsaved");
        setToast(`Added ${uploadedUrls.length} photo${uploadedUrls.length > 1 ? "s" : ""}! 📸✨`);
      }
    } finally {
      setMediaUploading(false);
      setUploadProgressMsg("");
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
    await uploadHeroPhoto(e);
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
      setBgColor5(p.bgColor5 || "#10b981");
      setBackgroundOverlay(p.backgroundOverlay ?? 18);
      setTargetEventDate(p.targetEventDate || "");
      setReminderDate(p.reminderDate || "");
      setTargetEventTitle(p.targetEventTitle || "");
    }
    setMomentTitle(d.title || "A Hamora moment");
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
    <main className={`studioRoot theme-${theme} motion-${globalMotion} ${websiteTheme === "bright" ? "bright-theme" : ""}`}>
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
      <input ref={heroPhotoInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={uploadHeroPhoto} />
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
            <span style={{ fontFamily: "'Geraldine', 'Symphonie Calligraphy', 'Symphonie', 'Great Vibes', cursive", letterSpacing: "0.02em" }}>
              Hamora<span style={{ color: "var(--accent)" }}>•</span>
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

          {/* Website Theme Toggle (Baby Pink / Dark Mode) */}
          <button
            type="button"
            className="btn small ghost"
            onClick={toggleWebsiteTheme}
            title={websiteTheme === "bright" ? "Switch website to Dark Mode" : "Switch website to Baby Pink Mode"}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            {websiteTheme === "bright" ? (
              <>
                <Moon size={14} style={{ color: "#7c5cff" }} /> <span>Dark Site</span>
              </>
            ) : (
              <>
                <span style={{ fontSize: "13px" }}>🌸</span> <span>Baby Pink Site</span>
              </>
            )}
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
            className="btn small primary generateLinkBtn glowingSweep actionBtnLinkPulse"
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
      {/* MOBILE TOP BAR (COMPLETE FEATURE PARITY)                                  */}
      {/* ========================================================================= */}
      <div className="studioMobileHeader">
        <div className="mobileHeaderTop">
          <Link href="/" className="mobileLogo" style={{ fontFamily: "'Geraldine', 'Symphonie Calligraphy', 'Symphonie', 'Great Vibes', cursive", letterSpacing: "0.02em" }}>
            Hamora<span style={{ color: "var(--accent)" }}>•</span>
          </Link>

          <div className="mobileTitleWrapper">
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

          <button
            type="button"
            className="mobileHeaderIconBtn"
            onClick={toggleWebsiteTheme}
            title={websiteTheme === "bright" ? "Dark Mode" : "Baby Pink Mode"}
          >
            {websiteTheme === "bright" ? <Moon size={15} style={{ color: "#7c5cff" }} /> : <span>🌸</span>}
          </button>

          <button
            type="button"
            className="mobileHeaderCtaBtn glowingSweep actionBtnLinkPulse"
            onClick={() => {
              setPublishOpen(true);
              publishGreeting();
            }}
          >
            <Lock size={13} /> Link
          </button>
        </div>

        <div className="mobileHeaderSub">
          <div className="mobileDraftStatus">
            {draftStatus === "saving" && <span className="saving">● Saving...</span>}
            {draftStatus === "saved" && <span className="saved">● Saved</span>}
            {draftStatus === "unsaved" && <span className="unsaved">● Unsaved</span>}
          </div>

          <div className="mobileQuickActions">
            <button
              type="button"
              className="mobileSubBtn"
              onClick={saveDraft}
              title="Save draft"
            >
              <Save size={13} /> Save
            </button>
            <button
              type="button"
              className="mobileSubBtn"
              onClick={() => {
                loadDraftsList();
                setDraftsModalOpen(true);
              }}
              title="Open drafts"
            >
              <FolderOpen size={13} /> Drafts
            </button>
            <button
              type="button"
              className={`mobileSubBtn ${positionsLocked ? "active" : ""}`}
              onClick={() => setPositionsLocked(!positionsLocked)}
              title={positionsLocked ? "Unlock positions" : "Lock positions"}
            >
              {positionsLocked ? <Lock size={13} /> : <Unlock size={13} />} {positionsLocked ? "Locked" : "Lock"}
            </button>
            <button
              type="button"
              className={`mobileSubBtn ${previewOnly ? "active" : ""}`}
              onClick={() => setPreviewOnly(!previewOnly)}
              title={previewOnly ? "Edit Studio" : "Preview"}
            >
              <Eye size={13} /> {previewOnly ? "Edit" : "Preview"}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3-COLUMN CREATOR STUDIO (DESKTOP & RESPONSIVE WORKSPACE)                   */}
      {/* ========================================================================= */}
      <div className={`studioGrid ${previewOnly ? "previewOnlyMode" : ""}`}>
        {/* ======================================================================= */}
        {/* LEFT COLUMN: DETAILED ELEMENT INSPECTOR                                  */}
        {/* ======================================================================= */}
        <aside className={`studioLeft ${mobileEditOpen ? "mobileOpen" : ""} drawer-${mobileDrawerHeight}`}>
          {mobileEditOpen && (
            <div
              className="drawerGrabHandle"
              onClick={() => setMobileDrawerHeight((prev) => (prev === "half" ? "full" : "half"))}
              title="Tap to toggle drawer size"
            >
              <div className="grabBar" />
            </div>
          )}
          <div className="studioLeftHeader">
            <div className="elementInspectorTitle">
              {current.emoji ? <span>{current.emoji}</span> : null}
              <span>{current.title || `Section ${selected + 1}`}</span>
              <span className="elementInspectorBadge">{current.type}</span>
            </div>
            {mobileEditOpen && (
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <button
                  type="button"
                  className="drawerSizeToggleBtn"
                  onClick={() => setMobileDrawerHeight((prev) => (prev === "half" ? "full" : "half"))}
                  title={mobileDrawerHeight === "half" ? "Expand panel" : "Minimize panel"}
                >
                  {mobileDrawerHeight === "half" ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
                </button>
                <button
                  type="button"
                  className="closeDrawerBtn"
                  onClick={() => setMobileEditOpen(false)}
                  title="Close panel"
                >
                  <X size={16} />
                </button>
              </div>
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
                <Sliders size={12} /> {current.type === "incidents" ? "Memories" : "Cards"}
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
                  {current.type === "reasons" && (
                    <button
                      type="button"
                      className={`photoSubTabBtn ${activeTextRole === "reasonTitle" ? "active" : ""}`}
                      onClick={() => setActiveTextRole("reasonTitle")}
                    >
                      💖 Reason Cards
                    </button>
                  )}
                  <button
                    type="button"
                    className={`photoSubTabBtn ${activeTextRole === "body" ? "active" : ""}`}
                    onClick={() => setActiveTextRole("body")}
                  >
                    📝 Description
                  </button>
                  <button
                    type="button"
                    className={`photoSubTabBtn ${activeTextRole === "heading" ? "active" : ""}`}
                    onClick={() => setActiveTextRole("heading")}
                  >
                    👑 Heading
                  </button>
                  <button
                    type="button"
                    className={`photoSubTabBtn ${activeTextRole === "subtitle" ? "active" : ""}`}
                    onClick={() => setActiveTextRole("subtitle")}
                  >
                    ✨ Subtitle
                  </button>
                  <button
                    type="button"
                    className={`photoSubTabBtn ${activeTextRole === "kicker" ? "active" : ""}`}
                    onClick={() => setActiveTextRole("kicker")}
                  >
                    🏷️ Top Tag
                  </button>
                  {current.type === "letter" && (
                    <button
                      type="button"
                      className={`photoSubTabBtn ${activeTextRole === "letter" ? "active" : ""}`}
                      onClick={() => setActiveTextRole("letter")}
                    >
                      💌 Letter
                    </button>
                  )}
                  <button
                    type="button"
                    className={`photoSubTabBtn ${activeTextRole === "buttons" ? "active" : ""}`}
                    onClick={() => setActiveTextRole("buttons")}
                  >
                    🔘 Buttons
                  </button>
                  {current.type === "incidents" && (
                    <button
                      type="button"
                      className={`photoSubTabBtn ${activeTextRole === "incidentTitle" ? "active" : ""}`}
                      onClick={() => setActiveTextRole("incidentTitle")}
                    >
                      📖 Stories
                    </button>
                  )}
                  {current.type === "secret" && (
                    <button
                      type="button"
                      className={`photoSubTabBtn ${activeTextRole === "secretText" ? "active" : ""}`}
                      onClick={() => setActiveTextRole("secretText")}
                    >
                      🔒 Secret
                    </button>
                  )}
                  {current.type === "cake" && (
                    <button
                      type="button"
                      className={`photoSubTabBtn ${activeTextRole === "cakeText" ? "active" : ""}`}
                      onClick={() => setActiveTextRole("cakeText")}
                    >
                      🎂 Cake Wish
                    </button>
                  )}
                </div>

                {current.type === "reasons" && activeTextRole !== "reasonTitle" && (
                  <div className="controlCard" style={{ background: "rgba(255, 79, 139, 0.08)", border: "1px dashed var(--accent, #ff4f8b)", marginBottom: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: "13px", color: "var(--accent, #ff4f8b)", display: "block" }}>
                          💖 Reason Cards & Text Controls
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                          Wording opacity, emoji opacity, card background opacity & text sizes
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn small primary"
                        onClick={() => setActiveTextRole("reasonTitle")}
                        style={{ fontSize: "11px", padding: "4px 8px" }}
                      >
                        Open Controls →
                      </button>
                    </div>
                  </div>
                )}

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
                    <div className="elementPositionLockRow">
                      <div className="positionCoordinatesBadge">
                        <span>Pos: {Math.round(getRoleStyle("heading").offsetX ?? 0)}px, {Math.round(getRoleStyle("heading").offsetY ?? 0)}px</span>
                      </div>
                      <div className="positionLockActionGroup">
                        <button
                          type="button"
                          className={`btn small ${getRoleStyle("heading").locked ? "lockedActionBtn" : "ghost"}`}
                          onClick={() => {
                            const nextLocked = !getRoleStyle("heading").locked;
                            updateElementStyle("heading", { locked: nextLocked });
                            setToast(nextLocked ? "🔒 Heading position locked" : "🔓 Heading position unlocked");
                          }}
                          title={getRoleStyle("heading").locked ? "Position is locked against dragging" : "Click to lock heading position"}
                        >
                          {getRoleStyle("heading").locked ? (
                            <>
                              <Lock size={12} /> <span>Locked</span>
                            </>
                          ) : (
                            <>
                              <Unlock size={12} /> <span>Lock</span>
                            </>
                          )}
                        </button>
                        {((getRoleStyle("heading").offsetX ?? 0) !== 0 || (getRoleStyle("heading").offsetY ?? 0) !== 0) && (
                          <button
                            type="button"
                            className="btn small ghost"
                            onClick={() => updateElementStyle("heading", { offsetX: 0, offsetY: 0 })}
                            title="Reset position to center"
                          >
                            ↺ Reset
                          </button>
                        )}
                      </div>
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
                    <div className="elementPositionLockRow">
                      <div className="positionCoordinatesBadge">
                        <span>Pos: {Math.round(getRoleStyle("subtitle").offsetX ?? 0)}px, {Math.round(getRoleStyle("subtitle").offsetY ?? 0)}px</span>
                      </div>
                      <div className="positionLockActionGroup">
                        <button
                          type="button"
                          className={`btn small ${getRoleStyle("subtitle").locked ? "lockedActionBtn" : "ghost"}`}
                          onClick={() => {
                            const nextLocked = !getRoleStyle("subtitle").locked;
                            updateElementStyle("subtitle", { locked: nextLocked });
                            updateElementStyle("eyebrow", { locked: nextLocked });
                            setToast(nextLocked ? "🔒 Subtitle position locked" : "🔓 Subtitle position unlocked");
                          }}
                          title={getRoleStyle("subtitle").locked ? "Position is locked against dragging" : "Click to lock subtitle position"}
                        >
                          {getRoleStyle("subtitle").locked ? (
                            <>
                              <Lock size={12} /> <span>Locked</span>
                            </>
                          ) : (
                            <>
                              <Unlock size={12} /> <span>Lock</span>
                            </>
                          )}
                        </button>
                        {((getRoleStyle("subtitle").offsetX ?? 0) !== 0 || (getRoleStyle("subtitle").offsetY ?? 0) !== 0) && (
                          <button
                            type="button"
                            className="btn small ghost"
                            onClick={() => {
                              updateElementStyle("subtitle", { offsetX: 0, offsetY: 0 });
                              updateElementStyle("eyebrow", { offsetX: 0, offsetY: 0 });
                            }}
                            title="Reset position to center"
                          >
                            ↺ Reset
                          </button>
                        )}
                      </div>
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
                    <div className="elementPositionLockRow">
                      <div className="positionCoordinatesBadge">
                        <span>Pos: {Math.round(getRoleStyle("kicker").offsetX ?? 0)}px, {Math.round(getRoleStyle("kicker").offsetY ?? 0)}px</span>
                      </div>
                      <div className="positionLockActionGroup">
                        <button
                          type="button"
                          className={`btn small ${getRoleStyle("kicker").locked ? "lockedActionBtn" : "ghost"}`}
                          onClick={() => {
                            const nextLocked = !getRoleStyle("kicker").locked;
                            updateElementStyle("kicker", { locked: nextLocked });
                            updateElementStyle("title", { locked: nextLocked });
                            setToast(nextLocked ? "🔒 Kicker position locked" : "🔓 Kicker position unlocked");
                          }}
                          title={getRoleStyle("kicker").locked ? "Position is locked against dragging" : "Click to lock kicker position"}
                        >
                          {getRoleStyle("kicker").locked ? (
                            <>
                              <Lock size={12} /> <span>Locked</span>
                            </>
                          ) : (
                            <>
                              <Unlock size={12} /> <span>Lock</span>
                            </>
                          )}
                        </button>
                        {((getRoleStyle("kicker").offsetX ?? 0) !== 0 || (getRoleStyle("kicker").offsetY ?? 0) !== 0) && (
                          <button
                            type="button"
                            className="btn small ghost"
                            onClick={() => {
                              updateElementStyle("kicker", { offsetX: 0, offsetY: 0 });
                              updateElementStyle("title", { offsetX: 0, offsetY: 0 });
                            }}
                            title="Reset position to center"
                          >
                            ↺ Reset
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ACTIVE ROLE: BODY / DESCRIPTION */}
                {activeTextRole === "body" && (
                  <div className="controlCard">
                    <span className="controlGroupTitle">📝 Description / Heartfelt Message</span>
                    <p style={{ fontSize: "11px", color: "var(--muted)", margin: "2px 0 10px 0" }}>
                      This is the main description and heartfelt story message displayed on this section.
                    </p>
                    <label className="fieldLabel">
                      Description / Message Text
                      <textarea
                        rows={4}
                        value={current.text || ""}
                        onChange={(e) => updateCurrent({ text: e.target.value })}
                        placeholder="Write your personal message, heartfelt memories, or warm wishes here..."
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
                    <div className="elementPositionLockRow">
                      <div className="positionCoordinatesBadge">
                        <span>Pos: {Math.round(getRoleStyle("body").offsetX ?? 0)}px, {Math.round(getRoleStyle("body").offsetY ?? 0)}px</span>
                      </div>
                      <div className="positionLockActionGroup">
                        <button
                          type="button"
                          className={`btn small ${getRoleStyle("body").locked ? "lockedActionBtn" : "ghost"}`}
                          onClick={() => {
                            const nextLocked = !getRoleStyle("body").locked;
                            updateElementStyle("body", { locked: nextLocked });
                            updateElementStyle("text", { locked: nextLocked });
                            setToast(nextLocked ? "🔒 Body text position locked" : "🔓 Body text position unlocked");
                          }}
                          title={getRoleStyle("body").locked ? "Position is locked against dragging" : "Click to lock body position"}
                        >
                          {getRoleStyle("body").locked ? (
                            <>
                              <Lock size={12} /> <span>Locked</span>
                            </>
                          ) : (
                            <>
                              <Unlock size={12} /> <span>Lock</span>
                            </>
                          )}
                        </button>
                        {((getRoleStyle("body").offsetX ?? 0) !== 0 || (getRoleStyle("body").offsetY ?? 0) !== 0) && (
                          <button
                            type="button"
                            className="btn small ghost"
                            onClick={() => {
                              updateElementStyle("body", { offsetX: 0, offsetY: 0 });
                              updateElementStyle("text", { offsetX: 0, offsetY: 0 });
                            }}
                            title="Reset position to center"
                          >
                            ↺ Reset
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ACTIVE ROLE: LETTER */}
                {activeTextRole === "letter" && (
                  <div className="controlCard">
                    <span className="controlGroupTitle">💌 Personal Letter Content</span>
                    <label className="fieldLabel">
                      Letter Message (Multiline)
                      <textarea
                        rows={8}
                        value={current.text ?? ""}
                        onChange={(e) => {
                          updateCurrent({ text: e.target.value });
                          setDraftStatus("unsaved");
                        }}
                        placeholder="Write your personal letter here... Write anything from your heart ❤️"
                        style={{
                          width: "100%",
                          minHeight: "160px",
                          padding: "12px",
                          borderRadius: "10px",
                          fontSize: "14px",
                          lineHeight: "1.6",
                          fontFamily: "inherit",
                          resize: "vertical",
                          marginTop: "6px"
                        }}
                      />
                    </label>

                    <div className="fieldRow">
                      <label className="fieldLabel">
                        Letter Font
                        <select
                          value={current.letterFont || current.bodyFont || current.font || "serif"}
                          onChange={(e) => {
                            const font = e.target.value as FontName;
                            updateCurrent({ letterFont: font, bodyFont: font });
                            updateElementStyle("letter", { font });
                            updateElementStyle("letterBody", { font });
                          }}
                        >
                          {fontOptions}
                        </select>
                      </label>
                      <label className="fieldLabel">
                        <div className="sliderHeader">
                          <span>Font Size</span>
                          <span className="valueBadge">{current.letterSize ?? current.bodySize ?? 17}px</span>
                        </div>
                        <input
                          type="range"
                          min="12"
                          max="36"
                          value={current.letterSize ?? current.bodySize ?? 17}
                          onChange={(e) => {
                            const size = Number(e.target.value);
                            updateCurrent({ letterSize: size, bodySize: size });
                            updateElementStyle("letter", { size });
                            updateElementStyle("letterBody", { size });
                          }}
                        />
                      </label>
                    </div>

                    <div className="fieldRow">
                      <label className="fieldLabel">
                        Font Weight
                        <select
                          value={getRoleStyle("letter").weight || "400"}
                          onChange={(e) => {
                            updateElementStyle("letter", { weight: e.target.value });
                            updateElementStyle("letterBody", { weight: e.target.value });
                          }}
                        >
                          <option value="300">300 Light</option>
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
                            updateElementStyle("letterBody", { color: val });
                          }}
                        />
                      </label>
                    </div>

                    <div className="fieldRow">
                      <label className="fieldLabel">
                        Text Align
                        <select
                          value={current.letterAlign || "left"}
                          onChange={(e) => {
                            const align = e.target.value as "left" | "center" | "right";
                            updateCurrent({ letterAlign: align });
                            updateElementStyle("letter", { align });
                            updateElementStyle("letterBody", { align });
                          }}
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
                          onChange={(e) => {
                            const opacity = Number(e.target.value);
                            updateElementStyle("letter", { opacity });
                            updateElementStyle("letterBody", { opacity });
                          }}
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
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span className="controlGroupTitle">💖 Reason Text Sizes & Card Styling</span>
                      <button
                        type="button"
                        className="btn small"
                        onClick={() => setActiveElementCategory("cards")}
                        style={{ fontSize: "11px", padding: "4px 8px" }}
                      >
                        Edit Reasons ({(current.items || reasonDefaults).length}) →
                      </button>
                    </div>

                    {/* Text Sizes */}
                    <div className="fieldRow">
                      <label className="fieldLabel">
                        <div className="sliderHeader">
                          <span>Reason Title Size</span>
                          <span className="valueBadge">{current.reasonTitleSize ?? 17}px</span>
                        </div>
                        <input
                          type="range"
                          min="12"
                          max="40"
                          value={current.reasonTitleSize ?? 17}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            updateCurrent({ reasonTitleSize: v });
                            updateElementStyle("reasonTitle", { size: v });
                          }}
                        />
                      </label>
                      <label className="fieldLabel">
                        <div className="sliderHeader">
                          <span>Reason Body / Text Size</span>
                          <span className="valueBadge">{current.reasonTextSize ?? 14}px</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="32"
                          value={current.reasonTextSize ?? 14}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            updateCurrent({ reasonTextSize: v });
                            updateElementStyle("reasonText", { size: v });
                          }}
                        />
                      </label>
                    </div>

                    {/* Fonts & Weight */}
                    <div className="fieldRow">
                      <label className="fieldLabel">
                        Title Font
                        <select
                          value={current.reasonTitleFont || current.headingFont || globalFont}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateCurrent({ reasonTitleFont: val as FontName });
                            updateElementStyle("reasonTitle", { font: val as FontName });
                          }}
                        >
                          {fontOptions}
                        </select>
                      </label>
                      <label className="fieldLabel">
                        Body Font
                        <select
                          value={current.reasonTextFont || current.bodyFont || globalFont}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateCurrent({ reasonTextFont: val as FontName });
                            updateElementStyle("reasonText", { font: val as FontName });
                          }}
                        >
                          {fontOptions}
                        </select>
                      </label>
                    </div>

                    {/* Colors & Opacity */}
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
                          <span>Wording Opacity</span>
                          <span className="valueBadge">{current.reasonTextOpacity ?? getRoleStyle("reasonText").opacity ?? 100}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={current.reasonTextOpacity ?? getRoleStyle("reasonText").opacity ?? 100}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            updateCurrent({ reasonTextOpacity: v });
                            updateElementStyle("reasonText", { opacity: v });
                            updateElementStyle("reasonTitle", { opacity: v });
                          }}
                        />
                      </label>
                    </div>

                    <div className="fieldRow">
                      <label className="fieldLabel">
                        <div className="sliderHeader">
                          <span>Emoji Opacity</span>
                          <span className="valueBadge">{current.reasonEmojiOpacity ?? 100}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={current.reasonEmojiOpacity ?? 100}
                          onChange={(e) => {
                            updateCurrent({ reasonEmojiOpacity: Number(e.target.value) });
                          }}
                        />
                      </label>
                    </div>

                    {/* Card Container Controls */}
                    <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--line)" }}>
                      <span className="controlGroupTitle" style={{ marginBottom: "8px", display: "block" }}>🃏 Reason Card Frame & Sizing</span>
                      <div className="fieldRow">
                        <label className="fieldLabel">
                          Card Background Color
                          <input
                            type="color"
                            value={current.reasonCardColor || (current.cardColor && current.cardColor !== "#ffffff" ? current.cardColor : "#ffffff")}
                            onChange={(e) => {
                              updateCurrent({ reasonCardColor: e.target.value });
                            }}
                          />
                        </label>
                        <label className="fieldLabel">
                          <div className="sliderHeader">
                            <span>Card Background Opacity</span>
                            <span className="valueBadge">{current.reasonCardOpacity ?? 14}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={current.reasonCardOpacity ?? 14}
                            onChange={(e) => {
                              updateCurrent({ reasonCardOpacity: Number(e.target.value) });
                            }}
                          />
                        </label>
                      </div>

                      <div className="fieldRow">
                        <label className="fieldLabel">
                          <div className="sliderHeader">
                            <span>Card Corner Radius</span>
                            <span className="valueBadge">{current.reasonCardRadius ?? current.radius ?? 21}px</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="60"
                            value={current.reasonCardRadius ?? current.radius ?? 21}
                            onChange={(e) => {
                              updateCurrent({ reasonCardRadius: Number(e.target.value) });
                            }}
                          />
                        </label>
                        <label className="fieldLabel">
                          <div className="sliderHeader">
                            <span>Card Inner Padding</span>
                            <span className="valueBadge">{current.reasonCardPadding ?? 22}px</span>
                          </div>
                          <input
                            type="range"
                            min="8"
                            max="50"
                            value={current.reasonCardPadding ?? 22}
                            onChange={(e) => {
                              updateCurrent({ reasonCardPadding: Number(e.target.value) });
                            }}
                          />
                        </label>
                      </div>

                      {/* Card Distance / Spacing */}
                      <div className="fieldRow" style={{ marginTop: "8px" }}>
                        <label className="fieldLabel">
                          <div className="sliderHeader">
                            <span>↕️ Card Distance / Spacing</span>
                            <span className="valueBadge">{current.reasonCardGap ?? 18}px</span>
                          </div>
                          <input
                            type="range"
                            min="-10"
                            max="60"
                            value={current.reasonCardGap ?? 18}
                            onChange={(e) => {
                              updateCurrent({ reasonCardGap: Number(e.target.value) });
                            }}
                          />
                        </label>
                      </div>
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
                    <span className="controlGroupTitle">🔒 Secret Reveal Message & Typography</span>
                    <label className="fieldLabel">
                      Reveal Message Text
                      <textarea
                        id="secret-reveal-textarea"
                        rows={3}
                        value={current.text || ""}
                        onChange={(e) => updateCurrent({ text: e.target.value })}
                        placeholder="Write your secret reveal message..."
                      />
                    </label>

                    {/* Font Family & Font Size */}
                    <div className="fieldRow">
                      <label className="fieldLabel">
                        Font Family
                        <select
                          value={current.secretTextFont || current.bodyFont || current.font || globalFont}
                          onChange={(e) => {
                            const val = e.target.value as FontName;
                            updateCurrent({ secretTextFont: val });
                            updateElementStyle("secretText", { font: val });
                            updateElementStyle("secretMessage", { font: val });
                          }}
                        >
                          {fontOptions}
                        </select>
                      </label>
                      <label className="fieldLabel">
                        <div className="sliderHeader">
                          <span>Font Size</span>
                          <span className="valueBadge">{current.secretTextSize ?? getRoleStyle("secretText").size ?? 28}px</span>
                        </div>
                        <input
                          type="range"
                          min="14"
                          max="72"
                          value={current.secretTextSize ?? getRoleStyle("secretText").size ?? 28}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            updateCurrent({ secretTextSize: val });
                            updateElementStyle("secretText", { size: val });
                            updateElementStyle("secretMessage", { size: val });
                          }}
                        />
                      </label>
                    </div>

                    {/* Quick Size Presets */}
                    <div style={{ marginTop: "4px", marginBottom: "8px" }}>
                      <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 500, display: "block", marginBottom: "4px" }}>Quick Size Presets:</span>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {[
                          { label: "Compact", size: 20 },
                          { label: "Normal", size: 28 },
                          { label: "Large", size: 36 },
                          { label: "Extra Large", size: 48 },
                          { label: "Huge", size: 60 }
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            className="btn small ghost"
                            style={{
                              fontSize: "11px",
                              padding: "2px 8px",
                              height: "24px",
                              borderRadius: "999px",
                              background: (current.secretTextSize ?? 28) === preset.size ? "var(--local, #ff4f8b)" : "rgba(255, 255, 255, 0.08)",
                              color: (current.secretTextSize ?? 28) === preset.size ? "#ffffff" : "inherit"
                            }}
                            onClick={() => {
                              updateCurrent({ secretTextSize: preset.size });
                              updateElementStyle("secretText", { size: preset.size });
                              updateElementStyle("secretMessage", { size: preset.size });
                            }}
                          >
                            {preset.label} ({preset.size}px)
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Font Weight & Color */}
                    <div className="fieldRow" style={{ marginTop: "8px" }}>
                      <label className="fieldLabel">
                        Font Weight
                        <select
                          value={current.secretTextWeight || getRoleStyle("secretText").weight || "500"}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateCurrent({ secretTextWeight: val });
                            updateElementStyle("secretText", { weight: val });
                            updateElementStyle("secretMessage", { weight: val });
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
                        Message Color
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
                    </div>

                    {/* Line Height & Letter Spacing */}
                    <div className="fieldRow">
                      <label className="fieldLabel">
                        <div className="sliderHeader">
                          <span>Line Height</span>
                          <span className="valueBadge">{current.secretTextLineHeight ?? getRoleStyle("secretText").lineHeight ?? 1.35}</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="2.4"
                          step="0.05"
                          value={current.secretTextLineHeight ?? getRoleStyle("secretText").lineHeight ?? 1.35}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            updateCurrent({ secretTextLineHeight: val });
                            updateElementStyle("secretText", { lineHeight: val });
                            updateElementStyle("secretMessage", { lineHeight: val });
                          }}
                        />
                      </label>
                      <label className="fieldLabel">
                        <div className="sliderHeader">
                          <span>Letter Spacing</span>
                          <span className="valueBadge">{current.secretTextLetterSpacing ?? getRoleStyle("secretText").letterSpacing ?? 0}px</span>
                        </div>
                        <input
                          type="range"
                          min="-2"
                          max="10"
                          step="0.5"
                          value={current.secretTextLetterSpacing ?? getRoleStyle("secretText").letterSpacing ?? 0}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            updateCurrent({ secretTextLetterSpacing: val });
                            updateElementStyle("secretText", { letterSpacing: val });
                            updateElementStyle("secretMessage", { letterSpacing: val });
                          }}
                        />
                      </label>
                    </div>

                    {/* Text Alignment & Opacity */}
                    <div className="fieldRow">
                      <label className="fieldLabel">
                        Alignment
                        <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                          {(["left", "center", "right"] as const).map((align) => (
                            <button
                              key={align}
                              type="button"
                              className={`btn small ${((current.secretTextAlign || getRoleStyle("secretText").align) || "center") === align ? "primary" : "ghost"}`}
                              style={{ flex: 1, textTransform: "capitalize", fontSize: "12px" }}
                              onClick={() => {
                                updateCurrent({ secretTextAlign: align });
                                updateElementStyle("secretText", { align });
                                updateElementStyle("secretMessage", { align });
                              }}
                            >
                              {align}
                            </button>
                          ))}
                        </div>
                      </label>
                      <label className="fieldLabel">
                        <div className="sliderHeader">
                          <span>Opacity</span>
                          <span className="valueBadge">{getRoleStyle("secretText").opacity ?? 100}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={getRoleStyle("secretText").opacity ?? 100}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            updateElementStyle("secretText", { opacity: val });
                            updateElementStyle("secretMessage", { opacity: val });
                          }}
                        />
                      </label>
                    </div>

                    {/* Position Lock & Reset */}
                    <div className="elementPositionLockRow">
                      <div className="positionCoordinatesBadge">
                        <span>Pos: {Math.round(getRoleStyle("secretText").offsetX ?? 0)}px, {Math.round(getRoleStyle("secretText").offsetY ?? 0)}px</span>
                      </div>
                      <div className="positionLockActionGroup">
                        <button
                          type="button"
                          className={`btn small ${getRoleStyle("secretText").locked ? "lockedActionBtn" : "ghost"}`}
                          onClick={() => {
                            const nextLocked = !getRoleStyle("secretText").locked;
                            updateElementStyle("secretText", { locked: nextLocked });
                            updateElementStyle("secretMessage", { locked: nextLocked });
                            setToast(nextLocked ? "🔒 Secret message position locked" : "🔓 Secret message position unlocked");
                          }}
                        >
                          {getRoleStyle("secretText").locked ? (
                            <>
                              <Lock size={12} /> <span>Locked</span>
                            </>
                          ) : (
                            <>
                              <Unlock size={12} /> <span>Lock</span>
                            </>
                          )}
                        </button>
                        {((getRoleStyle("secretText").offsetX ?? 0) !== 0 || (getRoleStyle("secretText").offsetY ?? 0) !== 0) && (
                          <button
                            type="button"
                            className="btn small ghost"
                            onClick={() => {
                              updateElementStyle("secretText", { offsetX: 0, offsetY: 0 });
                              updateElementStyle("secretMessage", { offsetX: 0, offsetY: 0 });
                            }}
                          >
                            Reset Pos
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="fieldRow" style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--line)" }}>
                      <label className="fieldLabel">
                        Reveal Button Text
                        <input
                          type="text"
                          value={current.revealButtonText || "Tap to reveal"}
                          onChange={(e) => updateCurrent({ revealButtonText: e.target.value })}
                          placeholder="Tap to reveal"
                        />
                      </label>
                      <label className="fieldLabel">
                        Hide Button Text
                        <input
                          type="text"
                          value={current.secretHideButtonText || "Hide again"}
                          onChange={(e) => updateCurrent({ secretHideButtonText: e.target.value })}
                          placeholder="Hide again"
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

                  {current.type === "secret" && (
                    <div className="controlCard" style={{ background: "rgba(255, 79, 139, 0.08)", border: "1px dashed var(--accent, #ff4f8b)", marginBottom: "12px", padding: "10px 12px" }}>
                      <span style={{ fontWeight: 600, fontSize: "12px", color: "var(--accent, #ff4f8b)", display: "block" }}>
                        🤫 Secret Reveal Photo
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--muted)", display: "block", marginTop: "2px" }}>
                        Any photo uploaded here stays locked & hidden until your recipient taps &quot;Tap to reveal&quot;!
                      </span>
                    </div>
                  )}

                  {/* Layout Selector for Memories/Gallery Section */}
                  {(current.type === "memories" || current.type === "gallery") && (
                    <label className="fieldLabel" style={{ marginBottom: "14px" }}>
                      Layout / Arrangement
                      <select
                        value={current.galleryLayout || "scattered"}
                        onChange={(e) => updateCurrent({ galleryLayout: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "10px",
                          marginTop: "6px"
                        }}
                      >
                        <option value="scattered">Scattered Image</option>
                        <option value="collage">Collage Flow</option>
                        <option value="grid">Clean Photo Grid</option>
                        <option value="masonry">Masonry Wall</option>
                        <option value="polaroid">Polaroid Snapshots</option>
                        <option value="filmstrip">Filmstrip Scroll</option>
                      </select>
                    </label>
                  )}

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
                      <div className="miniMediaRow" style={{ marginBottom: "10px" }}>
                        <span style={{ fontSize: "12px", color: "var(--text)", fontWeight: 500 }}>Photo #{selectedPhotoIdx + 1} Selected</span>
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

                      {/* Prominent PicsArt-Style Crop & Frame Action */}
                      <button
                        type="button"
                        className="btn small primary full"
                        style={{
                          marginBottom: "14px",
                          gap: "8px",
                          fontWeight: 600,
                          padding: "10px 14px",
                          borderRadius: "10px",
                          boxShadow: "0 4px 14px rgba(255, 61, 120, 0.35)"
                        }}
                        onClick={() => {
                          const src = galleryImages[selectedPhotoIdx];
                          if (src) {
                            setCropModalData({
                              isOpen: true,
                              imageSrc: src,
                              photoTitle: `Photo #${selectedPhotoIdx + 1}`,
                              photoKey: String(selectedPhotoIdx),
                              initialAdjustment: selectedPhotoAdj
                            });
                          }
                        }}
                      >
                        <Crop size={15} /> ✂️ Edit Crop & Framing
                      </button>

                      {/* Fit Mode */}
                      <label className="fieldLabel">
                        Fit / Display Mode
                        <div className="fitModeToggleGroup" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "4px" }}>
                          <button
                            type="button"
                            className={`fitModeToggleBtn ${(selectedPhotoAdj.fit === "contain" || (!selectedPhotoAdj.fit && current.imageFit !== "cover" && current.imageFit !== "natural")) ? "active" : ""}`}
                            onClick={() => {
                              const adjustments = { ...(current.imageAdjustments || {}) };
                              adjustments[String(selectedPhotoIdx)] = { ...selectedPhotoAdj, fit: "contain" };
                              if (selectedPhotoIdx === 0) adjustments["hero"] = { ...selectedPhotoAdj, fit: "contain" };
                              updateCurrent({ imageAdjustments: adjustments });
                            }}
                          >
                            Contain
                          </button>
                          <button
                            type="button"
                            className={`fitModeToggleBtn ${(selectedPhotoAdj.fit === "cover" || (!selectedPhotoAdj.fit && current.imageFit === "cover")) ? "active" : ""}`}
                            onClick={() => {
                              const adjustments = { ...(current.imageAdjustments || {}) };
                              adjustments[String(selectedPhotoIdx)] = { ...selectedPhotoAdj, fit: "cover" };
                              if (selectedPhotoIdx === 0) adjustments["hero"] = { ...selectedPhotoAdj, fit: "cover" };
                              updateCurrent({ imageAdjustments: adjustments });
                            }}
                          >
                            Cover
                          </button>
                          <button
                            type="button"
                            className={`fitModeToggleBtn ${(selectedPhotoAdj.fit === "natural" || (!selectedPhotoAdj.fit && current.imageFit === "natural")) ? "active" : ""}`}
                            onClick={() => {
                              const adjustments = { ...(current.imageAdjustments || {}) };
                              adjustments[String(selectedPhotoIdx)] = { ...selectedPhotoAdj, fit: "natural" };
                              if (selectedPhotoIdx === 0) adjustments["hero"] = { ...selectedPhotoAdj, fit: "natural" };
                              updateCurrent({ imageAdjustments: adjustments });
                            }}
                          >
                            Natural
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

                      {/* Rotation Slider */}
                      <label className="fieldLabel">
                        <div className="sliderHeader">
                          <span>Rotation</span>
                          <span className="valueBadge">{selectedPhotoAdj.rotation ?? 0}°</span>
                        </div>
                        <input
                          type="range"
                          min="-45"
                          max="45"
                          value={selectedPhotoAdj.rotation ?? 0}
                          onChange={(e) => {
                            const adjustments = { ...(current.imageAdjustments || {}) };
                            const val = Number(e.target.value);
                            adjustments[String(selectedPhotoIdx)] = { ...selectedPhotoAdj, rotation: val };
                            if (selectedPhotoIdx === 0) adjustments["hero"] = { ...selectedPhotoAdj, rotation: val };
                            updateCurrent({ imageAdjustments: adjustments });
                          }}
                        />
                      </label>

                      {/* Photo Position & Lock */}
                      <div className="elementPositionLockRow" style={{ marginTop: "14px" }}>
                        <div className="positionCoordinatesBadge">
                          <span>Pos: {Math.round(selectedPhotoAdj.x ?? 50)}%, {Math.round(selectedPhotoAdj.y ?? 50)}%</span>
                        </div>
                        <div className="positionLockActionGroup">
                          <button
                            type="button"
                            className={`btn small ${selectedPhotoAdj.locked ? "lockedActionBtn" : "ghost"}`}
                            onClick={() => {
                              const adjustments = { ...(current.imageAdjustments || {}) };
                              const nextLocked = !selectedPhotoAdj.locked;
                              adjustments[String(selectedPhotoIdx)] = { ...selectedPhotoAdj, locked: nextLocked };
                              if (selectedPhotoIdx === 0) adjustments["hero"] = { ...selectedPhotoAdj, locked: nextLocked };
                              updateCurrent({ imageAdjustments: adjustments });
                              setToast(nextLocked ? "🔒 Photo position locked" : "🔓 Photo position unlocked");
                            }}
                            title={selectedPhotoAdj.locked ? "Photo position is locked against dragging" : "Click to lock photo position in place"}
                          >
                            {selectedPhotoAdj.locked ? (
                              <>
                                <Lock size={12} /> <span>Locked</span>
                              </>
                            ) : (
                              <>
                                <Unlock size={12} /> <span>Lock pos</span>
                              </>
                            )}
                          </button>
                          {((selectedPhotoAdj.x ?? 50) !== 50 || (selectedPhotoAdj.y ?? 50) !== 50) && (
                            <button
                              type="button"
                              className="btn small ghost"
                              onClick={() => {
                                const adjustments = { ...(current.imageAdjustments || {}) };
                                adjustments[String(selectedPhotoIdx)] = { ...selectedPhotoAdj, x: 50, y: 50 };
                                if (selectedPhotoIdx === 0) adjustments["hero"] = { ...selectedPhotoAdj, x: 50, y: 50 };
                                updateCurrent({ imageAdjustments: adjustments });
                              }}
                              title="Reset photo to center"
                            >
                              ↺ Center
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Direct Drag Info */}
                      <div
                        style={{
                          marginTop: "14px",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          background: "rgba(255, 255, 255, 0.04)",
                          border: "1px dashed rgba(255, 255, 255, 0.15)",
                          fontSize: "12px",
                          color: "var(--muted)",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px"
                        }}
                      >
                        <span style={{ fontSize: "16px" }}>🖐️</span>
                        <span>
                          <strong>Direct Move:</strong> Drag directly on the preview with your mouse or touch & drag on mobile to move this photo anywhere!
                        </span>
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
                {/* Section-Specific Background & Aura Colors */}
                <div className="controlCard">
                  <span className="controlGroupTitle">🎨 Section Background Colors</span>
                  <label className="fieldLabel">
                    <span>Section Base Background</span>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "4px" }}>
                      <input
                        type="color"
                        value={current.backgroundBaseColor || backgroundBaseColor}
                        onChange={(e) => updateCurrent({ backgroundBaseColor: e.target.value })}
                        style={{ width: "36px", height: "32px", padding: "1px", border: "1px solid var(--line)", borderRadius: "6px", cursor: "pointer", background: "transparent" }}
                      />
                      <input
                        type="text"
                        value={current.backgroundBaseColor || ""}
                        placeholder={backgroundBaseColor + " (Inherit Global)"}
                        onChange={(e) => updateCurrent({ backgroundBaseColor: e.target.value })}
                        style={{ flex: 1, fontFamily: "monospace", fontSize: "11px" }}
                      />
                      {current.backgroundBaseColor && (
                        <button
                          type="button"
                          className="btn small"
                          onClick={() => updateCurrent({ backgroundBaseColor: undefined })}
                          title="Reset to page background"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </label>

                  <div style={{ marginTop: "8px" }}>
                    <span style={{ fontSize: "11px", color: "var(--muted)", display: "block", marginBottom: "4px" }}>
                      Section Glows (Optional Overrides):
                    </span>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px" }}>
                      {[
                        { name: "Glow 1", val: current.bgColor1 || bgColor1, key: "bgColor1" },
                        { name: "Glow 2", val: current.bgColor2 || bgColor2, key: "bgColor2" },
                        { name: "Glow 3", val: current.bgColor3 || bgColor3, key: "bgColor3" },
                        { name: "Glow 4", val: current.bgColor4 || bgColor4, key: "bgColor4" },
                        { name: "Glow 5", val: current.bgColor5 || bgColor5, key: "bgColor5" },
                      ].map((g) => (
                        <label
                          key={g.name}
                          title={g.name}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "3px",
                            cursor: "pointer",
                            background: "rgba(255, 255, 255, 0.04)",
                            padding: "4px 2px",
                            borderRadius: "6px",
                            border: "1px solid var(--line)"
                          }}
                        >
                          <div style={{
                            position: "relative",
                            width: "24px",
                            height: "24px",
                            borderRadius: "5px",
                            overflow: "hidden",
                            border: "1px solid rgba(255, 255, 255, 0.2)"
                          }}>
                            <input
                              type="color"
                              value={g.val}
                              onChange={(e) => updateCurrent({ [g.key]: e.target.value })}
                              style={{
                                position: "absolute",
                                top: "-8px",
                                left: "-8px",
                                width: "40px",
                                height: "40px",
                                border: "none",
                                cursor: "pointer",
                                background: "transparent"
                              }}
                            />
                          </div>
                          <span style={{ fontSize: "9px", color: "var(--site-text, #fff)", whiteSpace: "nowrap" }}>
                            {g.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="fieldRow" style={{ marginTop: "6px" }}>
                    <label className="fieldLabel">
                      <span>Card Glass Tint</span>
                      <input
                        type="color"
                        value={current.cardColor || "#ffffff"}
                        onChange={(e) => updateCurrent({ cardColor: e.target.value })}
                        style={{ width: "100%", height: "28px", padding: "1px", border: "1px solid var(--line)", borderRadius: "6px", cursor: "pointer", background: "transparent" }}
                      />
                    </label>
                    <label className="fieldLabel">
                      <div className="sliderHeader">
                        <span>Card Opacity</span>
                        <span className="valueBadge">{current.cardOpacity ?? globalCardOpacity}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={current.cardOpacity ?? globalCardOpacity}
                        onChange={(e) => updateCurrent({ cardOpacity: Number(e.target.value) })}
                      />
                    </label>
                  </div>
                </div>

                <div className="controlCard">
                  <span className="controlGroupTitle">🖼️ Custom Section Wallpaper</span>
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

                      <label className="fieldLabel" style={{ marginTop: "10px" }}>
                        Wallpaper Alignment
                        <div className="fitModeToggleGroup">
                          <button
                            type="button"
                            className={`fitModeToggleBtn ${current.customBgPositionX === 0 ? "active" : ""}`}
                            onClick={() => updateCurrent({ customBgPositionX: 0, customBgPositionY: 50 })}
                          >
                            Left
                          </button>
                          <button
                            type="button"
                            className={`fitModeToggleBtn ${(!current.customBgPositionX || current.customBgPositionX === 50) ? "active" : ""}`}
                            onClick={() => updateCurrent({ customBgPositionX: 50, customBgPositionY: 50 })}
                          >
                            Center
                          </button>
                          <button
                            type="button"
                            className={`fitModeToggleBtn ${current.customBgPositionX === 100 ? "active" : ""}`}
                            onClick={() => updateCurrent({ customBgPositionX: 100, customBgPositionY: 50 })}
                          >
                            Right
                          </button>
                        </div>
                      </label>
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
                {current.type === "secret" && (
                  <div className="controlCard" style={{ background: "rgba(255, 79, 139, 0.08)", border: "1px dashed var(--accent, #ff4f8b)", marginBottom: "12px", padding: "10px 12px" }}>
                    <span style={{ fontWeight: 600, fontSize: "12px", color: "var(--accent, #ff4f8b)", display: "block" }}>
                      🤫 Secret Reveal Video
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--muted)", display: "block", marginTop: "2px" }}>
                      Any video uploaded here stays locked & hidden until your recipient taps &quot;Tap to reveal&quot;!
                    </span>
                  </div>
                )}
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

                      <label className="fieldLabel" style={{ marginTop: "10px" }}>
                        Video Alignment
                        <div className="fitModeToggleGroup">
                          <button
                            type="button"
                            className={`fitModeToggleBtn ${current.videoPositionX === 0 ? "active" : ""}`}
                            onClick={() => updateCurrent({ videoPositionX: 0, videoPositionY: 50 })}
                          >
                            Left
                          </button>
                          <button
                            type="button"
                            className={`fitModeToggleBtn ${(!current.videoPositionX || current.videoPositionX === 50) ? "active" : ""}`}
                            onClick={() => updateCurrent({ videoPositionX: 50, videoPositionY: 50 })}
                          >
                            Center
                          </button>
                          <button
                            type="button"
                            className={`fitModeToggleBtn ${current.videoPositionX === 100 ? "active" : ""}`}
                            onClick={() => updateCurrent({ videoPositionX: 100, videoPositionY: 50 })}
                          >
                            Right
                          </button>
                        </div>
                      </label>

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
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "4px" }}>
                      <input
                        type="text"
                        value={current.emoji ?? ""}
                        placeholder="(None)"
                        onChange={(e) => updateCurrent({ emoji: e.target.value })}
                        style={{ fontSize: "20px", textAlign: "center", width: "70px" }}
                      />
                      {current.emoji && (
                        <button
                          type="button"
                          className="btn ghost small"
                          onClick={() => updateCurrent({ emoji: "" })}
                          title="Remove emoji"
                          style={{ fontSize: "11px", padding: "4px 8px" }}
                        >
                          ✕ Clear
                        </button>
                      )}
                    </div>
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
                {current.type === "reasons" && (() => {
                  const rList = current.items ? [...current.items] : [...reasonDefaults];
                  const safeCardIdx = Math.max(0, Math.min(selectedReasonIdx, rList.length - 1));
                  const activeItem = rList[safeCardIdx] || rList[0];
                  const cardKey = activeItem?.id || String(safeCardIdx);
                  const cardPos = current.reasonCardPositions?.[cardKey] || {
                    x: activeItem?.x ?? 0,
                    y: activeItem?.y ?? 0,
                    rotation: activeItem?.rotation ?? 0,
                    scale: activeItem?.scale ?? (current.reasonCardScale ?? 100),
                    width: activeItem?.width ?? current.reasonCardWidth,
                    locked: activeItem?.locked ?? false
                  };

                  const updateSelectedCard = (patch: Partial<ReasonItem>) => {
                    const updatedList = [...rList];
                    if (updatedList[safeCardIdx]) {
                      updatedList[safeCardIdx] = { ...updatedList[safeCardIdx], ...patch };
                    }
                    const updatedMap = { ...(current.reasonCardPositions || {}) };
                    if (
                      patch.x !== undefined ||
                      patch.y !== undefined ||
                      patch.rotation !== undefined ||
                      patch.scale !== undefined ||
                      patch.width !== undefined ||
                      patch.locked !== undefined
                    ) {
                      updatedMap[cardKey] = {
                        ...(updatedMap[cardKey] || {}),
                        ...(patch.x !== undefined ? { x: patch.x } : {}),
                        ...(patch.y !== undefined ? { y: patch.y } : {}),
                        ...(patch.rotation !== undefined ? { rotation: patch.rotation } : {}),
                        ...(patch.scale !== undefined ? { scale: patch.scale } : {}),
                        ...(patch.width !== undefined ? { width: patch.width } : {}),
                        ...(patch.locked !== undefined ? { locked: patch.locked } : {})
                      };
                    }
                    updateCurrent({ items: updatedList, reasonCardPositions: updatedMap });
                  };

                  const resetSelectedCardOverrides = () => {
                    const updatedList = [...rList];
                    if (updatedList[safeCardIdx]) {
                      const item = { ...updatedList[safeCardIdx] };
                      delete item.x;
                      delete item.y;
                      delete item.rotation;
                      delete item.scale;
                      delete item.width;
                      delete item.cardColor;
                      delete item.cardOpacity;
                      delete item.cardRadius;
                      delete item.cardPadding;
                      delete item.titleColor;
                      delete item.textColor;
                      delete item.locked;
                      updatedList[safeCardIdx] = item;
                    }
                    const updatedMap = { ...(current.reasonCardPositions || {}) };
                    delete updatedMap[cardKey];
                    updateCurrent({ items: updatedList, reasonCardPositions: updatedMap });
                    setToast(`Reset Card #${safeCardIdx + 1} to match global settings ✨`);
                  };

                  const applySelectedCardToAll = () => {
                    if (!activeItem) return;
                    const newScale = typeof activeItem.scale === "number" ? activeItem.scale : (current.reasonCardScale ?? 100);
                    const newWidth = typeof activeItem.width === "number" ? activeItem.width : current.reasonCardWidth;
                    const newColor = activeItem.cardColor || current.reasonCardColor;
                    const newOpacity = typeof activeItem.cardOpacity === "number" ? activeItem.cardOpacity : current.reasonCardOpacity;
                    const newRadius = typeof activeItem.cardRadius === "number" ? activeItem.cardRadius : current.reasonCardRadius;
                    const newPadding = typeof activeItem.cardPadding === "number" ? activeItem.cardPadding : current.reasonCardPadding;
                    const newTitleColor = activeItem.titleColor || current.reasonTitleColor;
                    const newTextColor = activeItem.textColor || current.reasonTextColor;

                    updateCurrent({
                      reasonCardScale: newScale,
                      reasonCardWidth: newWidth,
                      reasonCardColor: newColor,
                      reasonCardOpacity: newOpacity,
                      reasonCardRadius: newRadius,
                      reasonCardPadding: newPadding,
                      reasonTitleColor: newTitleColor,
                      reasonTextColor: newTextColor
                    });
                    setToast(`Applied Card #${safeCardIdx + 1}'s style to all cards! ✨`);
                  };

                  const syncAllCardsToMatch = () => {
                    const cleaned = rList.map((item) => {
                      const clone = { ...item };
                      delete clone.cardColor;
                      delete clone.cardOpacity;
                      delete clone.cardRadius;
                      delete clone.cardPadding;
                      delete clone.width;
                      delete clone.scale;
                      delete clone.titleColor;
                      delete clone.textColor;
                      return clone;
                    });
                    updateCurrent({ items: cleaned });
                    setToast("All cards synced to global settings! ✨");
                  };

                  return (
                    <>
                      {/* Scope Selector: Selected Card vs All Cards */}
                      <div className="cardScopeSelectorBar">
                        <button
                          type="button"
                          className={`cardScopeBtn ${cardEditScope === "selected" ? "active" : ""}`}
                          onClick={() => setCardEditScope("selected")}
                        >
                          🎯 Adjust Card #{safeCardIdx + 1} Separately
                        </button>
                        <button
                          type="button"
                          className={`cardScopeBtn ${cardEditScope === "all" ? "active" : ""}`}
                          onClick={() => setCardEditScope("all")}
                        >
                          🌐 Adjust All Cards Together
                        </button>
                      </div>

                      {/* Card Selector Tabs */}
                      <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "6px", marginBottom: "10px" }}>
                        {rList.map((r, i) => {
                          const hasOverrides =
                            r.scale !== undefined ||
                            r.width !== undefined ||
                            r.x !== undefined ||
                            r.y !== undefined ||
                            r.cardColor !== undefined ||
                            r.cardOpacity !== undefined ||
                            r.cardRadius !== undefined ||
                            r.cardPadding !== undefined ||
                            r.titleColor !== undefined ||
                            r.textColor !== undefined;
                          return (
                            <button
                              key={r.id || i}
                              type="button"
                              className={`btn small ${safeCardIdx === i && cardEditScope === "selected" ? "primary" : "ghost"}`}
                              style={{ fontSize: "11px", padding: "4px 9px", whiteSpace: "nowrap" }}
                              onClick={() => {
                                setSelectedReasonIdx(i);
                                setCardEditScope("selected");
                              }}
                            >
                              {r.emoji ? `${r.emoji} ` : ""}Card #{i + 1}
                              {hasOverrides ? " •" : ""}
                            </button>
                          );
                        })}
                      </div>

                      {/* Scope Status Banner */}
                      {cardEditScope === "selected" ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            background: "rgba(255, 79, 139, 0.12)",
                            border: "1px solid rgba(255, 79, 139, 0.35)",
                            borderRadius: "8px",
                            padding: "8px 10px",
                            marginBottom: "12px",
                            fontSize: "12px"
                          }}
                        >
                          <div style={{ minWidth: 0, flex: 1, marginRight: "8px" }}>
                            <div style={{ color: "var(--accent, #ff4f8b)", fontWeight: 700 }}>
                              🎯 Adjusting Card #{safeCardIdx + 1} Separately
                            </div>
                            <div
                              style={{
                                color: "rgba(255,255,255,0.75)",
                                fontSize: "11px",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis"
                              }}
                            >
                              {activeItem?.title || "Reason Title"}
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "5px" }}>
                            <button
                              type="button"
                              className="btn small ghost"
                              style={{ fontSize: "10px", padding: "3px 7px" }}
                              title="Reset this card's overrides to match global card settings"
                              onClick={resetSelectedCardOverrides}
                            >
                              ↺ Reset
                            </button>
                            <button
                              type="button"
                              className="btn small ghost"
                              style={{ fontSize: "10px", padding: "3px 7px" }}
                              title="Apply this card's style to all cards"
                              onClick={applySelectedCardToAll}
                            >
                              ⧉ Apply All
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            background: "rgba(255, 255, 255, 0.05)",
                            border: "1px solid var(--line)",
                            borderRadius: "8px",
                            padding: "8px 10px",
                            marginBottom: "12px",
                            fontSize: "12px"
                          }}
                        >
                          <div style={{ color: "var(--muted)", fontSize: "11px" }}>
                            🌐 Editing global settings for all {rList.length} cards.
                          </div>
                          <button
                            type="button"
                            className="btn small ghost"
                            style={{ fontSize: "10px", padding: "3px 7px" }}
                            title="Clear individual card overrides so all cards match exactly"
                            onClick={syncAllCardsToMatch}
                          >
                            🔄 Sync All
                          </button>
                        </div>
                      )}

                      {/* Reason Card Frame & Sizing Box */}
                      <div className="controlCard">
                        <span className="controlGroupTitle">
                          🃏 Reason Card Frame & Sizing {cardEditScope === "selected" ? `(#${safeCardIdx + 1})` : "(All Cards)"}
                        </span>

                        {/* Quick Size Presets */}
                        <div className="fieldRow" style={{ marginBottom: "10px" }}>
                          <div style={{ display: "flex", gap: "6px", width: "100%", flexWrap: "wrap" }}>
                            {[
                              { label: "Mini (75%)", scale: 75, padding: 14, titleSize: 15, textSize: 12 },
                              { label: "Compact (90%)", scale: 90, padding: 18, titleSize: 16, textSize: 13 },
                              { label: "Default (100%)", scale: 100, padding: 22, titleSize: 17, textSize: 14 },
                              { label: "Large (115%)", scale: 115, padding: 26, titleSize: 19, textSize: 15 }
                            ].map((preset) => {
                              const activeVal =
                                cardEditScope === "selected"
                                  ? (activeItem?.scale ?? current.reasonCardScale ?? 100)
                                  : (current.reasonCardScale ?? 100);
                              const isAct = activeVal === preset.scale;
                              return (
                                <button
                                  key={preset.label}
                                  type="button"
                                  className={`btn small ${isAct ? "primary" : "ghost"}`}
                                  style={{ flex: 1, minWidth: "75px", padding: "5px 8px", fontSize: "11px" }}
                                  onClick={() => {
                                    if (cardEditScope === "selected") {
                                      updateSelectedCard({ scale: preset.scale, cardPadding: preset.padding });
                                    } else {
                                      updateCurrent({
                                        reasonCardScale: preset.scale,
                                        reasonCardPadding: preset.padding,
                                        reasonTitleSize: preset.titleSize,
                                        reasonTextSize: preset.textSize
                                      });
                                    }
                                  }}
                                >
                                  {preset.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Card Scale / Overall Size & Card Width */}
                        <div className="fieldRow">
                          <label className="fieldLabel">
                            <div className="sliderHeader">
                              <span>{cardEditScope === "selected" ? `Card Scale (#${safeCardIdx + 1})` : "Card Overall Size"}</span>
                              <span className="valueBadge">
                                {cardEditScope === "selected"
                                  ? `${activeItem?.scale ?? current.reasonCardScale ?? 100}%`
                                  : `${current.reasonCardScale ?? 100}%`}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="50"
                              max="150"
                              value={
                                cardEditScope === "selected"
                                  ? (activeItem?.scale ?? current.reasonCardScale ?? 100)
                                  : (current.reasonCardScale ?? 100)
                              }
                              onChange={(e) => {
                                const v = Number(e.target.value);
                                if (cardEditScope === "selected") {
                                  updateSelectedCard({ scale: v });
                                } else {
                                  updateCurrent({ reasonCardScale: v });
                                }
                              }}
                            />
                          </label>
                          <label className="fieldLabel">
                            <div className="sliderHeader">
                              <span>{cardEditScope === "selected" ? `Card Width (#${safeCardIdx + 1})` : "Card Width"}</span>
                              <span className="valueBadge">
                                {cardEditScope === "selected"
                                  ? (activeItem?.width ? `${activeItem.width}px` : (current.reasonCardWidth ? `${current.reasonCardWidth}px (Inherited)` : "Auto (100%)"))
                                  : (current.reasonCardWidth ? `${current.reasonCardWidth}px` : "Auto (100%)")}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="240"
                              max="560"
                              value={
                                cardEditScope === "selected"
                                  ? (activeItem?.width ?? current.reasonCardWidth ?? 440)
                                  : (current.reasonCardWidth ?? 440)
                              }
                              onChange={(e) => {
                                const v = Number(e.target.value);
                                if (cardEditScope === "selected") {
                                  updateSelectedCard({ width: v });
                                } else {
                                  updateCurrent({ reasonCardWidth: v });
                                }
                              }}
                            />
                          </label>
                        </div>

                        {/* ↕️ Card Distance / Spacing Between Cards */}
                        <div className="fieldRow" style={{ marginTop: "10px" }}>
                          <label className="fieldLabel">
                            <div className="sliderHeader">
                              <span style={{ fontWeight: 600 }}>↕️ Card Distance / Spacing</span>
                              <span className="valueBadge">{current.reasonCardGap ?? 18}px</span>
                            </div>
                            <input
                              type="range"
                              min="-10"
                              max="60"
                              value={current.reasonCardGap ?? 18}
                              onChange={(e) => {
                                updateCurrent({ reasonCardGap: Number(e.target.value) });
                              }}
                            />
                          </label>
                        </div>

                        {/* Quick Distance Presets */}
                        <div style={{ display: "flex", gap: "5px", marginBottom: "12px", flexWrap: "wrap" }}>
                          {[
                            { label: "Overlap (-5px)", gap: -5 },
                            { label: "Tight (4px)", gap: 4 },
                            { label: "Compact (10px)", gap: 10 },
                            { label: "Default (18px)", gap: 18 },
                            { label: "Spacious (28px)", gap: 28 }
                          ].map((preset) => {
                            const isAct = (current.reasonCardGap ?? 18) === preset.gap;
                            return (
                              <button
                                key={preset.label}
                                type="button"
                                className={`btn small ${isAct ? "primary" : "ghost"}`}
                                style={{ flex: 1, minWidth: "62px", padding: "4px 5px", fontSize: "10px" }}
                                onClick={() => {
                                  updateCurrent({ reasonCardGap: preset.gap });
                                  setToast(`Set card distance to ${preset.gap}px ✨`);
                                }}
                              >
                                {preset.label}
                              </button>
                            );
                          })}
                        </div>

                        {/* Card Background Color & Opacity */}
                        <div className="fieldRow">
                          <label className="fieldLabel">
                            {cardEditScope === "selected" ? `Card #${safeCardIdx + 1} Color` : "Card Background Color"}
                            <input
                              type="color"
                              value={
                                cardEditScope === "selected"
                                  ? (activeItem?.cardColor || current.reasonCardColor || (current.cardColor && current.cardColor !== "#ffffff" ? current.cardColor : "#ffffff"))
                                  : (current.reasonCardColor || (current.cardColor && current.cardColor !== "#ffffff" ? current.cardColor : "#ffffff"))
                              }
                              onChange={(e) => {
                                const v = e.target.value;
                                if (cardEditScope === "selected") {
                                  updateSelectedCard({ cardColor: v });
                                } else {
                                  updateCurrent({ reasonCardColor: v });
                                }
                              }}
                            />
                          </label>
                          <label className="fieldLabel">
                            <div className="sliderHeader">
                              <span>{cardEditScope === "selected" ? `Card #${safeCardIdx + 1} Opacity` : "Card Background Opacity"}</span>
                              <span className="valueBadge">
                                {cardEditScope === "selected"
                                  ? `${activeItem?.cardOpacity ?? current.reasonCardOpacity ?? 14}%`
                                  : `${current.reasonCardOpacity ?? 14}%`}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={
                                cardEditScope === "selected"
                                  ? (activeItem?.cardOpacity ?? current.reasonCardOpacity ?? 14)
                                  : (current.reasonCardOpacity ?? 14)
                              }
                              onChange={(e) => {
                                const v = Number(e.target.value);
                                if (cardEditScope === "selected") {
                                  updateSelectedCard({ cardOpacity: v });
                                } else {
                                  updateCurrent({ reasonCardOpacity: v });
                                }
                              }}
                            />
                          </label>
                        </div>

                        {/* Card Corner Radius & Inner Padding */}
                        <div className="fieldRow">
                          <label className="fieldLabel">
                            <div className="sliderHeader">
                              <span>{cardEditScope === "selected" ? `Card #${safeCardIdx + 1} Radius` : "Card Corner Radius"}</span>
                              <span className="valueBadge">
                                {cardEditScope === "selected"
                                  ? `${activeItem?.cardRadius ?? current.reasonCardRadius ?? current.radius ?? 21}px`
                                  : `${current.reasonCardRadius ?? current.radius ?? 21}px`}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="60"
                              value={
                                cardEditScope === "selected"
                                  ? (activeItem?.cardRadius ?? current.reasonCardRadius ?? current.radius ?? 21)
                                  : (current.reasonCardRadius ?? current.radius ?? 21)
                              }
                              onChange={(e) => {
                                const v = Number(e.target.value);
                                if (cardEditScope === "selected") {
                                  updateSelectedCard({ cardRadius: v });
                                } else {
                                  updateCurrent({ reasonCardRadius: v });
                                }
                              }}
                            />
                          </label>
                          <label className="fieldLabel">
                            <div className="sliderHeader">
                              <span>{cardEditScope === "selected" ? `Card #${safeCardIdx + 1} Padding` : "Card Inner Padding"}</span>
                              <span className="valueBadge">
                                {cardEditScope === "selected"
                                  ? `${activeItem?.cardPadding ?? current.reasonCardPadding ?? 22}px`
                                  : `${current.reasonCardPadding ?? 22}px`}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="8"
                              max="50"
                              value={
                                cardEditScope === "selected"
                                  ? (activeItem?.cardPadding ?? current.reasonCardPadding ?? 22)
                                  : (current.reasonCardPadding ?? 22)
                              }
                              onChange={(e) => {
                                const v = Number(e.target.value);
                                if (cardEditScope === "selected") {
                                  updateSelectedCard({ cardPadding: v });
                                } else {
                                  updateCurrent({ reasonCardPadding: v });
                                }
                              }}
                            />
                          </label>
                        </div>

                        {/* ========================================================= */}
                        {/* 📍 MANUAL CARD POSITION & PLACEMENT (FREE POSITIONING)     */}
                        {/* ========================================================= */}
                        <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid var(--line)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <span className="controlGroupTitle" style={{ margin: 0 }}>📍 Manual Card Placement</span>
                            <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                              Adjusting: <strong>#{safeCardIdx + 1}</strong> ({(activeItem?.title || "Card").slice(0, 14)})
                            </span>
                          </div>

                          {/* Manual Moving Note without Scrollers */}
                          <p style={{ fontSize: "11px", color: "var(--muted)", margin: "0 0 10px" }}>
                            ✨ Drag and drop this card freely anywhere directly on the canvas with the <strong>⠿</strong> handle without any sliders!
                          </p>

                          {/* Quick Placement & Tactile Shift Buttons */}
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
                            <button
                              type="button"
                              className="btn small ghost"
                              style={{ fontSize: "11px", padding: "4px 8px" }}
                              onClick={() => updateSelectedCard({ x: (cardPos.x ?? 0) - 30 })}
                              title="Shift card 30px left"
                            >
                              ⬅ Shift Left (-30px)
                            </button>
                            <button
                              type="button"
                              className="btn small ghost"
                              style={{ fontSize: "11px", padding: "4px 8px" }}
                              onClick={() => updateSelectedCard({ x: 0, y: 0, rotation: 0 })}
                              title="Reset card to center"
                            >
                              ⬛ Center (0, 0)
                            </button>
                            <button
                              type="button"
                              className="btn small ghost"
                              style={{ fontSize: "11px", padding: "4px 8px" }}
                              onClick={() => updateSelectedCard({ x: (cardPos.x ?? 0) + 30 })}
                              title="Shift card 30px right"
                            >
                              ➡ Shift Right (+30px)
                            </button>
                            <button
                              type="button"
                              className="btn small ghost"
                              style={{ fontSize: "11px", padding: "4px 8px" }}
                              onClick={() => updateSelectedCard({ y: (cardPos.y ?? 0) - 25 })}
                              title="Shift card 25px up"
                            >
                              ⬆ Shift Up (-25px)
                            </button>
                            <button
                              type="button"
                              className="btn small ghost"
                              style={{ fontSize: "11px", padding: "4px 8px" }}
                              onClick={() => updateSelectedCard({ y: (cardPos.y ?? 0) + 25 })}
                              title="Shift card 25px down"
                            >
                              ⬇ Shift Down (+25px)
                            </button>
                            <button
                              type="button"
                              className="btn small ghost"
                              style={{ fontSize: "11px", padding: "4px 8px" }}
                              onClick={() => {
                                const staggered = rList.map((item, idx) => {
                                  const side = idx % 2 === 0 ? -30 : 30;
                                  const tilt = idx % 2 === 0 ? -2 : 2;
                                  return { ...item, x: side, rotation: tilt };
                                });
                                const map: Record<string, any> = {};
                                staggered.forEach((item, idx) => {
                                  map[item.id || String(idx)] = { x: item.x, y: item.y ?? 0, rotation: item.rotation };
                                });
                                updateCurrent({ items: staggered, reasonCardPositions: map });
                                setToast("Zig-zag staggered all cards! ✨");
                              }}
                            >
                              ⚡ Zig-Zag Stagger All
                            </button>
                          </div>

                          <div className="elementPositionLockRow" style={{ marginTop: "4px", marginBottom: "12px" }}>
                            <div className="positionCoordinatesBadge">
                              <span>Position: X: {Math.round(cardPos.x ?? 0)}px, Y: {Math.round(cardPos.y ?? 0)}px</span>
                            </div>
                            {((cardPos.x ?? 0) !== 0 || (cardPos.y ?? 0) !== 0 || (cardPos.rotation ?? 0) !== 0) && (
                              <button
                                type="button"
                                className="btn small ghost resetPosBtn"
                                onClick={() => {
                                  updateSelectedCard({ x: 0, y: 0, rotation: 0 });
                                  setToast(`📍 Reset Card #${safeCardIdx + 1} to center`);
                                }}
                                title="Reset position to default center"
                              >
                                <RotateCcw size={12} />
                                <span>Reset Center</span>
                              </button>
                            )}
                          </div>

                          {/* Card Tilt & Rotation */}
                          <div className="fieldRow">
                            <label className="fieldLabel">
                              <div className="sliderHeader">
                                <span>Card Tilt / Angle</span>
                                <span className="valueBadge">{cardPos.rotation ?? 0}°</span>
                              </div>
                              <input
                                type="range"
                                min="-15"
                                max="15"
                                value={cardPos.rotation ?? 0}
                                onChange={(e) => updateSelectedCard({ rotation: Number(e.target.value) })}
                              />
                            </label>
                            <label className="fieldLabel">
                              <div className="sliderHeader">
                                <span>Card Scale for #{safeCardIdx + 1}</span>
                                <span className="valueBadge">{cardPos.scale ?? (current.reasonCardScale ?? 100)}%</span>
                              </div>
                              <input
                                type="range"
                                min="50"
                                max="150"
                                value={cardPos.scale ?? (current.reasonCardScale ?? 100)}
                                onChange={(e) => updateSelectedCard({ scale: Number(e.target.value) })}
                              />
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Reason Text Sizes & Typography Box */}
                      <div className="controlCard">
                        <span className="controlGroupTitle">💖 Reason Text Sizes & Typography</span>
                        <div className="fieldRow">
                          <label className="fieldLabel">
                            <div className="sliderHeader">
                              <span>Reason Title Size</span>
                              <span className="valueBadge">{current.reasonTitleSize ?? 17}px</span>
                            </div>
                            <input
                              type="range"
                              min="12"
                              max="40"
                              value={current.reasonTitleSize ?? 17}
                              onChange={(e) => {
                                const v = Number(e.target.value);
                                updateCurrent({ reasonTitleSize: v });
                                updateElementStyle("reasonTitle", { size: v });
                              }}
                            />
                          </label>
                          <label className="fieldLabel">
                            <div className="sliderHeader">
                              <span>Reason Text / Body Size</span>
                              <span className="valueBadge">{current.reasonTextSize ?? 14}px</span>
                            </div>
                            <input
                              type="range"
                              min="10"
                              max="32"
                              value={current.reasonTextSize ?? 14}
                              onChange={(e) => {
                                const v = Number(e.target.value);
                                updateCurrent({ reasonTextSize: v });
                                updateElementStyle("reasonText", { size: v });
                              }}
                            />
                          </label>
                        </div>

                        <div className="fieldRow">
                          <label className="fieldLabel">
                            Title Font
                            <select
                              value={current.reasonTitleFont || current.headingFont || globalFont}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateCurrent({ reasonTitleFont: val as FontName });
                                updateElementStyle("reasonTitle", { font: val as FontName });
                              }}
                            >
                              {fontOptions}
                            </select>
                          </label>
                          <label className="fieldLabel">
                            Body Font
                            <select
                              value={current.reasonTextFont || current.bodyFont || globalFont}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateCurrent({ reasonTextFont: val as FontName });
                                updateElementStyle("reasonText", { font: val as FontName });
                              }}
                            >
                              {fontOptions}
                            </select>
                          </label>
                        </div>

                        <div className="fieldRow">
                          <label className="fieldLabel">
                            {cardEditScope === "selected" ? `Title Color (#${safeCardIdx + 1})` : "Title Color"}
                            <input
                              type="color"
                              value={
                                cardEditScope === "selected"
                                  ? (activeItem?.titleColor || current.reasonTitleColor || current.headingColor || globalTextColor)
                                  : (current.reasonTitleColor || current.headingColor || globalTextColor)
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                if (cardEditScope === "selected") {
                                  updateSelectedCard({ titleColor: val });
                                } else {
                                  updateCurrent({ reasonTitleColor: val });
                                  updateElementStyle("reasonTitle", { color: val });
                                }
                              }}
                            />
                          </label>
                          <label className="fieldLabel">
                            {cardEditScope === "selected" ? `Description Color (#${safeCardIdx + 1})` : "Description Color"}
                            <input
                              type="color"
                              value={
                                cardEditScope === "selected"
                                  ? (activeItem?.textColor || current.reasonTextColor || current.bodyColor || globalTextColor)
                                  : (current.reasonTextColor || current.bodyColor || globalTextColor)
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                if (cardEditScope === "selected") {
                                  updateSelectedCard({ textColor: val });
                                } else {
                                  updateCurrent({ reasonTextColor: val });
                                  updateElementStyle("reasonText", { color: val });
                                }
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
                              <span>Wording Opacity</span>
                              <span className="valueBadge">{current.reasonTextOpacity ?? getRoleStyle("reasonText").opacity ?? 100}%</span>
                            </div>
                            <input
                              type="range"
                              min="10"
                              max="100"
                              value={current.reasonTextOpacity ?? getRoleStyle("reasonText").opacity ?? 100}
                              onChange={(e) => {
                                const v = Number(e.target.value);
                                updateCurrent({ reasonTextOpacity: v });
                                updateElementStyle("reasonText", { opacity: v });
                                updateElementStyle("reasonTitle", { opacity: v });
                              }}
                            />
                          </label>
                        </div>

                        <div className="fieldRow">
                          <label className="fieldLabel">
                            <div className="sliderHeader">
                              <span>Emoji Opacity</span>
                              <span className="valueBadge">{current.reasonEmojiOpacity ?? 100}%</span>
                            </div>
                            <input
                              type="range"
                              min="10"
                              max="100"
                              value={current.reasonEmojiOpacity ?? 100}
                              onChange={(e) => {
                                updateCurrent({ reasonEmojiOpacity: Number(e.target.value) });
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      {/* Reasons Items Manager */}
                      <div className="controlCard">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span className="controlGroupTitle">📝 Reason Items ({rList.length})</span>
                          <button
                            type="button"
                            className="btn small primary"
                            onClick={() => {
                              const reasons = [...rList];
                              reasons.push({
                                id: uid(),
                                title: `Reason #${reasons.length + 1}`,
                                text: "Something you adore about them...",
                                emoji: ""
                              });
                              updateCurrent({ items: reasons });
                              setSelectedReasonIdx(reasons.length - 1);
                              setCardEditScope("selected");
                            }}
                          >
                            <Plus size={12} /> Add Reason
                          </button>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
                          {rList.map((r, i) => (
                            <div
                              key={r.id || i}
                              id={`reason-item-editor-${i}`}
                              className="nestedItemCard"
                              style={{
                                border: selectedReasonIdx === i ? "1px solid var(--accent, #ff4f8b)" : "1px solid var(--line)",
                                boxShadow: selectedReasonIdx === i ? "0 0 12px rgba(255, 79, 139, 0.25)" : "none",
                                transition: "all 0.2s ease"
                              }}
                              onClick={() => {
                                setSelectedReasonIdx(i);
                                setCardEditScope("selected");
                              }}
                            >
                              <div className="nestedItemHeader">
                                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent, #ff4f8b)", marginRight: "4px" }}>
                                  #{i + 1}
                                </span>
                                <input
                                  type="text"
                                  className="nestedEmojiInput"
                                  value={r.emoji ?? ""}
                                  placeholder="–"
                                  title="Emoji (leave empty for none)"
                                  onChange={(e) => {
                                    const reasons = [...rList];
                                    reasons[i] = { ...reasons[i], emoji: e.target.value };
                                    updateCurrent({ items: reasons });
                                  }}
                                />
                                <input
                                  type="text"
                                  className="nestedTitleInput"
                                  value={r.title || ""}
                                  onChange={(e) => {
                                    const reasons = [...rList];
                                    reasons[i] = { ...reasons[i], title: e.target.value };
                                    updateCurrent({ items: reasons });
                                  }}
                                  placeholder="Reason title"
                                />
                                <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
                                  <button
                                    type="button"
                                    className="iconBtn tiny"
                                    title="Move Up"
                                    disabled={i === 0}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (i === 0) return;
                                      const reasons = [...rList];
                                      const temp = reasons[i];
                                      reasons[i] = reasons[i - 1];
                                      reasons[i - 1] = temp;
                                      updateCurrent({ items: reasons });
                                      setSelectedReasonIdx(i - 1);
                                      setCardEditScope("selected");
                                    }}
                                    style={{ opacity: i === 0 ? 0.3 : 1 }}
                                  >
                                    ↑
                                  </button>
                                  <button
                                    type="button"
                                    className="iconBtn tiny"
                                    title="Move Down"
                                    disabled={i === rList.length - 1}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (i >= rList.length - 1) return;
                                      const reasons = [...rList];
                                      const temp = reasons[i];
                                      reasons[i] = reasons[i + 1];
                                      reasons[i + 1] = temp;
                                      updateCurrent({ items: reasons });
                                      setSelectedReasonIdx(i + 1);
                                      setCardEditScope("selected");
                                    }}
                                    style={{ opacity: i === rList.length - 1 ? 0.3 : 1 }}
                                  >
                                    ↓
                                  </button>
                                  <button
                                    type="button"
                                    className="dangerIconBtn"
                                    title="Delete this reason"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const reasons = rList.filter((_, idx) => idx !== i);
                                      updateCurrent({ items: reasons });
                                      setSelectedReasonIdx(Math.max(0, i - 1));
                                    }}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                              <textarea
                                rows={2}
                                value={r.text || ""}
                                onChange={(e) => {
                                  const reasons = [...rList];
                                  reasons[i] = { ...reasons[i], text: e.target.value };
                                  updateCurrent({ items: reasons });
                                }}
                                className="nestedItemTextarea"
                                placeholder="Why they are so special..."
                              />

                              {/* Individual Card Custom Overrides Badges */}
                              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "4px" }}>
                                {r.scale !== undefined && (
                                  <span className="cardOverridePill">Scale: {r.scale}%</span>
                                )}
                                {r.width !== undefined && (
                                  <span className="cardOverridePill">Width: {r.width}px</span>
                                )}
                                {(r.x || r.y) ? (
                                  <span className="cardOverridePill">Pos: ({r.x ? (r.x > 0 ? `+${r.x}` : r.x) : 0}, {r.y ? (r.y > 0 ? `+${r.y}` : r.y) : 0})</span>
                                ) : null}
                                {r.rotation ? (
                                  <span className="cardOverridePill">Tilt: {r.rotation}°</span>
                                ) : null}
                                {r.cardColor && (
                                  <span className="cardOverridePill" style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
                                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: r.cardColor, display: "inline-block" }}></span>
                                    Color
                                  </span>
                                )}
                              </div>

                              <button
                                type="button"
                                className={`btn small ${selectedReasonIdx === i && cardEditScope === "selected" ? "primary" : "ghost"}`}
                                style={{ fontSize: "11px", padding: "4px 8px", marginTop: "6px", width: "100%", justifyContent: "center" }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedReasonIdx(i);
                                  setCardEditScope("selected");
                                  if (inspectorBodyRef.current) {
                                    inspectorBodyRef.current.scrollTo({ top: 0, behavior: "smooth" });
                                  }
                                }}
                              >
                                🎯 Adjust Card #{i + 1} Separately
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* MEMORY STORY SECTION */}
                {current.type === "incidents" && (
                  <div className="controlCard">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <span className="controlGroupTitle">📖 Memory Stories Together</span>
                        <span style={{ fontSize: "11px", color: "var(--muted)", display: "block", marginTop: "2px" }}>
                          Add dates, milestone tags, personal stories & photos
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn small"
                        onClick={() => {
                          const incidents = current.incidents ? [...current.incidents] : [...incidentDefaults];
                          incidents.push({
                            id: uid(),
                            title: "A Special Moment",
                            tag: `Memory #${incidents.length + 1}`,
                            date: "",
                            text: "Write about this memorable moment together and why it means so much...",
                            emoji: "✨"
                          });
                          updateCurrent({ incidents });
                          setToast("Added new memory story! ✨");
                        }}
                      >
                        <Plus size={12} /> Add Memory
                      </button>
                    </div>

                    <div className="fieldRow" style={{ marginTop: "12px", borderTop: "1px solid var(--line)", paddingTop: "10px" }}>
                      <label className="fieldLabel">
                        Memory Title Color
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

                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
                      {(current.incidents || incidentDefaults).map((inc, i) => (
                        <div
                          key={inc.id || i}
                          id={`incident-item-editor-${i}`}
                          className="nestedItemCard"
                          style={{
                            padding: "12px",
                            border: "1px solid var(--line)",
                            borderRadius: "12px",
                            background: "rgba(255, 255, 255, 0.03)",
                            boxShadow: "0 4px 14px rgba(0, 0, 0, 0.2)"
                          }}
                        >
                          {/* Row 1: Index, Emoji, Title, Reorder, Delete */}
                          <div className="nestedItemHeader" style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                            <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--accent, #ff4f8b)", background: "rgba(255, 79, 139, 0.15)", padding: "2px 6px", borderRadius: "6px" }}>
                              #{i + 1}
                            </span>
                            <input
                              type="text"
                              className="nestedEmojiInput"
                              value={inc.emoji ?? ""}
                              placeholder="✨"
                              title="Memory Emoji"
                              style={{ width: "38px", textAlign: "center", fontSize: "16px" }}
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
                              placeholder="Memory Title (e.g. The Rainy Road Trip)"
                              style={{ flex: 1, fontWeight: 600 }}
                            />
                            {i > 0 && (
                              <button
                                type="button"
                                title="Move Up"
                                className="ghostBtn"
                                style={{ padding: "4px", background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer" }}
                                onClick={() => {
                                  const list = current.incidents ? [...current.incidents] : [...incidentDefaults];
                                  const temp = list[i - 1];
                                  list[i - 1] = list[i];
                                  list[i] = temp;
                                  updateCurrent({ incidents: list });
                                }}
                              >
                                <ArrowUp size={13} />
                              </button>
                            )}
                            {i < (current.incidents || incidentDefaults).length - 1 && (
                              <button
                                type="button"
                                title="Move Down"
                                className="ghostBtn"
                                style={{ padding: "4px", background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer" }}
                                onClick={() => {
                                  const list = current.incidents ? [...current.incidents] : [...incidentDefaults];
                                  const temp = list[i + 1];
                                  list[i + 1] = list[i];
                                  list[i] = temp;
                                  updateCurrent({ incidents: list });
                                }}
                              >
                                <ArrowDown size={13} />
                              </button>
                            )}
                            <button
                              type="button"
                              className="dangerIconBtn"
                              title="Delete this memory"
                              onClick={() => {
                                const list = (current.incidents || incidentDefaults).filter((_, idx) => idx !== i);
                                updateCurrent({ incidents: list });
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          {/* Row 2: Date and Badge Tag */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "8px" }}>
                            <div>
                              <label style={{ fontSize: "10px", color: "var(--muted)", display: "block", marginBottom: "2px" }}>
                                📅 Date / Milestone
                              </label>
                              <input
                                type="text"
                                value={inc.date || ""}
                                placeholder="e.g. Oct 14, 2023 or First Day"
                                style={{ width: "100%", fontSize: "12px", padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--line)", background: "rgba(0,0,0,0.25)", color: "inherit", boxSizing: "border-box" }}
                                onChange={(e) => {
                                  const list = current.incidents ? [...current.incidents] : [...incidentDefaults];
                                  list[i] = { ...list[i], date: e.target.value };
                                  updateCurrent({ incidents: list });
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: "10px", color: "var(--muted)", display: "block", marginBottom: "2px" }}>
                                🏷️ Badge Tag
                              </label>
                              <input
                                type="text"
                                value={inc.tag || ""}
                                placeholder="e.g. Core Memory or Most Hilarious"
                                style={{ width: "100%", fontSize: "12px", padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--line)", background: "rgba(0,0,0,0.25)", color: "inherit", boxSizing: "border-box" }}
                                onChange={(e) => {
                                  const list = current.incidents ? [...current.incidents] : [...incidentDefaults];
                                  list[i] = { ...list[i], tag: e.target.value };
                                  updateCurrent({ incidents: list });
                                }}
                              />
                            </div>
                          </div>

                          {/* Row 3: Photo Attachment */}
                          <div style={{ marginTop: "10px" }}>
                            <label style={{ fontSize: "10px", color: "var(--muted)", display: "block", marginBottom: "4px" }}>
                              📸 Memory Photo (Optional)
                            </label>
                            {inc.image ? (
                              <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(0,0,0,0.3)", padding: "6px 10px", borderRadius: "8px", border: "1px solid var(--line)" }}>
                                <img
                                  src={inc.image}
                                  alt={inc.title}
                                  style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "6px", border: "1px solid var(--line)" }}
                                />
                                <div style={{ display: "flex", gap: "6px", flex: 1 }}>
                                  <button
                                    type="button"
                                    className="btn small"
                                    style={{ fontSize: "11px", padding: "4px 10px" }}
                                    onClick={() => {
                                      setActiveIncidentIdx(i);
                                      incidentPhotoInputRef.current?.click();
                                    }}
                                  >
                                    Change Photo
                                  </button>
                                  <button
                                    type="button"
                                    className="btn small ghost"
                                    style={{ fontSize: "11px", padding: "4px 8px", color: "#f87171" }}
                                    onClick={() => {
                                      const list = current.incidents ? [...current.incidents] : [...incidentDefaults];
                                      list[i] = { ...list[i], image: undefined };
                                      updateCurrent({ incidents: list });
                                    }}
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="btn small ghost"
                                style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", padding: "6px 12px", border: "1.5px dashed var(--line)", borderRadius: "8px", background: "rgba(255,255,255,0.02)" }}
                                onClick={() => {
                                  setActiveIncidentIdx(i);
                                  incidentPhotoInputRef.current?.click();
                                }}
                              >
                                <Camera size={13} /> + Attach Memory Photo
                              </button>
                            )}
                          </div>

                          {/* Row 4: Story Description */}
                          <div style={{ marginTop: "10px" }}>
                            <label style={{ fontSize: "10px", color: "var(--muted)", display: "block", marginBottom: "2px" }}>
                              ✍️ Memory Story / What happened
                            </label>
                            <textarea
                              rows={3}
                              value={inc.text || ""}
                              onChange={(e) => {
                                const list = current.incidents ? [...current.incidents] : [...incidentDefaults];
                                list[i] = { ...list[i], text: e.target.value };
                                updateCurrent({ incidents: list });
                              }}
                              className="nestedItemTextarea"
                              placeholder="Write the story of what happened together and why you cherish it..."
                              style={{ width: "100%", fontSize: "13px", padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--line)", background: "rgba(0,0,0,0.25)", color: "inherit", resize: "vertical", boxSizing: "border-box" }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CAKE FULL CUSTOMIZATION SUITE: SIZE, TEXTURE, COLOR, CANDLES */}
                {current.type === "cake" && (
                  <>
                    {/* 1. Cake Size & Dimensions */}
                    <div className="controlCard" id="cake-customizer-panel">
                      <span className="controlGroupTitle">📐 Cake Size & Scale</span>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <span style={{ fontSize: "12px", color: "var(--muted)" }}>Overall Scale</span>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--accent)" }}>{current.cakeScale ?? 100}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="150"
                        step="5"
                        value={current.cakeScale ?? 100}
                        onChange={(e) => updateCurrent({ cakeScale: Number(e.target.value) })}
                        style={{ width: "100%", accentColor: "var(--accent)" }}
                      />
                      <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                        {[75, 100, 125].map((s) => (
                          <button
                            key={s}
                            type="button"
                            className="btn small ghost"
                            style={{ flex: 1, padding: "4px 8px", fontSize: "11px" }}
                            onClick={() => updateCurrent({ cakeScale: s })}
                          >
                            {s === 75 ? "Compact (75%)" : s === 100 ? "Default (100%)" : "Large (125%)"}
                          </button>
                        ))}
                      </div>
                    </div>


                    {/* 0. Cake Model & Style Presets */}
                    <div className="controlCard" style={{ background: "linear-gradient(135deg, rgba(255, 61, 120, 0.15), rgba(245, 158, 11, 0.12))", border: "1px solid rgba(255, 61, 120, 0.35)" }}>
                      <span className="controlGroupTitle" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>✨</span> Cake Style Presets
                      </span>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginTop: "8px" }}>
                        {[
                          {
                            id: "racing-3d",
                            label: "🏎️ 3D Nitro Racing",
                            sub: "Stunt loop, ramp cars & flame ring",
                            config: {
                              cakeModel: "racing-3d" as const,
                              cakeCandleShape: "racing" as const,
                              cakeCandleCount: 3,
                              cakeTexture: "checkered" as const,
                              cakeRacingTrack: true,
                              cakeCherries: false,
                              cakeHeartSwags: false,
                              cakeColor: "#0284c7",
                              cakeTopColor: "#38bdf8",
                              cakeCreamColor: "#ffffff",
                              cakePlateColor: "#0f172a",
                              cakeCandleColor: "#0284c7",
                              cakeCandleStripeColor: "#f97316",
                              cakeFlameColor: "gold",
                              cakeCelebrationEmoji: "🏎️🔥🏁"
                            }
                          },
                          {
                            id: "comic-2d",
                            label: "🎨 2D Comic Cake",
                            sub: "Pop-art cartoon ink & cherries",
                            config: {
                              cakeModel: "comic-2d" as const,
                              cakeCandleShape: "comic" as const,
                              cakeCandleCount: 1,
                              cakeTexture: "comic-pop" as const,
                              cakeCherries: true,
                              cakeHeartSwags: false,
                              cakeRacingTrack: false,
                              cakeColor: "#ff4f8b",
                              cakeTopColor: "#ff4f8b",
                              cakeCreamColor: "#ffffff",
                              cakePlateColor: "#ffffff",
                              cakeCandleColor: "#ffffff",
                              cakeCandleStripeColor: "#ff4f8b",
                              cakeFlameColor: "comic",
                              cakeCelebrationEmoji: "🎨🎂✨"
                            }
                          },
                          {
                            id: "romantic-hearts",
                            label: "💖 Romantic Heart Cake",
                            sub: "Heart candles, draped swags & blush pink",
                            config: {
                              cakeModel: "romantic-hearts" as const,
                              cakeCandleShape: "heart" as const,
                              cakeTexture: "hearts" as const,
                              cakeCherries: false,
                              cakeHeartSwags: true,
                              cakeRacingTrack: false,
                              cakeColor: "#ff7597",
                              cakeTopColor: "#fff0f5",
                              cakeCreamColor: "#ffe4ec",
                              cakeCandleColor: "#fff5f8",
                              cakeCandleStripeColor: "#ff4d79",
                              cakeFlameColor: "pink",
                              cakeCelebrationEmoji: "💖🎂✨"
                            }
                          },
                          {
                            id: "double-heart-wish",
                            label: "💕 Double Heart Topper",
                            sub: "Interlocking twin hearts & ribbons",
                            config: {
                              cakeModel: "romantic-hearts" as const,
                              cakeCandleShape: "double-heart" as const,
                              cakeTexture: "velvet" as const,
                              cakeCherries: false,
                              cakeHeartSwags: true,
                              cakeRacingTrack: false,
                              cakeColor: "#f472b6",
                              cakeTopColor: "#fff1f7",
                              cakeCreamColor: "#ffe4e6",
                              cakeCandleColor: "#ffe4e6",
                              cakeCandleStripeColor: "#ec4899",
                              cakeFlameColor: "gold",
                              cakeCelebrationEmoji: "💕✨🎂"
                            }
                          },
                          {
                            id: "classic-bday",
                            label: "🎂 Classic Birthday",
                            sub: "Striped candles & smooth glaze",
                            config: {
                              cakeModel: "classic" as const,
                              cakeCandleShape: "standard" as const,
                              cakeTexture: "smooth" as const,
                              cakeCherries: false,
                              cakeHeartSwags: false,
                              cakeRacingTrack: false,
                              cakeColor: "#ff6f9e",
                              cakeTopColor: "#fff0f5",
                              cakeCreamColor: "#ffffff",
                              cakeCandleColor: "#fff1f7",
                              cakeCandleStripeColor: "#ff6f9e",
                              cakeFlameColor: "gold",
                              cakeCelebrationEmoji: "🎂✨❤️"
                            }
                          },
                          {
                            id: "royal-gold",
                            label: "👑 Royal 24K Gold",
                            sub: "Gold foil shimmer & amber glow",
                            config: {
                              cakeModel: "royal-gold" as const,
                              cakeCandleShape: "sparkler" as const,
                              cakeTexture: "gold" as const,
                              cakeCherries: false,
                              cakeHeartSwags: false,
                              cakeRacingTrack: false,
                              cakeColor: "#d97706",
                              cakeTopColor: "#fffbeb",
                              cakeCreamColor: "#fef3c7",
                              cakeCandleColor: "#fff9d6",
                              cakeCandleStripeColor: "#ffd700",
                              cakeFlameColor: "gold",
                              cakeCelebrationEmoji: "👑✨🍾"
                            }
                          }
                        ].map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            className={`cakePresetBtn ${((current.cakeModel === preset.config.cakeModel && current.cakeCandleShape === preset.config.cakeCandleShape) ? "active" : "")}`}
                            onClick={() => {
                              updateCurrent(preset.config);
                              setToast(`✨ Applied ${preset.label}`);
                            }}
                          >
                            <span className="cakePresetTitle">{preset.label}</span>
                            <span className="cakePresetSub">{preset.sub}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 2. Frosting Texture & Style */}
                    <div className="controlCard">
                      <span className="controlGroupTitle">🧁 Frosting Texture & Style</span>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "8px" }}>
                        {[
                          { id: "smooth", label: "Smooth Glaze", icon: "🎂" },
                          { id: "checkered", label: "Checkered Flag", icon: "🏁" },
                          { id: "comic-pop", label: "2D Comic Pop", icon: "🎨" },
                          { id: "hearts", label: "Sweet Hearts", icon: "💖" },
                          { id: "drip", label: "Drip Glaze", icon: "🍫" },
                          { id: "sprinkles", label: "Party Sprinkles", icon: "🍬" },
                          { id: "striped", label: "Bakery Stripes", icon: "🎨" },
                          { id: "stars", label: "Star Sparkles", icon: "✨" },
                          { id: "velvet", label: "Royal Velvet", icon: "🌹" },
                          { id: "gold", label: "24K Gold Foil", icon: "👑" }
                        ].map((tex) => (
                          <button
                            key={tex.id}
                            type="button"
                            className={`btn small ${((current.cakeTexture || "smooth") === tex.id) ? "primary" : "ghost"}`}
                            style={{ justifyContent: "flex-start", padding: "8px 10px", fontSize: "12px", gap: "6px" }}
                            onClick={() => updateCurrent({ cakeTexture: tex.id as any })}
                          >
                            <span>{tex.icon}</span>
                            <span>{tex.label}</span>
                          </button>
                        ))}
                      </div>

                      {/* Cake Decor Options: Cherries & Heart Swags & Racing Track */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "12px" }}>
                        <label className="fieldLabel" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.05)", padding: "8px 10px", borderRadius: "10px", border: "1px solid var(--line)" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600 }}>
                            <span>🏎️</span> 3D Racing Ramp & Stunt Track
                          </span>
                          <input
                            type="checkbox"
                            checked={Boolean(current.cakeRacingTrack || current.cakeModel === "racing-3d")}
                            onChange={(e) => updateCurrent({ cakeRacingTrack: e.target.checked })}
                            style={{ width: "18px", height: "18px", accentColor: "var(--accent, #ff4f8b)", cursor: "pointer" }}
                          />
                        </label>

                        <label className="fieldLabel" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.05)", padding: "8px 10px", borderRadius: "10px", border: "1px solid var(--line)" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600 }}>
                            <span>🍒</span> Whipped Cream & Cherries
                          </span>
                          <input
                            type="checkbox"
                            checked={Boolean(current.cakeCherries || current.cakeModel === "comic-2d")}
                            onChange={(e) => updateCurrent({ cakeCherries: e.target.checked })}
                            style={{ width: "18px", height: "18px", accentColor: "var(--accent, #ff4f8b)", cursor: "pointer" }}
                          />
                        </label>

                        <label className="fieldLabel" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.05)", padding: "8px 10px", borderRadius: "10px", border: "1px solid var(--line)" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600 }}>
                            <span>🎀</span> Draped Heart Ribbon Swags
                          </span>
                          <input
                            type="checkbox"
                            checked={Boolean(current.cakeHeartSwags || current.cakeTexture === "hearts" || current.cakeModel === "romantic-hearts")}
                            onChange={(e) => updateCurrent({ cakeHeartSwags: e.target.checked })}
                            style={{ width: "18px", height: "18px", accentColor: "var(--accent, #ff4f8b)", cursor: "pointer" }}
                          />
                        </label>
                      </div>
                    </div>

                    {/* 3. Cake Colors & Palette */}
                    <div className="controlCard">
                      <span className="controlGroupTitle">🎨 Cake Colors</span>

                      {/* Description regarding Classic Birthday option */}
                      <div
                        style={{
                          padding: "10px 12px",
                          borderRadius: "8px",
                          background: (!current.cakeModel || current.cakeModel === "classic")
                            ? "rgba(16, 185, 129, 0.08)"
                            : "rgba(245, 158, 11, 0.12)",
                          border: (!current.cakeModel || current.cakeModel === "classic")
                            ? "1px solid rgba(16, 185, 129, 0.25)"
                            : "1px solid rgba(245, 158, 11, 0.35)",
                          marginBottom: "12px",
                          fontSize: "11px",
                          lineHeight: "1.45"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                          <span style={{ fontSize: "14px", lineHeight: 1 }}>
                            {(!current.cakeModel || current.cakeModel === "classic") ? "🎂" : "ℹ️"}
                          </span>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontWeight: 600, color: "var(--foreground, #fff)" }}>
                              These color customizations will work only when the <strong>Classic Birthday</strong> option is enabled.
                            </p>
                            {(!current.cakeModel || current.cakeModel === "classic") ? (
                              <p style={{ margin: "4px 0 0", color: "#10b981", fontSize: "10.5px" }}>
                                ✓ Classic Birthday option is active — your color selections are applied directly.
                              </p>
                            ) : (
                              <div style={{ marginTop: "6px" }}>
                                <p style={{ margin: "0 0 6px", color: "#f59e0b", fontSize: "10.5px" }}>
                                  Currently using a themed style ({current.cakeModel === "racing-3d" ? "🏎️ 3D Nitro Racing" : current.cakeModel === "comic-2d" ? "💥 2D Comic" : current.cakeModel === "royal-gold" ? "👑 Royal 24K Gold" : "💕 Romantic Hearts"}).
                                </p>
                                <button
                                  type="button"
                                  className="btn small"
                                  style={{
                                    fontSize: "11px",
                                    padding: "4px 10px",
                                    background: "var(--accent, #ff4f8b)",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontWeight: 600
                                  }}
                                  onClick={() => {
                                    updateCurrent({
                                      cakeModel: "classic",
                                      cakeTexture: "smooth",
                                      cakeCandleShape: "standard",
                                      cakeRacingTrack: false,
                                      cakeCherries: false
                                    });
                                    setToast("🎂 Enabled Classic Birthday option");
                                  }}
                                >
                                  🎂 Enable Classic Birthday Option
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Quick Color Presets */}
                      <span style={{ fontSize: "11px", color: "var(--muted)", display: "block", marginBottom: "6px" }}>Popular Cake Flavors</span>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
                        {[
                          { name: "Hot Wheels Blue", base: "#0284c7", top: "#38bdf8", cream: "#ffffff" },
                          { name: "Strawberry", base: "#ff6f9e", top: "#fff0f5", cream: "#ffe4ec" },
                          { name: "2D Comic Pink", base: "#ff4f8b", top: "#ff4f8b", cream: "#ffffff" },
                          { name: "Romantic Rose", base: "#ff7597", top: "#fff0f5", cream: "#fce7f3" },
                          { name: "Chocolate", base: "#5c301c", top: "#fff8eb", cream: "#401d0e" },
                          { name: "Vanilla", base: "#fef3c7", top: "#ffffff", cream: "#fde68a" },
                          { name: "Red Velvet", base: "#991b1b", top: "#fff5f5", cream: "#ffffff" },
                          { name: "Matcha", base: "#4ade80", top: "#f0fdf4", cream: "#bbf7d0" },
                          { name: "Lavender", base: "#c084fc", top: "#faf5ff", cream: "#e9d5ff" },
                          { name: "Caramel Gold", base: "#d97706", top: "#fffbeb", cream: "#fef3c7" }
                        ].map((flavor) => (
                          <button
                            key={flavor.name}
                            type="button"
                            title={flavor.name}
                            onClick={() => updateCurrent({ cakeColor: flavor.base, cakeTopColor: flavor.top, cakeCreamColor: flavor.cream, cakeModel: "classic" })}
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "50%",
                              background: flavor.base,
                              border: (current.cakeColor === flavor.base) ? "2px solid #ffffff" : "1px solid rgba(255,255,255,0.3)",
                              boxShadow: (current.cakeColor === flavor.base) ? "0 0 10px rgba(255,255,255,0.6)" : "none",
                              cursor: "pointer"
                            }}
                          />
                        ))}
                      </div>

                      <div className="fieldRow">
                        <label className="fieldLabel">
                          Cake Frosting Color
                          <input
                            type="color"
                            value={current.cakeColor || "#ff6f9e"}
                            onChange={(e) => updateCurrent({ cakeColor: e.target.value, cakeModel: "classic" })}
                          />
                        </label>
                        <label className="fieldLabel">
                          Top Glaze Color
                          <input
                            type="color"
                            value={current.cakeTopColor || "#fff2f7"}
                            onChange={(e) => updateCurrent({ cakeTopColor: e.target.value, cakeModel: "classic" })}
                          />
                        </label>
                      </div>

                      <div className="fieldRow" style={{ marginTop: "8px" }}>
                        <label className="fieldLabel">
                          Middle Cream Color
                          <input
                            type="color"
                            value={current.cakeCreamColor || "#ffffff"}
                            onChange={(e) => updateCurrent({ cakeCreamColor: e.target.value, cakeModel: "classic" })}
                          />
                        </label>
                        <label className="fieldLabel">
                          Serving Platter Color
                          <input
                            type="color"
                            value={current.cakePlateColor || "#ffffff"}
                            onChange={(e) => updateCurrent({ cakePlateColor: e.target.value, cakeModel: "classic" })}
                          />
                        </label>
                      </div>
                    </div>

                    {/* 4. Candle Customization */}
                    <div className="controlCard">
                      <span className="controlGroupTitle">🕯️ Candles, Hearts & Flames</span>
                      
                      {/* Candle Shape / Topper Selector */}
                      <label className="fieldLabel" style={{ marginBottom: "10px" }}>
                        Candle Shape & Topper
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginTop: "6px" }}>
                          {[
                            { id: "racing", label: "🏎️ Racing Stripes", desc: "Nitro Speed Stripes" },
                            { id: "standard", label: "🕯️ Classic Stick", desc: "Traditional Stripe" },
                            { id: "comic", label: "🎨 Comic Candle", desc: "Bold Cartoon Stripe" },
                            { id: "heart", label: "💖 Heart Candle", desc: "Sculpted 3D Heart" },
                            { id: "double-heart", label: "💕 Double Heart", desc: "Interlocking Topper" },
                            { id: "spiral", label: "🍭 Spiral Taper", desc: "Candy Cane Stripe" },
                            { id: "sparkler", label: "✨ Star Sparkler", desc: "Golden Rod" }
                          ].map((shape) => (
                            <button
                              key={shape.id}
                              type="button"
                              className={`btn small ${((current.cakeCandleShape || (current.cakeModel === "racing-3d" ? "racing" : current.cakeModel === "comic-2d" ? "comic" : "standard")) === shape.id) ? "primary" : "ghost"}`}
                              style={{ flexDirection: "column", alignItems: "flex-start", padding: "6px 8px", gap: "1px" }}
                              onClick={() => updateCurrent({ cakeCandleShape: shape.id as any })}
                            >
                              <span style={{ fontSize: "11.5px", fontWeight: 700 }}>{shape.label}</span>
                              <span style={{ fontSize: "9.5px", opacity: 0.75 }}>{shape.desc}</span>
                            </button>
                          ))}
                        </div>
                      </label>

                      {current.cakeCandleShape !== "double-heart" && current.cakeCandleShape !== "flame-arch" && (
                        <label className="fieldLabel" style={{ marginBottom: "8px" }}>
                          Number of Candles (1 – 10)
                          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginTop: "6px" }}>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                              <button
                                key={num}
                                type="button"
                                className={`btn small ${((current.cakeCandleCount ?? (current.cakeModel === "comic-2d" ? 1 : 3)) === num) ? "primary" : "ghost"}`}
                                style={{ width: "32px", height: "30px", padding: 0, fontSize: "12px", fontWeight: 600 }}
                                onClick={() => updateCurrent({ cakeCandleCount: num })}
                              >
                                {num}
                              </button>
                            ))}
                          </div>
                        </label>
                      )}

                      <div className="fieldRow" style={{ marginTop: "10px" }}>
                        <label className="fieldLabel">
                          Candle / Heart Base
                          <input
                            type="color"
                            value={current.cakeCandleColor || "#fff1f7"}
                            onChange={(e) => updateCurrent({ cakeCandleColor: e.target.value })}
                          />
                        </label>
                        <label className="fieldLabel">
                          Heart / Stripe Accent
                          <input
                            type="color"
                            value={current.cakeCandleStripeColor || "#ff6f9e"}
                            onChange={(e) => updateCurrent({ cakeCandleStripeColor: e.target.value })}
                          />
                        </label>
                      </div>

                      <div className="fieldRow" style={{ marginTop: "8px" }}>
                        <label className="fieldLabel">
                          Flame Glow Style
                          <select
                            value={current.cakeFlameColor || (current.cakeModel === "comic-2d" ? "comic" : "gold")}
                            onChange={(e) => updateCurrent({ cakeFlameColor: e.target.value })}
                            style={{
                              background: "rgba(255, 255, 255, 0.08)",
                              color: "var(--text)",
                              border: "1px solid var(--line)",
                              borderRadius: "8px",
                              padding: "6px 8px",
                              marginTop: "4px"
                            }}
                          >
                            <option value="sparkler">✨ Real Fireworks Sparkler</option>
                            <option value="comic">🎨 2D Comic Cartoon Flame</option>
                            <option value="gold">🟡 Warm Amber Glow</option>
                            <option value="pink">💖 Magical Pink Glow</option>
                            <option value="blue">💎 Mystic Blue Flame</option>
                            <option value="purple">💜 Neon Violet Flame</option>
                            <option value="green">💚 Emerald Flame</option>
                          </select>
                        </label>

                        {current.cakeCandleShape !== "double-heart" && (
                          <label className="fieldLabel">
                            Candle Height
                            <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
                              {[
                                { label: "Short", h: 50 },
                                { label: "Medium", h: 64 },
                                { label: "Tall", h: 80 }
                              ].map((ch) => (
                                <button
                                  key={ch.h}
                                  type="button"
                                  className={`btn small ${((current.cakeCandleHeight ?? 64) === ch.h) ? "primary" : "ghost"}`}
                                  style={{ flex: 1, padding: "5px 6px", fontSize: "11px" }}
                                  onClick={() => updateCurrent({ cakeCandleHeight: ch.h })}
                                >
                                  {ch.label}
                                </button>
                              ))}
                            </div>
                          </label>
                        )}
                      </div>

                      {/* Optional Sparkler Fountain Candle Effect */}
                      <div
                        style={{
                          marginTop: "12px",
                          padding: "10px 12px",
                          borderRadius: "10px",
                          background: current.cakeSparkler
                            ? "linear-gradient(135deg, rgba(255, 215, 0, 0.18), rgba(255, 107, 0, 0.12))"
                            : "rgba(255, 255, 255, 0.05)",
                          border: current.cakeSparkler
                            ? "1.5px solid rgba(255, 215, 0, 0.6)"
                            : "1px solid var(--line)",
                          boxShadow: current.cakeSparkler
                            ? "0 0 16px rgba(255, 215, 0, 0.25)"
                            : "none",
                          transition: "all 0.2s ease"
                        }}
                      >
                        <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", margin: 0 }}>
                          <div style={{ paddingRight: "10px" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700, color: current.cakeSparkler ? "#ffd700" : "var(--text)" }}>
                              <span>✨</span> Sparkler Fountain Candle
                            </span>
                            <span style={{ fontSize: "10.5px", color: "var(--muted)", display: "block", marginTop: "2px" }}>
                              Radiating starburst rays, fireworks sparks & crackling light
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            checked={Boolean(current.cakeSparkler || current.cakeFlameColor === "sparkler")}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              updateCurrent({
                                cakeSparkler: checked,
                                cakeFlameColor: checked ? "sparkler" : "gold",
                                cakeSparklerScale: current.cakeSparklerScale ?? 45
                              });
                              setToast(checked ? "✨ Sparkler fountain candles enabled!" : "🕯️ Classic candle flame restored");
                            }}
                            style={{ width: "18px", height: "18px", accentColor: "#ffd700", cursor: "pointer" }}
                          />
                        </label>

                        {Boolean(current.cakeSparkler || current.cakeFlameColor === "sparkler") && (
                          <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: "1px dashed rgba(255, 215, 0, 0.3)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                              <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)" }}>Sparkle Size</span>
                              <span style={{ fontSize: "11px", fontWeight: 700, color: "#ffd700" }}>{current.cakeSparklerScale ?? 45}%</span>
                            </div>
                            <input
                              type="range"
                              min="20"
                              max="75"
                              step="5"
                              value={current.cakeSparklerScale ?? 45}
                              onChange={(e) => updateCurrent({ cakeSparklerScale: Number(e.target.value) })}
                              style={{ width: "100%", accentColor: "#ffd700", cursor: "pointer" }}
                            />
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9.5px", color: "var(--muted)", marginTop: "2px" }}>
                              <span>Dainty (20%)</span>
                              <span>Balanced (45%)</span>
                              <span>Festive (75%)</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 5. Cake Finale Wish Text */}
                    <div className="controlCard">
                      <span className="controlGroupTitle">🎉 Celebration Card</span>
                      
                      <label className="fieldLabel">
                        Emojis
                        <input
                          type="text"
                          value={current.cakeCelebrationEmoji ?? "🎂✨❤️"}
                          onChange={(e) => updateCurrent({ cakeCelebrationEmoji: e.target.value })}
                          placeholder="🎂✨❤️"
                        />
                        <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                          {["🎂✨❤️", "🎉🥳🍾", "🌟💖💫", "🍰🎈🎁"].map((em) => (
                            <button
                              key={em}
                              type="button"
                              className="btn small ghost"
                              style={{ padding: "3px 7px", fontSize: "12px" }}
                              onClick={() => updateCurrent({ cakeCelebrationEmoji: em })}
                            >
                              {em}
                            </button>
                          ))}
                        </div>
                      </label>

                      <label className="fieldLabel" style={{ marginTop: "10px" }}>
                        Heading
                        <input
                          type="text"
                          value={current.cakeWishHeading || current.subtitle || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateCurrent({ cakeWishHeading: val, subtitle: val });
                          }}
                          placeholder="Happy Birthday once again!"
                        />
                      </label>

                      <label className="fieldLabel" style={{ marginTop: "8px" }}>
                        Message
                        <textarea
                          rows={2}
                          value={current.cakeWishText || current.text || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateCurrent({ cakeWishText: val, text: val });
                          }}
                          placeholder="May your year ahead be filled with immense joy..."
                        />
                      </label>

                      <div className="fieldRow" style={{ marginTop: "8px" }}>
                        <label className="fieldLabel">
                          Heading Color
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
                          Message Color
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

                      <label className="fieldLabel" style={{ marginTop: "8px" }}>
                        Button Label
                        <input
                          type="text"
                          value={current.cakeResetButtonText || "Light candles again"}
                          onChange={(e) => updateCurrent({ cakeResetButtonText: e.target.value })}
                          placeholder="Light candles again"
                        />
                      </label>
                    </div>
                  </>
                )}

                {/* SECRET / REVEAL SECTION */}
                {current.type === "secret" && (
                  <>
                    {/* 1. Hidden Media in Reveal */}
                    <div className="controlCard">
                      <span className="controlGroupTitle">🤫 Hidden Media inside Reveal</span>
                      <p style={{ fontSize: "11px", color: "var(--muted)", margin: "2px 0 10px 0" }}>
                        Photos and videos uploaded here stay locked & hidden until your recipient taps the reveal button!
                      </p>

                      {/* Hidden Photo */}
                      <label className="fieldLabel" style={{ marginBottom: "10px" }}>
                        Surprise Photo
                        {(galleryImages.length > 0 || current.image || current.secretImage) ? (
                          <div className="miniMediaRow" style={{ marginTop: "6px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <img
                                src={galleryImages[0] || current.image || current.secretImage}
                                alt="Secret preview"
                                style={{ width: "36px", height: "36px", borderRadius: "6px", objectFit: "cover", border: "1px solid rgba(255,255,255,0.2)" }}
                              />
                              <span style={{ fontSize: "12px", color: "var(--text)" }}>Hidden Photo Attached</span>
                            </div>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button
                                type="button"
                                className="btn small"
                                onClick={() => heroPhotoInputRef.current?.click()}
                              >
                                Replace
                              </button>
                              <button
                                type="button"
                                className="btn small danger"
                                onClick={() => {
                                  updateCurrent({
                                    images: [],
                                    image: "",
                                    secretImage: ""
                                  });
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="btn small primary full"
                            style={{ marginTop: "4px" }}
                            onClick={() => {
                              setActiveElementCategory("photo");
                              heroPhotoInputRef.current?.click();
                            }}
                          >
                            📸 + Add Surprise Photo to Reveal
                          </button>
                        )}
                      </label>

                      {/* Hidden Video */}
                      <label className="fieldLabel">
                        Surprise Video
                        {(current.video || current.memoryVideo || current.secretVideo) ? (
                          <div className="miniMediaRow" style={{ marginTop: "6px" }}>
                            <span style={{ fontSize: "12px", color: "var(--text)" }}>
                              🎥 {current.videoName || "Hidden Video Attached"}
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
                                onClick={() => {
                                  updateCurrent({
                                    video: "",
                                    memoryVideo: "",
                                    secretVideo: "",
                                    videoName: ""
                                  });
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="btn small primary full"
                            style={{ marginTop: "4px" }}
                            disabled={totalVideoCount >= 3}
                            onClick={() => {
                              setActiveElementCategory("video");
                              videoInputRef.current?.click();
                            }}
                          >
                            🎥 + Add Surprise Video to Reveal
                          </button>
                        )}
                      </label>
                    </div>

                    {/* 2. Secret Message */}
                    <div className="controlCard">
                      <span className="controlGroupTitle">💬 Secret Message Card</span>
                      <label className="fieldLabel">
                        Hidden Message (Revealed on Tap)
                        <textarea
                          id="secret-reveal-textarea-cards"
                          rows={3}
                          value={current.text || ""}
                          onChange={(e) => updateCurrent({ text: e.target.value })}
                          placeholder="Write something special that only appears upon tapping..."
                        />
                      </label>

                      {/* Font Family & Font Size */}
                      <div className="fieldRow" style={{ marginTop: "8px" }}>
                        <label className="fieldLabel">
                          Font Family
                          <select
                            value={current.secretTextFont || current.bodyFont || current.font || globalFont}
                            onChange={(e) => {
                              const val = e.target.value as FontName;
                              updateCurrent({ secretTextFont: val });
                              updateElementStyle("secretText", { font: val });
                              updateElementStyle("secretMessage", { font: val });
                            }}
                          >
                            {fontOptions}
                          </select>
                        </label>
                        <label className="fieldLabel">
                          <div className="sliderHeader">
                            <span>Font Size</span>
                            <span className="valueBadge">{current.secretTextSize ?? getRoleStyle("secretText").size ?? 28}px</span>
                          </div>
                          <input
                            type="range"
                            min="14"
                            max="72"
                            value={current.secretTextSize ?? getRoleStyle("secretText").size ?? 28}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              updateCurrent({ secretTextSize: val });
                              updateElementStyle("secretText", { size: val });
                              updateElementStyle("secretMessage", { size: val });
                            }}
                          />
                        </label>
                      </div>

                      {/* Quick Size Presets */}
                      <div style={{ marginTop: "4px", marginBottom: "8px" }}>
                        <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 500, display: "block", marginBottom: "4px" }}>Quick Size Presets:</span>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          {[
                            { label: "Compact", size: 20 },
                            { label: "Normal", size: 28 },
                            { label: "Large", size: 36 },
                            { label: "Extra Large", size: 48 },
                            { label: "Huge", size: 60 }
                          ].map((preset) => (
                            <button
                              key={preset.label}
                              type="button"
                              className="btn small ghost"
                              style={{
                                fontSize: "11px",
                                padding: "2px 8px",
                                height: "24px",
                                borderRadius: "999px",
                                background: (current.secretTextSize ?? 28) === preset.size ? "var(--local, #ff4f8b)" : "rgba(255, 255, 255, 0.08)",
                                color: (current.secretTextSize ?? 28) === preset.size ? "#ffffff" : "inherit"
                              }}
                              onClick={() => {
                                updateCurrent({ secretTextSize: preset.size });
                                updateElementStyle("secretText", { size: preset.size });
                                updateElementStyle("secretMessage", { size: preset.size });
                              }}
                            >
                              {preset.label} ({preset.size}px)
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="fieldRow" style={{ marginTop: "8px" }}>
                        <label className="fieldLabel">
                          Message Color
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
                      </div>
                    </div>

                    {/* 3. Action Buttons */}
                    <div className="controlCard">
                      <span className="controlGroupTitle">🔘 Reveal & Hide Buttons</span>
                      <label className="fieldLabel">
                        Reveal Button Text
                        <input
                          type="text"
                          value={current.revealButtonText || "Tap to reveal"}
                          onChange={(e) => updateCurrent({ revealButtonText: e.target.value })}
                          placeholder="Tap to reveal"
                        />
                      </label>

                      <label className="fieldLabel" style={{ marginTop: "8px" }}>
                        Hide Button Text
                        <input
                          type="text"
                          value={current.secretHideButtonText || "Hide again"}
                          onChange={(e) => updateCurrent({ secretHideButtonText: e.target.value })}
                          placeholder="Hide again"
                        />
                      </label>
                    </div>
                  </>
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

            <div className="canvasToolbarActions">
              <button
                type="button"
                className={`canvasLockBtn ${positionsLocked ? "is-locked" : "is-unlocked"}`}
                onClick={() => {
                  const nextState = !positionsLocked;
                  setPositionsLocked(nextState);
                  setToast(nextState ? "🔒 All positions locked (dragging disabled)" : "🔓 Positions unlocked (drag any element to position it)");
                }}
                title={positionsLocked ? "Positions are locked. Click to unlock and drag elements." : "Positions are unlocked. Click to lock all elements in place."}
              >
                {positionsLocked ? (
                  <>
                    <Lock size={13} />
                    <span>Positions Locked</span>
                  </>
                ) : (
                  <>
                    <Unlock size={13} />
                    <span>Positions Unlocked</span>
                  </>
                )}
              </button>

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
          </div>

          {/* Controlled Greeting Viewport */}
          <div className={`greetingViewportWrapper device-${previewDevice}`}>
            {/* Mobile Quick Section Switcher Carousel */}
            <div className="mobileQuickSectionBar" role="tablist" aria-label="Section Quick Switcher">
              {blocks.map((b, idx) => {
                const isActive = idx === scene;
                return (
                  <button
                    key={b.id || idx}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`mobileSectionChip ${isActive ? "active" : ""}`}
                    onClick={() => selectSection(idx)}
                  >
                    <span className="chipEmoji">
                      {b.emoji || (b.type === "reasons" ? "💖" : b.type === "memories" ? "📸" : b.type === "incidents" ? "✨" : b.type === "letter" ? "💌" : b.type === "cake" ? "🎂" : "🌟")}
                    </span>
                    <span className="chipTitle">{b.title || `Section ${idx + 1}`}</span>
                  </button>
                );
              })}
              <button
                type="button"
                className="mobileSectionChip addChip"
                onClick={() => setAddSectionModalOpen(true)}
                title="Add new section"
              >
                <Plus size={13} />
                <span>Add</span>
              </button>
            </div>

            <div className="greetingCanvasContainer">
              <GreetingView
                project={memoizedProject}
                sceneIndex={scene}
                onSceneChange={selectSection}
                isEditable={!previewOnly}
                positionsLocked={positionsLocked}
                selectedCardIndex={current.type === "reasons" ? selectedReasonIdx : undefined}
                onSelectElement={handleSelectElement}
                onEditSection={handleSelectSectionById}
                onUpdateBlock={(blockId, patch) => {
                  setBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, ...patch } : b)));
                  setDraftStatus("unsaved");
                }}
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

            {/* Mobile Quick Action Footer Bar */}
            <div className="mobileCanvasQuickActions">
              <button
                type="button"
                className="mobileQuickEditBtn"
                onClick={() => {
                  setMobileEditOpen(true);
                  setMobileStoryFlowOpen(false);
                }}
              >
                <Pencil size={14} />
                <span>Edit Current Section ({current.title || current.type})</span>
              </button>
              <div className="mobileQuickNavRow">
                <button
                  type="button"
                  className="mobileNavArrowBtn"
                  disabled={scene === 0}
                  onClick={() => selectSection(Math.max(0, scene - 1))}
                  title="Previous section"
                >
                  <ArrowLeft size={14} /> Prev
                </button>
                <span className="mobileStepIndicator">
                  {scene + 1} / {blocks.length}
                </span>
                <button
                  type="button"
                  className="mobileNavArrowBtn"
                  disabled={scene >= blocks.length - 1}
                  onClick={() => selectSection(Math.min(blocks.length - 1, scene + 1))}
                  title="Next section"
                >
                  Next <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================================= */}
        {/* RIGHT COLUMN: GLOBAL DESIGN & STORY FLOW SIDEBAR                        */}
        {/* ======================================================================= */}
        <aside className={`studioRight ${mobileStoryFlowOpen ? "mobileOpen" : ""} drawer-${mobileDrawerHeight}`}>
          {mobileStoryFlowOpen && (
            <div
              className="drawerGrabHandle"
              onClick={() => setMobileDrawerHeight((prev) => (prev === "half" ? "full" : "half"))}
              title="Tap to toggle drawer size"
            >
              <div className="grabBar" />
            </div>
          )}
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
            </div>
            {mobileStoryFlowOpen && (
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <button
                  type="button"
                  className="drawerSizeToggleBtn"
                  onClick={() => setMobileDrawerHeight((prev) => (prev === "half" ? "full" : "half"))}
                  title={mobileDrawerHeight === "half" ? "Expand panel" : "Minimize panel"}
                >
                  {mobileDrawerHeight === "half" ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
                </button>
                <button
                  type="button"
                  className="closeDrawerBtn"
                  onClick={() => setMobileStoryFlowOpen(false)}
                  title="Close panel"
                >
                  <X size={16} />
                </button>
              </div>
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
                  <span className="controlGroupTitle">🎨 Hamora Theme Presets</span>
                  <div className="themePresetGrid">
                    {[
                      { id: "liquid-glass", name: "Liquid Glass", baseColor: "#0b0614", accent: "#ff4f9a", accent2: "#38bdf8", font: "serif" as FontName, textColor: "#fff8fc", cardColor: "#ffffff" },
                      { id: "dark", name: "Dark Velvet", baseColor: "#0b0810", accent: "#ff4f8b", accent2: "#ff9fc2", font: "serif" as FontName, textColor: "#fff7fb", cardColor: "#ffffff" },
                      { id: "romantic", name: "Rose Gold", baseColor: "#160914", accent: "#ff3d78", accent2: "#ff86b0", font: "great-vibes" as FontName, textColor: "#fff4f8", cardColor: "#ffffff" },
                      { id: "dreamy", name: "Twilight Glow", baseColor: "#0d1020", accent: "#9b7cff", accent2: "#cbbdff", font: "serif" as FontName, textColor: "#f7f5ff", cardColor: "#ffffff" },
                      { id: "system", name: "Midnight Sparkle", baseColor: "#101015", accent: "#e879a0", accent2: "#f4a6c0", font: "sans" as FontName, textColor: "#f8f7fb", cardColor: "#ffffff" },
                      { id: "light", name: "Minimalist Light", baseColor: "#fff7f4", accent: "#d34f75", accent2: "#a23d60", font: "sans" as FontName, textColor: "#2d2027", cardColor: "#ffffff" }
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        className={`themePresetButton ${theme === t.id ? "active" : ""}`}
                        onClick={() => {
                          setTheme(t.id);
                          setGlobalFont(t.font);
                          setGlobalTextColor(t.textColor || "#fff8fc");
                          setBackgroundBaseColor(t.baseColor);
                          setBgColor1(t.accent);
                          setBgColor2(t.accent2);
                          if (t.id === "liquid-glass") {
                            setGlobalMotion("cinematic");
                            setBackground("liquidGlass");
                            setBgColor3("#38bdf8");
                            setBgColor4("#c084fc");
                          } else if (t.id === "light") {
                            setBgColor3("#e8f7ff");
                            setBgColor4("#fff0f5");
                          } else {
                            setBgColor3("#38bdf8");
                            setBgColor4("#f59e0b");
                          }
                          setDraftStatus("unsaved");
                        }}
                      >
                        <div className="themePreviewSwatches">
                          <span style={{ background: t.baseColor }} />
                          <span style={{ background: t.accent }} />
                          <span style={{ background: t.accent2 }} />
                        </div>
                        <span>{t.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Background Effects & Colors */}
                <div className="controlCard">
                  <span className="controlGroupTitle">✨ Background Colors & Aura</span>

                  {/* Page Base Background Color */}
                  <label className="fieldLabel">
                    <span>Page Base Background Color</span>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "4px" }}>
                      <input
                        type="color"
                        value={backgroundBaseColor}
                        onChange={(e) => {
                          setBackgroundBaseColor(e.target.value);
                          setDraftStatus("unsaved");
                        }}
                        style={{ width: "36px", height: "32px", padding: "1px", border: "1px solid var(--line)", borderRadius: "6px", cursor: "pointer", background: "transparent" }}
                      />
                      <input
                        type="text"
                        value={backgroundBaseColor}
                        onChange={(e) => {
                          if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) {
                            setBackgroundBaseColor(e.target.value);
                            setDraftStatus("unsaved");
                          }
                        }}
                        placeholder="#100917"
                        style={{ flex: 1, fontFamily: "monospace", fontSize: "12px" }}
                      />
                    </div>
                  </label>

                  {/* Quick Background Swatches (8 Distinct Curated Tones) */}
                  <div style={{ marginTop: "8px", marginBottom: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>
                        Quick Palette (Curated Tones):
                      </span>
                      <span style={{ fontSize: "10px", color: "var(--text-muted)", opacity: 0.8 }}>
                        4 Dark • 4 Light
                      </span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
                      {[
                        { color: "#0c0a14", label: "Midnight Obsidian (Deep Dark)", dark: true },
                        { color: "#381028", label: "Velvet Bordeaux (Deep Wine)", dark: true },
                        { color: "#0c2444", label: "Royal Sapphire (Deep Navy)", dark: true },
                        { color: "#0b2e20", label: "Emerald Night (Forest Dark)", dark: true },
                        { color: "#ffe4ec", label: "Blush Rose (Soft Pink)", light: true },
                        { color: "#fdf6e2", label: "Warm Vanilla (Golden Cream)", light: true },
                        { color: "#ebe4fa", label: "Lavender Haze (Lilac Light)", light: true },
                        { color: "#ffffff", label: "Clean Pearl (Pure Crisp)", light: true }
                      ].map((s) => {
                        const isSelected = backgroundBaseColor.toLowerCase() === s.color.toLowerCase();
                        return (
                          <button
                            key={s.color}
                            type="button"
                            title={s.label}
                            onClick={() => {
                              setBackgroundBaseColor(s.color);
                              if (s.light) {
                                setGlobalTextColor("#2d2027");
                                setTheme("light");
                              } else {
                                if (globalTextColor === "#2d2027") {
                                  setGlobalTextColor("#fff8fc");
                                }
                                if (theme === "light") {
                                  setTheme("dark");
                                }
                              }
                              setDraftStatus("unsaved");
                            }}
                            style={{
                              height: "28px",
                              borderRadius: "6px",
                              backgroundColor: s.color,
                              border: isSelected ? "2px solid #ff4f8b" : (s.light ? "1px solid rgba(0,0,0,0.12)" : "1px solid rgba(255,255,255,0.18)"),
                              cursor: "pointer",
                              boxShadow: isSelected ? "0 0 10px #ff4f8b" : "none",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "10px",
                              fontWeight: 800,
                              color: isSelected ? (s.light ? "#ff4f8b" : "#ff86b0") : (s.light ? "#2d2027" : "#ffffff"),
                              transition: "all 0.15s ease"
                            }}
                          >
                            {isSelected ? "✓" : ""}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Aura Preset Dropdown */}
                  <label className="fieldLabel">
                    Background Glow Preset
                    <select
                      value={background}
                      onChange={(e) => {
                        setBackground(e.target.value);
                        setDraftStatus("unsaved");
                      }}
                    >
                      <option value="aurora">🌌 Aurora Borealis (Multi-glow)</option>
                      <option value="petals">🌸 Falling Rose Petals</option>
                      <option value="stars">✨ Cosmic Starfield</option>
                      <option value="minimal">🌑 Minimal Deep Glow</option>
                      <option value="mesh">🎨 Ambient Mesh Glow</option>
                      <option value="gradient">🌈 Smooth Linear Gradient</option>
                      <option value="solid">⬛ Clean Solid Color (No Glow)</option>
                      <option value="lightGradient">☀️ Soft Pastel Glow</option>
                    </select>
                  </label>

                  {/* Aura Glow Colors (Clean 5 Options Row) */}
                  <div style={{ marginTop: "12px", borderTop: "1px solid var(--line)", paddingTop: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--site-text, #fff)" }}>
                        🌈 Aura Glow Colors
                      </span>
                      <span style={{ fontSize: "10px", color: "var(--muted)" }}>
                        Tap swatch to edit
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px" }}>
                      {[
                        { name: "Aura 1", val: bgColor1, set: setBgColor1 },
                        { name: "Aura 2", val: bgColor2, set: setBgColor2 },
                        { name: "Aura 3", val: bgColor3, set: setBgColor3 },
                        { name: "Aura 4", val: bgColor4, set: setBgColor4 },
                        { name: "Aura 5", val: bgColor5, set: setBgColor5 },
                      ].map((a) => (
                        <label
                          key={a.name}
                          title={`${a.name}: ${a.val}`}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "5px",
                            cursor: "pointer",
                            background: "rgba(255, 255, 255, 0.04)",
                            padding: "6px 2px",
                            borderRadius: "8px",
                            border: "1px solid var(--line)",
                            transition: "all 0.15s ease"
                          }}
                        >
                          <div style={{
                            position: "relative",
                            width: "28px",
                            height: "28px",
                            borderRadius: "7px",
                            overflow: "hidden",
                            border: "1.5px solid rgba(255, 255, 255, 0.2)",
                            boxShadow: `0 2px 8px ${a.val}55`
                          }}>
                            <input
                              type="color"
                              value={a.val}
                              onChange={(e) => {
                                a.set(e.target.value);
                                setDraftStatus("unsaved");
                              }}
                              style={{
                                position: "absolute",
                                top: "-10px",
                                left: "-10px",
                                width: "48px",
                                height: "48px",
                                border: "none",
                                cursor: "pointer",
                                background: "transparent"
                              }}
                            />
                          </div>
                          <span style={{ fontSize: "9px", fontWeight: 700, color: "var(--site-text, #fff)", whiteSpace: "nowrap" }}>
                            {a.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Darken / Dim Overlay Slider */}
                  <label className="fieldLabel" style={{ marginTop: "10px" }}>
                    <div className="sliderHeader">
                      <span>Darken / Dim Overlay</span>
                      <span className="valueBadge">{backgroundOverlay}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="80"
                      value={backgroundOverlay}
                      onChange={(e) => {
                        setBackgroundOverlay(Number(e.target.value));
                        setDraftStatus("unsaved");
                      }}
                    />
                  </label>

                  {/* Reset to Theme Default */}
                  <button
                    type="button"
                    className="btn small ghost full"
                    style={{ marginTop: "10px" }}
                    onClick={() => {
                      const t = themes[theme] || themes.dark;
                      setBackgroundBaseColor(t[0]);
                      setBgColor1(t[1]);
                      setBgColor2(t[2]);
                      setDraftStatus("unsaved");
                      setToast("Background colors reset to theme default! ✨");
                    }}
                  >
                    ↺ Reset Background to Theme Default
                  </button>
                </div>

                {/* Transition & Motion Theme */}
                <div className="controlCard">
                  <span className="controlGroupTitle">🌊 Transition & Motion Theme</span>
                  <label className="fieldLabel">
                    Scene Transition Effect
                    <select
                      value={globalMotion}
                      onChange={(e) => {
                        setGlobalMotion(e.target.value);
                        setDraftStatus("unsaved");
                        setToast(`Updated motion transition to ${e.target.value}! 🌊`);
                      }}
                    >
                      <option value="cinematic">🎬 Cinematic Elevation</option>
                      <option value="snappy">⚡ Snappy Modern</option>
                      <option value="none">⏹️ Static (No Transition)</option>
                    </select>
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
                    {blocks.map((b, idx) => {
                      const isDragging = draggedStoryIdx === idx;
                      const isDragOver = dragOverStoryIdx === idx;
                      return (
                        <div
                          key={b.id}
                          className={`storyFlowCard ${selected === idx ? "active" : ""} ${b.visible === false ? "hiddenCard" : ""} ${isDragging ? "isDragging" : ""} ${isDragOver ? "dragOver" : ""}`}
                          onClick={() => selectSection(idx)}
                          draggable
                          onDragStart={(e) => {
                            setDraggedStoryIdx(idx);
                            e.dataTransfer.setData("text/plain", String(idx));
                            e.dataTransfer.effectAllowed = "move";
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
                            if (dragOverStoryIdx !== idx) {
                              setDragOverStoryIdx(idx);
                            }
                          }}
                          onDragEnter={(e) => {
                            e.preventDefault();
                            setDragOverStoryIdx(idx);
                          }}
                          onDragLeave={(e) => {
                            if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                            if (dragOverStoryIdx === idx) {
                              setDragOverStoryIdx(null);
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (draggedStoryIdx !== null && draggedStoryIdx !== idx) {
                              handleStoryReorder(draggedStoryIdx, idx);
                            }
                            setDraggedStoryIdx(null);
                            setDragOverStoryIdx(null);
                          }}
                          onDragEnd={() => {
                            setDraggedStoryIdx(null);
                            setDragOverStoryIdx(null);
                          }}
                          title="Drag to reorder sections"
                        >
                          <span className="storyDragHandle" title="Drag to reorder" onClick={(e) => e.stopPropagation()}>
                            <GripVertical size={13} />
                          </span>
                          <span className="cardSeqNum">{idx + 1}</span>
                          <span className="cardEmoji">{b.emoji ?? ""}</span>
                          <div className="cardInfo">
                            <span className="cardTitle">{b.title || `Section ${idx + 1}`}</span>
                            <span className="cardTypeBadge">{b.type}</span>
                          </div>
                          <div className="cardQuickActions" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
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
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>



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
                <h4>Memory Story</h4>
                <p>Shared memories together, special dates, stories & photos</p>
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

      {/* ========================================================================= */}
      {/* MODAL: PICSART-STYLE PHOTO CROP & FRAMING EDITOR                          */}
      {/* ========================================================================= */}
      <PhotoCropModal
        isOpen={cropModalData.isOpen}
        imageSrc={cropModalData.imageSrc}
        photoTitle={cropModalData.photoTitle}
        initialAdjustment={cropModalData.initialAdjustment}
        onSave={handleSaveCrop}
        onClose={() => setCropModalData((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* ========================================================================= */}
      {/* MOBILE BOTTOM NAVIGATION DOCK (INSTAGRAM/CANVA STYLE)                     */}
      {/* ========================================================================= */}
      <nav className="studioMobileDock" aria-label="Mobile Navigation">
        <button
          type="button"
          className={`mobileDockItem ${!mobileEditOpen && !mobileStoryFlowOpen ? "active" : ""}`}
          onClick={() => {
            setMobileEditOpen(false);
            setMobileStoryFlowOpen(false);
          }}
        >
          <Eye size={18} />
          <span>Card</span>
        </button>

        <button
          type="button"
          className={`mobileDockItem ${mobileEditOpen ? "active" : ""}`}
          onClick={() => {
            setMobileEditOpen(true);
            setMobileStoryFlowOpen(false);
          }}
        >
          <Sliders size={18} />
          <span>Edit</span>
        </button>

        <button
          type="button"
          className={`mobileDockItem ${mobileStoryFlowOpen && activeRightTab === "story" ? "active" : ""}`}
          onClick={() => {
            setActiveRightTab("story");
            setMobileStoryFlowOpen(true);
            setMobileEditOpen(false);
          }}
        >
          <Layers size={18} />
          <span>Story ({blocks.length})</span>
        </button>

        <button
          type="button"
          className={`mobileDockItem ${mobileStoryFlowOpen && activeRightTab === "design" ? "active" : ""}`}
          onClick={() => {
            setActiveRightTab("design");
            setMobileStoryFlowOpen(true);
            setMobileEditOpen(false);
          }}
        >
          <Palette size={18} />
          <span>Design</span>
        </button>

        <button
          type="button"
          className="mobileDockItem primaryCTA"
          onClick={() => {
            setPublishOpen(true);
            publishGreeting();
          }}
        >
          <Lock size={18} />
          <span>Share</span>
        </button>
      </nav>

      {/* Mobile Drawer Dimming Backdrop */}
      {(mobileEditOpen || mobileStoryFlowOpen) && (
        <div
          className="mobileSheetBackdrop"
          onClick={() => {
            setMobileEditOpen(false);
            setMobileStoryFlowOpen(false);
          }}
          aria-hidden="true"
        />
      )}
    </main>
  );
}
