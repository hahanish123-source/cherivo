import { randomUUID } from "node:crypto";
import { isLocalDevelopmentFallbackEnabled, supabaseAdmin } from "./supabaseAdmin";

export const GREETING_MEDIA_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET?.trim() ||
  "hanora-media";
export const MAX_AUDIO_BYTES = 20 * 1024 * 1024;
export const MAX_MEMORY_VIDEO_BYTES = 50_000_000;
const MEMORY_VIDEO_TYPES = new Map([
  ["video/mp4", "mp4"],
  ["video/webm", "webm"],
  ["video/quicktime", "mov"],
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
};

export type UploadedMedia = {
  media: StoredMedia | string;
  previewUrl: string;
};

function isLocalStore() {
  return isLocalDevelopmentFallbackEnabled();
}

async function hasContainerSignature(file: File, kind: StoredMedia["kind"]) {
  const header = new Uint8Array(await file.slice(0, 32).arrayBuffer());
  if (kind === "memory-video") {
    const text = new TextDecoder().decode(header.slice(4, 8));
    return text === "ftyp" || (header[0] === 0x1a && header[1] === 0x45 && header[2] === 0xdf && header[3] === 0xa3);
  }
  if (kind === "image") {
    return (
      (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) ||
      (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47) ||
      (header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46) ||
      (header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x38)
    );
  }
  return (header[0] === 0x49 && header[1] === 0x44 && header[2] === 0x33) || (header[0] === 0xff && (header[1] & 0xe0) === 0xe0);
}

export async function uploadGreetingMedia(file: File, kind: StoredMedia["kind"]): Promise<StoredMedia | string> {
  const isVideo = kind === "memory-video";
  const isImage = kind === "image";
  const maxBytes = isVideo ? MAX_MEMORY_VIDEO_BYTES : 20 * 1024 * 1024;
  const expectedType = isVideo || isImage ? file.type : "audio/mpeg";
  const fileName = file.name.toLowerCase();

  if (file.size > maxBytes) {
    throw new Error(
      isVideo
        ? "Video is too large. Please choose a video under 50 MB."
        : isImage
        ? "Image is too large. Please choose an image under 20 MB."
        : "Audio file is too large (must be under 20 MB)."
    );
  }

  if (isVideo) {
    const extension = MEMORY_VIDEO_TYPES.get(file.type);
    if (!extension || !fileName.endsWith(`.${extension}`) || !(await hasContainerSignature(file, kind))) {
      throw new Error("Unsupported video type. Choose an MP4, WebM, or MOV video.");
    }
  } else if (isImage) {
    const extension = IMAGE_TYPES.get(file.type);
    if (!extension || !(await hasContainerSignature(file, kind))) {
      throw new Error("Unsupported image type. Choose a JPEG, PNG, WebP, or GIF image.");
    }
  } else if (!fileName.endsWith(".mp3") || file.type !== expectedType || !(await hasContainerSignature(file, kind))) {
    throw new Error("Only MP3 audio files are supported.");
  }

  if (isLocalStore()) {
    const bytes = Buffer.from(await file.arrayBuffer());
    return `data:${expectedType};base64,${bytes.toString("base64")}`;
  }

  const extension = isVideo ? MEMORY_VIDEO_TYPES.get(file.type)! : isImage ? IMAGE_TYPES.get(file.type)! : "mp3";
  const path = `greetings/${randomUUID()}.${extension}`;

  let supabase;
  try {
    supabase = supabaseAdmin();
  } catch (err) {
    if (isLocalDevelopmentFallbackEnabled() || isLocalStore()) {
      const bytes = Buffer.from(await file.arrayBuffer());
      return `data:${expectedType};base64,${bytes.toString("base64")}`;
    }
    throw err;
  }

  let uploadResult = await supabase.storage.from(GREETING_MEDIA_BUCKET).upload(path, Buffer.from(await file.arrayBuffer()), {
    contentType: expectedType,
    cacheControl: "3600",
    upsert: false,
  });

  if (uploadResult.error && (uploadResult.error.message.toLowerCase().includes("bucket not found") || (uploadResult.error as any).statusCode === 404)) {
    try {
      const { error: createErr } = await supabase.storage.createBucket(GREETING_MEDIA_BUCKET, {
        public: false,
        fileSizeLimit: 52428800,
        allowedMimeTypes: ["audio/mpeg", "video/mp4", "video/webm", "video/quicktime", "image/jpeg", "image/png", "image/webp", "image/gif"]
      });
      if (!createErr || createErr.message.toLowerCase().includes("already exists")) {
        uploadResult = await supabase.storage.from(GREETING_MEDIA_BUCKET).upload(path, Buffer.from(await file.arrayBuffer()), {
          contentType: expectedType,
          cacheControl: "3600",
          upsert: false,
        });
      }
    } catch (createEx) {
      console.warn(`Could not auto-create bucket '${GREETING_MEDIA_BUCKET}':`, createEx);
    }
  }

  if (uploadResult.error) {
    let extraMsg = "";
    try {
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      if (listError) {
        extraMsg = ` (Could not list buckets: ${listError.message})`;
      } else {
        const names = buckets.map(b => b.name).join(", ");
        extraMsg = ` (Existing buckets in this Supabase project: [${names}])`;
      }
    } catch (e: any) {
      extraMsg = ` (Failed to list buckets: ${e?.message})`;
    }
    throw new Error(`Media upload failed: ${uploadResult.error.message}.${extraMsg} Ensure the Supabase Storage bucket '${GREETING_MEDIA_BUCKET}' exists.`);
  }

  return { storage: "supabase", path, kind, size: file.size };
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

  try {
    const { data } = supabaseAdmin().storage.from(GREETING_MEDIA_BUCKET).getPublicUrl(media.path);
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
    await supabase.storage.from(GREETING_MEDIA_BUCKET).remove(paths);
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
      block.secretVideo = await resolveMedia(block.secretVideo);
      block.customBg = (await resolveMedia(block.customBg)) as string | undefined;
      return block;
    }));
  }

  return resolved;
}