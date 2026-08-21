"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import type { ChangeEvent } from "react";
import Link from "next/link";
import type {
  Block,
  BlockType,
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
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Cake,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Mail,
  Music2,
  Pencil,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  X,
  Play,
  Pause,
  Volume2,
  HelpCircle,
  Palette,
  Layers,
  Sliders,
  Calendar,
  Bell,
  User,
  FolderOpen,
  Send,
  Copy,
  Check,
  Film,
  Video,
  Smile,
  Maximize2,
  Smartphone,
  Monitor
} from "lucide-react";

export default function CreatePage() {
  const [blocks, setBlocks] = useState<Block[]>(defaultBlocks);
  const [selected, setSelected] = useState(0);
  const [selectedReason, setSelectedReason] = useState(0);
  const [selectedIncident, setSelectedIncident] = useState(0);
  const [scene, setScene] = useState(0);

  // Canva-style tool navigation: "theme" | "cards" | "edit" | null (collapsed)
  const [activeTool, setActiveTool] = useState<"theme" | "cards" | "edit" | null>("edit");

  // Global Project Design
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

  // Event & Birthday Reminder Timestamps
  const [targetEventTitle, setTargetEventTitle] = useState("Friend's Birthday");
  const [targetEventDate, setTargetEventDate] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [reminderModalOpen, setReminderModalOpen] = useState(false);

  // Audio state
  const [audioName, setAudioName] = useState("");
  const [audioUrl, setAudioUrl] = useState<MediaValue>("");
  const [audioPreviewUrl, setAudioPreviewUrl] = useState("");
  const [audioError, setAudioError] = useState("");
  const [audioPreviewPlaying, setAudioPreviewPlaying] = useState(false);
  const audioPreviewElRef = useRef<HTMLAudioElement | null>(null);

  // Media & Backgrounds
  const [mediaUploading, setMediaUploading] = useState(false);
  const [memoryVideoPreview, setMemoryVideoPreview] = useState<Record<string, string>>({});
  const [secretVideoPreview, setSecretVideoPreview] = useState<Record<string, string>>({});
  const [pendingMediaSizes, setPendingMediaSizes] = useState<Record<string, number>>({});
  const [customBgPreviews, setCustomBgPreviews] = useState<Record<string, string>>({});
  const [customBg, setCustomBg] = useState("");
  const [customBgName, setCustomBgName] = useState("");
  const [customBgOpacity, setCustomBgOpacity] = useState(100);
  const [customBgScale, setCustomBgScale] = useState(100);
  const [customBgPositionX, setCustomBgPositionX] = useState(50);
  const [customBgPositionY, setCustomBgPositionY] = useState(50);
  const [customBgRotation, setCustomBgRotation] = useState(0);

  // Color overrides
  const [backgroundBaseColor, setBackgroundBaseColor] = useState("#100917");
  const [bgColor1, setBgColor1] = useState("#ff4f8b");
  const [bgColor2, setBgColor2] = useState("#7c5cff");
  const [bgColor3, setBgColor3] = useState("#38bdf8");
  const [bgColor4, setBgColor4] = useState("#f59e0b");
  const [backgroundOverlay, setBackgroundOverlay] = useState(18);
  const [themeOverride, setThemeOverride] = useState(false);

  // UI Modals & Views
  const [fullPreviewOpen, setFullPreviewOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">("desktop");
  const [draftsModalOpen, setDraftsModalOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string; name: string } | null>(null);
  const [savedDraftsList, setSavedDraftsList] = useState<GreetingDraft[]>([]);
  const [currentDraftId, setCurrentDraftId] = useState<string>("");

  const [toast, setToast] = useState("");
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishTitle, setPublishTitle] = useState("A Hanora moment");
  const [publishedLink, setPublishedLink] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [selectedGalleryImage, setSelectedGalleryImage] = useState(0);

  const bgFileInputRef = useRef<HTMLInputElement | null>(null);
  const sectionBgFileInputRef = useRef<HTMLInputElement | null>(null);
  const secretPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const secretVideoInputRef = useRef<HTMLInputElement | null>(null);
  const incidentPhotoInputRef = useRef<HTMLInputElement | null>(null);

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

  // Calculate project size in bytes
  const projectBytes = useMemo(() => {
    let configSize = 0;
    try {
      const data = projectData();
      const cleanData = JSON.parse(JSON.stringify(data));
      if (typeof cleanData.audioUrl === "string" && cleanData.audioUrl.startsWith("data:")) cleanData.audioUrl = "";
      if (typeof cleanData.customBg === "string" && cleanData.customBg.startsWith("data:")) cleanData.customBg = "";
      if (Array.isArray(cleanData.blocks)) {
        cleanData.blocks.forEach((b: any) => {
          if (typeof b.audioUrl === "string" && b.audioUrl.startsWith("data:")) b.audioUrl = "";
          if (typeof b.memoryVideo === "string" && b.memoryVideo.startsWith("data:")) b.memoryVideo = "";
          if (typeof b.secretVideo === "string" && b.secretVideo.startsWith("data:")) b.secretVideo = "";
          if (typeof b.customBg === "string" && b.customBg.startsWith("data:")) b.customBg = "";
          if (Array.isArray(b.images)) {
            b.images = b.images.map((img: any) => (typeof img === "string" && img.startsWith("data:") ? "" : img));
          }
        });
      }
      configSize = new Blob([JSON.stringify(cleanData)]).size;
    } catch {}

    let mediaSize = 0;
    const countSize = (val: any) => {
      if (!val) return;
      if (typeof val === "string" && val.startsWith("data:")) {
        const comma = val.indexOf(",");
        if (comma >= 0) {
          mediaSize += Math.round(((val.length - comma - 1) * 3) / 4);
        }
      } else if (typeof val === "object" && val !== null && "size" in val && typeof val.size === "number") {
        mediaSize += val.size;
      }
    };

    countSize(audioUrl);
    countSize(customBg);
    blocks.forEach((b) => {
      countSize(b.audioUrl);
      countSize(b.memoryVideo);
      countSize(b.secretVideo);
      countSize(b.customBg);
      if (Array.isArray(b.images)) {
        b.images.forEach((img) => countSize(img));
      }
    });

    Object.values(pendingMediaSizes).forEach((sz) => {
      mediaSize += sz;
    });

    return configSize + mediaSize;
  }, [
    blocks,
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
    pendingMediaSizes
  ]);

  // Load active project from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("hanora-user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {}
    }

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
      if (proj.targetEventTitle) setTargetEventTitle(proj.targetEventTitle);
      if (proj.targetEventDate) setTargetEventDate(proj.targetEventDate);
      if (proj.reminderDate) setReminderDate(proj.reminderDate);
      if (x.themeOverride) {
        setThemeOverride(true);
        if (proj.backgroundBaseColor) setBackgroundBaseColor(proj.backgroundBaseColor);
        if (proj.bgColor1) setBgColor1(proj.bgColor1);
        if (proj.bgColor2) setBgColor2(proj.bgColor2);
        if (proj.bgColor3) setBgColor3(proj.bgColor3);
        if (proj.bgColor4) setBgColor4(proj.bgColor4);
      }
      if (proj.backgroundOverlay !== undefined) setBackgroundOverlay(proj.backgroundOverlay);
      resolveMediaOnMount(proj);
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

  function notify(m: string) {
    setToast(m);
    window.setTimeout(() => setToast(""), 1800);
  }

  function stopAudioPreview() {
    if (audioPreviewElRef.current) {
      audioPreviewElRef.current.pause();
      audioPreviewElRef.current.src = "";
    }
    setAudioPreviewPlaying(false);
  }

  function selectBlock(i: number) {
    setSelected(i);
    setSelectedReason(0);
    setSelectedIncident(0);
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

  function updateIncident(index: number, patch: Partial<IncidentItem>) {
    setBlocks((prev) =>
      prev.map((b, i) => {
        if (i !== selected || b.type !== "incidents") return b;
        const incidents = (b.incidents ?? incidentDefaults).map((inc, j) =>
          j === index ? { ...inc, ...patch } : inc
        );
        return normalizeBlock({ ...b, incidents }, i, globalFont);
      })
    );
  }

  function addIncident() {
    if (current.type !== "incidents") return;
    const item: IncidentItem = {
      id: uid(),
      title: `Incident #${(current.incidents ?? []).length + 1}`,
      tag: "Funny Memory",
      date: "That Day",
      text: "Write what happened and why it was so memorable...",
      emoji: "😂"
    };
    updateCurrent({ incidents: [...(current.incidents ?? []), item] });
    setSelectedIncident((current.incidents ?? []).length);
    notify("Memorable incident added ✨");
  }

  function deleteIncident(index: number) {
    if (current.type !== "incidents") return;
    const next = (current.incidents ?? []).filter((_, i) => i !== index);
    updateCurrent({ incidents: next });
    setSelectedIncident(Math.max(0, Math.min(selectedIncident, next.length - 1)));
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
      backgroundOverlay,
      targetEventTitle,
      targetEventDate,
      reminderDate
    });
  }

  async function saveDraft() {
    const data = projectData();
    const draftId = currentDraftId || uid();
    setCurrentDraftId(draftId);

    localStorage.setItem("hanora-project", JSON.stringify({ ...data, themeOverride }));
    localStorage.removeItem("cherivo-project");

    try {
      await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: draftId,
          userId: user?.id || "anonymous",
          title: publishTitle || "Untitled moment",
          targetEventTitle,
          targetEventDate,
          reminderDate,
          project: data
        })
      });
    } catch {}

    notify("Draft saved ✨");
  }

  async function loadDrafts() {
    try {
      const res = await fetch(`/api/drafts?userId=${user?.id || "anonymous"}`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.drafts)) {
        setSavedDraftsList(data.drafts);
      }
    } catch {}
  }

  async function deleteDraftItem(draftId: string) {
    if (!window.confirm("Delete this draft?\n\nAssociated uploaded media will be removed to free up Supabase storage.")) return;
    try {
      const res = await fetch(`/api/drafts?id=${draftId}&userId=${user?.id || "anonymous"}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.ok) {
        setSavedDraftsList((prev) => prev.filter((d) => d.id !== draftId));
        if (currentDraftId === draftId) {
          localStorage.removeItem("hanora-project");
          setCurrentDraftId("");
        }
        notify(`Draft deleted (${data.deletedMediaCount || 0} media files cleaned from storage) 🗑️`);
      }
    } catch (err: any) {
      notify("Failed to delete draft");
    }
  }

  function applyDraft(draft: GreetingDraft) {
    if (!draft.project) return;
    const proj = normalizeProject(draft.project);
    if (proj.blocks) setBlocks(proj.blocks);
    if (proj.theme) setTheme(proj.theme);
    if (proj.background) setBackground(proj.background);
    if (proj.globalFont) setGlobalFont(proj.globalFont);
    if (proj.targetEventTitle) setTargetEventTitle(proj.targetEventTitle);
    if (proj.targetEventDate) setTargetEventDate(proj.targetEventDate);
    if (proj.reminderDate) setReminderDate(proj.reminderDate);
    setPublishTitle(draft.title || "A Hanora moment");
    setCurrentDraftId(draft.id);
    setDraftsModalOpen(false);
    resolveMediaOnMount(proj);
    notify(`Loaded draft: ${draft.title} ✨`);
  }

  async function publishGreeting() {
    setPublishError("");
    setPublishing(true);
    try {
      const project = projectData();
      const serialized = JSON.stringify(project);
      const bytes = new Blob([serialized]).size;
      if (bytes > 80_000_000) {
        throw new Error(
          "This greeting is too large to publish (exceeds 80 MB). Reduce photo/video/audio sizes or remove unused media."
        );
      }

      const res = await fetch("/api/greetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: publishTitle,
          project,
          userId: user?.id,
          targetEventDate,
          reminderDate
        })
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

  async function uploadMediaFile(file: File, kind: "audio" | "memory-video" | "image") {
    const body = new FormData();
    body.append("file", file);
    body.append("kind", kind);

    const response = await fetch("/api/media", { method: "POST", body });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `Upload failed with status code ${response.status}`);
    }
    return data;
  }

  async function uploadSecretPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaUploading(true);
    try {
      const data = await uploadMediaFile(file, "image");
      updateCurrent({ secretImage: data.previewUrl || data.media });
      notify("Secret memory photo uploaded ✨");
    } catch (err: any) {
      notify(err.message || "Failed to upload secret photo");
    } finally {
      setMediaUploading(false);
      e.target.value = "";
    }
  }

  async function uploadSecretVideo(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaUploading(true);
    try {
      const data = await uploadMediaFile(file, "memory-video");
      updateCurrent({ secretVideo: data.media });
      setSecretVideoPreview((prev) => ({ ...prev, [current.id]: data.previewUrl }));
      notify("Secret memory video uploaded 🎥");
    } catch (err: any) {
      notify(err.message || "Failed to upload secret video");
    } finally {
      setMediaUploading(false);
      e.target.value = "";
    }
  }

  async function uploadIncidentPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaUploading(true);
    try {
      const data = await uploadMediaFile(file, "image");
      updateIncident(selectedIncident, { image: data.previewUrl || data.media });
      notify("Incident photo attached ✨");
    } catch (err: any) {
      notify(err.message || "Failed to upload photo");
    } finally {
      setMediaUploading(false);
      e.target.value = "";
    }
  }

  async function resolveMediaOnMount(proj: GreetingProject) {
    if (proj.blocks) {
      for (const b of proj.blocks) {
        if (b.memoryVideo && typeof b.memoryVideo === "object" && "path" in b.memoryVideo) {
          try {
            const res = await fetch(`/api/media?path=${encodeURIComponent((b.memoryVideo as any).path)}&kind=memory-video`);
            const data = await res.json();
            if (data.previewUrl) setMemoryVideoPreview((prev) => ({ ...prev, [b.id]: data.previewUrl }));
          } catch {}
        }
        if (b.secretVideo && typeof b.secretVideo === "object" && "path" in b.secretVideo) {
          try {
            const res = await fetch(`/api/media?path=${encodeURIComponent((b.secretVideo as any).path)}&kind=memory-video`);
            const data = await res.json();
            if (data.previewUrl) setSecretVideoPreview((prev) => ({ ...prev, [b.id]: data.previewUrl }));
          } catch {}
        }
      }
    }
  }

  // Calculate days remaining to birthday/event
  const eventDaysRemaining = useMemo(() => {
    if (!targetEventDate) return null;
    const target = new Date(targetEventDate).getTime();
    const now = new Date().setHours(0, 0, 0, 0);
    const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    return diff;
  }, [targetEventDate]);

  return (
    <main className="canvaEditorShell">
      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}

      {/* Top Navbar */}
      <header className="canvaHeader">
        <div className="canvaHeaderLeft">
          <Link href="/" className="logo">
            <span>
              HANORA<span>•</span>
            </span>
          </Link>
          <div className="canvaTitleWrap">
            <input
              type="text"
              value={publishTitle}
              onChange={(e) => setPublishTitle(e.target.value)}
              placeholder="Name this moment..."
              className="canvaTitleInput"
            />
          </div>
        </div>

        {/* Event / Birthday Reminder Pill */}
        {targetEventDate ? (
          <button
            type="button"
            className="canvaReminderBadge"
            onClick={() => setReminderModalOpen(true)}
            title="Click to manage reminder"
          >
            <Calendar size={13} />
            <span>
              {targetEventTitle || "Event"}:{" "}
              {eventDaysRemaining !== null && eventDaysRemaining >= 0
                ? eventDaysRemaining === 0
                  ? "Today! 🎉"
                  : `${eventDaysRemaining}d left`
                : "Passed"}
            </span>
          </button>
        ) : (
          <button
            type="button"
            className="canvaAddReminderBtn"
            onClick={() => setReminderModalOpen(true)}
          >
            <Bell size={13} />
            <span>Set Birthday / Event Reminder</span>
          </button>
        )}

        <div className="canvaHeaderRight">
          <button
            type="button"
            className="canvaHeaderBtn"
            onClick={() => {
              loadDrafts();
              setDraftsModalOpen(true);
            }}
          >
            <FolderOpen size={14} />
            <span>Drafts</span>
          </button>

          <button
            type="button"
            className="canvaHeaderBtn"
            onClick={() => setFullPreviewOpen(true)}
          >
            <Eye size={14} />
            <span>Preview</span>
          </button>

          <button
            type="button"
            className="canvaHeaderBtn"
            onClick={saveDraft}
          >
            <span>Save</span>
          </button>

          <button
            type="button"
            className="canvaPublishBtn"
            onClick={publishGreeting}
            disabled={publishing}
          >
            <Send size={13} />
            <span>{publishing ? "Publishing..." : "Generate Link"}</span>
          </button>

          <button
            type="button"
            className="canvaUserBtn"
            onClick={() => setUserModalOpen(true)}
            title={user ? `Signed in as ${user.name}` : "Sign In with Google"}
          >
            {user ? (
              <span className="userAvatar">{user.name.charAt(0).toUpperCase()}</span>
            ) : (
              <User size={16} />
            )}
          </button>
        </div>
      </header>

      {/* Main Workspace Stage */}
      <div className="canvaWorkspace">
        {/* Interactive Center Stage Preview Canvas */}
        <div className="canvaStageArea">
          <div className="canvaCardViewport">
            <GreetingView
              project={projectData()}
              sceneIndex={scene}
              onSceneChange={setScene}
              isEditable={true}
              onEditSection={(blockId) => {
                const idx = blocks.findIndex((b) => b.id === blockId);
                if (idx >= 0) {
                  selectBlock(idx);
                  setActiveTool("edit");
                }
              }}
              onEditReason={(blockId, reasonIdx) => {
                const idx = blocks.findIndex((b) => b.id === blockId);
                if (idx >= 0) {
                  selectBlock(idx);
                  setSelectedReason(reasonIdx);
                  setActiveTool("edit");
                }
              }}
              onAddReason={() => {
                addReason();
                setActiveTool("edit");
              }}
              onEditIncident={(blockId, incIdx) => {
                const idx = blocks.findIndex((b) => b.id === blockId);
                if (idx >= 0) {
                  selectBlock(idx);
                  setSelectedIncident(incIdx);
                  setActiveTool("edit");
                }
              }}
              onAddIncident={() => {
                addIncident();
                setActiveTool("edit");
              }}
              title={publishTitle}
              memoryVideoPreviews={memoryVideoPreview}
              customBgPreviews={customBgPreviews}
            />
          </div>
        </div>

        {/* Canva-style Slide-out Drawer Panel */}
        {activeTool && (
          <aside className="canvaDrawer">
            <div className="canvaDrawerHeader">
              <div className="drawerTitle">
                {activeTool === "theme" && (
                  <>
                    <Palette size={16} /> <span>Design & Global Theme</span>
                  </>
                )}
                {activeTool === "cards" && (
                  <>
                    <Layers size={16} /> <span>Story Cards ({blocks.length})</span>
                  </>
                )}
                {activeTool === "edit" && (
                  <>
                    <Sliders size={16} /> <span>Edit: {current.heading || current.title}</span>
                  </>
                )}
              </div>
              <button
                type="button"
                className="drawerCloseBtn"
                onClick={() => setActiveTool(null)}
                title="Collapse drawer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="canvaDrawerScroll customScrollbar">
              {/* TOOL 1: THEME & DESIGN */}
              {activeTool === "theme" && (
                <div className="drawerContentSection">
                  <div className="controlGroup">
                    <label>Color Palette Preset</label>
                    <div className="themePillGrid">
                      {Object.keys(themes).map((t) => (
                        <button
                          key={t}
                          type="button"
                          className={`themePill ${theme === t ? "active" : ""}`}
                          onClick={() => {
                            setTheme(t);
                            setThemeOverride(false);
                          }}
                        >
                          <span
                            className="themeSwatch"
                            style={{ background: themes[t][1] }}
                          />
                          <span className="themeName">{t}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="controlGroup" style={{ marginTop: "18px" }}>
                    <label>Dynamic Background Texture</label>
                    <select
                      value={background}
                      onChange={(e) => setBackground(e.target.value)}
                      className="canvaSelect"
                    >
                      <option value="aurora">Aurora Borealis (Dreamy)</option>
                      <option value="mesh">Mesh Glow (Vibrant)</option>
                      <option value="petals">Floating Petals</option>
                      <option value="stars">Twinkling Night Stars</option>
                      <option value="gradient">Deep Gradient</option>
                      <option value="lightGradient">Soft Blush Glow</option>
                      <option value="minimal">Minimal Dark</option>
                    </select>
                  </div>

                  <div className="controlGroup" style={{ marginTop: "18px" }}>
                    <label>Global Typography</label>
                    <select
                      value={globalFont}
                      onChange={(e) => setGlobalFont(e.target.value as FontName)}
                      className="canvaSelect"
                    >
                      {fontOptions}
                    </select>
                  </div>

                  <div className="controlGroup" style={{ marginTop: "18px" }}>
                    <label>Custom Wallpaper Photo</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        ref={bgFileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setMediaUploading(true);
                          try {
                            const data = await uploadMediaFile(file, "image");
                            setCustomBg(data.media);
                            setCustomBgName(file.name);
                            notify("Wallpaper photo set ✨");
                          } catch (err: any) {
                            notify(err.message || "Failed to upload wallpaper");
                          } finally {
                            setMediaUploading(false);
                            e.target.value = "";
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="btn small"
                        onClick={() => bgFileInputRef.current?.click()}
                      >
                        {customBg ? "Change Wallpaper" : "Upload Wallpaper"}
                      </button>
                      {customBg && (
                        <button
                          type="button"
                          className="btn small ghost"
                          onClick={() => {
                            setCustomBg("");
                            setCustomBgName("");
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    {customBg && (
                      <div className="sliderRow" style={{ marginTop: "12px" }}>
                        <span>Opacity: {customBgOpacity}%</span>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={customBgOpacity}
                          onChange={(e) => setCustomBgOpacity(Number(e.target.value))}
                        />
                      </div>
                    )}
                  </div>

                  <div className="controlGroup" style={{ marginTop: "18px" }}>
                    <label>Background Music (MP3)</label>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <input
                        type="file"
                        accept="audio/mp3,audio/mpeg"
                        style={{ display: "none" }}
                        id="audioFileInput"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setMediaUploading(true);
                          try {
                            const data = await uploadMediaFile(file, "audio");
                            setAudioUrl(data.media);
                            setAudioName(file.name.replace(/\.[^/.]+$/, ""));
                            notify("Music uploaded 🎵");
                          } catch (err: any) {
                            notify(err.message || "Audio upload failed");
                          } finally {
                            setMediaUploading(false);
                            e.target.value = "";
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="btn small"
                        onClick={() => document.getElementById("audioFileInput")?.click()}
                      >
                        <Music2 size={13} /> {audioUrl ? "Change Song" : "Upload Song"}
                      </button>
                      {audioUrl && (
                        <button
                          type="button"
                          className="btn small ghost"
                          onClick={() => {
                            setAudioUrl("");
                            setAudioName("");
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    {audioName && <div className="songNameTag">🎵 {audioName}</div>}
                  </div>
                </div>
              )}

              {/* TOOL 2: STORY CARDS LIST */}
              {activeTool === "cards" && (
                <div className="drawerContentSection">
                  <div className="cardsList">
                    {blocks.map((b, i) => (
                      <div
                        key={b.id}
                        className={`cardListItem ${selected === i ? "active" : ""}`}
                        onClick={() => selectBlock(i)}
                      >
                        <span className="cardListEmoji">{b.emoji || "📄"}</span>
                        <div className="cardListInfo">
                          <b>{b.heading || b.title}</b>
                          <small>{b.type.toUpperCase()}</small>
                        </div>
                        <div className="cardListActions" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="iconBtn"
                            title={b.visible ? "Hide card" : "Show card"}
                            onClick={() => {
                              const next = [...blocks];
                              next[i] = { ...next[i], visible: !next[i].visible };
                              setBlocks(next);
                            }}
                          >
                            {b.visible ? <Eye size={13} /> : <EyeOff size={13} style={{ opacity: 0.5 }} />}
                          </button>
                          {i > 0 && (
                            <button
                              type="button"
                              className="iconBtn"
                              title="Move up"
                              onClick={() => {
                                const next = [...blocks];
                                const temp = next[i - 1];
                                next[i - 1] = next[i];
                                next[i] = temp;
                                setBlocks(next);
                                setSelected(i - 1);
                              }}
                            >
                              <ArrowUp size={13} />
                            </button>
                          )}
                          {i < blocks.length - 1 && (
                            <button
                              type="button"
                              className="iconBtn"
                              title="Move down"
                              onClick={() => {
                                const next = [...blocks];
                                const temp = next[i + 1];
                                next[i + 1] = next[i];
                                next[i] = temp;
                                setBlocks(next);
                                setSelected(i + 1);
                              }}
                            >
                              <ArrowDown size={13} />
                            </button>
                          )}
                          {blocks.length > 1 && (
                            <button
                              type="button"
                              className="iconBtn danger"
                              title="Delete card"
                              onClick={() => {
                                const next = blocks.filter((_, idx) => idx !== i);
                                setBlocks(next);
                                setSelected(Math.max(0, i - 1));
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="btn primary fullWidth"
                    style={{ marginTop: "14px" }}
                    onClick={() => setAddOpen(true)}
                  >
                    <Plus size={14} /> Add New Card / Scene
                  </button>
                </div>
              )}

              {/* TOOL 3: EDIT CURRENT CARD */}
              {activeTool === "edit" && (
                <div className="drawerContentSection">
                  <div className="formGroup">
                    <label>Card Type</label>
                    <div className="typeBadge">{current.type.toUpperCase()} CARD</div>
                  </div>

                  <div className="formGroup" style={{ marginTop: "12px" }}>
                    <label>Section Kicker (Top Tag)</label>
                    <input
                      type="text"
                      value={current.title}
                      onChange={(e) => updateCurrent({ title: e.target.value })}
                      placeholder="e.g. WHAT I LOVE"
                    />
                  </div>

                  <div className="formGroup" style={{ marginTop: "12px" }}>
                    <label>Eyebrow (Subtitle)</label>
                    <input
                      type="text"
                      value={current.subtitle}
                      onChange={(e) => updateCurrent({ subtitle: e.target.value })}
                      placeholder="e.g. Reasons you make life brighter"
                    />
                  </div>

                  <div className="formGroup" style={{ marginTop: "12px" }}>
                    <label>Main Headline</label>
                    <input
                      type="text"
                      value={current.heading}
                      onChange={(e) => updateCurrent({ heading: e.target.value })}
                      placeholder="e.g. Happy Birthday Someone Special"
                    />
                  </div>

                  <div className="formGroup" style={{ marginTop: "12px" }}>
                    <label>Card Message Text</label>
                    <textarea
                      rows={3}
                      value={current.text}
                      onChange={(e) => updateCurrent({ text: e.target.value })}
                      placeholder="Write your heartfelt note..."
                    />
                  </div>

                  {/* SPECIAL CARD INSPECTORS */}
                  {/* INCIDENTS BLOCK ("Our Story / Funny Moments") */}
                  {current.type === "incidents" && (
                    <div className="specialCardBox" style={{ marginTop: "18px" }}>
                      <div className="specialBoxHeader">
                        <b>Memorable Incidents & Funny Stories</b>
                        <button type="button" className="btn small" onClick={addIncident}>
                          + Add Incident
                        </button>
                      </div>

                      <div className="incidentsEditList">
                        {(current.incidents ?? incidentDefaults).map((inc, idx) => (
                          <div
                            key={inc.id}
                            className={`incidentEditCard ${selectedIncident === idx ? "active" : ""}`}
                            onClick={() => setSelectedIncident(idx)}
                          >
                            <div className="incidentEditHeader">
                              <span>
                                {inc.emoji} <b>{inc.title}</b>
                              </span>
                              <button
                                type="button"
                                className="iconBtn danger"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteIncident(idx);
                                }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                            {selectedIncident === idx && (
                              <div className="incidentEditFields">
                                <input
                                  type="text"
                                  placeholder="Incident Title (e.g. The Day We Met)"
                                  value={inc.title}
                                  onChange={(e) => updateIncident(idx, { title: e.target.value })}
                                />
                                <div style={{ display: "flex", gap: "6px" }}>
                                  <input
                                    type="text"
                                    placeholder="Tag (e.g. Hilarious)"
                                    value={inc.tag || ""}
                                    onChange={(e) => updateIncident(idx, { tag: e.target.value })}
                                    style={{ flex: 1 }}
                                  />
                                  <input
                                    type="text"
                                    placeholder="Emoji"
                                    value={inc.emoji}
                                    onChange={(e) => updateIncident(idx, { emoji: e.target.value })}
                                    style={{ width: "60px" }}
                                  />
                                </div>
                                <textarea
                                  rows={3}
                                  placeholder="What happened on this day? Write the funny details..."
                                  value={inc.text}
                                  onChange={(e) => updateIncident(idx, { text: e.target.value })}
                                />
                                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                  <input
                                    ref={incidentPhotoInputRef}
                                    type="file"
                                    accept="image/*"
                                    style={{ display: "none" }}
                                    onChange={uploadIncidentPhoto}
                                  />
                                  <button
                                    type="button"
                                    className="btn small ghost"
                                    onClick={() => incidentPhotoInputRef.current?.click()}
                                  >
                                    <ImageIcon size={12} /> {inc.image ? "Change Photo" : "Add Photo"}
                                  </button>
                                  {inc.image && (
                                    <button
                                      type="button"
                                      className="btn small ghost"
                                      onClick={() => updateIncident(idx, { image: undefined })}
                                    >
                                      Remove Photo
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SECRET / TAP TO REVEAL BLOCK */}
                  {current.type === "secret" && (
                    <div className="specialCardBox" style={{ marginTop: "18px" }}>
                      <b>Hidden Secret Surprise</b>
                      <p style={{ fontSize: "12px", color: "var(--muted)", margin: "4px 0 10px" }}>
                        Upload a hidden photo or video that reveals when the recipient taps the heart!
                      </p>

                      <div className="formGroup">
                        <label>Secret Text Reveal</label>
                        <input
                          type="text"
                          value={current.text}
                          onChange={(e) => updateCurrent({ text: e.target.value })}
                          placeholder="e.g. I have a surprise gift for you tomorrow! ♥"
                        />
                      </div>

                      <div style={{ marginTop: "12px" }}>
                        <label>Secret Memory Photo</label>
                        <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                          <input
                            ref={secretPhotoInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={uploadSecretPhoto}
                          />
                          <button
                            type="button"
                            className="btn small"
                            onClick={() => secretPhotoInputRef.current?.click()}
                          >
                            <ImageIcon size={12} /> {current.secretImage ? "Change Secret Photo" : "Upload Secret Photo"}
                          </button>
                          {current.secretImage && (
                            <button
                              type="button"
                              className="btn small ghost"
                              onClick={() => updateCurrent({ secretImage: undefined })}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>

                      <div style={{ marginTop: "12px" }}>
                        <label>Secret Memory Video</label>
                        <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                          <input
                            ref={secretVideoInputRef}
                            type="file"
                            accept="video/mp4,video/webm,video/quicktime"
                            style={{ display: "none" }}
                            onChange={uploadSecretVideo}
                          />
                          <button
                            type="button"
                            className="btn small"
                            onClick={() => secretVideoInputRef.current?.click()}
                          >
                            <Video size={12} /> {current.secretVideo ? "Change Secret Video" : "Upload Secret Video"}
                          </button>
                          {current.secretVideo && (
                            <button
                              type="button"
                              className="btn small ghost"
                              onClick={() => updateCurrent({ secretVideo: undefined })}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* REASONS BLOCK */}
                  {current.type === "reasons" && (
                    <div className="specialCardBox" style={{ marginTop: "18px" }}>
                      <div className="specialBoxHeader">
                        <b>Reasons Deck</b>
                        <button type="button" className="btn small" onClick={addReason}>
                          + Add Reason
                        </button>
                      </div>
                      <div className="incidentsEditList">
                        {(current.items ?? reasonDefaults).map((r, idx) => (
                          <div
                            key={r.id}
                            className={`incidentEditCard ${selectedReason === idx ? "active" : ""}`}
                            onClick={() => setSelectedReason(idx)}
                          >
                            <div className="incidentEditHeader">
                              <span>
                                {r.emoji} <b>{r.title}</b>
                              </span>
                              <button
                                type="button"
                                className="iconBtn danger"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteReason(idx);
                                }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                            {selectedReason === idx && (
                              <div className="incidentEditFields">
                                <input
                                  type="text"
                                  value={r.title}
                                  placeholder="Reason Title"
                                  onChange={(e) => updateReason(idx, { title: e.target.value })}
                                />
                                <textarea
                                  rows={2}
                                  value={r.text}
                                  placeholder="Reason description..."
                                  onChange={(e) => updateReason(idx, { text: e.target.value })}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Canva-style 3-Button Docked Bottom Bar */}
      <footer className="canvaDockBar">
        <button
          type="button"
          className={`canvaDockBtn ${activeTool === "theme" ? "active" : ""}`}
          onClick={() => setActiveTool(activeTool === "theme" ? null : "theme")}
        >
          <Palette size={18} />
          <span>Design & Theme</span>
        </button>

        <button
          type="button"
          className={`canvaDockBtn ${activeTool === "cards" ? "active" : ""}`}
          onClick={() => setActiveTool(activeTool === "cards" ? null : "cards")}
        >
          <Layers size={18} />
          <span>Story Cards ({blocks.length})</span>
        </button>

        <button
          type="button"
          className={`canvaDockBtn ${activeTool === "edit" ? "active" : ""}`}
          onClick={() => setActiveTool(activeTool === "edit" ? null : "edit")}
        >
          <Sliders size={18} />
          <span>Edit Card</span>
        </button>
      </footer>

      {/* FULL-SCREEN LIVE REALISTIC PREVIEW MODAL */}
      {fullPreviewOpen && (
        <div className="fullPreviewOverlay">
          <div className="fullPreviewBar">
            <div className="previewDeviceInfo">
              <button
                type="button"
                className={`previewDeviceBtn ${previewDevice === "desktop" ? "active" : ""}`}
                onClick={() => setPreviewDevice("desktop")}
              >
                <Monitor size={15} /> Desktop
              </button>
              <button
                type="button"
                className={`previewDeviceBtn ${previewDevice === "mobile" ? "active" : ""}`}
                onClick={() => setPreviewDevice("mobile")}
              >
                <Smartphone size={15} /> Mobile View
              </button>
            </div>
            <button
              type="button"
              className="btn primary small"
              onClick={() => setFullPreviewOpen(false)}
            >
              Exit Preview
            </button>
          </div>
          <div className={`fullPreviewStage device-${previewDevice}`}>
            <GreetingView
              project={projectData()}
              sceneIndex={scene}
              onSceneChange={setScene}
              isEditable={false}
              previewDevice={previewDevice}
              title={publishTitle}
              memoryVideoPreviews={memoryVideoPreview}
              customBgPreviews={customBgPreviews}
            />
          </div>
        </div>
      )}

      {/* DRAFTS & SAVED GREETINGS MODAL */}
      {draftsModalOpen && (
        <div className="modalOverlay" onClick={() => setDraftsModalOpen(false)}>
          <div className="modalContent" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h2>📁 Your Drafts & Moments</h2>
              <button type="button" className="iconBtn" onClick={() => setDraftsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <p style={{ color: "var(--muted)", fontSize: "13px", marginBottom: "16px" }}>
              Drafts are linked to your browser and user ID. Deleting drafts automatically clears media files from Supabase Storage.
            </p>

            <div className="draftsList customScrollbar">
              {savedDraftsList.length > 0 ? (
                savedDraftsList.map((d) => (
                  <div key={d.id} className="draftRow">
                    <div className="draftDetails">
                      <b>{d.title || "Untitled moment"}</b>
                      {d.targetEventDate && (
                        <span className="draftEventTag">
                          📅 {d.targetEventTitle || "Event"}: {d.targetEventDate}
                        </span>
                      )}
                      <small>Last updated: {new Date(d.updatedAt).toLocaleDateString()}</small>
                    </div>
                    <div className="draftRowActions">
                      <button
                        type="button"
                        className="btn small primary"
                        onClick={() => applyDraft(d)}
                      >
                        Open Draft
                      </button>
                      <button
                        type="button"
                        className="btn small ghost danger"
                        onClick={() => deleteDraftItem(d.id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: "center", padding: "28px", color: "var(--muted)" }}>
                  No saved drafts found yet. Click Save to create one!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BIRTHDAY & EVENT REMINDER MODAL */}
      {reminderModalOpen && (
        <div className="modalOverlay" onClick={() => setReminderModalOpen(false)}>
          <div className="modalContent" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h2>⏰ Birthday & Event Reminder</h2>
              <button type="button" className="iconBtn" onClick={() => setReminderModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <p style={{ color: "var(--muted)", fontSize: "13px", marginBottom: "16px" }}>
              Set your friend's birthday or event date so Cherivo can remind you to finish and share your link in advance!
            </p>

            <div className="formGroup">
              <label>Event Name / Occasion</label>
              <input
                type="text"
                placeholder="e.g. Arjun's 21st Birthday"
                value={targetEventTitle}
                onChange={(e) => setTargetEventTitle(e.target.value)}
              />
            </div>

            <div className="formGroup" style={{ marginTop: "12px" }}>
              <label>Event Date (e.g. Birthday Date)</label>
              <input
                type="date"
                value={targetEventDate}
                onChange={(e) => {
                  setTargetEventDate(e.target.value);
                  // Automatically default reminder to 1 day before
                  if (e.target.value) {
                    const d = new Date(e.target.value);
                    d.setDate(d.getDate() - 1);
                    setReminderDate(d.toISOString().split("T")[0]);
                  }
                }}
              />
            </div>

            <div className="formGroup" style={{ marginTop: "12px" }}>
              <label>Reminder Notification Date</label>
              <input
                type="date"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
              />
            </div>

            <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  setTargetEventDate("");
                  setReminderDate("");
                  setReminderModalOpen(false);
                  notify("Reminder cleared");
                }}
              >
                Clear
              </button>
              <button
                type="button"
                className="btn primary"
                onClick={() => {
                  setReminderModalOpen(false);
                  notify("Reminder saved ✨");
                }}
              >
                Set Reminder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* USER & GOOGLE LOGIN MODAL */}
      {userModalOpen && (
        <div className="modalOverlay" onClick={() => setUserModalOpen(false)}>
          <div className="modalContent" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h2>👤 Account & Sign In</h2>
              <button type="button" className="iconBtn" onClick={() => setUserModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {!user ? (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <p style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "20px" }}>
                  Sign in with Google to sync all your personal greetings, view recipient responses, and access saved drafts on any device.
                </p>
                <button
                  type="button"
                  className="btn primary fullWidth"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    padding: "12px"
                  }}
                  onClick={() => {
                    const mockUser = {
                      id: `usr_${uid()}`,
                      email: "friend@gmail.com",
                      name: "Google User"
                    };
                    setUser(mockUser);
                    localStorage.setItem("hanora-user", JSON.stringify(mockUser));
                    notify("Signed in with Google ✨");
                    setUserModalOpen(false);
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #ff4f8b, #7c5cff)",
                    color: "#fff",
                    fontSize: "24px",
                    display: "grid",
                    placeItems: "center",
                    margin: "0 auto 12px",
                    fontWeight: "bold"
                  }}
                >
                  {user.name.charAt(0)}
                </div>
                <h3>{user.name}</h3>
                <p style={{ color: "var(--muted)", fontSize: "13px" }}>{user.email}</p>
                <div style={{ marginTop: "20px" }}>
                  <button
                    type="button"
                    className="btn ghost danger fullWidth"
                    onClick={() => {
                      setUser(null);
                      localStorage.removeItem("hanora-user");
                      notify("Signed out");
                      setUserModalOpen(false);
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD CARD MODAL */}
      {addOpen && (
        <div className="modalOverlay" onClick={() => setAddOpen(false)}>
          <div className="modalContent" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h2>Add a New Scene / Card</h2>
              <button type="button" className="iconBtn" onClick={() => setAddOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="templateGrid">
              {[
                { type: "incidents", title: "Our Story / Incidents", desc: "Share funny moments and memorable stories", icon: "😂" },
                { type: "reasons", title: "Reasons Deck", desc: "Cards for reasons why you love them", icon: "🦋" },
                { type: "memories", title: "Photo Gallery", desc: "Polaroids, grids, and collage memories", icon: "📸" },
                { type: "secret", title: "Tap to Reveal", desc: "Hidden surprise with photo, video, or secret note", icon: "💗" },
                { type: "letter", title: "Heartfelt Letter", desc: "A personal letter with handwritten fonts", icon: "💌" },
                { type: "cake", title: "Birthday Cake", desc: "Interactive candles to blow out with smoke", icon: "🎂" },
                { type: "welcome", title: "Welcome Cover", desc: "An eye-catching title opening", icon: "✨" }
              ].map((tmpl) => (
                <button
                  key={tmpl.type}
                  type="button"
                  className="templateChoiceBtn"
                  onClick={() => {
                    const newB = normalizeBlock(
                      {
                        type: tmpl.type,
                        title: tmpl.title,
                        heading: tmpl.title,
                        text: tmpl.desc,
                        emoji: tmpl.icon
                      },
                      blocks.length,
                      globalFont
                    );
                    setBlocks([...blocks, newB]);
                    setSelected(blocks.length);
                    setActiveTool("edit");
                    setAddOpen(false);
                    notify(`Added ${tmpl.title} ✨`);
                  }}
                >
                  <span className="tmplIcon">{tmpl.icon}</span>
                  <div>
                    <b>{tmpl.title}</b>
                    <p>{tmpl.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PUBLISHED SUCCESS MODAL */}
      {publishOpen && (
        <div className="modalOverlay" onClick={() => setPublishOpen(false)}>
          <div className="modalContent" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h2>🎉 Moment is Live!</h2>
              <button type="button" className="iconBtn" onClick={() => setPublishOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <p style={{ color: "var(--muted)", fontSize: "14px", margin: "10px 0 18px" }}>
              Anyone with this private link can open your interactive moment and send you a response back!
            </p>

            <div className="publishedUrlBox">
              <input type="text" readOnly value={publishedLink} />
              <button
                type="button"
                className="btn primary"
                onClick={async () => {
                  await navigator.clipboard.writeText(publishedLink);
                  notify("Link copied to clipboard 📋");
                }}
              >
                <Copy size={14} /> Copy
              </button>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
              <a
                href={publishedLink}
                target="_blank"
                rel="noreferrer"
                className="btn fullWidth"
                style={{ textAlign: "center" }}
              >
                Open in New Tab ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
