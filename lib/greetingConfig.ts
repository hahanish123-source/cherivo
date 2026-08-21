import type { Block, BlockType, FontName, GreetingProject, IncidentItem, ReasonItem } from "./types";

export const reasonDefaults: ReasonItem[] = [
  { id: "r1", title: "Your laugh", text: "The way your laugh makes an ordinary moment feel lighter.", emoji: "😊" },
  { id: "r2", title: "Your kindness", text: "The little things you do that make people feel seen.", emoji: "💗" },
  { id: "r3", title: "Your way of making ordinary days memorable", text: "Somehow even the smallest moments become memories with you.", emoji: "✨" }
];

export const incidentDefaults: IncidentItem[] = [
  {
    id: "inc-1",
    title: "The Day We Met",
    tag: "First Memory",
    date: "Day 1",
    text: "Who knew that a random conversation would turn into one of my most cherished friendships?",
    emoji: "☕"
  },
  {
    id: "inc-2",
    title: "That Uncontrollable Laugh Incident",
    tag: "Most Hilarious",
    date: "That unforgettable night",
    text: "We started laughing over the dumbest thing and couldn't stop for 20 minutes straight until our stomachs hurt!",
    emoji: "😂"
  },
  {
    id: "inc-3",
    title: "When You Had My Back",
    tag: "Core Memory",
    date: "Always",
    text: "Without even hesitating, you were right there when I needed someone the most. I'll never forget that.",
    emoji: "🛡️"
  }
];

export const defaultBlocks: Block[] = [
  {
    id: "welcome",
    type: "welcome",
    title: "Welcome",
    subtitle: "A little beginning",
    heading: "Happy Birthday, Someone Special",
    text: "Today is a little reminder of how much joy one person can bring into the lives around them.",
    emoji: "💗",
    accent: "#ff4f8b",
    headingColor: "#fff7fb",
    subtitleColor: "#ff9fc2",
    bodyColor: "#c8bacb",
    emojiColor: "#ff86b0",
    headingSize: 70,
    bodySize: 17,
    lineHeight: 1.75,
    letterSpacing: 0,
    radius: 21,
    cardColor: "#ffffff",
    cardOpacity: 14,
    imageOpacity: 100,
    visible: true
  },
  {
    id: "reasons",
    type: "reasons",
    title: "What I Love",
    subtitle: "Reasons",
    heading: "What I love about you",
    text: "Every little reason is yours to rewrite.",
    emoji: "🦋",
    accent: "#ff6f9e",
    headingColor: "#fff7fb",
    subtitleColor: "#ff9fc2",
    bodyColor: "#c8bacb",
    emojiColor: "#ff86b0",
    headingSize: 70,
    bodySize: 17,
    lineHeight: 1.75,
    letterSpacing: 0,
    radius: 21,
    cardColor: "#ffffff",
    cardOpacity: 14,
    imageOpacity: 100,
    visible: true,
    items: reasonDefaults
  },
  {
    id: "memories",
    type: "memories",
    title: "Our Memories",
    subtitle: "Little moments",
    heading: "Little moments, big memories",
    text: "Add dates, photos and tiny stories that deserve to stay.",
    emoji: "📸",
    accent: "#c084fc",
    headingColor: "#fff7fb",
    subtitleColor: "#ff9fc2",
    bodyColor: "#c8bacb",
    emojiColor: "#ff86b0",
    headingSize: 70,
    bodySize: 17,
    lineHeight: 1.75,
    letterSpacing: 0,
    radius: 21,
    cardColor: "#ffffff",
    cardOpacity: 14,
    imageOpacity: 100,
    visible: true
  },
  {
    id: "letter",
    type: "letter",
    title: "A Letter",
    subtitle: "For you",
    heading: "A little letter",
    text: "Write something only they should read here.",
    emoji: "💌",
    font: "script",
    titleFont: "sans",
    subtitleFont: "script",
    headingFont: "script",
    bodyFont: "serif",
    accent: "#ff86b0",
    headingColor: "#fff7fb",
    subtitleColor: "#ff9fc2",
    bodyColor: "#c8bacb",
    emojiColor: "#ff86b0",
    headingSize: 70,
    bodySize: 17,
    lineHeight: 1.75,
    letterSpacing: 0,
    radius: 21,
    cardColor: "#ffffff",
    cardOpacity: 14,
    letterColor: "#2d2024",
    letterSize: 17,
    letterLineHeight: 1.8,
    letterAlign: "left",
    imageOpacity: 100,
    visible: true
  },
  {
    id: "secret",
    type: "secret",
    title: "One More Thing",
    subtitle: "A secret reveal",
    heading: "There's one more thing...",
    text: "Tap the heart to reveal what comes next.",
    emoji: "💗",
    accent: "#ff3d78",
    headingColor: "#fff7fb",
    subtitleColor: "#ff9fc2",
    bodyColor: "#c8bacb",
    emojiColor: "#ff86b0",
    headingSize: 70,
    bodySize: 17,
    lineHeight: 1.75,
    letterSpacing: 0,
    radius: 21,
    cardColor: "#ffffff",
    cardOpacity: 14,
    imageOpacity: 100,
    visible: true
  },
  {
    id: "cake",
    type: "cake",
    title: "Make a Wish",
    subtitle: "Birthday moment",
    heading: "Make a wish",
    text: "Blow the candles or tap them.",
    emoji: "🎂",
    accent: "#ffb45c",
    headingColor: "#fff7fb",
    subtitleColor: "#ff9fc2",
    bodyColor: "#c8bacb",
    emojiColor: "#ff86b0",
    headingSize: 70,
    bodySize: 17,
    lineHeight: 1.75,
    letterSpacing: 0,
    radius: 21,
    cardColor: "#ffffff",
    cardOpacity: 14,
    imageOpacity: 100,
    visible: true
  }
];

export const themes: Record<string, [string, string, string, string]> = {
  dark: ["#0b0810", "#ff4f8b", "#ff9fc2", "#fff7fb"],
  light: ["#fff7f4", "#d34f75", "#a23d60", "#2d2027"],
  system: ["#101015", "#e879a0", "#f4a6c0", "#f8f7fb"],
  romantic: ["#160914", "#ff3d78", "#ff86b0", "#fff4f8"],
  dreamy: ["#0d1020", "#9b7cff", "#cbbdff", "#f7f5ff"]
};

export const backgrounds: Record<string, string> = {
  aurora:
    "radial-gradient(circle at 12% 18%, rgba(255,61,120,.52), transparent 28%),radial-gradient(circle at 88% 18%, rgba(124,92,255,.58), transparent 30%),radial-gradient(circle at 72% 82%, rgba(34,211,238,.26), transparent 28%),linear-gradient(135deg,#090713 0%,#21102e 48%,#070914 100%)",
  mesh:
    "radial-gradient(circle at 15% 20%, rgba(255,70,150,.64), transparent 25%),radial-gradient(circle at 82% 18%, rgba(126,87,255,.62), transparent 28%),radial-gradient(circle at 72% 78%, rgba(0,220,210,.34), transparent 26%),radial-gradient(circle at 20% 82%, rgba(255,170,65,.24), transparent 25%),linear-gradient(120deg,#130a18,#27123a 45%,#08141b)",
  gradient:
    "linear-gradient(125deg,#ff4f8b 0%,#a855f7 38%,#38bdf8 72%,#111827 100%)",
  stars:
    "radial-gradient(circle at 20% 25%,#ffffffaa 0 1px,transparent 2px),radial-gradient(circle at 70% 18%,#ffffff88 0 1px,transparent 2px),linear-gradient(145deg,#070611,#15102b 55%,#050611)",
  minimal:
    "radial-gradient(circle at 50% 15%, rgba(255,255,255,.16), transparent 28%),linear-gradient(180deg,#17131b,#0a090d)",
  petals:
    "radial-gradient(circle at 12% 18%,#ff91bb55,transparent 25%), radial-gradient(circle at 82% 22%,#ffd4e855,transparent 25%), linear-gradient(145deg,#1a0b16,#26132b 55%,#0a0710)",
  lightGradient:
    "linear-gradient(135deg,#fff0f5 0%,#f4e9ff 45%,#e8f7ff 100%)"
};

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export const validFonts: FontName[] = [
  "sans",
  "serif",
  "script",
  "caveat",
  "great-vibes",
  "dancing-script",
  "pacifico",
  "satisfy",
  "allura",
  "sacramento"
];

export function getFont(f?: string): string {
  const fontKey = (f || "").toLowerCase().trim();
  if (fontKey === "script" || fontKey === "great-vibes" || fontKey === "great vibes") return '"Great Vibes", cursive';
  if (fontKey === "serif") return '"Playfair Display", Georgia, serif';
  if (fontKey === "caveat") return '"Caveat", cursive';
  if (fontKey === "dancing-script" || fontKey === "dancing script") return '"Dancing Script", cursive';
  if (fontKey === "pacifico") return '"Pacifico", cursive';
  if (fontKey === "satisfy") return '"Satisfy", cursive';
  if (fontKey === "allura") return '"Allura", cursive';
  if (fontKey === "sacramento") return '"Sacramento", cursive';
  return '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
}

export function normalizeBlock(raw: any, fallbackIndex = 0, fallbackFont: FontName = "serif"): Block {
  if (!raw || typeof raw !== "object") {
    const fb = defaultBlocks[fallbackIndex] ?? defaultBlocks[0];
    return { ...fb, id: uid() };
  }

  const items = raw.type === "reasons"
    ? (Array.isArray(raw.items)
        ? raw.items.map((x: any, i: number) =>
            typeof x === "string"
              ? { id: `legacy-${i}`, title: x, text: "Make this reason yours.", emoji: "✨" }
              : {
                  id: x?.id ?? uid(),
                  title: x?.title ?? "A reason",
                  text: x?.text ?? "Make this reason yours.",
                  emoji: x?.emoji ?? "✨"
                }
          )
        : reasonDefaults)
    : undefined;

  const incidents = raw.type === "incidents"
    ? (Array.isArray(raw.incidents)
        ? raw.incidents.map((x: any, i: number) => ({
            id: x?.id ?? uid(),
            title: x?.title ?? `Incident #${i + 1}`,
            tag: x?.tag ?? "Core Memory",
            date: x?.date ?? "",
            text: x?.text ?? "Write about what happened...",
            emoji: x?.emoji ?? "✨",
            image: x?.image ? String(x.image) : undefined
          }))
        : incidentDefaults)
    : undefined;

  const safeFont = (fontVal: any, def: FontName): FontName =>
    validFonts.includes(fontVal) ? fontVal : def;

  const defaultFont = safeFont(raw.font, fallbackFont);

  return {
    id: raw.id ? String(raw.id) : uid(),
    type: (raw.type ?? "welcome") as BlockType,
    title: raw.title !== undefined ? String(raw.title) : "Untitled section",
    subtitle: raw.subtitle !== undefined ? String(raw.subtitle) : "A little moment",
    heading: raw.heading !== undefined ? String(raw.heading) : "Your moment",
    text: raw.text !== undefined ? String(raw.text) : "Write something beautiful.",
    emoji: raw.emoji !== undefined ? String(raw.emoji) : "✨",
    emojiAnimation: typeof raw.emojiAnimation === "string" ? raw.emojiAnimation : undefined,
    emojiSize: typeof raw.emojiSize === "number" ? raw.emojiSize : Number(raw.emojiSize ?? 48),
    font: raw.font ? safeFont(raw.font, "serif") : undefined,
    titleFont: raw.titleFont ? safeFont(raw.titleFont, "sans") : undefined,
    subtitleFont: raw.subtitleFont ? safeFont(raw.subtitleFont, "sans") : undefined,
    headingFont: raw.headingFont ? safeFont(raw.headingFont, "serif") : undefined,
    bodyFont: raw.bodyFont ? safeFont(raw.bodyFont, "sans") : undefined,
    letterFont: raw.letterFont ? safeFont(raw.letterFont, "serif") : undefined,
    accent: raw.accent ?? "#ff4f8b",
    headingColor: raw.headingColor !== undefined ? String(raw.headingColor) : "",
    subtitleColor: raw.subtitleColor !== undefined ? String(raw.subtitleColor) : "",
    bodyColor: raw.bodyColor !== undefined ? String(raw.bodyColor) : "",
    emojiColor: raw.emojiColor !== undefined ? String(raw.emojiColor) : "",
    titleSize: typeof raw.titleSize === "number" ? raw.titleSize : Number(raw.titleSize ?? 12),
    subtitleSize: typeof raw.subtitleSize === "number" ? raw.subtitleSize : Number(raw.subtitleSize ?? 13),
    headingSize: typeof raw.headingSize === "number" ? raw.headingSize : Number(raw.headingSize ?? 70),
    bodySize: typeof raw.bodySize === "number" ? raw.bodySize : Number(raw.bodySize ?? 17),
    lineHeight: typeof raw.lineHeight === "number" ? raw.lineHeight : Number(raw.lineHeight ?? 1.75),
    letterSpacing: typeof raw.letterSpacing === "number" ? raw.letterSpacing : Number(raw.letterSpacing ?? 0),
    radius: typeof raw.radius === "number" ? raw.radius : Number(raw.radius ?? 21),
    cardColor: raw.cardColor ?? "#ffffff",
    cardOpacity: typeof raw.cardOpacity === "number" ? raw.cardOpacity : undefined,
    background: typeof raw.background === "string" ? raw.background : undefined,
    customBg: typeof raw.customBg === "string" || (raw.customBg && typeof raw.customBg === "object") ? raw.customBg : undefined,
    customBgName: typeof raw.customBgName === "string" ? raw.customBgName : undefined,
    customBgOpacity: typeof raw.customBgOpacity === "number" ? raw.customBgOpacity : undefined,
    customBgScale: typeof raw.customBgScale === "number" ? raw.customBgScale : undefined,
    customBgPositionX: typeof raw.customBgPositionX === "number" ? raw.customBgPositionX : undefined,
    customBgPositionY: typeof raw.customBgPositionY === "number" ? raw.customBgPositionY : undefined,
    customBgRotation: typeof raw.customBgRotation === "number" ? raw.customBgRotation : undefined,
    backgroundOverlay: typeof raw.backgroundOverlay === "number" ? raw.backgroundOverlay : undefined,
    backgroundBaseColor: typeof raw.backgroundBaseColor === "string" ? raw.backgroundBaseColor : undefined,
    bgColor1: typeof raw.bgColor1 === "string" ? raw.bgColor1 : undefined,
    bgColor2: typeof raw.bgColor2 === "string" ? raw.bgColor2 : undefined,
    bgColor3: typeof raw.bgColor3 === "string" ? raw.bgColor3 : undefined,
    bgColor4: typeof raw.bgColor4 === "string" ? raw.bgColor4 : undefined,
    letterColor: raw.letterColor ?? "#2d2024",
    letterSize: typeof raw.letterSize === "number" ? raw.letterSize : Number(raw.letterSize ?? 17),
    letterLineHeight: typeof raw.letterLineHeight === "number" ? raw.letterLineHeight : Number(raw.letterLineHeight ?? 1.8),
    letterAlign: raw.letterAlign === "center" || raw.letterAlign === "right" ? raw.letterAlign : "left",
    image: raw.image ? String(raw.image) : "",
    images: Array.isArray(raw.images)
      ? raw.images.filter((x: any) => typeof x === "string")
      : raw.image
      ? [String(raw.image)]
      : [],
    imageAdjustments:
      raw.imageAdjustments && typeof raw.imageAdjustments === "object"
        ? raw.imageAdjustments
        : {},
    imageOpacity: typeof raw.imageOpacity === "number" ? raw.imageOpacity : Number(raw.imageOpacity ?? 100),
    audioName: raw.audioName ? String(raw.audioName) : "",
    audioUrl: raw.audioUrl,
    memoryVideo: raw.memoryVideo,
    secretImage: raw.secretImage ? String(raw.secretImage) : undefined,
    secretVideo: raw.secretVideo,
    galleryLayout: raw.galleryLayout ? String(raw.galleryLayout) : "collage",
    galleryBackground: raw.galleryBackground === "black" || raw.galleryBackground === "white" ? raw.galleryBackground : "transparent",
    visible: raw.visible !== false,
    ...(items ? { items } : {}),
    ...(incidents ? { incidents } : {})
  };
}

export function normalizeProject(raw: any): GreetingProject {
  if (!raw || typeof raw !== "object") {
    return {
      blocks: defaultBlocks.map((b) => ({ ...b })),
      theme: "dark",
      background: "aurora",
      cardBackgroundMode: "same",
      emojiAnimation: "floating",
      globalFont: "serif",
      globalTextColor: "#fff8fc",
      globalCardOpacity: 14,
      globalRadius: 21,
      globalSpacing: 18,
      globalMotion: "cinematic",
      backgroundBaseColor: "#100917",
      bgColor1: "#ff4f8b",
      bgColor2: "#7c5cff",
      bgColor3: "#38bdf8",
      bgColor4: "#f59e0b",
      backgroundOverlay: 18
    };
  }

  const globalFont: FontName = validFonts.includes(raw.globalFont) ? raw.globalFont : "serif";

  const rawBlocks = Array.isArray(raw.blocks) && raw.blocks.length > 0 ? raw.blocks : defaultBlocks;
  const blocks = rawBlocks.map((b: any, idx: number) => normalizeBlock(b, idx, globalFont));

  const theme = typeof raw.theme === "string" && themes[raw.theme] ? raw.theme : "dark";
  const themeColors = themes[theme] ?? themes.dark;

  return {
    blocks,
    theme,
    background: typeof raw.background === "string" && (backgrounds[raw.background] || raw.background === "stars") ? raw.background : "aurora",
    cardBackgroundMode: raw.cardBackgroundMode === "different" ? "different" : "same",
    emojiAnimation: typeof raw.emojiAnimation === "string" ? raw.emojiAnimation : "floating",
    globalFont,
    globalTextColor: raw.globalTextColor ?? "#fff8fc",
    globalCardOpacity: typeof raw.globalCardOpacity === "number" ? raw.globalCardOpacity : Number(raw.globalCardOpacity ?? 14),
    globalRadius: typeof raw.globalRadius === "number" ? raw.globalRadius : Number(raw.globalRadius ?? 21),
    globalSpacing: typeof raw.globalSpacing === "number" ? raw.globalSpacing : Number(raw.globalSpacing ?? 18),
    globalMotion: typeof raw.globalMotion === "string" ? raw.globalMotion : "cinematic",
    audioName: raw.audioName ? String(raw.audioName) : "",
    audioUrl: raw.audioUrl,
    customBg: typeof raw.customBg === "string" || (raw.customBg && typeof raw.customBg === "object") ? raw.customBg : "",
    customBgName: raw.customBgName ? String(raw.customBgName) : "",
    customBgOpacity: typeof raw.customBgOpacity === "number" ? raw.customBgOpacity : Number(raw.customBgOpacity ?? 100),
    customBgScale: typeof raw.customBgScale === "number" ? raw.customBgScale : Number(raw.customBgScale ?? 100),
    customBgPositionX: typeof raw.customBgPositionX === "number" ? raw.customBgPositionX : Number(raw.customBgPositionX ?? 50),
    customBgPositionY: typeof raw.customBgPositionY === "number" ? raw.customBgPositionY : Number(raw.customBgPositionY ?? 50),
    customBgRotation: typeof raw.customBgRotation === "number" ? raw.customBgRotation : Number(raw.customBgRotation ?? 0),
    backgroundBaseColor: raw.backgroundBaseColor ?? themeColors[0],
    bgColor1: raw.bgColor1 ?? themeColors[1],
    bgColor2: raw.bgColor2 ?? themeColors[2],
    bgColor3: raw.bgColor3 ?? (theme === "light" ? "#e8f7ff" : "#38bdf8"),
    bgColor4: raw.bgColor4 ?? (theme === "light" ? "#fff0f5" : "#f59e0b"),
    backgroundOverlay: typeof raw.backgroundOverlay === "number" ? raw.backgroundOverlay : Number(raw.backgroundOverlay ?? 18),
    targetEventDate: typeof raw.targetEventDate === "string" ? raw.targetEventDate : undefined,
    reminderDate: typeof raw.reminderDate === "string" ? raw.reminderDate : undefined,
    targetEventTitle: typeof raw.targetEventTitle === "string" ? raw.targetEventTitle : undefined
  };
}
