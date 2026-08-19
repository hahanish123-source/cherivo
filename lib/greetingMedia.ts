import { randomUUID } from "node:crypto";
import { isLocalDevelopmentFallbackEnabled, supabaseAdmin } from "./supabaseAdmin";

export const GREETING_MEDIA_BUCKET = "hanora-media";
export const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
export const MAX_MEMORY_VIDEO_BYTES = 20_000_000;
const MEMORY_VIDEO_TYPES = new Map([
  ["video/mp4", "mp4"],
  ["video/webm", "webm"],
  ["video/quicktime", "mov"],
]);

export type StoredMedia = {
  storage: "supabase";
  path: string;
  kind: "audio" | "memory-video";
};

export type UploadedMedia = {
  media: StoredMedia | string;
  previewUrl: string;
};

function isLocalStore() {
  return process.env.NODE_ENV !== "production" && process.env.CHERIVO_LOCAL_STORE !== "false";
}

async function hasContainerSignature(file: File, kind: StoredMedia["kind"]) {
  const header = new Uint8Array(await file.slice(0, 32).arrayBuffer());
  if (kind === "memory-video") {
    const text = new TextDecoder().decode(header.slice(4, 8));
    return text === "ftyp" || (header[0] === 0x1a && header[1] === 0x45 && header[2] === 0xdf && header[3] === 0xa3);
  }
  return (header[0] === 0x49 && header[1] === 0x44 && header[2] === 0x33) || (header[0] === 0xff && (header[1] & 0xe0) === 0xe0);
}

export async function uploadGreetingMedia(file: File, kind: StoredMedia["kind"]): Promise<StoredMedia | string> {
  const isVideo = kind === "memory-video";
  const maxBytes = isVideo ? MAX_MEMORY_VIDEO_BYTES : MAX_AUDIO_BYTES;
  const expectedType = isVideo ? file.type : "audio/mpeg";
  const fileName = file.name.toLowerCase();

  if (file.size > maxBytes) {
    throw new Error(isVideo ? "Video is too large. Please choose a video under 20 MB." : "Audio file is too large.");
  }

  if (isVideo) {
    const extension = MEMORY_VIDEO_TYPES.get(file.type);
    if (!extension || !fileName.endsWith(`.${extension}`) || !(await hasContainerSignature(file, kind))) {
      throw new Error("Unsupported video type. Choose an MP4, WebM, or MOV video.");
    }
  } else if (!fileName.endsWith(".mp3") || file.type !== expectedType || !(await hasContainerSignature(file, kind))) {
    throw new Error("Only MP3 audio files are supported.");
  }

  if (isLocalStore()) {
    const bytes = Buffer.from(await file.arrayBuffer());
    return `data:${expectedType};base64,${bytes.toString("base64")}`;
  }

  const extension = isVideo ? MEMORY_VIDEO_TYPES.get(file.type)! : "mp3";
  const path = `greetings/${randomUUID()}.${extension}`;
  const supabase = supabaseAdmin();
  const { error } = await supabase.storage.from(GREETING_MEDIA_BUCKET).upload(path, Buffer.from(await file.arrayBuffer()), {
    contentType: expectedType,
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    throw new Error(`Media upload failed: ${error.message}`);
  }

  return { storage: "supabase", path, kind };
}

export async function getGreetingMediaUrl(value: unknown): Promise<string> {
  if (typeof value === "string" && value.startsWith("data:")) return value;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Media URL generation failed: invalid media reference");
  }

  const media = value as Partial<StoredMedia>;
  if (media.storage !== "supabase" || typeof media.path !== "string") {
    throw new Error("Media URL generation failed: invalid media reference");
  }

  const { data, error } = await supabaseAdmin().storage.from(GREETING_MEDIA_BUCKET).createSignedUrl(media.path, 3600);
  if (error) throw new Error(`Media URL generation failed: ${error.message}`);
  if (!data?.signedUrl) throw new Error("Media URL generation failed: missing URL");
  return data.signedUrl;
}

async function resolveMedia(value: unknown): Promise<unknown> {
  if (typeof value === "string") return value.startsWith("data:") ? value : "";
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const media = value as Partial<StoredMedia>;
  if (media.storage !== "supabase" || typeof media.path !== "string") return value;

  if (isLocalDevelopmentFallbackEnabled()) return value;
  return getGreetingMediaUrl(value);
}

export async function resolveGreetingMedia(project: Record<string, unknown>) {
  const resolved = { ...project };
  resolved.audioUrl = await resolveMedia(resolved.audioUrl);

  if (Array.isArray(resolved.blocks)) {
    resolved.blocks = await Promise.all(resolved.blocks.map(async (raw) => {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;
      const block = { ...(raw as Record<string, unknown>) };
      block.audioUrl = await resolveMedia(block.audioUrl);
      block.memoryVideo = await resolveMedia(block.memoryVideo);
      return block;
    }));
  }

  return resolved;
}