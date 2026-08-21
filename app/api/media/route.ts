import { NextResponse } from "next/server";
import { getGreetingMediaUrl, uploadGreetingMedia } from "@/lib/greetingMedia";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const kind = formData.get("kind");

    if (!(file instanceof File) || (kind !== "audio" && kind !== "memory-video" && kind !== "image")) {
      return NextResponse.json({ error: "A valid media file (audio, video, or image) is required." }, { status: 400 });
    }

    if (kind === "memory-video" && file.size > 50_000_000) {
      return NextResponse.json({ error: "Video is too large. Please choose a video under 50 MB." }, { status: 413 });
    }

    if (kind === "audio" && file.size > 20_000_000) {
      return NextResponse.json({ error: "Audio is too large. Please choose an audio file under 20 MB." }, { status: 413 });
    }

    if (kind === "image" && file.size > 20_000_000) {
      return NextResponse.json({ error: "Image is too large. Please choose an image under 20 MB." }, { status: 413 });
    }

    const media = await uploadGreetingMedia(file, kind as "audio" | "memory-video" | "image");
    const previewUrl = await getGreetingMediaUrl(media);
    return NextResponse.json({ ok: true, media, previewUrl });
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