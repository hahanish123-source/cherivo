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
  x?: number;
  y?: number;
  rotation?: number;
  scale?: number;
  width?: number;
  cardColor?: string;
  cardOpacity?: number;
  cardRadius?: number;
  cardPadding?: number;
  titleColor?: string;
  textColor?: string;
  locked?: boolean;
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

export type PhotoCrop = {
  scale: number;
  offsetX: number;
  offsetY: number;
  cropX: number;
  cropY: number;
  cropWidth?: number;
  cropHeight?: number;
  aspectRatio?: "free" | "original" | "1:1" | "4:5" | "16:9" | "3:4" | "4:3" | "9:16";
  isCustomCropped?: boolean;
};

export type ImageAdjustment = {
  scale: number;
  x: number;
  y: number;
  opacity?: number;
  rotation?: number;
  fit?: "cover" | "contain" | "natural" | "fill";
  width?: number;
  cropRatio?: "free" | "original" | "1:1" | "4:5" | "16:9" | "3:4" | "4:3" | "9:16";
  cropX?: number;
  cropY?: number;
  cropScale?: number;
  isCustomCropped?: boolean;
  crop?: PhotoCrop;
  cornerRadius?: number;
  zIndex?: number;
  visible?: boolean;
  locked?: boolean;
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
  locked?: boolean;
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
  reasonTitleSize?: number;
  reasonTextSize?: number;
  reasonTitleFont?: FontName;
  reasonTextFont?: FontName;
  reasonCardColor?: string;
  reasonCardRadius?: number;
  reasonCardOpacity?: number;
  reasonCardPadding?: number;
  reasonCardScale?: number;
  reasonCardWidth?: number;
  reasonCardGap?: number;
  reasonCardPositions?: Record<string, { x: number; y: number; rotation?: number; scale?: number; width?: number; locked?: boolean }>;
  reasonTextOpacity?: number;
  reasonEmojiOpacity?: number;
  incidentTitleColor?: string;
  incidentTextColor?: string;
  secretTextColor?: string;
  secretTextSize?: number;
  secretTextFont?: FontName;
  secretTextWeight?: string;
  secretTextLineHeight?: number;
  secretTextLetterSpacing?: number;
  secretTextAlign?: "left" | "center" | "right";
  secretHideButtonText?: string;
  cakeSubtitleColor?: string;
  cakeTextColor?: string;
  cakeScale?: number;
  cakeOffsetX?: number;
  cakeOffsetY?: number;
  cakeLocked?: boolean;
  cakeColor?: string;
  cakeSecondaryColor?: string;
  cakeTopColor?: string;
  cakeCreamColor?: string;
  cakePlateColor?: string;
  cakeTexture?: "smooth" | "drip" | "sprinkles" | "striped" | "stars" | "velvet" | "gold" | "hearts" | "comic-pop" | "checkered";
  cakeCandleCount?: number;
  cakeCandleShape?: "standard" | "heart" | "double-heart" | "spiral" | "sparkler" | "comic" | "racing" | "flame-arch";
  cakeHeartSwags?: boolean;
  cakeCherries?: boolean;
  cakeRacingTrack?: boolean;
  cakeModel?: "classic" | "romantic-hearts" | "royal-gold" | "sweet-strawberry" | "comic-2d" | "racing-3d";
  cakeCandleColor?: string;
  cakeCandleStripeColor?: string;
  cakeFlameColor?: string;
  cakeSparkler?: boolean;
  cakeSparklerScale?: number;
  cakeCandleHeight?: number;
  cakeCelebrationEmoji?: string;
  cakeWishHeading?: string;
  cakeWishText?: string;
  cakeResetButtonText?: string;
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
  bgColor5?: string;
  letterColor?: string;
  letterSize?: number;
  letterLineHeight?: number;
  letterAlign?: "left" | "center" | "right";
  image?: string;
  images?: string[];
  imageAdjustments?: Record<string, ImageAdjustment>;
  imageOpacity: number;
  imageFit?: "cover" | "contain" | "natural" | "fill";
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
  bgColor5?: string;
  backgroundOverlay?: number;
  targetEventDate?: string;
  reminderDate?: string;
  targetEventTitle?: string;
};

export type GreetingResponse = {
  id: string;
  token: string;
  senderName?: string;
  sender_name?: string;
  recipient_name?: string;
  message: string;
  emojis?: string[];
  candles_blown?: boolean;
  reaction?: string;
  createdAt: string;
  created_at?: string;
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
