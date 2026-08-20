import fs from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { supabaseAdmin } from "./supabaseAdmin";

export type StoredGreeting = {
  token: string;
  title: string;
  data: Record<string, unknown>;
  created_at?: string;
};

const localFile = path.join(process.cwd(), ".cherivo-local", "greetings.json");

async function localRead(): Promise<StoredGreeting[]> {
  try {
    const raw = await fs.readFile(localFile, "utf8");
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

async function localWrite(rows: StoredGreeting[]) {
  await fs.mkdir(path.dirname(localFile), { recursive: true });
  await fs.writeFile(localFile, JSON.stringify(rows, null, 2), "utf8");
}

function useLocalStore() {
  const hasSupabase = Boolean(
    process.env.SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.SUPABASE_URL.startsWith("http")
  );
  if (process.env.NODE_ENV === "production" && hasSupabase && process.env.CHERIVO_LOCAL_STORE !== "true") {
    return false;
  }
  return true;
}

async function generateUniqueToken(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const token = randomBytes(32).toString("hex");

    if (useLocalStore()) {
      const rows = await localRead();
      if (!rows.some((row) => row.token === token)) {
        return token;
      }
      continue;
    }

    try {
      const supabase = supabaseAdmin();
      const { data, error } = await supabase
        .from("greetings")
        .select("token")
        .eq("token", token)
        .maybeSingle();

      if (error) {
        throw new Error(`Database token check failed: ${error.message}`);
      }

      if (!data) {
        return token;
      }
    } catch {
      const rows = await localRead();
      if (!rows.some((row) => row.token === token)) {
        return token;
      }
    }
  }

  throw new Error("Unable to generate a unique private greeting token.");
}

export async function createGreeting(title: string, data: Record<string, unknown>): Promise<{ token: string }> {
  const token = await generateUniqueToken();

  if (useLocalStore()) {
    const rows = await localRead();
    rows.push({ token, title, data, created_at: new Date().toISOString() });
    await localWrite(rows);
    return { token };
  }

  try {
    const supabase = supabaseAdmin();
    const { error } = await supabase.from("greetings").insert({ token, title, data });
    if (error) {
      throw new Error(`Database publish failed: ${error.message}`);
    }
    return { token };
  } catch (err) {
    if (process.env.CHERIVO_LOCAL_STORE !== "false") {
      const rows = await localRead();
      rows.push({ token, title, data, created_at: new Date().toISOString() });
      await localWrite(rows);
      return { token };
    }
    throw err;
  }
}

export async function getGreeting(token: string): Promise<StoredGreeting | null> {
  if (useLocalStore()) {
    const rows = await localRead();
    return rows.find((row) => row.token === token) ?? null;
  }

  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("greetings")
      .select("token,title,data,created_at")
      .eq("token", token)
      .maybeSingle();

    if (error) {
      throw new Error(`Database read failed: ${error.message}`);
    }

    if (data) return data;
  } catch (err) {
    if (process.env.CHERIVO_LOCAL_STORE !== "false") {
      const rows = await localRead();
      const match = rows.find((row) => row.token === token);
      if (match) return match;
    }
    throw err;
  }

  if (process.env.CHERIVO_LOCAL_STORE !== "false") {
    const rows = await localRead();
    return rows.find((row) => row.token === token) ?? null;
  }

  return null;
}
