import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { deleteGreetingAdmin } from "@/lib/greetingStore";

export async function DELETE(req: Request) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Unauthorized access." },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Missing token parameter." }, { status: 400 });
    }

    const result = await deleteGreetingAdmin(token);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to delete greeting." },
      { status: 500 }
    );
  }
}
