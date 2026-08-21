import { NextResponse } from "next/server";
import { deleteDraftRecord, getDraftRecords, saveDraftRecord } from "@/lib/greetingStore";
import type { GreetingDraft } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "anonymous";
    const drafts = await getDraftRecords(userId);
    return NextResponse.json({ ok: true, drafts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load drafts.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid draft payload." }, { status: 400 });
    }

    const draft = body as GreetingDraft;
    if (!draft.title && !draft.project) {
      return NextResponse.json({ error: "Draft title or project is required." }, { status: 400 });
    }

    const saved = await saveDraftRecord(draft);
    return NextResponse.json({ ok: true, draft: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save draft.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId") || undefined;

    if (!id) {
      return NextResponse.json({ error: "Draft ID is required." }, { status: 400 });
    }

    const result = await deleteDraftRecord(id, userId);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete draft.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
