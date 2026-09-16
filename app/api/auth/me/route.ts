import { NextResponse } from "next/server";
import { getUserSession, getAdminSession } from "@/lib/auth";
import { getUserById } from "@/lib/userStore";

export async function GET() {
  try {
    const isAdmin = await getAdminSession();
    if (isAdmin) {
      return NextResponse.json({
        authenticated: true,
        role: "admin",
        user: { name: "Hanish", email: "hanish@hamora.local", role: "admin" }
      });
    }

    const session = await getUserSession();
    if (!session) {
      return NextResponse.json({ authenticated: false, role: null, user: null });
    }

    const user = await getUserById(session.id);
    if (!user) {
      return NextResponse.json({ authenticated: false, role: null, user: null });
    }

    return NextResponse.json({
      authenticated: true,
      role: "user",
      user
    });
  } catch {
    return NextResponse.json({ authenticated: false, role: null, user: null });
  }
}
