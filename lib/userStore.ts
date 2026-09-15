import fs from "node:fs/promises";
import path from "node:path";
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

const localDir = path.join(process.cwd(), ".cherivo-local");
const localUsersFile = path.join(localDir, "users.json");

async function safeUsersRead(): Promise<StoredUser[]> {
  try {
    const stat = await fs.stat(localUsersFile).catch(() => null);
    if (!stat) return [];
    const raw = await fs.readFile(localUsersFile, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function safeUsersWrite(users: StoredUser[]): Promise<void> {
  await fs.mkdir(localDir, { recursive: true });
  await fs.writeFile(localUsersFile, JSON.stringify(users, null, 2), "utf8");
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
