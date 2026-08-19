import { NextResponse } from "next/server";
import { getGreetingMediaUrl, uploadGreetingMedia } from "@/lib/greetingMedia";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const kind = formData.get("kind");

    if (!(file instanceof File) || (kind !== "audio" && kind !== "memory-video")) {
      return NextResponse.json({ error: "A valid audio or memory video file is required." }, { status: 400 });
    }

    if (kind === "memory-video" && file.size > 20_000_000) {
      return NextResponse.json({ error: "Video is too large. Please choose a video under 20 MB." }, { status: 413 });
    }

    const media = await uploadGreetingMedia(file, kind);
    const previewUrl = await getGreetingMediaUrl(media);
    return NextResponse.json({ ok: true, media, previewUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Media upload failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}