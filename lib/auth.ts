import crypto from "node:crypto";
import { cookies } from "next/headers";

const ADMIN_USER = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASS = process.env.ADMIN_PASSWORD || "HamoraAdmin@2026!Secure";
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || "hamora_super_secret_session_key_987654321_secure";

// In-memory rate limiting against brute force attacks
type AttemptRecord = { count: number; lockedUntil: number };
const loginAttempts = new Map<string, AttemptRecord>();

export function checkRateLimit(ipOrKey: string): { allowed: boolean; remainingSec?: number } {
  const now = Date.now();
  const record = loginAttempts.get(ipOrKey);
  if (!record) return { allowed: true };
  if (record.lockedUntil > now) {
    return { allowed: false, remainingSec: Math.ceil((record.lockedUntil - now) / 1000) };
  }
  if (record.lockedUntil <= now && record.count >= 5) {
    loginAttempts.delete(ipOrKey);
  }
  return { allowed: true };
}

export function recordFailedAttempt(ipOrKey: string) {
  const now = Date.now();
  const record = loginAttempts.get(ipOrKey) || { count: 0, lockedUntil: 0 };
  record.count += 1;
  if (record.count >= 5) {
    record.lockedUntil = now + 15 * 60 * 1000; // 15-minute lock
  }
  loginAttempts.set(ipOrKey, record);
}

export function clearFailedAttempts(ipOrKey: string) {
  loginAttempts.delete(ipOrKey);
}

export function verifyAdminCredentials(user: string, pass: string): boolean {
  if (!user || !pass) return false;

  // Double sha256 to ensure matching length buffers for constant-time comparison
  const hashUser = crypto.createHash("sha256").update(user).digest();
  const hashExpectedUser = crypto.createHash("sha256").update(ADMIN_USER).digest();
  const hashPass = crypto.createHash("sha256").update(pass).digest();
  const hashExpectedPass = crypto.createHash("sha256").update(ADMIN_PASS).digest();

  const userMatch = crypto.timingSafeEqual(hashUser, hashExpectedUser);
  const passMatch = crypto.timingSafeEqual(hashPass, hashExpectedPass);

  return userMatch && passMatch;
}

export function createSessionToken(role: "admin" | "user", identifier: string): string {
  const timestamp = Date.now();
  const payload = `${role}:${identifier}:${timestamp}`;
  const hmac = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  return `${payload}:${hmac}`;
}

export function verifySessionToken(token: string): { valid: boolean; role?: "admin" | "user"; identifier?: string } {
  if (!token) return { valid: false };
  const parts = token.split(":");
  if (parts.length !== 4) return { valid: false };
  const [role, identifier, timestampStr, signature] = parts;

  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp) || Date.now() - timestamp > 7 * 24 * 60 * 60 * 1000) {
    return { valid: false };
  }

  const payload = `${role}:${identifier}:${timestampStr}`;
  const expectedHmac = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedHmac);

  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return { valid: false };
  }

  return { valid: true, role: role as "admin" | "user", identifier };
}

export async function getAdminSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("hamora_session")?.value;
    if (!token) return false;
    const { valid, role } = verifySessionToken(token);
    return valid && role === "admin";
  } catch {
    return false;
  }
}

export async function getUserSession(): Promise<{ id: string; role: "user" | "admin" } | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("hamora_session")?.value;
    if (!token) return null;
    const { valid, role, identifier } = verifySessionToken(token);
    if (!valid || !identifier) return null;
    return { id: identifier, role: role || "user" };
  } catch {
    return null;
  }
}
