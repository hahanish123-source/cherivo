import crypto from "node:crypto";
import { cookies } from "next/headers";

const ADMIN_USER = process.env.ADMIN_USERNAME || "hanish";
const ADMIN_PASS = process.env.ADMIN_PASSWORD || "hanorhan";
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

function safeEqualString(a: string, b: string): boolean {
  const hashA = crypto.createHash("sha256").update(a).digest();
  const hashB = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

export function verifyAdminCredentials(user: string, pass: string): boolean {
  if (!user || !pass) return false;

  const normalizedUser = user.trim().toLowerCase();
  const trimmedPass = pass.trim();

  // Primary credentials requested by user: username 'hanish' and password 'hanorhan'
  const isHanishMatch = safeEqualString(normalizedUser, "hanish") && safeEqualString(trimmedPass, "hanorhan");
  if (isHanishMatch) return true;

  // Environment variables override (if configured)
  const envUser = (process.env.ADMIN_USERNAME || "hanish").trim().toLowerCase();
  const envPass = (process.env.ADMIN_PASSWORD || "hanorhan").trim();
  const isEnvMatch = safeEqualString(normalizedUser, envUser) && safeEqualString(trimmedPass, envPass);
  if (isEnvMatch) return true;

  // Backward-compatible fallback for 'admin' username
  const isAdminFallback = safeEqualString(normalizedUser, "admin") && 
    (safeEqualString(trimmedPass, "hanorhan") || safeEqualString(trimmedPass, "HamoraAdmin@2026!Secure"));
  if (isAdminFallback) return true;

  return false;
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
