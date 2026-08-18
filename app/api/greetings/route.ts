
import { NextResponse } from "next/server";
import { createGreeting } from "@/lib/greetingStore";

export const runtime = "nodejs";

function getBaseUrl(request: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;
  return new URL(request.url).origin;
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    mode: process.env.NODE_ENV !== "production" && process.env.CHERIVO_LOCAL_STORE !== "false"
      ? "local-development"
      : "supabase-production",
    message: "Cherivo greeting API is ready."
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const title = String(body?.title || "Cherivo moment").trim().slice(0, 120);
    const project = body?.project;

    if (!project || typeof project !== "object") {
      return NextResponse.json({ error: "Greeting data is missing." }, { status: 400 });
    }

    const serialized = JSON.stringify(project);
    const bytes = Buffer.byteLength(serialized, "utf8");

    if (bytes > 3_800_000) {
      return NextResponse.json({
        error: "This greeting is too large to publish. Reduce photo/audio sizes or use fewer media files."
      }, { status: 413 });
    }

    const { token } = await createGreeting(title || "Cherivo moment", project);
    const url = `${getBaseUrl(request)}/g/${token}`;

    return NextResponse.json({ ok: true, token, url });
  } catch (error: any) {
    console.error("Cherivo publish error:", error);

    const message = String(error?.message || error || "Could not create greeting.");

    if (process.env.NODE_ENV === "production" && /SUPABASE/i.test(message)) {
      return NextResponse.json({
        error: "Cherivo is missing its production database configuration. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel → Settings → Environment Variables, then redeploy."
      }, { status: 503 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
