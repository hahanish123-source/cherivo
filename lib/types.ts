import type { StoredMedia } from "./greetingMedia";

export type BlockType =
  | "welcome"
  | "reasons"
  | "incidents"
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

export type IncidentItem = {
  id: string;
  title: string;
  tag?: string;
  date?: string;
  text: string;
  emoji: string;
  image?: string;
};

export type ImageAdjustment = {
  scale: number;
  x: number;
  y: number;
  opacity?: number;
  rotation?: number;
  fit?: "cover" | "contain" | "fill";
};

export type ElementTextStyle = {
  font?: FontName;
  size?: number;
  weight?: string;
  color?: string;
  opacity?: number;
  letterSpacing?: number;
  lineHeight?: number;
  align?: "left" | "center" | "right" | "justify";
  offsetX?: number;
  offsetY?: number;
  rotation?: number;
  animation?: string;
  delay?: number;
  duration?: number;
  visible?: boolean;
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
  font?: FontName;
  titleFont?: FontName;
  subtitleFont?: FontName;
  headingFont?: FontName;
  bodyFont?: FontName;
  letterFont?: FontName;
  accent: string;
  headingColor: string;
  subtitleColor: string;
  bodyColor: string;
  emojiColor: string;
  titleColor?: string;
  kickerColor?: string;
  buttonColor?: string;
  reasonTitleColor?: string;
  reasonTextColor?: string;
  incidentTitleColor?: string;
  incidentTextColor?: string;
  secretTextColor?: string;
  cakeSubtitleColor?: string;
  cakeTextColor?: string;
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
  customBgFit?: "cover" | "contain" | "fill";
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
  imageFit?: "cover" | "contain" | "fill";
  audioName?: string;
  audioUrl?: MediaValue;
  memoryVideo?: MediaValue;
  video?: MediaValue;
  videoName?: string;
  videoOpacity?: number;
  videoScale?: number;
  videoPositionX?: number;
  videoPositionY?: number;
  videoFit?: "cover" | "contain" | "fill";
  videoRadius?: number;
  videoWidth?: number;
  videoAutoplay?: boolean;
  videoMuted?: boolean;
  videoLoop?: boolean;
  secretImage?: string;
  secretVideo?: MediaValue;
  galleryLayout?: string;
  galleryBackground?: "transparent" | "black" | "white" | string;
  textStyles?: Record<string, ElementTextStyle>;
  backButtonText?: string;
  keepGoingButtonText?: string;
  revealButtonText?: string;
  replayButtonText?: string;
  visible: boolean;
  items?: ReasonItem[];
  incidents?: IncidentItem[];
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
  customBgFit?: "cover" | "contain" | "fill";
  backgroundBaseColor?: string;
  bgColor1?: string;
  bgColor2?: string;
  bgColor3?: string;
  bgColor4?: string;
  backgroundOverlay?: number;
  targetEventDate?: string;
  reminderDate?: string;
  targetEventTitle?: string;
};

export type GreetingResponse = {
  id: string;
  token: string;
  senderName?: string;
  message: string;
  emojis?: string[];
  createdAt: string;
};

export type GreetingDraft = {
  id: string;
  userId?: string;
  title: string;
  targetEventDate?: string;
  reminderDate?: string;
  targetEventTitle?: string;
  updatedAt: string;
  project: GreetingProject;
};

export type StoredGreetingRecord = {
  token: string;
  title: string;
  data: GreetingProject | Record<string, unknown>;
  created_at?: string;
};
