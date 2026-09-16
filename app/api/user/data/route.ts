import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth";
import {
  getAllGreetingsAdmin,
  getAllResponsesAdmin,
  getDraftRecords
} from "@/lib/greetingStore";
import { getUserById } from "@/lib/userStore";

export async function GET(request: Request) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json(
      { error: "Please log in to view your creator dashboard." },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const clientTokensParam = searchParams.get("tokens");
    const clientTokens = clientTokensParam
      ? clientTokensParam.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const isPlatformAdmin =
      session.role === "admin" || session.id === "admin" || session.id === "hanish";

    const user =
      (await getUserById(session.id)) ||
      (isPlatformAdmin
        ? {
            id: session.id,
            name: "Hanish (Administrator)",
            email: "hanish@hamora.local",
            created_at: new Date().toISOString()
          }
        : null);

    const [allGreetings, allResponses, drafts] = await Promise.all([
      getAllGreetingsAdmin(),
      getAllResponsesAdmin(),
      getDraftRecords(session.id)
    ]);

    // Match cards created by this user, client-stored tokens, or all cards for admin
    const userGreetings = allGreetings.filter((g) => {
      if (isPlatformAdmin) return true;
      if (clientTokens.includes(g.token)) return true;
      if (g.user_id === session.id) return true;
      if (user?.email && g.user_id === user.email) return true;
      return false;
    });

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
