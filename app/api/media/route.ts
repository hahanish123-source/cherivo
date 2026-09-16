import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import {
  GREETING_MEDIA_BUCKET,
  MAX_AUDIO_BYTES,
  MAX_IMAGE_BYTES,
  MAX_MEMORY_VIDEO_BYTES,
  deleteGreetingMediaPaths,
  getGreetingMediaUrl,
  uploadGreetingMedia
} from "@/lib/greetingMedia";
import { isLocalDevelopmentFallbackEnabled, supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    // 1. Signed Direct Upload Handler (bypasses Vercel 4.5 MB serverless limit)
    if (contentType.includes("application/json")) {
      const body = await request.json().catch(() => null);
      if (body?.action === "get-signed-upload-url") {
        if (isLocalDevelopmentFallbackEnabled()) {
          return NextResponse.json({ local: true });
        }

        const { filename, fileSize, kind } = body;
        if (kind !== "audio" && kind !== "memory-video" && kind !== "image") {
          return NextResponse.json({ error: "A valid media kind is required." }, { status: 400 });
        }

        const isVideo = kind === "memory-video";
        const isImage = kind === "image";
        const maxBytes = isVideo ? MAX_MEMORY_VIDEO_BYTES : isImage ? MAX_IMAGE_BYTES : MAX_AUDIO_BYTES;
        if (fileSize > maxBytes) {
          return NextResponse.json({
            error: isVideo
              ? "Video is too large. Video must be 80 MB or smaller."
              : isImage
              ? "Image is too large. Image must be 15 MB or smaller."
              : "Audio is too large. Audio must be 20 MB or smaller."
          }, { status: 413 });
        }

        const ext = ((typeof filename === "string" ? filename.split(".").pop() : "") || (isVideo ? "mp4" : isImage ? "jpg" : "mp3")).toLowerCase();
        const path = `greetings/${randomUUID()}.${ext}`;

        const supabase = supabaseAdmin();
        const candidateBuckets = [
          GREETING_MEDIA_BUCKET,
          "hanora-media",
          "hamora-media"
        ].filter((v, i, a) => v && a.indexOf(v) === i);

        let signedData: { signedUrl: string; token: string; path: string } | null = null;
        let usedBucket = candidateBuckets[0];

        for (const bucket of candidateBuckets) {
          try {
            const { data, error } = await supabase.storage
              .from(bucket)
              .createSignedUploadUrl(path);
            if (!error && data?.signedUrl) {
              signedData = data;
              usedBucket = bucket;
              break;
            }
          } catch {
            // try next bucket
          }
        }

        if (!signedData) {
          return NextResponse.json({ local: true, reason: "signed_url_unavailable" });
        }

        const { data: publicData } = supabase.storage.from(usedBucket).getPublicUrl(path);

        return NextResponse.json({
          ok: true,
          signedUrl: signedData.signedUrl,
          token: signedData.token,
          path,
          bucket: usedBucket,
          previewUrl: publicData?.publicUrl || "",
          media: {
            storage: "supabase",
            path,
            kind,
            bucket: usedBucket
          }
        });
      }
    }

    // 2. Standard multipart/form-data upload fallback
    const formData = await request.formData();
    const file = formData.get("file");
    const kind = formData.get("kind");

    if (!(file instanceof File) || (kind !== "audio" && kind !== "memory-video" && kind !== "image")) {
      return NextResponse.json({ error: "A valid media file (audio, video, or image) is required." }, { status: 400 });
    }

    if (kind === "memory-video" && file.size > MAX_MEMORY_VIDEO_BYTES) {
      return NextResponse.json({ error: "Video is too large. Video must be 80 MB or smaller." }, { status: 413 });
    }

    if (kind === "audio" && file.size > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: "Audio is too large. Audio must be 20 MB or smaller." }, { status: 413 });
    }

    if (kind === "image" && file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Image is too large. Image must be 15 MB or smaller." }, { status: 413 });
    }

    const media = await uploadGreetingMedia(file, kind as "audio" | "memory-video" | "image");
    const previewUrl = await getGreetingMediaUrl(media);
    return NextResponse.json({ ok: true, media, previewUrl, size: file.size });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Media upload failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");
    const kind = searchParams.get("kind") || "image";
    if (!path) {
      return NextResponse.json({ error: "Path parameter is required." }, { status: 400 });
    }
    const previewUrl = await getGreetingMediaUrl({ storage: "supabase", path, kind: kind as any });
    return NextResponse.json({ previewUrl });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to resolve media." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { paths } = await request.json();
    if (Array.isArray(paths) && paths.length > 0) {
      await deleteGreetingMediaPaths(paths);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Paths array is required." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Media deletion failed." }, { status: 400 });
  }
}