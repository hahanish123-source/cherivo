import type { StoredMedia } from "./greetingMedia";

export type BlockType =
  | "welcome"
  | "reasons"
  | "memories"
  | "letter"
  | "secret"
  | "cake"
  | "text"
  | "image"
  | "music"
  | "gallery"
  | "custom";

export type FontName =
  | "sans"
  | "serif"
  | "script"
  | "caveat"
  | "great-vibes"
  | "dancing-script"
  | "pacifico"
  | "satisfy"
  | "allura"
  | "sacramento"
  | string;

export type ReasonItem = {
  id: string;
  title: string;
  text: string;
  emoji: string;
};

export type ImageAdjustment = {
  scale: number;
  x: number;
  y: number;
};

export type MediaValue = string | StoredMedia;

export type Block = {
  id: string;
  type: BlockType;
  title: string;
  subtitle: string;
  heading: string;
  text: string;
  emoji: string;
  emojiAnimation?: string;
  emojiSize?: number;
  font: FontName;
  titleFont: FontName;
  subtitleFont: FontName;
  headingFont: FontName;
  bodyFont: FontName;
  letterFont?: FontName;
  accent: string;
  headingColor: string;
  subtitleColor: string;
  bodyColor: string;
  emojiColor: string;
  titleSize?: number;
  subtitleSize?: number;
  headingSize: number;
  bodySize: number;
  lineHeight: number;
  letterSpacing: number;
  radius: number;
  cardColor: string;
  cardOpacity?: number;
  background?: string;
  customBg?: string;
  customBgName?: string;
  customBgOpacity?: number;
  customBgScale?: number;
  customBgPositionX?: number;
  customBgPositionY?: number;
  customBgRotation?: number;
  backgroundOverlay?: number;
  backgroundBaseColor?: string;
  bgColor1?: string;
  bgColor2?: string;
  bgColor3?: string;
  bgColor4?: string;
  letterColor?: string;
  letterSize?: number;
  letterLineHeight?: number;
  letterAlign?: "left" | "center" | "right";
  image?: string;
  images?: string[];
  imageAdjustments?: Record<string, ImageAdjustment>;
  imageOpacity: number;
  audioName?: string;
  audioUrl?: MediaValue;
  memoryVideo?: MediaValue;
  galleryLayout?: string;
  galleryBackground?: "transparent" | "black" | "white" | string;
  visible: boolean;
  items?: ReasonItem[];
};

export type GreetingProject = {
  blocks: Block[];
  theme: string;
  background: string;
  cardBackgroundMode?: "same" | "different";
  emojiAnimation?: string;
  globalFont: FontName;
  globalTextColor: string;
  globalCardOpacity: number;
  globalRadius: number;
  globalSpacing: number;
  globalMotion: string;
  audioName?: string;
  audioUrl?: MediaValue;
  customBg?: string;
  customBgName?: string;
  customBgOpacity?: number;
  customBgScale?: number;
  customBgPositionX?: number;
  customBgPositionY?: number;
  customBgRotation?: number;
  backgroundBaseColor?: string;
  bgColor1?: string;
  bgColor2?: string;
  bgColor3?: string;
  bgColor4?: string;
  backgroundOverlay?: number;
};

export type StoredGreetingRecord = {
  token: string;
  title: string;
  data: GreetingProject | Record<string, unknown>;
  created_at?: string;
};
