import type { Metadata } from "next";
import { getGreeting } from "@/lib/greetingStore";
import { resolveGreetingMedia } from "@/lib/greetingMedia";
import GreetingClient from "./GreetingClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  try {
    const data = await getGreeting(token);
    if (data?.title) {
      return {
        title: `${data.title} | Hanora`,
        robots: { index: false, follow: false }
      };
    }
  } catch {}
  return { title: "A Hanora moment", robots: { index: false, follow: false } };
}

export default async function GreetingPage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  try {
    const data = await getGreeting(token);
    if (data) {
      const resolvedProject = await resolveGreetingMedia(
        (data.data as Record<string, unknown>) ?? {}
      );
      return (
        <GreetingClient
          project={resolvedProject as Record<string, unknown>}
          title={data.title || "A Hanora moment"}
        />
      );
    }
    return (
      <main className="privateMissing">
        <div>
          <span>404</span>
          <h1>This moment isn't available.</h1>
          <p>The link may be wrong, deleted, or not published yet.</p>
        </div>
      </main>
    );
  } catch {
    return (
      <main className="privateMissing">
        <div>
          <span>Setup needed</span>
          <h1>Hanora is not connected to its secure database yet.</h1>
          <p>Add the Supabase environment variables from the README before publishing.</p>
        </div>
      </main>
    );
  }
}
