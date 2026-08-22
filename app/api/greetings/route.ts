import { NextResponse } from "next/server";
import { createGreeting } from "@/lib/greetingStore";
import { normalizeProject } from "@/lib/greetingConfig";
import {
  getSupabaseRuntimeDiagnostics,
  isMissingSupabaseConfigError,
  logSupabaseRuntimeDiagnostics,
} from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

function getBaseUrl(request: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (configured) {
    return configured;
  }

  return new URL(request.url).origin;
}

function validateProjectMedia(project: Record<string, unknown>) {
  // Allow all valid media: data URLs, https/http URLs, and Supabase storage objects
}

export async function GET() {
  const diagnostics = getSupabaseRuntimeDiagnostics();
  logSupabaseRuntimeDiagnostics("Hanora GET /api/greetings diagnostics");

  return NextResponse.json({
    ok: true,
    mode:
      process.env.NODE_ENV !== "production" && process.env.CHERIVO_LOCAL_STORE !== "false"
        ? "local-development"
        : "supabase-production",
    message: "Hanora greeting API is ready.",
    diagnostics,
  });
}

export async function POST(request: Request) {
  const diagnostics = getSupabaseRuntimeDiagnostics();
  logSupabaseRuntimeDiagnostics("Hanora POST /api/greetings diagnostics");

  try {
    const body = (await request.json().catch(() => null)) ?? {};

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Greeting payload is invalid." }, { status: 400 });
    }

    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      return NextResponse.json({ error: "A greeting title is required." }, { status: 400 });
    }

    const { project, userId, targetEventDate, reminderDate } = body;
    if (!project || typeof project !== "object" || Array.isArray(project)) {
      return NextResponse.json({ error: "Greeting data is missing or invalid." }, { status: 400 });
    }

    validateProjectMedia(project as Record<string, unknown>);

    const normalizedProject = normalizeProject(project);
    const serialized = JSON.stringify(normalizedProject);
    const bytes = Buffer.byteLength(serialized, "utf8");
    const maxBytes = 80_000_000;
    if (bytes > maxBytes) {
      return NextResponse.json(
        { error: "This greeting is too large to publish (exceeds 80 MB). Reduce photo/video/audio sizes or remove unused media." },
        { status: 413 }
      );
    }

    const { token } = await createGreeting(
      title.slice(0, 120),
      normalizedProject as unknown as Record<string, unknown>,
      {
        userId: typeof userId === "string" ? userId : undefined,
        targetEventDate: typeof targetEventDate === "string" ? targetEventDate : normalizedProject.targetEventDate,
        reminderDate: typeof reminderDate === "string" ? reminderDate : normalizedProject.reminderDate
      }
    );
    const url = `${getBaseUrl(request)}/g/${token}`;

    return NextResponse.json({
      ok: true,
      token,
      url,
      diagnostics: getSupabaseRuntimeDiagnostics(),
    });
  } catch (error: unknown) {
    const diagnostics = getSupabaseRuntimeDiagnostics();
    logSupabaseRuntimeDiagnostics("Hanora publish error diagnostics");
    console.error("Hanora publish error:", {
      diagnostics,
      error,
    });

    const message =
      error instanceof Error ? error.message : "Could not create greeting.";

    return NextResponse.json(
      {
        ok: false,
        error: message,
        diagnostics,
      },
      { status: isMissingSupabaseConfigError(error) ? 503 : 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { token, userId } = await request.json();
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Greeting token is required." }, { status: 400 });
    }
    const { deleteGreetingByToken } = await import("@/lib/greetingStore");
    const result = await deleteGreetingByToken(token, typeof userId === "string" ? userId : undefined);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not delete greeting.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
