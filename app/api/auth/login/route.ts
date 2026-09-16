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
    const { username, email, password, isAdmin } = body || {};
    const identifier = (username || email || "").trim();
    const rawPassword = (password || "").trim();

    // Check if credentials match Admin (hanish / hanorhan)
    const isAdminCredentials = verifyAdminCredentials(identifier, rawPassword);

    if (isAdmin || isAdminCredentials) {
      if (!isAdminCredentials) {
        const rateKey = `${ip}:admin`;
        recordFailedAttempt(rateKey);
        const limitStatus = checkRateLimit(rateKey);
        if (!limitStatus.allowed) {
          return NextResponse.json(
            { error: `Too many failed attempts. Please try again in ${limitStatus.remainingSec}s.` },
            { status: 429 }
          );
        }
        return NextResponse.json(
          { error: "Invalid admin credentials. Access denied." },
          { status: 401 }
        );
      }

      // Valid Admin credentials - clear any rate limit lock immediately
      clearFailedAttempts(`${ip}:admin`);
      clearFailedAttempts(`${ip}:${identifier}`);
      const token = createSessionToken("admin", "hanish");

      const response = NextResponse.json({
        success: true,
        role: "admin",
        user: { name: "Hanish (Administrator)", email: "hanish@hamora.local", role: "admin" }
      });

      response.cookies.set("hamora_session", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30 // 30 days
      });

      return response;
    } else {
      // Standard Creator User Login
      const rateKey = `${ip}:${identifier}`;
      const limitStatus = checkRateLimit(rateKey);
      if (!limitStatus.allowed) {
        return NextResponse.json(
          { error: `Account temporarily locked due to multiple failed login attempts. Please try again in ${limitStatus.remainingSec}s.` },
          { status: 429 }
        );
      }

      const user = await authenticateUser(identifier, rawPassword);
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
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30 // 30 days
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
