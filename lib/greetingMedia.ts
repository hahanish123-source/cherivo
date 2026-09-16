import { randomUUID } from "node:crypto";
import { isLocalDevelopmentFallbackEnabled, supabaseAdmin } from "./supabaseAdmin";

export const GREETING_MEDIA_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET?.trim() ||
  "hanora-media";
export const MAX_AUDIO_BYTES = 20 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
export const MAX_MEMORY_VIDEO_BYTES = 80 * 1024 * 1024;
export const MAX_TOTAL_GREETING_BYTES = 300 * 1024 * 1024;
export const MAX_VIDEOS_PER_GREETING = 3;

const MEMORY_VIDEO_TYPES = new Map([
  ["video/mp4", "mp4"],
  ["video/webm", "webm"],
  ["video/quicktime", "mov"],
  ["video/x-m4v", "m4v"],
  ["video/m4v", "m4v"]
]);

const IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

export type StoredMedia = {
  storage: "supabase";
  path: string;
  kind: "audio" | "memory-video" | "image";
  size?: number;
  bucket?: string;
};

export type UploadedMedia = {
  media: StoredMedia | string;
  previewUrl: string;
};

function isLocalStore() {
  return isLocalDevelopmentFallbackEnabled();
}

async function hasContainerSignature(file: File, kind: StoredMedia["kind"]) {
  try {
    const header = new Uint8Array(await file.slice(0, 512).arrayBuffer());
    if (kind === "memory-video") {
      const text = new TextDecoder().decode(header);
      return (
        text.includes("ftyp") ||
        text.includes("moov") ||
        text.includes("wide") ||
        text.includes("mdat") ||
        (header[0] === 0x1a && header[1] === 0x45 && header[2] === 0xdf && header[3] === 0xa3) ||
        /\.(mp4|webm|mov|m4v|mkv|3gp|avi)$/i.test(file.name)
      );
    }
    if (kind === "image") {
      return (
        (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) ||
        (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47) ||
        (header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46) ||
        (header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x38) ||
        /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file.name)
      );
    }
    return (header[0] === 0x49 && header[1] === 0x44 && header[2] === 0x33) || (header[0] === 0xff && (header[1] & 0xe0) === 0xe0) || /\.mp3$/i.test(file.name);
  } catch {
    return true;
  }
}

export async function uploadGreetingMedia(file: File, kind: StoredMedia["kind"]): Promise<StoredMedia | string> {
  const isVideo = kind === "memory-video";
  const isImage = kind === "image";
  const maxBytes = isVideo ? MAX_MEMORY_VIDEO_BYTES : isImage ? MAX_IMAGE_BYTES : MAX_AUDIO_BYTES;
  const fileName = file.name.toLowerCase();

  if (file.size > maxBytes) {
    throw new Error(
      isVideo
        ? "Video is too large. Video must be 80 MB or smaller."
        : isImage
        ? "Image is too large. Image must be 15 MB or smaller."
        : "Audio is too large. Audio must be 20 MB or smaller."
    );
  }

  if (isVideo) {
    const isVideoExt = /\.(mp4|webm|mov|m4v|mkv|3gp|avi)$/i.test(fileName);
    const isVideoMime = file.type.startsWith("video/") || file.type === "application/octet-stream" || !file.type;
    const hasSig = await hasContainerSignature(file, kind);

    if (!isVideoExt && !isVideoMime && !hasSig) {
      throw new Error("Unsupported video type. Choose an MP4, WebM, or MOV video.");
    }
  } else if (isImage) {
    const isImgExt = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(fileName);
    const isImgMime = file.type.startsWith("image/") || !file.type;
    const hasSig = await hasContainerSignature(file, kind);

    if (!isImgExt && !isImgMime && !hasSig) {
      throw new Error("Unsupported image type. Choose a JPEG, PNG, WebP, or GIF image.");
    }
  } else if (!fileName.endsWith(".mp3") && file.type !== "audio/mpeg" && !(await hasContainerSignature(file, kind))) {
    throw new Error("Only MP3 audio files are supported.");
  }

  const inferredExt = (fileName.split(".").pop() || "").toLowerCase();
  const extension = isVideo
    ? (["mp4", "webm", "mov", "m4v", "mkv", "3gp"].includes(inferredExt) ? inferredExt : (MEMORY_VIDEO_TYPES.get(file.type) || "mp4"))
    : isImage
    ? (["jpg", "jpeg", "png", "webp", "gif"].includes(inferredExt) ? (inferredExt === "jpeg" ? "jpg" : inferredExt) : (IMAGE_TYPES.get(file.type) || "jpg"))
    : "mp3";

  const expectedType = isVideo
    ? (file.type && file.type.startsWith("video/") ? file.type : `video/${extension === "mov" ? "quicktime" : extension}`)
    : isImage
    ? (file.type && file.type.startsWith("image/") ? file.type : `image/${extension === "jpg" ? "jpeg" : extension}`)
    : "audio/mpeg";

  if (isLocalStore()) {
    const bytes = Buffer.from(await file.arrayBuffer());
    return `data:${expectedType};base64,${bytes.toString("base64")}`;
  }

  const path = `greetings/${randomUUID()}.${extension}`;

  let supabase;
  try {
    supabase = supabaseAdmin();
  } catch (err) {
    console.warn("[Hamora Media] Supabase admin init failed, falling back to data URL:", err);
    const bytes = Buffer.from(await file.arrayBuffer());
    return `data:${expectedType};base64,${bytes.toString("base64")}`;
  }

  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const candidateBuckets = [
    GREETING_MEDIA_BUCKET,
    "hanora-media",
    "hamora-media"
  ].filter((v, i, a) => v && a.indexOf(v) === i);

  let uploadSuccess = false;
  let usedBucket = GREETING_MEDIA_BUCKET;

  for (const bucket of candidateBuckets) {
    try {
      const uploadResult = await supabase.storage.from(bucket).upload(path, fileBuffer, {
        contentType: expectedType,
        cacheControl: "3600",
        upsert: false,
      });

      if (!uploadResult.error) {
        uploadSuccess = true;
        usedBucket = bucket;
        break;
      } else {
        console.warn(`[Hamora Media] Upload to bucket '${bucket}' failed: ${uploadResult.error.message}`);
      }
    } catch (ex) {
      console.warn(`[Hamora Media] Upload exception for bucket '${bucket}':`, ex);
    }
  }

  if (!uploadSuccess) {
    console.warn("[Hamora Media] All Supabase storage bucket uploads failed. Falling back to inline data URL.");
    const bytes = Buffer.from(await file.arrayBuffer());
    return `data:${expectedType};base64,${bytes.toString("base64")}`;
  }

  return { storage: "supabase", path, kind, size: file.size, bucket: usedBucket };
}

export async function getGreetingMediaUrl(value: unknown): Promise<string> {
  if (typeof value === "string") {
    if (value.startsWith("data:") || value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/")) {
      return value;
    }
    return value;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "";
  }

  const media = value as Partial<StoredMedia>;
  if (media.storage !== "supabase" || typeof media.path !== "string") {
    return "";
  }

  const bucket = media.bucket || GREETING_MEDIA_BUCKET;

  try {
    const { data } = supabaseAdmin().storage.from(bucket).getPublicUrl(media.path);
    if (!data?.publicUrl) return "";
    return data.publicUrl;
  } catch (err) {
    if (isLocalDevelopmentFallbackEnabled()) {
      return "";
    }
    return "";
  }
}

async function resolveMedia(value: unknown): Promise<unknown> {
  if (typeof value === "string") {
    if (value.startsWith("data:") || value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/")) {
      return value;
    }
    return value;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const media = value as Partial<StoredMedia>;
  if (media.storage !== "supabase" || typeof media.path !== "string") return value;

  if (isLocalDevelopmentFallbackEnabled()) return value;
  return getGreetingMediaUrl(value);
}

export async function deleteGreetingMediaPaths(paths: string[]): Promise<void> {
  if (!paths || paths.length === 0 || isLocalStore()) return;
  try {
    const supabase = supabaseAdmin();
    await Promise.allSettled([
      supabase.storage.from("hanora-media").remove(paths),
      supabase.storage.from("hamora-media").remove(paths)
    ]);
  } catch (err) {
    console.warn("Media deletion warning:", err);
  }
}

export async function resolveGreetingMedia(project: Record<string, unknown>) {
  const resolved = { ...project };
  resolved.audioUrl = await resolveMedia(resolved.audioUrl);
  resolved.customBg = (await resolveMedia(resolved.customBg)) as string | undefined;

  if (Array.isArray(resolved.blocks)) {
    resolved.blocks = await Promise.all(resolved.blocks.map(async (raw) => {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;
      const block = { ...(raw as Record<string, unknown>) };
      block.audioUrl = await resolveMedia(block.audioUrl);
      block.memoryVideo = await resolveMedia(block.memoryVideo);
      block.video = await resolveMedia(block.video);
      block.secretVideo = await resolveMedia(block.secretVideo);
      block.customBg = (await resolveMedia(block.customBg)) as string | undefined;
      return block;
    }));
  }

  return resolved;
}