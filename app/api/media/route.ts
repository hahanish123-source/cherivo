import { NextResponse } from "next/server";
import { getGreetingMediaUrl, uploadGreetingMedia } from "@/lib/greetingMedia";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const kind = formData.get("kind");

    if (!(file instanceof File) || (kind !== "video" && kind !== "audio")) {
      return NextResponse.json({ error: "A valid media file and media type are required." }, { status: 400 });
    }

    const media = await uploadGreetingMedia(file, kind);
    const previewUrl = await getGreetingMediaUrl(media);
    return NextResponse.json({ ok: true, media, previewUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Media upload failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}