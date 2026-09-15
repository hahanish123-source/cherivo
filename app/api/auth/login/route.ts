import { NextResponse } from "next/server";
import {
  checkRateLimit,
  recordFailedAttempt,
  clearFailedAttempts,
  verifyAdminCredentials,
  createSessionToken
} from "@/lib/auth";
import { authenticateUser } from "@/lib/userStore";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const body = await req.json();
    const { username, email, password, isAdmin } = body;

    // Rate limiting check
    const rateKey = `${ip}:${isAdmin ? "admin" : (email || username)}`;
    const limitStatus = checkRateLimit(rateKey);
    if (!limitStatus.allowed) {
      return NextResponse.json(
        { error: `Account temporarily locked due to multiple failed login attempts. Please try again in ${limitStatus.remainingSec}s.` },
        { status: 429 }
      );
    }

    if (isAdmin) {
      // Secure Admin Login
      const valid = verifyAdminCredentials(username, password);
      if (!valid) {
        recordFailedAttempt(rateKey);
        return NextResponse.json(
          { error: "Invalid admin credentials. Access denied." },
          { status: 401 }
        );
      }

      clearFailedAttempts(rateKey);
      const token = createSessionToken("admin", username || "admin");

      const response = NextResponse.json({
        success: true,
        role: "admin",
        user: { name: "System Administrator", email: "admin@hamora.local", role: "admin" }
      });

      response.cookies.set("hamora_session", token, {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });

      return response;
    } else {
      // Standard Creator User Login
      const user = await authenticateUser(email || username, password);
      if (!user) {
        recordFailedAttempt(rateKey);
        return NextResponse.json(
          { error: "Invalid email or password." },
          { status: 401 }
        );
      }

      clearFailedAttempts(rateKey);
      const token = createSessionToken("user", user.id);

      const response = NextResponse.json({
        success: true,
        role: "user",
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
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Login failed." },
      { status: 500 }
    );
  }
}
