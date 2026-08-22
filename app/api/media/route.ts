import { NextResponse } from "next/server";
import {
  MAX_AUDIO_BYTES,
  MAX_IMAGE_BYTES,
  MAX_MEMORY_VIDEO_BYTES,
  deleteGreetingMediaPaths,
  getGreetingMediaUrl,
  uploadGreetingMedia
} from "@/lib/greetingMedia";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const kind = formData.get("kind");

    if (!(file instanceof File) || (kind !== "audio" && kind !== "memory-video" && kind !== "image")) {
      return NextResponse.json({ error: "A valid media file (audio, video, or image) is required." }, { status: 400 });
    }

    if (kind === "memory-video" && file.size > MAX_MEMORY_VIDEO_BYTES) {
      return NextResponse.json({ error: "Video is too large. Video must be 50 MB or smaller." }, { status: 413 });
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