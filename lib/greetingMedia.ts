import { randomUUID } from "node:crypto";
import { isLocalDevelopmentFallbackEnabled, supabaseAdmin } from "./supabaseAdmin";

export const GREETING_MEDIA_BUCKET = "hanora-media";
export const MAX_VIDEO_BYTES = 20 * 1024 * 1024;
export const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

export type StoredMedia = {
  storage: "supabase";
  path: string;
  kind: "video" | "audio";
};

export type UploadedMedia = {
  media: StoredMedia | string;
  previewUrl: string;
};

function isLocalStore() {
  return process.env.NODE_ENV !== "production" && process.env.CHERIVO_LOCAL_STORE !== "false";
}

function extensionFor(kind: StoredMedia["kind"]) {
  return kind === "video" ? "mp4" : "mp3";
}

async function hasContainerSignature(file: File, kind: StoredMedia["kind"]) {
  const header = new Uint8Array(await file.slice(0, 32).arrayBuffer());
  if (kind === "video") {
    return new TextDecoder().decode(header.slice(4, 8)) === "ftyp";
  }
  return (header[0] === 0x49 && header[1] === 0x44 && header[2] === 0x33) || (header[0] === 0xff && (header[1] & 0xe0) === 0xe0);
}

export async function uploadGreetingMedia(file: File, kind: StoredMedia["kind"]): Promise<StoredMedia | string> {
  const maxBytes = kind === "video" ? MAX_VIDEO_BYTES : MAX_AUDIO_BYTES;
  const expectedType = kind === "video" ? "video/mp4" : "audio/mpeg";
  const fileName = file.name.toLowerCase();

  if (file.size > maxBytes) {
    throw new Error(`${kind === "video" ? "Video" : "Audio"} file is too large.`);
  }

  if (!fileName.endsWith(`.${extensionFor(kind)}`) || file.type !== expectedType || !(await hasContainerSignature(file, kind))) {
    throw new Error(kind === "video" ? "Only MP4 video files are supported." : "Only MP3 audio files are supported.");
  }

  if (isLocalStore()) {
    const bytes = Buffer.from(await file.arrayBuffer());
    return `data:${expectedType};base64,${bytes.toString("base64")}`;
  }

  const path = `greetings/${randomUUID()}.${extensionFor(kind)}`;
  const supabase = supabaseAdmin();
  const { data: buckets, error: bucketListError } = await supabase.storage.listBuckets();
  if (bucketListError) {
    throw new Error(`Media bucket lookup failed: ${bucketListError.message}`);
  }

  if (!buckets.some((bucket) => bucket.name === GREETING_MEDIA_BUCKET)) {
    const { error: bucketCreateError } = await supabase.storage.createBucket(GREETING_MEDIA_BUCKET, {
      public: false,
      fileSizeLimit: `${MAX_VIDEO_BYTES}B`,
    });
    if (bucketCreateError) {
      throw new Error(`Media bucket setup failed: ${bucketCreateError.message}`);
    }
  }

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
  if (typeof value === "string") return value;
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
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const media = value as Partial<StoredMedia>;
  if (media.storage !== "supabase" || typeof media.path !== "string") return value;

  if (isLocalDevelopmentFallbackEnabled()) return value;
  return getGreetingMediaUrl(value);
}

export async function resolveGreetingMedia(project: Record<string, unknown>) {
  const resolved = { ...project };
  for (const key of ["backgroundVideo", "audioUrl"]) {
    resolved[key] = await resolveMedia(resolved[key]);
  }

  if (Array.isArray(resolved.blocks)) {
    resolved.blocks = await Promise.all(resolved.blocks.map(async (raw) => {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;
      const block = { ...(raw as Record<string, unknown>) };
      block.backgroundVideo = await resolveMedia(block.backgroundVideo);
      block.audioUrl = await resolveMedia(block.audioUrl);
      return block;
    }));
  }

  return resolved;
}