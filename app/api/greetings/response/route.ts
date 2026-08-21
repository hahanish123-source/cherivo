import { NextResponse } from "next/server";
import { getGreetingResponses, saveGreetingResponse } from "@/lib/greetingStore";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid response data." }, { status: 400 });
    }

    const { token, message, senderName, emojis } = body;
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Greeting token is required." }, { status: 400 });
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "A response message is required." }, { status: 400 });
    }

    const item = await saveGreetingResponse(token, {
      message,
      senderName,
      emojis: Array.isArray(emojis) ? emojis : ["💖"]
    });

    return NextResponse.json({ ok: true, response: item });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save response.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "Greeting token is required." }, { status: 400 });
    }

    const responses = await getGreetingResponses(token);
    return NextResponse.json({ ok: true, responses });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load responses.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
