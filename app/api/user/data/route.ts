import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth";
import {
  getAllGreetingsAdmin,
  getAllResponsesAdmin,
  getDraftRecords
} from "@/lib/greetingStore";
import { getUserById } from "@/lib/userStore";

export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json(
      { error: "Please log in to view your creator dashboard." },
      { status: 401 }
    );
  }

  try {
    const user = await getUserById(session.id);
    const [allGreetings, allResponses, drafts] = await Promise.all([
      getAllGreetingsAdmin(),
      getAllResponsesAdmin(),
      getDraftRecords(session.id)
    ]);

    // Match cards created by this user or anonymous fallback
    const userGreetings = allGreetings.filter(
      (g) => g.user_id === session.id || g.user_id === user?.email
    );

    const greetingsWithResponses = userGreetings.map((g) => {
      const resp = allResponses[g.token] || [];
      return {
        token: g.token,
        title: g.title || "Untitled Card",
        created_at: g.created_at || "Unknown",
        responseCount: resp.length,
        candlesBlown: resp.filter((r) => r.candles_blown).length,
        responses: resp,
        previewUrl: `/g/${g.token}`
      };
    });

    return NextResponse.json({
      success: true,
      user,
      greetings: greetingsWithResponses,
      drafts
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load user data." },
      { status: 500 }
    );
  }
}
