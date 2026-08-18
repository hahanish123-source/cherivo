
import fs from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { supabaseAdmin } from "./supabaseAdmin";

export type StoredGreeting = {
  token: string;
  title: string;
  data: any;
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
  return process.env.NODE_ENV !== "production" && process.env.CHERIVO_LOCAL_STORE !== "false";
}

export async function createGreeting(title: string, data: any) {
  const token = randomBytes(32).toString("base64url");
  if (useLocalStore()) {
    const rows = await localRead();
    rows.push({ token, title, data, created_at: new Date().toISOString() });
    await localWrite(rows);
    return { token };
  }

  const supabase = supabaseAdmin();
  const { error } = await supabase.from("greetings").insert({ token, title, data });
  if (error) throw new Error(`Database publish failed: ${error.message}`);
  return { token };
}

export async function getGreeting(token: string) {
  if (useLocalStore()) {
    const rows = await localRead();
    return rows.find((r) => r.token === token) ?? null;
  }

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("greetings")
    .select("token,title,data,created_at")
    .eq("token", token)
    .maybeSingle();

  if (error) throw new Error(`Database read failed: ${error.message}`);
  return data ?? null;
}
