import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";

export type StoredUser = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  salt: string;
  created_at: string;
  last_login?: string;
};

export type PublicUser = Omit<StoredUser, "passwordHash" | "salt">;

// Global in-memory storage fallback for serverless / read-only environments
declare global {
  // eslint-disable-next-line no-var
  var __hamoraUsersMemoryStore: Map<string, StoredUser> | undefined;
}

function getUsersMemoryStore(): Map<string, StoredUser> {
  if (!globalThis.__hamoraUsersMemoryStore) {
    globalThis.__hamoraUsersMemoryStore = new Map();
  }
  return globalThis.__hamoraUsersMemoryStore;
}

function getCandidateFiles(): string[] {
  const files: string[] = [];
  try {
    // In Vercel / AWS Lambda serverless environments, /tmp is always writable
    const tmpDir = path.join(os.tmpdir(), ".cherivo-local");
    files.push(path.join(tmpDir, "users.json"));
  } catch {
    // ignore
  }
  // Local project directory fallback for development
  files.push(path.join(process.cwd(), ".cherivo-local", "users.json"));
  return files;
}

async function safeUsersRead(): Promise<StoredUser[]> {
  const memStore = getUsersMemoryStore();
  const allUsersMap = new Map<string, StoredUser>();

  // 1. Seed from active memory store
  for (const [id, user] of memStore.entries()) {
    allUsersMap.set(id, user);
  }

  // 2. Read from disk storage locations
  for (const file of getCandidateFiles()) {
    try {
      const stat = await fs.stat(file).catch(() => null);
      if (stat) {
        const raw = await fs.readFile(file, "utf8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const u of parsed) {
            if (u && u.id && !allUsersMap.has(u.id)) {
              allUsersMap.set(u.id, u);
              memStore.set(u.id, u);
            }
          }
        }
      }
    } catch {
      // Continue to next candidate
    }
  }

  return Array.from(allUsersMap.values());
}

async function safeUsersWrite(users: StoredUser[]): Promise<void> {
  const memStore = getUsersMemoryStore();
  for (const user of users) {
    memStore.set(user.id, user);
  }

  // Write to first writable storage location without throwing EROFS
  for (const file of getCandidateFiles()) {
    try {
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, JSON.stringify(users, null, 2), "utf8");
      break; // Successfully persisted
    } catch (err: any) {
      console.warn(`[Hamora UserStore] Local filesystem write bypassed for ${file} (${err?.code || err?.message})`);
    }
  }
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

export async function registerUser(email: string, password: string, name: string): Promise<PublicUser> {
  const users = await safeUsersRead();
  const normalizedEmail = email.trim().toLowerCase();

  if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    throw new Error("An account with this email already exists.");
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters long.");
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = hashPassword(password, salt);
  const id = crypto.randomUUID();

  const newUser: StoredUser = {
    id,
    email: normalizedEmail,
    name: name.trim() || normalizedEmail.split("@")[0] || "Hamora Creator",
    passwordHash,
    salt,
    created_at: new Date().toISOString(),
    last_login: new Date().toISOString()
  };

  users.push(newUser);
  await safeUsersWrite(users);

  const { passwordHash: _, salt: __, ...publicUser } = newUser;
  return publicUser;
}

export async function authenticateUser(email: string, password: string): Promise<PublicUser | null> {
  const users = await safeUsersRead();
  const normalizedEmail = email.trim().toLowerCase();
  const user = users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!user) return null;

  const attemptedHash = hashPassword(password, user.salt);
  const expectedBuffer = Buffer.from(user.passwordHash, "hex");
  const attemptedBuffer = Buffer.from(attemptedHash, "hex");

  if (expectedBuffer.length !== attemptedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, attemptedBuffer)) {
    return null;
  }

  user.last_login = new Date().toISOString();
  await safeUsersWrite(users);

  const { passwordHash: _, salt: __, ...publicUser } = user;
  return publicUser;
}

export async function getUserById(id: string): Promise<PublicUser | null> {
  const users = await safeUsersRead();
  const user = users.find((u) => u.id === id);
  if (!user) return null;

  const { passwordHash: _, salt: __, ...publicUser } = user;
  return publicUser;
}

export async function getAllUsersAdmin(): Promise<PublicUser[]> {
  const users = await safeUsersRead();
  return users.map(({ passwordHash: _, salt: __, ...pub }) => pub);
}
