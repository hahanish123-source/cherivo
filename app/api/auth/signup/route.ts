import { NextResponse } from "next/server";
import { registerUser } from "@/lib/userStore";
import { createSessionToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const user = await registerUser(email, password, name);
    const token = createSessionToken("user", user.id);

    const response = NextResponse.json({
      success: true,
      user
    });

    response.cookies.set("hamora_session", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Registration failed." },
      { status: 400 }
    );
  }
}
