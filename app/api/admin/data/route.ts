import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import {
  getAllGreetingsAdmin,
  getAllResponsesAdmin,
  getAllDraftsAdmin
} from "@/lib/greetingStore";
import { getAllUsersAdmin } from "@/lib/userStore";
import fs from "node:fs/promises";
import path from "node:path";

export async function GET() {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Unauthorized access. Administrator privileges required." },
      { status: 403 }
    );
  }

  try {
    const [greetings, responsesMap, drafts, users] = await Promise.all([
      getAllGreetingsAdmin(),
      getAllResponsesAdmin(),
      getAllDraftsAdmin(),
      getAllUsersAdmin()
    ]);

    // Calculate approximate storage usage
    let localStorageBytes = 0;
    try {
      const localDir = path.join(process.cwd(), ".cherivo-local");
      const files = await fs.readdir(localDir);
      for (const f of files) {
        const s = await fs.stat(path.join(localDir, f));
        localStorageBytes += s.size;
      }
    } catch {}

    // Attach response counts to greetings
    const sanitizedGreetings = greetings.map((g) => {
      const resp = responsesMap[g.token] || [];
      return {
        token: g.token,
        title: g.title || "Untitled Card",
        created_at: g.created_at || "Unknown",
        user_id: g.user_id || "anonymous",
        target_event_date: g.target_event_date,
        reminder_date: g.reminder_date,
        responseCount: resp.length,
        candlesBlown: resp.filter((r) => r.candles_blown).length,
        previewUrl: `/g/${g.token}`
      };
    });

    const totalResponses = Object.values(responsesMap).reduce(
      (acc, arr) => acc + arr.length,
      0
    );

    return NextResponse.json({
      success: true,
      stats: {
        totalGreetings: greetings.length,
        totalUsers: users.length,
        totalResponses,
        totalDrafts: drafts.length,
        storageBytes: localStorageBytes,
        storageMb: (localStorageBytes / (1024 * 1024)).toFixed(2)
      },
      greetings: sanitizedGreetings,
      responses: responsesMap,
      users,
      drafts
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch admin data." },
      { status: 500 }
    );
  }
}
