"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import type { ChangeEvent } from "react";
import Link from "next/link";
import type {
  Block,
  BlockType,
  FontName,
  GreetingProject,
  ImageAdjustment,
  IncidentItem,
  MediaValue,
  ReasonItem,
  GreetingDraft
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
  signInWithGoogle,
  signOut,
  getSupabaseClient
} from "@/lib/supabaseClient";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Cake,
  Calendar,
  Clock,
  Copy,
  Eye,
  EyeOff,
  FolderOpen,
  Heart,
  HelpCircle,
  Image as ImageIcon,
  LogIn,
  LogOut,
  Mail,
  Music2,
  Pause,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Save,
  Sliders,
  Sparkles,
  Trash2,
  User,
  Volume2,
  X
} from "lucide-react";

export default function CreatePage() {
  const [blocks, setBlocks] = useState<Block[]>(defaultBlocks);
  const [selected, setSelected] = useState(0);
  const [selectedReason, setSelectedReason] = useState(0);
  const [selectedIncident, setSelectedIncident] = useState(0);
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
  const [pendingMediaSizes, setPendingMediaSizes] = useState<Record<string, number>>({});
  const [customBgPreviews, setCustomBgPreviews] = useState<Record<string, string>>({});
  const [customBg, setCustomBg] = useState<MediaValue>("");
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

  // Target event and reminders
  const [targetEventTitle, setTargetEventTitle] = useState("Friend's Birthday");
  const [targetEventDate, setTargetEventDate] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [reminderModalOpen, setReminderModalOpen] = useState(false);

  // Studio tabs: "theme" (Design & Theme) | "story" (Story flow) | "card" (Edit card)
  const [activeTab, setActiveTab] = useState<"theme" | "story" | "card">("theme");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Preview & Viewport
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">("desktop");
  const [fullPreviewOpen, setFullPreviewOpen] = useState(false);

  // UI Modals
  const [toast, setToast] = useState("");
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishTitle, setPublishTitle] = useState("A Hanora moment");
  const [publishedLink, setPublishedLink] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [draftsOpen, setDraftsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<{ id: string; email: string; name?: string } | null>(null);
  const [savedDraftsList, setSavedDraftsList] = useState<GreetingDraft[]>([]);
  const [selectedGalleryImage, setSelectedGalleryImage] = useState(0);

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

  const visible = useMemo(() => blocks.filter((b) => b.visible), [blocks]);
  const current = normalizeBlock(blocks[selected] ?? defaultBlocks[0], 0, globalFont);

  // Collect all uploaded memory photos across the project for reuse in Letter
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

  // Total project approximate byte size for capacity indicator
  const projectBytes = useMemo(() => {
    try {
      const serialized = JSON.stringify({
        blocks,
        customBg,
        audioUrl,
        theme,
        background
      });
      const baseBytes = new Blob([serialized]).size;
      const pendingTotal = Object.values(pendingMediaSizes).reduce((acc, v) => acc + v, 0);
      return baseBytes + pendingTotal;
    } catch {
      return 0;
    }
  }, [blocks, customBg, audioUrl, theme, background, pendingMediaSizes]);

  function notify(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  }

  // Google Auth Listener
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserProfile({
          id: session.user.id,
          email: session.user.email || "",
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name
        });
      }
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserProfile({
          id: session.user.id,
          email: session.user.email || "",
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name
        });
      } else {
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Restore Draft on Mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("hanora-project") || localStorage.getItem("cherivo-project");
      if (!raw) return;
      const data = JSON.parse(raw);
      const proj = normalizeProject(data);
      if (proj.blocks && proj.blocks.length > 0) setBlocks(proj.blocks);
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
      if (proj.backgroundBaseColor) setBackgroundBaseColor(proj.backgroundBaseColor);
      if (proj.bgColor1) setBgColor1(proj.bgColor1);
      if (proj.bgColor2) setBgColor2(proj.bgColor2);
      if (proj.bgColor3) setBgColor3(proj.bgColor3);
      if (proj.bgColor4) setBgColor4(proj.bgColor4);
      if (proj.backgroundOverlay !== undefined) setBackgroundOverlay(proj.backgroundOverlay);
      if (proj.targetEventTitle) setTargetEventTitle(proj.targetEventTitle);
      if (proj.targetEventDate) setTargetEventDate(proj.targetEventDate);
      if (proj.reminderDate) setReminderDate(proj.reminderDate);
      if (data.themeOverride !== undefined) setThemeOverride(Boolean(data.themeOverride));
      resolveMediaOnMount(proj);
    } catch {}
  }, []);

  // Sync scene when selected changes
  useEffect(() => {
    const visibleIndex = visible.findIndex((v) => v.id === blocks[selected]?.id);
    if (visibleIndex >= 0) setScene(visibleIndex);
  }, [selected, blocks, visible]);

  function stopAudioPreview() {
    if (audioPreviewElRef.current) {
      audioPreviewElRef.current.pause();
      audioPreviewElRef.current.currentTime = 0;
    }
    setAudioPreviewPlaying(false);
  }

  function toggleAudioPreview() {
    if (!audioPreviewElRef.current) return;
    if (audioPreviewPlaying) {
      stopAudioPreview();
    } else {
      const targetUrl = audioPreviewUrl || (typeof audioUrl === "string" ? audioUrl : "");
      if (!targetUrl) return;
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
        const list = (b.incidents ?? incidentDefaults).map((inc, j) =>
          j === index ? { ...inc, ...patch } : inc
        );
        return normalizeBlock({ ...b, incidents: list }, i, globalFont);
      })
    );
  }

  function addIncident() {
    if (current.type !== "incidents") return;
    const item: IncidentItem = {
      id: uid(),
      title: "Our Funny Memory",
      tag: "Hilarious Moment",
      date: "That unforgettable day",
      text: "Describe what happened on this special day...",
      emoji: "😂"
    };
    updateCurrent({ incidents: [...(current.incidents ?? []), item] });
    setSelectedIncident((current.incidents ?? []).length);
    notify("Incident added ✨");
  }

  function deleteIncident(index: number) {
    if (current.type !== "incidents") return;
    const next = (current.incidents ?? []).filter((_, i) => i !== index);
    updateCurrent({ incidents: next });
    setSelectedIncident(Math.max(0, Math.min(selectedIncident, next.length - 1)));
  }

  function projectData(): GreetingProject {
    return normalizeProject({
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
      targetEventTitle,
      targetEventDate,
      reminderDate
    });
  }

  async function save() {
    const data = projectData();
    localStorage.setItem("hanora-project", JSON.stringify({ ...data, themeOverride }));
    localStorage.removeItem("cherivo-project");

    try {
      const uId = userProfile?.id || "anonymous";
      await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: publishTitle,
          project: data,
          targetEventDate,
          reminderDate,
          targetEventTitle,
          userId: uId
        })
      });
    } catch {}

    notify("Draft saved to cloud & local ✨");
  }

  async function loadDrafts() {
    try {
      const uId = userProfile?.id || "anonymous";
      const res = await fetch(`/api/drafts?userId=${encodeURIComponent(uId)}`);
      if (res.ok) {
        const data = await res.json();
        setSavedDraftsList(data.drafts || []);
      }
    } catch {}
    setDraftsOpen(true);
  }

  function restoreDraft(draft: GreetingDraft) {
    if (!draft.project) return;
    const proj = normalizeProject(draft.project);
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
    if (draft.title) setPublishTitle(draft.title);
    if (draft.targetEventTitle) setTargetEventTitle(draft.targetEventTitle);
    if (draft.targetEventDate) setTargetEventDate(draft.targetEventDate);
    if (draft.reminderDate) setReminderDate(draft.reminderDate);
    resolveMediaOnMount(proj);
    setDraftsOpen(false);
    notify("Draft loaded ✨");
  }

  async function deleteDraftRecord(draftId: string) {
    if (!window.confirm("Delete this draft and remove its media from cloud storage?")) return;
    try {
      const uId = userProfile?.id || "anonymous";
      const res = await fetch(`/api/drafts?id=${encodeURIComponent(draftId)}&userId=${encodeURIComponent(uId)}`, { method: "DELETE" });
      if (res.ok) {
        setSavedDraftsList((prev) => prev.filter((d) => d.id !== draftId));
        notify("Draft and storage purged 🗑️");
      }
    } catch {}
  }

  function deleteCurrentDraft() {
    if (!window.confirm("Clear this working draft?\n\nThis action cannot be undone.")) return;
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
        body: JSON.stringify({
          title: publishTitle,
          project,
          userId: userProfile?.id,
          targetEventDate,
          reminderDate
        })
      });
      let data: any;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || `Publish failed with status code ${res.status}`);
      }
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
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Upload failed with status code ${response.status}`);
      }
      return data;
    } else {
      const text = await response.text();
      throw new Error(text || `Server returned status ${response.status}`);
    }
  }

  async function uploadGlobalBackground(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20_000_000) {
      notify("Image is too large. Please choose an image under 20 MB.");
      e.target.value = "";
      return;
    }
    setMediaUploading(true);
    setPendingMediaSizes((prev) => ({ ...prev, globalBg: file.size }));
    try {
      const data = await uploadMediaFile(file, "image");
      setCustomBg(data.media);
      setCustomBgName(file.name);
      setCustomBgPreviews((prev) => ({
        ...prev,
        [typeof data.media === "string" ? data.media : (data.media as any).path || "globalBg"]: data.previewUrl || ""
      }));
      notify("Background photo uploaded ✨");
    } catch (error: any) {
      notify(error?.message || "Background upload failed");
    } finally {
      setPendingMediaSizes((prev) => {
        const copy = { ...prev };
        delete copy.globalBg;
        return copy;
      });
      setMediaUploading(false);
      e.target.value = "";
    }
  }

  async function uploadSectionBackground(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20_000_000) {
      notify("Image is too large. Please choose an image under 20 MB.");
      e.target.value = "";
      return;
    }
    setMediaUploading(true);
    const blockId = current.id;
    setPendingMediaSizes((prev) => ({ ...prev, [blockId]: file.size }));
    try {
      const data = await uploadMediaFile(file, "image");
      updateCurrent({
        customBg: data.media,
        customBgName: file.name
      });
      setCustomBgPreviews((prev) => ({
        ...prev,
        [typeof data.media === "string" ? data.media : (data.media as any).path || blockId]: data.previewUrl || ""
      }));
      setCardBackgroundMode("different");
      notify("Section background photo uploaded ✨");
    } catch (error: any) {
      notify(error?.message || "Section background upload failed");
    } finally {
      setPendingMediaSizes((prev) => {
        const copy = { ...prev };
        delete copy[blockId];
        return copy;
      });
      setMediaUploading(false);
      e.target.value = "";
    }
  }

  async function resolveMediaOnMount(proj: GreetingProject) {
    const resolvePath = async (val: any) => {
      if (val && typeof val === "object" && val.storage === "supabase" && val.path) {
        try {
          const res = await fetch(`/api/media?path=${encodeURIComponent(val.path)}&kind=${val.kind}`);
          if (res.ok) {
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              const data = await res.json();
              return data.previewUrl || "";
            }
          }
        } catch {}
      }
      return "";
    };

    if (proj.audioUrl) {
      const url = await resolvePath(proj.audioUrl);
      if (url) setAudioPreviewUrl(url);
    }
    if (proj.customBg) {
      const url = await resolvePath(proj.customBg);
      if (url) {
        setCustomBgPreviews((prev) => ({ ...prev, [(proj.customBg as any).path]: url }));
      }
    }
    if (proj.blocks) {
      for (const b of proj.blocks) {
        if (b.customBg) {
          const url = await resolvePath(b.customBg);
          if (url) {
            setCustomBgPreviews((prev) => ({ ...prev, [(b.customBg as any).path]: url }));
          }
        }
        if (b.memoryVideo) {
          const url = await resolvePath(b.memoryVideo);
          if (url) {
            setMemoryVideoPreview((prev) => ({ ...prev, [b.id]: url }));
          }
        }
      }
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
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (ext !== ".mp3") {
      notify("Choose a valid MP3 audio file");
      e.target.value = "";
      return;
    }

    stopAudioPreview();
    setMediaUploading(true);
    setPendingMediaSizes((prev) => ({ ...prev, audio: file.size }));
    try {
      const data = await uploadMediaFile(file, "audio");
      setAudioUrl(data.media);
      setAudioPreviewUrl(data.previewUrl || "");
      setAudioError("");
      setAudioName(file.name);
      notify("Music added ✨");
    } catch (error: any) {
      notify(error?.message || "Media upload failed");
    } finally {
      setPendingMediaSizes((prev) => {
        const copy = { ...prev };
        delete copy.audio;
        return copy;
      });
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
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    const allowedExts = new Set([".mp4", ".webm", ".mov", ".qt"]);
    const allowedTypes = new Set(["video/mp4", "video/webm", "video/quicktime", "video/x-quicktime"]);
    if (!allowedTypes.has(file.type) && !allowedExts.has(ext)) {
      notify("Unsupported video type. Choose an MP4, WebM, or MOV video.");
      e.target.value = "";
      return;
    }
    setMediaUploading(true);
    const blockId = current.id;
    setPendingMediaSizes((prev) => ({ ...prev, [`video-${blockId}`]: file.size }));
    try {
      const data = await uploadMediaFile(file, "memory-video");
      updateCurrent({ memoryVideo: data.media });
      setMemoryVideoPreview((prev) => ({ ...prev, [current.id]: data.previewUrl || "" }));
      notify("Memory video added ✨");
    } catch (error: any) {
      notify(error?.message || "Memory video upload failed");
    } finally {
      setPendingMediaSizes((prev) => {
        const copy = { ...prev };
        delete copy[`video-${blockId}`];
        return copy;
      });
      setMediaUploading(false);
      e.target.value = "";
    }
  }

  async function uploadSecretVideo(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50_000_000) {
      notify("Video is too large. Choose a video under 50 MB.");
      return;
    }
    setMediaUploading(true);
    const blockId = current.id;
    try {
      const data = await uploadMediaFile(file, "memory-video");
      updateCurrent({ secretVideo: data.media });
      setMemoryVideoPreview((prev) => ({ ...prev, [`secret-${blockId}`]: data.previewUrl || "" }));
      notify("Secret video uploaded 🎁");
    } catch (err: any) {
      notify(err?.message || "Upload failed");
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

  function duplicateBlock(i: number) {
    const src = blocks[i];
    const copy = normalizeBlock({ ...src, id: uid(), title: `${src.title} (Copy)` }, i + 1, globalFont);
    const next = [...blocks];
    next.splice(i + 1, 0, copy);
    setBlocks(next);
    setSelected(i + 1);
    notify("Section duplicated ✨");
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
      incidents: "Our Story",
      letter: "A Little Letter",
      secret: "A Secret Reveal",
      cake: "Make a Wish",
      text: "A Little Note",
      image: "A Memory",
      music: "Our Song",
      custom: "Special Moment"
    };

    const block = normalizeBlock(
      {
        id: uid(),
        type,
        title: titles[type] ?? "Special Moment",
        subtitle: "A little moment",
        heading: type === "letter" ? "A little letter" : type === "incidents" ? "Memorable Incidents" : "Happy Birthday",
        text: "Write something from the heart here.",
        emoji: type === "image" ? "📸" : type === "letter" ? "💌" : type === "cake" ? "🎂" : type === "incidents" ? "😂" : "✨",
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
        items: type === "reasons" ? [] : undefined,
        incidents: type === "incidents" ? incidentDefaults : undefined
      },
      blocks.length,
      globalFont
    );
    setBlocks((prev) => [...prev, block]);
    setSelected(blocks.length);
    setAddOpen(false);
    setActiveTab("card");
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
        img.onerror = () => reject(new Error("Could not load image"));
        img.onload = () => {
          let { width, height } = img;
          if (width > maxSide || height > maxSide) {
            if (width > height) {
              height = Math.round((height * maxSide) / width);
              width = maxSide;
            } else {
              width = Math.round((width * maxSide) / height);
              height = maxSide;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("No 2D context"));
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.src = String(r.result);
      };
      r.readAsDataURL(file);
    });
  }

  async function pickGalleryImages(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const currentImgs = current.images ?? (current.image ? [current.image] : []);
    const remaining = 20 - currentImgs.length;
    if (remaining <= 0) return notify("Maximum 20 photos reached");
    const toProcess = files.slice(0, remaining);
    try {
      const urls = await Promise.all(toProcess.map((f) => compressImage(f, 1400, 0.78)));
      const next = [...currentImgs, ...urls];
      updateCurrent({ images: next, image: next[0] ?? "" });
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
  const incident = (current.incidents ?? incidentDefaults)[selectedIncident];
  const heroAdjustment =
    current.imageAdjustments?.["hero"] ?? current.imageAdjustments?.["0"] ?? { scale: 100, x: 50, y: 50 };

  // Countdown computation
  const daysUntilEvent = useMemo(() => {
    if (!targetEventDate) return null;
    const target = new Date(targetEventDate).getTime();
    const today = new Date().setHours(0, 0, 0, 0);
    const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    return diff;
  }, [targetEventDate]);

  // ============================================================================
  // RENDER: DESIGN & THEME CONTROLS (Authentic Hanora Full Suite)
  // ============================================================================
  function renderThemeTab() {
    return (
      <div className="tabPaneContent">
        <div className="editorHead">
          <h2 style={{ fontSize: "16px", margin: 0 }}>🎨 Global Design & Theme</h2>
        </div>

        {/* Theme Presets */}
        <div className="divider" style={{ marginTop: "6px" }}>Theme Presets</div>
        <div className="themeGrid">
          {[
            ["dark", "Dark"],
            ["light", "Light"],
            ["system", "System"],
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

        {/* Dynamic Background Presets */}
        <div className="divider">🌈 Dynamic Background</div>
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
              className={`bgOption ${background === v && !customBg ? "active" : ""}`}
              onClick={() => {
                setBackground(v);
                setCustomBg("");
              }}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Gradient Palette Colors */}
        <div className="divider">🎨 Gradient Palette</div>
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

        <label style={{ marginTop: "8px" }}>
          Background overlay <strong>{backgroundOverlay}%</strong>
          <input
            type="range"
            min="0"
            max="60"
            value={backgroundOverlay}
            onChange={(e) => setBackgroundOverlay(Number(e.target.value))}
          />
        </label>

        {/* Custom Wallpaper Background */}
        <div className="divider">🖼️ Custom Wallpaper Photo</div>
        <p className="helperText">Upload a wallpaper image applied across your greeting with full zoom, position, and opacity control.</p>

        <input
          ref={bgFileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={uploadGlobalBackground}
        />

        {!customBg ? (
          <button
            type="button"
            className="btn full"
            style={{ marginTop: "6px" }}
            onClick={() => bgFileInputRef.current?.click()}
          >
            📷 Choose background wallpaper
          </button>
        ) : (
          <div className="customBgManager" style={{ marginTop: "8px", padding: "12px", border: "1px solid var(--line)", borderRadius: "14px", background: "rgba(255,255,255,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#fff" }}>
                🖼️ {customBgName || "wallpaper.jpg"}
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
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
              Reset wallpaper framing
            </button>
          </div>
        )}

        {/* Card Background Mode */}
        <div className="divider">🖼️ Card Background Mode</div>
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
            Different background per section
          </label>
        </div>

        {/* Global Typography */}
        <div className="divider">🔤 Global Typography</div>
        <label>
          Global Font
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

        {/* Card Transparency & Radius */}
        <div className="divider">🧱 Card Transparency & Radius</div>
        <label>
          Card Transparency (Global) <strong>{globalCardOpacity}%</strong>
          <input
            type="range"
            min="0"
            max="100"
            value={globalCardOpacity}
            onChange={(e) => setGlobalCardOpacity(Number(e.target.value))}
          />
        </label>
        <label>
          Card Corner Radius <strong>{globalRadius}px</strong>
          <input
            type="range"
            min="0"
            max="48"
            value={globalRadius}
            onChange={(e) => setGlobalRadius(Number(e.target.value))}
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

        {/* Emoji Motion & Style */}
        <div className="divider">🎭 Global Emoji Motion</div>
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

        {/* Background Music */}
        <div className="divider">🎵 Background Music</div>
        <p className="helperText">Upload an MP3 song to play softly with the greeting.</p>
        <label>
          Upload MP3 (Max 20MB)
          <input
            type="file"
            accept="audio/mpeg,.mp3"
            onChange={uploadAudio}
            disabled={mediaUploading}
          />
        </label>
        {(audioUrl || audioPreviewUrl) && (
          <div className="audioControlCard">
            <div style={{ display: "flex", flexDirection: "column", gap: "2px", overflow: "hidden", flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                <Volume2 size={16} style={{ flexShrink: 0, color: "var(--accent)" }} />
                <b style={{ fontSize: "12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {audioName || "Selected music"}
                </b>
              </div>
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
        <audio ref={audioPreviewElRef} onEnded={() => setAudioPreviewPlaying(false)} />

        {/* Draft Actions */}
        <div className="draftActions" style={{ marginTop: "24px" }}>
          <button type="button" className="btn" onClick={save}>
            <Save size={14} /> Save changes
          </button>
          <button type="button" className="btn danger" onClick={deleteCurrentDraft}>
            <Trash2 size={14} /> Clear draft
          </button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: STORY FLOW CARDS
  // ============================================================================
  function renderStoryTab() {
    return (
      <div className="tabPaneContent">
        <div className="editorHead">
          <div>
            <h2 style={{ fontSize: "16px", margin: 0 }}>Story Flow Deck</h2>
            <small style={{ color: "var(--accent)" }}>{blocks.length} cards in greeting sequence</small>
          </div>
          <button
            type="button"
            className="btn small primary"
            onClick={() => setAddOpen(true)}
          >
            <Plus size={12} /> Add Card
          </button>
        </div>
        <div className="storyList" style={{ marginTop: "12px" }}>
          {blocks.map((b, i) => (
            <div
              className={`storyItem ${i === selected ? "selected" : ""}`}
              key={b.id}
              onClick={() => {
                selectBlock(i);
                setActiveTab("card");
              }}
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
                <b>{b.emoji ? `${b.emoji} ` : ""}{b.title}</b>
                <small>{b.type}</small>
              </div>

              <button
                type="button"
                title="Duplicate card"
                onClick={(e) => {
                  e.stopPropagation();
                  duplicateBlock(i);
                }}
              >
                <Copy size={12} />
              </button>

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
          style={{ marginTop: "14px" }}
          onClick={() => setAddOpen(true)}
        >
          <Plus size={15} /> Add new card template
        </button>
      </div>
    );
  }

  // ============================================================================
  // RENDER: EDIT CARD INSPECTOR (Full Suite)
  // ============================================================================
  function renderCardTab() {
    return (
      <div className="tabPaneContent">
        <div className="editorHead">
          <div>
            <h2 style={{ fontSize: "16px", margin: 0 }}>
              Section {selected + 1}: {current.title}
            </h2>
            <small style={{ color: "var(--accent)" }}>Type: {current.type}</small>
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              type="button"
              className="btn small"
              disabled={selected === 0}
              onClick={() => selectBlock(selected - 1)}
              title="Previous Section"
            >
              ◀
            </button>
            <button
              type="button"
              className="btn small"
              disabled={selected === blocks.length - 1}
              onClick={() => selectBlock(selected + 1)}
              title="Next Section"
            >
              ▶
            </button>
          </div>
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

        {/* Typography & Sizes for This Section */}
        <div className="divider">🔤 Typography & Font Sizes</div>
        <div className="typographyControlGroup">
          <div className="typoItem">
            <div className="typoHeader">
              <span>Title Size</span>
              <span className="typoSizeVal">{current.titleSize ?? 12}px</span>
            </div>
            <div className="typoRow" style={{ display: "flex", gap: "8px" }}>
              <select
                value={current.titleFont ?? globalFont}
                onChange={(e) => updateCurrent({ titleFont: e.target.value as FontName })}
              >
                {fontOptions}
              </select>
              <input
                type="range"
                min="10"
                max="36"
                value={current.titleSize ?? 12}
                onChange={(e) => updateCurrent({ titleSize: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="typoItem" style={{ marginTop: "8px" }}>
            <div className="typoHeader">
              <span>Subtitle Size</span>
              <span className="typoSizeVal">{current.subtitleSize ?? 14}px</span>
            </div>
            <div className="typoRow" style={{ display: "flex", gap: "8px" }}>
              <select
                value={current.subtitleFont ?? globalFont}
                onChange={(e) => updateCurrent({ subtitleFont: e.target.value as FontName })}
              >
                {fontOptions}
              </select>
              <input
                type="range"
                min="10"
                max="36"
                value={current.subtitleSize ?? 14}
                onChange={(e) => updateCurrent({ subtitleSize: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="typoItem" style={{ marginTop: "8px" }}>
            <div className="typoHeader">
              <span>Heading Size</span>
              <span className="typoSizeVal">{current.headingSize ?? 70}px</span>
            </div>
            <div className="typoRow" style={{ display: "flex", gap: "8px" }}>
              <select
                value={current.headingFont ?? current.font ?? globalFont}
                onChange={(e) => updateCurrent({ headingFont: e.target.value as FontName })}
              >
                {fontOptions}
              </select>
              <input
                type="range"
                min="24"
                max="120"
                value={current.headingSize ?? 70}
                onChange={(e) => updateCurrent({ headingSize: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="typoItem" style={{ marginTop: "8px" }}>
            <div className="typoHeader">
              <span>Body Text Size</span>
              <span className="typoSizeVal">{current.bodySize ?? 17}px</span>
            </div>
            <div className="typoRow" style={{ display: "flex", gap: "8px" }}>
              <select
                value={current.bodyFont ?? "sans"}
                onChange={(e) => updateCurrent({ bodyFont: e.target.value as FontName })}
              >
                {fontOptions}
              </select>
              <input
                type="range"
                min="12"
                max="32"
                value={current.bodySize ?? 17}
                onChange={(e) => updateCurrent({ bodySize: Number(e.target.value) })}
              />
            </div>
          </div>
        </div>

        {/* Section Colors */}
        <div className="divider">🎨 Section Colors</div>
        <div className="colorPanel">
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
            Heading
            <input
              className="color"
              type="color"
              value={current.headingColor || globalTextColor}
              onChange={(e) => updateCurrent({ headingColor: e.target.value })}
            />
          </label>
          <label>
            Subtitle
            <input
              className="color"
              type="color"
              value={current.subtitleColor || "#ff9fc2"}
              onChange={(e) => updateCurrent({ subtitleColor: e.target.value })}
            />
          </label>
          <label>
            Body
            <input
              className="color"
              type="color"
              value={current.bodyColor || "#c8bacb"}
              onChange={(e) => updateCurrent({ bodyColor: e.target.value })}
            />
          </label>
          <label>
            Emoji
            <input
              className="color"
              type="color"
              value={current.emojiColor || "#ff86b0"}
              onChange={(e) => updateCurrent({ emojiColor: e.target.value })}
            />
          </label>
        </div>

        {/* Card Styling */}
        <div className="divider">🧱 Card Styling</div>
        <div className="two">
          <label>
            Card colour
            <input
              className="color"
              type="color"
              value={current.cardColor ?? "#ffffff"}
              onChange={(e) => updateCurrent({ cardColor: e.target.value })}
            />
          </label>
          <label>
            Card opacity <strong>{current.cardOpacity ?? globalCardOpacity}%</strong>
            <input
              type="range"
              min="0"
              max="100"
              value={current.cardOpacity ?? globalCardOpacity}
              onChange={(e) => updateCurrent({ cardOpacity: Number(e.target.value) })}
            />
          </label>
        </div>
        <div className="two">
          <label>
            Corner radius <strong>{current.radius ?? globalRadius}px</strong>
            <input
              type="range"
              min="0"
              max="48"
              value={current.radius ?? globalRadius}
              onChange={(e) => updateCurrent({ radius: Number(e.target.value) })}
            />
          </label>
          <label>
            Line spacing <strong>{Number(current.lineHeight ?? 1.75).toFixed(2)}</strong>
            <input
              type="range"
              min="1"
              max="2.4"
              step=".05"
              value={current.lineHeight ?? 1.75}
              onChange={(e) => updateCurrent({ lineHeight: Number(e.target.value) })}
            />
          </label>
        </div>
        <label>
          Letter spacing <strong>{current.letterSpacing ?? 0}px</strong>
          <input
            type="range"
            min="-1"
            max="6"
            step=".2"
            value={current.letterSpacing ?? 0}
            onChange={(e) => updateCurrent({ letterSpacing: Number(e.target.value) })}
          />
        </label>

        {/* Emoji & Animation */}
        <div className="two">
          <label>
            Emoji
            <input
              value={current.emoji}
              onChange={(e) => updateCurrent({ emoji: e.target.value })}
            />
          </label>
          <label>
            Emoji Animation
            <select
              value={current.emojiAnimation || emojiAnimation}
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

        {/* Image Opacity Slider */}
        <label>
          Image Opacity: <strong>{current.imageOpacity ?? 100}%</strong>
          <input
            type="range"
            min="10"
            max="100"
            value={current.imageOpacity ?? 100}
            onChange={(e) => updateCurrent({ imageOpacity: Number(e.target.value) })}
          />
        </label>

        {/* HERO / WELCOME PHOTO MANAGER */}
        {(current.type === "welcome" || current.type === "image") && (
          <div className="heroPhotoManager">
            <div className="divider">📸 Hero / Feature Photo</div>
            <label>
              Upload / Replace photo
              <input
                type="file"
                accept="image/*"
                onChange={(e) => pickImage(e, (url) => updateCurrent({ image: url }))}
              />
            </label>
            {current.image && (
              <div className="heroAdjustmentControls" style={{ marginTop: "8px" }}>
                <label>
                  Photo zoom <strong>{heroAdjustment.scale}%</strong>
                  <input
                    type="range"
                    min="50"
                    max="200"
                    value={heroAdjustment.scale}
                    onChange={(e) =>
                      updateImageAdjustment(0, { scale: Number(e.target.value) })
                    }
                  />
                </label>
                <div className="two">
                  <label>
                    Position X <strong>{heroAdjustment.x}%</strong>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={heroAdjustment.x}
                      onChange={(e) => updateImageAdjustment(0, { x: Number(e.target.value) })}
                    />
                  </label>
                  <label>
                    Position Y <strong>{heroAdjustment.y}%</strong>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={heroAdjustment.y}
                      onChange={(e) => updateImageAdjustment(0, { y: Number(e.target.value) })}
                    />
                  </label>
                </div>
                <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                  <button
                    type="button"
                    className="btn small"
                    onClick={() => resetImageAdjustment(0)}
                  >
                    <RotateCcw size={12} /> Reset pan/zoom
                  </button>
                  <button
                    type="button"
                    className="btn danger small"
                    onClick={() => updateCurrent({ image: "" })}
                  >
                    <Trash2 size={12} /> Remove photo
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* REASONS LIST MANAGER */}
        {current.type === "reasons" && (
          <div className="reasonsManager">
            <div className="divider">❤️ Reasons List ({(current.items ?? []).length})</div>
            {(current.items ?? reasonDefaults).map((r, i) => (
              <div
                key={r.id || i}
                className={`reasonRow ${selectedReason === i ? "selected" : ""}`}
                onClick={() => setSelectedReason(i)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px",
                  borderRadius: "8px",
                  background: selectedReason === i ? "rgba(255,79,139,0.15)" : "rgba(255,255,255,0.03)",
                  border: selectedReason === i ? "1px solid var(--accent)" : "1px solid var(--line)",
                  marginBottom: "6px",
                  cursor: "pointer"
                }}
              >
                <span>{r.emoji}</span>
                <span style={{ flex: 1, fontSize: "12px", fontWeight: 600 }}>{r.title}</span>
                <button
                  type="button"
                  className="iconBtn danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteReason(i);
                  }}
                  title="Delete reason"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn small full"
              style={{ marginTop: "6px" }}
              onClick={addReason}
            >
              <Plus size={13} /> Add reason
            </button>

            {reason && (
              <div className="reasonFields" style={{ marginTop: "10px" }}>
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

        {/* PHOTO GALLERY & MEMORIES MANAGER */}
        {(current.type === "memories" || current.type === "gallery") && (
          <div className="galleryManager">
            <div className="divider">
              🖼️ Photo Gallery ({(current.images ?? []).length} / 20)
            </div>

            <label>
              Gallery Layout
              <select
                value={current.galleryLayout || "scattered"}
                onChange={(e) =>
                  updateCurrent({ galleryLayout: e.target.value as Block["galleryLayout"] })
                }
              >
                <option value="scattered">✨ Scattered & Interactive (Dust Disintegration)</option>
                <option value="collage">Auto Dynamic Collage</option>
                <option value="grid">Balanced Grid</option>
                <option value="masonry">Masonry</option>
                <option value="polaroid">Polaroid</option>
                <option value="filmstrip">Filmstrip</option>
                <option value="hero">Hero Showcase</option>
              </select>
            </label>

            <label>
              Gallery Frame Background
              <select
                value={current.galleryBackground || "transparent"}
                onChange={(e) =>
                  updateCurrent({ galleryBackground: e.target.value as Block["galleryBackground"] })
                }
              >
                <option value="transparent">Transparent</option>
                <option value="black">Deep Dark Glass</option>
                <option value="white">Frosted White Glass</option>
              </select>
            </label>

            <label style={{ marginTop: "8px" }}>
              Upload photos (up to 20)
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={pickGalleryImages}
              />
            </label>

            {(current.images ?? []).length > 0 && (
              <div
                className="galleryThumbsGrid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "6px",
                  marginTop: "10px"
                }}
              >
                {(current.images ?? []).map((src, i) => (
                  <div
                    key={i}
                    className="galleryThumbWrapper"
                    style={{
                      position: "relative",
                      borderRadius: "6px",
                      overflow: "hidden",
                      aspectRatio: "1",
                      border: selectedGalleryImage === i ? "2px solid var(--accent)" : "1px solid var(--line)"
                    }}
                    onClick={() => setSelectedGalleryImage(i)}
                  >
                    <img
                      src={src}
                      alt={`Memory ${i + 1}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeGalleryImage(i);
                      }}
                      style={{
                        position: "absolute",
                        top: "2px",
                        right: "2px",
                        background: "rgba(0,0,0,0.7)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "50%",
                        width: "20px",
                        height: "20px",
                        display: "grid",
                        placeItems: "center",
                        cursor: "pointer"
                      }}
                      title="Remove photo"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Optional Memory Video Upload (Up to 50 MB) */}
            <div className="memoryVideoManager" style={{ marginTop: "14px" }}>
              <div className="divider">🎬 Memory Video (Up to 50 MB)</div>
              <label>
                Upload Video (MP4 / WebM / MOV)
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/*"
                  onChange={uploadMemoryVideo}
                  disabled={mediaUploading}
                />
              </label>
              {current.memoryVideo && (
                <div style={{ marginTop: "8px" }}>
                  <button
                    type="button"
                    className="btn danger small full"
                    onClick={() => {
                      updateCurrent({ memoryVideo: undefined });
                      setMemoryVideoPreview((prev) => {
                        const copy = { ...prev };
                        delete copy[current.id];
                        return copy;
                      });
                    }}
                  >
                    Remove video
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* LETTER STYLING */}
        {current.type === "letter" && (
          <div className="letterControls">
            <div className="divider">💌 Letter Customization</div>
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
                Title font
                <select
                  value={current.headingFont ?? "great-vibes"}
                  onChange={(e) => updateCurrent({ headingFont: e.target.value as FontName })}
                >
                  {fontOptions}
                </select>
              </label>
              <label>
                Body font
                <select
                  value={current.bodyFont ?? "serif"}
                  onChange={(e) => updateCurrent({ bodyFont: e.target.value as FontName })}
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
                  onChange={(e) => updateCurrent({ letterLineHeight: Number(e.target.value) })}
                />
              </label>
            </div>
            <label>
              Letter alignment
              <select
                value={current.letterAlign ?? "left"}
                onChange={(e) => updateCurrent({ letterAlign: e.target.value as Block["letterAlign"] })}
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </label>

            {allMemoryPhotos.length > 0 && (
              <div className="memoryPicker" style={{ marginTop: "10px" }}>
                <label style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "6px", display: "block" }}>
                  Pick from uploaded memory photos:
                </label>
                <div className="thumbGrid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
                  {allMemoryPhotos.map((src, i) => (
                    <button
                      type="button"
                      key={i}
                      className="thumbItem"
                      style={{
                        border: current.image === src ? "2px solid var(--accent)" : "1px solid var(--line)",
                        borderRadius: "6px",
                        overflow: "hidden",
                        padding: 0,
                        height: "50px"
                      }}
                      onClick={() => updateCurrent({ image: current.image === src ? "" : src })}
                    >
                      <img src={src} alt={`Memory ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECRET / TAP-TO-REVEAL MANAGER */}
        {current.type === "secret" && (
          <div className="secretRevealManager">
            <div className="divider">🎁 Tap-to-Reveal Hidden Media</div>
            <p className="helperText">Add hidden text, a hidden memory photo, and a secret video message revealed upon heart tap.</p>
            <label>
              Secret Message
              <textarea
                value={current.text}
                onChange={(e) => updateCurrent({ text: e.target.value })}
              />
            </label>
            <label style={{ marginTop: "8px" }}>
              Upload secret photo
              <input
                type="file"
                accept="image/*"
                onChange={(e) => pickImage(e, (url) => updateCurrent({ secretImage: url }))}
              />
            </label>
            {current.secretImage && (
              <button
                type="button"
                className="btn small danger"
                style={{ marginTop: "6px" }}
                onClick={() => updateCurrent({ secretImage: "" })}
              >
                <Trash2 size={12} /> Remove secret photo
              </button>
            )}
            <label style={{ marginTop: "10px" }}>
              Upload secret video (Up to 50 MB)
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/*"
                onChange={uploadSecretVideo}
                disabled={mediaUploading}
              />
            </label>
            {current.secretVideo && (
              <button
                type="button"
                className="btn small danger"
                style={{ marginTop: "6px" }}
                onClick={() => updateCurrent({ secretVideo: "" })}
              >
                <Trash2 size={12} /> Remove secret video
              </button>
            )}
          </div>
        )}

        {/* CAKE / CANDLE FINALE */}
        {current.type === "cake" && (
          <div className="cakeManager">
            <div className="divider">🎂 Birthday Cake & Wish Finale</div>
            <label>
              Candle Instructions / Wish Prompt
              <textarea
                value={current.text}
                onChange={(e) => updateCurrent({ text: e.target.value })}
                placeholder="Tap a candle to blow it out. Make a special wish for the year ahead ✨"
              />
            </label>
          </div>
        )}

        {/* MEMORABLE INCIDENTS */}
        {current.type === "incidents" && (
          <div className="incidentsManager">
            <div className="divider">😂 Story Incidents ({(current.incidents ?? []).length})</div>
            {(current.incidents ?? incidentDefaults).map((inc, i) => (
              <div
                key={inc.id || i}
                className={`incidentRow ${selectedIncident === i ? "selected" : ""}`}
                onClick={() => setSelectedIncident(i)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px",
                  borderRadius: "8px",
                  background: selectedIncident === i ? "rgba(255,79,139,0.15)" : "rgba(255,255,255,0.03)",
                  border: selectedIncident === i ? "1px solid var(--accent)" : "1px solid var(--line)",
                  marginBottom: "6px",
                  cursor: "pointer"
                }}
              >
                <span>{inc.emoji}</span>
                <div style={{ flex: 1 }}>
                  <b style={{ fontSize: "12px" }}>{inc.title}</b>
                  <span style={{ fontSize: "10px", color: "var(--muted)", display: "block" }}>{inc.tag}</span>
                </div>
                <button
                  type="button"
                  className="iconBtn danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteIncident(i);
                  }}
                  title="Delete incident"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn small full"
              style={{ marginTop: "6px" }}
              onClick={addIncident}
            >
              <Plus size={13} /> Add incident
            </button>

            {incident && (
              <div className="incidentFields" style={{ marginTop: "10px" }}>
                <div className="two">
                  <label>
                    Title
                    <input
                      value={incident.title}
                      onChange={(e) => updateIncident(selectedIncident, { title: e.target.value })}
                    />
                  </label>
                  <label>
                    Tag / Label
                    <input
                      value={incident.tag || ""}
                      onChange={(e) => updateIncident(selectedIncident, { tag: e.target.value })}
                    />
                  </label>
                </div>
                <div className="two">
                  <label>
                    Date
                    <input
                      value={incident.date || ""}
                      onChange={(e) => updateIncident(selectedIncident, { date: e.target.value })}
                    />
                  </label>
                  <label>
                    Emoji
                    <input
                      value={incident.emoji}
                      onChange={(e) => updateIncident(selectedIncident, { emoji: e.target.value })}
                    />
                  </label>
                </div>
                <label>
                  Incident Story
                  <textarea
                    value={incident.text}
                    onChange={(e) => updateIncident(selectedIncident, { text: e.target.value })}
                  />
                </label>
                <label style={{ marginTop: "6px" }}>
                  Incident Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => pickImage(e, (url) => updateIncident(selectedIncident, { image: url }))}
                  />
                </label>
                {incident.image && (
                  <button
                    type="button"
                    className="btn small danger"
                    style={{ marginTop: "6px" }}
                    onClick={() => updateIncident(selectedIncident, { image: "" })}
                  >
                    <Trash2 size={12} /> Remove photo
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* SECTION CUSTOM BACKGROUND (WHEN DIFFERENT BACKGROUNDS SELECTED) */}
        {cardBackgroundMode === "different" && (
          <div className="sectionBgManager" style={{ marginTop: "14px" }}>
            <div className="divider">🖼️ Individual Section Wallpaper</div>
            <input
              ref={sectionBgFileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={uploadSectionBackground}
            />
            <button
              type="button"
              className="btn full small"
              onClick={() => sectionBgFileInputRef.current?.click()}
            >
              📷 Upload section wallpaper
            </button>
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // MAIN RETURN JSX (Authentic Hanora Look & Feel)
  // ============================================================================
  return (
    <main className="creator">
      {/* Top Header Navigation */}
      <header className="creatorTop">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link href="/" className="logo">
            <span>
              HANORA<span>•</span>
            </span>
          </Link>
          <input
            className="canvaTitleInput"
            value={publishTitle}
            onChange={(e) => setPublishTitle(e.target.value)}
            title="Edit greeting title"
          />
          {targetEventDate ? (
            <button
              type="button"
              className="canvaReminderBadge"
              onClick={() => setReminderModalOpen(true)}
              title="Click to view/change target event"
            >
              <Calendar size={13} />
              <span>
                {targetEventTitle || "Event"}: {daysUntilEvent !== null ? (daysUntilEvent === 0 ? "Today! 🎉" : `${daysUntilEvent}d left`) : targetEventDate}
              </span>
            </button>
          ) : (
            <button
              type="button"
              className="canvaAddReminderBtn"
              onClick={() => setReminderModalOpen(true)}
            >
              <Clock size={13} /> Set Reminder
            </button>
          )}
        </div>

        <div className="topActions">
          <div
            className="capacityIndicator hideOnMobile"
            style={{
              fontSize: "11px",
              color: projectBytes > 70_000_000 ? "#ff4976" : "var(--muted)",
              marginRight: "8px",
              alignSelf: "center"
            }}
          >
            Size: <strong>{(projectBytes / (1024 * 1024)).toFixed(1)} MB</strong> / 80 MB
          </div>

          <button
            type="button"
            className="btn small"
            onClick={() => setFullPreviewOpen(true)}
            title="Open live realistic preview"
          >
            <Eye size={14} /> Preview
          </button>

          <button
            type="button"
            className="btn small"
            onClick={save}
            title="Save draft"
          >
            <Save size={14} /> Save
          </button>

          <button
            type="button"
            className="btn small"
            onClick={loadDrafts}
            title="Manage cloud drafts"
          >
            <FolderOpen size={14} /> Drafts
          </button>

          <button
            type="button"
            className="btn small"
            onClick={() => setAuthModalOpen(true)}
            title="Account / Login"
          >
            <User size={14} /> {userProfile?.name || (userProfile ? "Account" : "Sign In")}
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

      {/* Main Studio Grid */}
      <div className="creatorGrid">
        {/* Left Column Studio Inspector (Desktop) */}
        <aside className="sidePanel editor">
          {/* Studio Tab Switcher with 3 Primary Categories */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "4px",
              padding: "6px",
              background: "rgba(0,0,0,0.4)",
              borderRadius: "12px",
              marginBottom: "14px"
            }}
          >
            <button
              type="button"
              className={`btn small ${activeTab === "theme" ? "primary" : ""}`}
              onClick={() => setActiveTab("theme")}
              style={{ justifyContent: "center", fontSize: "11px", padding: "6px 2px" }}
            >
              <Sparkles size={13} /> Design
            </button>
            <button
              type="button"
              className={`btn small ${activeTab === "story" ? "primary" : ""}`}
              onClick={() => setActiveTab("story")}
              style={{ justifyContent: "center", fontSize: "11px", padding: "6px 2px" }}
            >
              <Copy size={13} /> Story ({blocks.length})
            </button>
            <button
              type="button"
              className={`btn small ${activeTab === "card" ? "primary" : ""}`}
              onClick={() => setActiveTab("card")}
              style={{ justifyContent: "center", fontSize: "11px", padding: "6px 2px" }}
            >
              <Pencil size={13} /> Edit ({selected + 1})
            </button>
          </div>

          {activeTab === "theme" && renderThemeTab()}
          {activeTab === "story" && renderStoryTab()}
          {activeTab === "card" && renderCardTab()}
        </aside>

        {/* Center / Right Column: Live Interactive Canvas Preview */}
        <div className={`previewWrap ${mobileDrawerOpen ? "drawerOpen" : ""}`}>
          <div className="previewToolbar" style={{ marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "12px", color: "var(--muted)" }}>
              Editing: <b style={{ color: "#fff" }}>{current.title}</b> ({selected + 1} / {blocks.length})
            </div>
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
            selectedBlockId={current.id}
            onEditSection={(blockId) => {
              const idx = blocks.findIndex((b) => b.id === blockId);
              if (idx >= 0) {
                selectBlock(idx);
                setActiveTab("card");
                setMobileDrawerOpen(true);
              }
            }}
            onEditReason={(blockId, reasonIdx) => {
              const idx = blocks.findIndex((b) => b.id === blockId);
              if (idx >= 0) {
                setSelected(idx);
                setSelectedReason(reasonIdx);
                setActiveTab("card");
                setMobileDrawerOpen(true);
              }
            }}
            onAddReason={addReason}
            onEditIncident={(blockId, incIdx) => {
              const idx = blocks.findIndex((b) => b.id === blockId);
              if (idx >= 0) {
                setSelected(idx);
                setSelectedIncident(incIdx);
                setActiveTab("card");
                setMobileDrawerOpen(true);
              }
            }}
            onAddIncident={addIncident}
            previewDevice={previewDevice}
            title={publishTitle}
            memoryVideoPreviews={memoryVideoPreview}
            customBgPreviews={customBgPreviews}
          />
        </div>
      </div>

      {/* Mobile Creative Studio Bottom Bar (3 Primary Tools) */}
      <nav className="mobileStudioBar">
        <button
          type="button"
          className={`mobileStudioToolBtn ${activeTab === "theme" && mobileDrawerOpen ? "active" : ""}`}
          onClick={() => {
            if (activeTab === "theme" && mobileDrawerOpen) {
              setMobileDrawerOpen(false);
            } else {
              setActiveTab("theme");
              setMobileDrawerOpen(true);
            }
          }}
        >
          <Sparkles size={18} />
          <span>Design & Theme</span>
        </button>
        <button
          type="button"
          className={`mobileStudioToolBtn ${activeTab === "story" && mobileDrawerOpen ? "active" : ""}`}
          onClick={() => {
            if (activeTab === "story" && mobileDrawerOpen) {
              setMobileDrawerOpen(false);
            } else {
              setActiveTab("story");
              setMobileDrawerOpen(true);
            }
          }}
        >
          <Copy size={18} />
          <span>Story Cards</span>
        </button>
        <button
          type="button"
          className={`mobileStudioToolBtn ${activeTab === "card" && mobileDrawerOpen ? "active" : ""}`}
          onClick={() => {
            if (activeTab === "card" && mobileDrawerOpen) {
              setMobileDrawerOpen(false);
            } else {
              setActiveTab("card");
              setMobileDrawerOpen(true);
            }
          }}
        >
          <Pencil size={18} />
          <span>Edit Card ({selected + 1})</span>
        </button>
      </nav>

      {/* Mobile Contextual Compact Bottom Sheet (Contains FULL suite, ~44vh max height) */}
      {mobileDrawerOpen && (
        <div className="mobileStudioDrawer">
          <div className="mobileStudioDrawerHead">
            <h3 style={{ margin: 0, fontSize: "14px", color: "#fff", display: "flex", alignItems: "center", gap: "6px" }}>
              {activeTab === "theme" && <><Sparkles size={15} /> Design & Theme</>}
              {activeTab === "story" && <><Copy size={15} /> Story Cards ({blocks.length})</>}
              {activeTab === "card" && <><Pencil size={15} /> Edit: {current.title}</>}
            </h3>
            <button
              type="button"
              className="btn small"
              onClick={() => setMobileDrawerOpen(false)}
            >
              Done / Close
            </button>
          </div>
          <div className="mobileStudioDrawerScroll customScrollbar">
            {activeTab === "theme" && renderThemeTab()}
            {activeTab === "story" && renderStoryTab()}
            {activeTab === "card" && renderCardTab()}
          </div>
        </div>
      )}

      {/* Event Reminder Modal */}
      {reminderModalOpen && (
        <div className="modal" onClick={() => setReminderModalOpen(false)}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <div className="modalTop">
              <div>
                <h2>🎂 Birthday & Event Reminder</h2>
                <p>Configure your target celebration date and automated 1-day reminder.</p>
              </div>
              <button type="button" onClick={() => setReminderModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div style={{ marginTop: "14px" }}>
              <label>
                Event Name / Person
                <input
                  value={targetEventTitle}
                  onChange={(e) => setTargetEventTitle(e.target.value)}
                  placeholder="e.g. Maya's 25th Birthday"
                />
              </label>
              <label style={{ marginTop: "10px" }}>
                Celebration Date
                <input
                  type="date"
                  value={targetEventDate}
                  onChange={(e) => {
                    const d = e.target.value;
                    setTargetEventDate(d);
                    if (d) {
                      const dt = new Date(d);
                      dt.setDate(dt.getDate() - 1);
                      setReminderDate(dt.toISOString().split("T")[0]);
                    } else {
                      setReminderDate("");
                    }
                  }}
                />
              </label>
              {reminderDate && (
                <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--accent)" }}>
                  🔔 Reminder Date: <strong>{reminderDate}</strong> (1 day before event)
                </div>
              )}
              {daysUntilEvent !== null && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "10px",
                    borderRadius: "8px",
                    background: "rgba(255, 79, 139, 0.15)",
                    fontSize: "13px",
                    fontWeight: 500
                  }}
                >
                  {daysUntilEvent === 0
                    ? "🎂 Today is the big day! Generate and share your link now!"
                    : daysUntilEvent === 1
                    ? `🎂 Tomorrow is ${targetEventTitle || "the birthday"}! Finish your draft now.`
                    : `⏳ ${daysUntilEvent} days remaining until ${targetEventTitle || "the celebration"}!`}
                </div>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "18px" }}>
              <button type="button" className="btn small" onClick={() => setReminderModalOpen(false)}>
                Close
              </button>
              <button
                type="button"
                className="btn small primary"
                onClick={() => {
                  setReminderModalOpen(false);
                  save();
                }}
              >
                Save Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Section Modal */}
      {addOpen && (
        <div className="modal" onClick={() => setAddOpen(false)}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <div className="modalTop">
              <div>
                <h2>✨ Add a Section Template</h2>
                <p>Select a card type to enrich your greeting story.</p>
              </div>
              <button type="button" onClick={() => setAddOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="addGrid">
              {[
                { type: "welcome" as BlockType, label: "Welcome / Hero", icon: "✨", desc: "Opening hero title and photo" },
                { type: "reasons" as BlockType, label: "What I Love", icon: "❤️", desc: "Cards list of heartfelt reasons" },
                { type: "memories" as BlockType, label: "Photo Gallery", icon: "🖼️", desc: "Interactive memory photos & layouts" },
                { type: "incidents" as BlockType, label: "Memorable Incidents", icon: "😂", desc: "Funny stories and dated incidents" },
                { type: "letter" as BlockType, label: "A Little Letter", icon: "💌", desc: "Longform personal letter with photo" },
                { type: "secret" as BlockType, label: "Secret Reveal", icon: "🎁", desc: "Tap-to-reveal secret message & video" },
                { type: "cake" as BlockType, label: "Birthday Cake", icon: "🎂", desc: "Interactive candles to blow & wish finale" },
                { type: "text" as BlockType, label: "A Little Note", icon: "📝", desc: "Simple message with clean styling" },
                { type: "image" as BlockType, label: "Memory Snapshot", icon: "📸", desc: "Dedicated full-frame photo slide" }
              ].map((item) => (
                <button
                  type="button"
                  key={item.type}
                  onClick={() => addBlock(item.type)}
                >
                  <div style={{ fontSize: "20px", marginBottom: "4px" }}>{item.icon}</div>
                  <b style={{ display: "block", color: "#fff" }}>{item.label}</b>
                  <span style={{ fontSize: "11px", color: "var(--muted)" }}>{item.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cloud Drafts Manager Modal */}
      {draftsOpen && (
        <div className="modal" onClick={() => setDraftsOpen(false)}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <div className="modalTop">
              <div>
                <h2>📁 Saved Drafts</h2>
                <p>Manage saved greeting drafts. Deleting drafts automatically purges media from Supabase storage.</p>
              </div>
              <button type="button" onClick={() => setDraftsOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="draftsList" style={{ marginTop: "14px" }}>
              {savedDraftsList.length === 0 ? (
                <p style={{ color: "#888", textAlign: "center", padding: "20px" }}>No saved cloud drafts found.</p>
              ) : (
                savedDraftsList.map((d) => (
                  <div className="draftRow" key={d.id}>
                    <div className="draftDetails">
                      <b>{d.title}</b>
                      {d.targetEventDate && (
                        <span className="draftEventTag">🎂 Event: {d.targetEventDate}</span>
                      )}
                      <small>Saved: {new Date(d.updatedAt || "").toLocaleDateString()}</small>
                    </div>
                    <div className="draftRowActions">
                      <button
                        type="button"
                        className="btn small"
                        onClick={() => restoreDraft(d)}
                      >
                        Load
                      </button>
                      <button
                        type="button"
                        className="iconBtn danger"
                        onClick={() => deleteDraftRecord(d.id)}
                        title="Delete draft & clean storage"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Google Login / Account Modal */}
      {authModalOpen && (
        <div className="modal" onClick={() => setAuthModalOpen(false)}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <div className="modalTop">
              <div>
                <h2>👤 Account & Sync</h2>
                <p>Sign in with Google to sync your drafts and reminders across devices.</p>
              </div>
              <button type="button" onClick={() => setAuthModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            {userProfile ? (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div className="userAvatar" style={{ fontSize: "32px", marginBottom: "8px" }}>
                  👤
                </div>
                <h3 style={{ margin: "0 0 4px", color: "#fff" }}>{userProfile.name || userProfile.email}</h3>
                <p style={{ color: "#888", fontSize: "12px", margin: "0 0 20px" }}>{userProfile.email}</p>
                <button
                  type="button"
                  className="btn danger full"
                  onClick={async () => {
                    try {
                      await signOut();
                    } catch {}
                    setUserProfile(null);
                    setAuthModalOpen(false);
                    notify("Signed out");
                  }}
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            ) : (
              <div style={{ padding: "10px 0" }}>
                <p className="helperText">
                  Sign in with Google to access your own personal workspace and drafts.
                </p>
                <button
                  type="button"
                  className="btn full primary"
                  style={{ marginTop: "14px", padding: "12px", fontSize: "14px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
                  onClick={async () => {
                    try {
                      await signInWithGoogle();
                    } catch (err: any) {
                      notify(err.message || "Google sign-in could not be initiated");
                    }
                  }}
                >
                  <LogIn size={16} /> Continue with Google
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen Realistic Recipient Preview Modal */}
      {fullPreviewOpen && (
        <div className="fullPreviewOverlay">
          <div className="fullPreviewBar">
            <div className="previewDeviceInfo">
              <button
                type="button"
                className={`previewDeviceBtn ${previewDevice === "desktop" ? "active" : ""}`}
                onClick={() => setPreviewDevice("desktop")}
              >
                Desktop View
              </button>
              <button
                type="button"
                className={`previewDeviceBtn ${previewDevice === "mobile" ? "active" : ""}`}
                onClick={() => setPreviewDevice("mobile")}
              >
                Mobile View
              </button>
            </div>
            <button
              type="button"
              className="btn small"
              onClick={() => setFullPreviewOpen(false)}
            >
              <X size={15} /> Close Preview
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

      {/* Publish Live Link Modal */}
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
