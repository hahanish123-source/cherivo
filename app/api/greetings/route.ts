
import { NextResponse } from "next/server";
import { createGreeting } from "@/lib/greetingStore";
import { isMissingSupabaseConfigError } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

function getBaseUrl(request: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (configured) {
    return configured;
  }

  return new URL(request.url).origin;
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    mode:
      process.env.NODE_ENV !== "production" && process.env.CHERIVO_LOCAL_STORE !== "false"
        ? "local-development"
        : "supabase-production",
    message: "Cherivo greeting API is ready.",
  });
}

export async function POST(request: Request) {
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

    const serialized = JSON.stringify(project);
    const bytes = Buffer.byteLength(serialized, "utf8");
    if (bytes > 3_800_000) {
      return NextResponse.json(
        { error: "This greeting is too large to publish. Reduce photo/audio sizes or remove unused media." },
        { status: 413 }
      );
    }

    const { token } = await createGreeting(title.slice(0, 120), project as Record<string, unknown>);
    const url = `${getBaseUrl(request)}/g/${token}`;
    return NextResponse.json({ ok: true, token, url });
  } catch (error: unknown) {
    console.error("Cherivo publish error:", error);

    const message =
      error instanceof Error ? error.message : "Could not create greeting.";

    if (isMissingSupabaseConfigError(error)) {
      return NextResponse.json(
        {
          error:
            "Cherivo is missing its production database configuration. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel environment variables, then redeploy.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
