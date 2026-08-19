
import { NextResponse } from "next/server";
import { createGreeting } from "@/lib/greetingStore";
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
  if (project.audioUrl && typeof project.audioUrl === "string" && !project.audioUrl.startsWith("data:")) {
    throw new Error("Audio must be uploaded as an MP3 file.");
  }
  if (Array.isArray(project.blocks)) {
    for (const raw of project.blocks) {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
      const block = raw as Record<string, unknown>;
      if (block.audioUrl && typeof block.audioUrl === "string" && !block.audioUrl.startsWith("data:")) {
        throw new Error("Audio must be uploaded as an MP3 file.");
      }
      if (block.memoryVideo && typeof block.memoryVideo === "string" && !block.memoryVideo.startsWith("data:")) {
        throw new Error("Memory video must be uploaded through Hanora.");
      }
    }
  }
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

    const { project } = body;
    if (!project || typeof project !== "object" || Array.isArray(project)) {
      return NextResponse.json({ error: "Greeting data is missing or invalid." }, { status: 400 });
    }

    validateProjectMedia(project as Record<string, unknown>);

    const serialized = JSON.stringify(project);
    const bytes = Buffer.byteLength(serialized, "utf8");
    const maxBytes = process.env.NODE_ENV !== "production" ? 30_000_000 : 3_800_000;
    if (bytes > maxBytes) {
      return NextResponse.json(
        { error: "This greeting is too large to publish. Reduce photo/audio sizes or remove unused media." },
        { status: 413 }
      );
    }

    const { token } = await createGreeting(title.slice(0, 120), project as Record<string, unknown>);
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
    const code = (error as { code?: string } | null)?.code ?? "unknown";

    if (isMissingSupabaseConfigError(error)) {
      return NextResponse.json(
        {
          ok: false,
          code: "missing_supabase_config",
          error:
            "Hanora is missing its production database configuration. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel environment variables, then redeploy.",
          diagnostics,
        },
        { status: 503 }
      );
    }

    if (code === "supabase_client_init_failed") {
      return NextResponse.json(
        {
          ok: false,
          code: "supabase_client_init_failed",
          error: "Supabase client initialization failed. Check the server environment and Supabase project configuration.",
          diagnostics,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        code: "supabase_insert_failed",
        error: message,
        diagnostics,
      },
      { status: 500 }
    );
  }
}
