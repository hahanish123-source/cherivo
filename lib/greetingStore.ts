import fs from "node:fs/promises";
import path from "node:path";
import { randomBytes, randomUUID } from "node:crypto";
import { supabaseAdmin, getSupabaseCredentials } from "./supabaseAdmin";
import type { GreetingDraft, GreetingResponse } from "./types";
import { deleteGreetingMediaPaths } from "./greetingMedia";

export type StoredGreeting = {
  token: string;
  title: string;
  data: Record<string, unknown>;
  user_id?: string;
  target_event_date?: string;
  reminder_date?: string;
  created_at?: string;
};

// Global in-memory storage fallback for serverless / read-only environments
declare global {
  // eslint-disable-next-line no-var
  var __hanoraMemoryStore:
    | {
        greetings: Map<string, StoredGreeting>;
        drafts: Map<string, GreetingDraft>;
        responses: Map<string, GreetingResponse[]>;
      }
    | undefined;
}

function getMemoryStore() {
  if (!globalThis.__hanoraMemoryStore) {
    globalThis.__hanoraMemoryStore = {
      greetings: new Map(),
      drafts: new Map(),
      responses: new Map(),
    };
  }
  return globalThis.__hanoraMemoryStore;
}

const localDir = path.join(process.cwd(), ".cherivo-local");
const localGreetingsFile = path.join(localDir, "greetings.json");
const localResponsesFile = path.join(localDir, "responses.json");
const localDraftsFile = path.join(localDir, "drafts.json");

async function safeLocalRead<T>(file: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(file, "utf8");
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

async function safeLocalWrite<T>(file: string, rows: T[]) {
  try {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(rows, null, 2), "utf8");
  } catch (err: any) {
    // If the filesystem is read-only (e.g. Vercel serverless /var/task), silently fail or use memory store
    console.warn(`[Hanora Storage] Local filesystem write bypassed (${err?.code || err?.message})`);
  }
}

function isSupabaseAvailable() {
  const { hasValidSupabase } = getSupabaseCredentials();
  return hasValidSupabase;
}

export function extractMediaPaths(project: Record<string, unknown>): string[] {
  const paths = new Set<string>();
  const addPath = (val: any) => {
    if (!val) return;
    if (typeof val === "object" && val.storage === "supabase" && typeof val.path === "string") {
      paths.add(val.path);
    }
  };

  addPath(project.audioUrl);
  addPath(project.customBg);

  if (Array.isArray(project.blocks)) {
    for (const b of project.blocks) {
      if (!b || typeof b !== "object") continue;
      addPath(b.audioUrl);
      addPath(b.memoryVideo);
      addPath(b.secretVideo);
      addPath(b.customBg);
      if (Array.isArray(b.images)) {
        b.images.forEach(addPath);
      }
    }
  }
  return Array.from(paths);
}

async function generateUniqueToken(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const token = randomBytes(32).toString("hex");

    if (isSupabaseAvailable()) {
      try {
        const supabase = supabaseAdmin();
        const { data, error } = await supabase
          .from("greetings")
          .select("token")
          .eq("token", token)
          .maybeSingle();

        if (!error && !data) {
          return token;
        }
      } catch {
        // Continue fallback check
      }
    }

    const memStore = getMemoryStore();
    if (!memStore.greetings.has(token)) {
      const rows = await safeLocalRead<StoredGreeting>(localGreetingsFile);
      if (!rows.some((row) => row.token === token)) {
        return token;
      }
    }
  }

  return randomBytes(32).toString("hex");
}

export async function createGreeting(
  title: string,
  data: Record<string, unknown>,
  options?: { userId?: string; targetEventDate?: string; reminderDate?: string }
): Promise<{ token: string }> {
  const token = await generateUniqueToken();
  const row: StoredGreeting = {
    token,
    title,
    data,
    user_id: options?.userId,
    target_event_date: options?.targetEventDate,
    reminder_date: options?.reminderDate,
    created_at: new Date().toISOString(),
  };

  // 1. Primary: Save to Supabase
  if (isSupabaseAvailable()) {
    try {
      const supabase = supabaseAdmin();
      const { error } = await supabase.from("greetings").insert(row);
      if (error) {
        console.error("Supabase insert greeting error:", error.message);
        throw new Error(`Database publish failed: ${error.message}`);
      }
      return { token };
    } catch (err: any) {
      console.warn("Supabase greeting insert failed, falling back safely:", err?.message);
      if (process.env.NODE_ENV === "production" && !process.env.VERCEL) {
        throw err;
      }
    }
  }

  // 2. Fallback: In-memory & Safe Local File
  const memStore = getMemoryStore();
  memStore.greetings.set(token, row);

  const rows = await safeLocalRead<StoredGreeting>(localGreetingsFile);
  rows.push(row);
  await safeLocalWrite(localGreetingsFile, rows);

  return { token };
}

export async function getGreeting(token: string): Promise<StoredGreeting | null> {
  // 1. Primary: Read from Supabase
  if (isSupabaseAvailable()) {
    try {
      const supabase = supabaseAdmin();
      const { data, error } = await supabase
        .from("greetings")
        .select("token,title,data,user_id,target_event_date,reminder_date,created_at")
        .eq("token", token)
        .maybeSingle();

      if (!error && data) {
        return data as StoredGreeting;
      }
    } catch (err) {
      console.warn("Supabase getGreeting error, checking fallback:", err);
    }
  }

  // 2. Fallback: In-memory & Safe Local File
  const memStore = getMemoryStore();
  if (memStore.greetings.has(token)) {
    return memStore.greetings.get(token) || null;
  }

  const rows = await safeLocalRead<StoredGreeting>(localGreetingsFile);
  const match = rows.find((row) => row.token === token);
  return match ?? null;
}

export async function saveGreetingResponse(
  token: string,
  response: { senderName?: string; message: string; emojis?: string[] }
): Promise<GreetingResponse> {
  const item: GreetingResponse = {
    id: randomUUID(),
    token,
    senderName: response.senderName?.trim() || "Someone Special",
    message: response.message.trim(),
    emojis: Array.isArray(response.emojis) ? response.emojis : ["💖"],
    createdAt: new Date().toISOString(),
  };

  // 1. Primary: Save to Supabase
  if (isSupabaseAvailable()) {
    try {
      const supabase = supabaseAdmin();
      const { error } = await supabase.from("greeting_responses").insert({
        id: item.id,
        token: item.token,
        sender_name: item.senderName,
        message: item.message,
        emojis: item.emojis,
        created_at: item.createdAt,
      });
      if (!error) return item;
    } catch (err) {
      console.warn("Supabase save response error, fallback saving:", err);
    }
  }

  // 2. Fallback: In-memory & Safe Local File
  const memStore = getMemoryStore();
  const existing = memStore.responses.get(token) || [];
  existing.unshift(item);
  memStore.responses.set(token, existing);

  const rows = await safeLocalRead<GreetingResponse>(localResponsesFile);
  rows.push(item);
  await safeLocalWrite(localResponsesFile, rows);

  return item;
}

export async function getGreetingResponses(token: string): Promise<GreetingResponse[]> {
  // 1. Primary: Read from Supabase
  if (isSupabaseAvailable()) {
    try {
      const supabase = supabaseAdmin();
      const { data, error } = await supabase
        .from("greeting_responses")
        .select("id,token,sender_name,message,emojis,created_at")
        .eq("token", token)
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        return data.map((row: any) => ({
          id: row.id,
          token: row.token,
          senderName: row.sender_name,
          message: row.message,
          emojis: row.emojis,
          createdAt: row.created_at,
        }));
      }
    } catch (err) {
      console.warn("Supabase getGreetingResponses error, fallback checking:", err);
    }
  }

  // 2. Fallback: In-memory & Safe Local File
  const memStore = getMemoryStore();
  if (memStore.responses.has(token)) {
    return memStore.responses.get(token) || [];
  }

  const rows = await safeLocalRead<GreetingResponse>(localResponsesFile);
  return rows.filter((r) => r.token === token);
}

export async function saveDraftRecord(draft: GreetingDraft): Promise<GreetingDraft> {
  const updated: GreetingDraft = {
    ...draft,
    id: draft.id || randomUUID(),
    updatedAt: new Date().toISOString(),
  };

  // 1. Primary: Save to Supabase
  if (isSupabaseAvailable()) {
    try {
      const supabase = supabaseAdmin();
      const { error } = await supabase.from("greeting_drafts").upsert({
        id: updated.id,
        user_id: updated.userId || "anonymous",
        title: updated.title,
        target_event_date: updated.targetEventDate,
        reminder_date: updated.reminderDate,
        target_event_title: updated.targetEventTitle,
        data: updated.project,
        updated_at: updated.updatedAt,
      });
      if (!error) {
        return updated;
      }
      console.warn("Supabase save draft error:", error.message);
    } catch (err) {
      console.warn("Supabase save draft exception:", err);
    }
  }

  // 2. Fallback: In-memory & Safe Local File
  const memStore = getMemoryStore();
  memStore.drafts.set(updated.id, updated);

  const rows = await safeLocalRead<GreetingDraft>(localDraftsFile);
  const idx = rows.findIndex((r) => r.id === updated.id);
  if (idx >= 0) rows[idx] = updated;
  else rows.unshift(updated);
  await safeLocalWrite(localDraftsFile, rows);

  return updated;
}

export async function getDraftRecords(userId: string): Promise<GreetingDraft[]> {
  // 1. Primary: Read from Supabase
  if (isSupabaseAvailable()) {
    try {
      const supabase = supabaseAdmin();
      let query = supabase
        .from("greeting_drafts")
        .select("id,user_id,title,target_event_date,reminder_date,target_event_title,data,updated_at");

      if (userId && userId !== "anonymous") {
        query = query.eq("user_id", userId);
      } else {
        query = query.eq("user_id", "anonymous");
      }

      const { data, error } = await query.order("updated_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        return data.map((row: any) => ({
          id: row.id,
          userId: row.user_id,
          title: row.title,
          targetEventDate: row.target_event_date,
          reminderDate: row.reminder_date,
          targetEventTitle: row.target_event_title,
          project: row.data,
          updatedAt: row.updated_at,
        }));
      }
    } catch (err) {
      console.warn("Supabase getDraftRecords exception:", err);
    }
  }

  // 2. Fallback: In-memory & Safe Local File
  const memStore = getMemoryStore();
  const memoryDrafts = Array.from(memStore.drafts.values()).filter(
    (d) => !userId || d.userId === userId || (!d.userId && userId === "anonymous")
  );

  const rows = await safeLocalRead<GreetingDraft>(localDraftsFile);
  const fileDrafts = rows.filter(
    (r) => !userId || r.userId === userId || (!r.userId && userId === "anonymous")
  );

  const mergedMap = new Map<string, GreetingDraft>();
  for (const d of [...memoryDrafts, ...fileDrafts]) {
    mergedMap.set(d.id, d);
  }

  return Array.from(mergedMap.values()).sort(
    (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
  );
}

export async function deleteDraftRecord(
  draftId: string,
  userId?: string
): Promise<{ deleted: boolean; deletedMediaCount: number }> {
  let draftToDelete: GreetingDraft | null = null;

  // Check in-memory store
  const memStore = getMemoryStore();
  if (memStore.drafts.has(draftId)) {
    draftToDelete = memStore.drafts.get(draftId) || null;
    memStore.drafts.delete(draftId);
  }

  // Check file store
  const rows = await safeLocalRead<GreetingDraft>(localDraftsFile);
  const foundIdx = rows.findIndex((r) => r.id === draftId);
  if (foundIdx >= 0) {
    if (!draftToDelete) draftToDelete = rows[foundIdx];
    rows.splice(foundIdx, 1);
    await safeLocalWrite(localDraftsFile, rows);
  }

  // Check Supabase
  if (isSupabaseAvailable()) {
    try {
      const supabase = supabaseAdmin();
      const { data } = await supabase
        .from("greeting_drafts")
        .select("data")
        .eq("id", draftId)
        .maybeSingle();

      if (data?.data && !draftToDelete) {
        draftToDelete = { id: draftId, title: "", updatedAt: "", project: data.data };
      }

      let deleteQuery = supabase.from("greeting_drafts").delete().eq("id", draftId);
      if (userId && userId !== "anonymous") {
        deleteQuery = deleteQuery.eq("user_id", userId);
      }
      await deleteQuery;
    } catch (err) {
      console.warn("Supabase draft delete warning:", err);
    }
  }

  let deletedMediaCount = 0;
  if (draftToDelete?.project) {
    const mediaPaths = extractMediaPaths(
      draftToDelete.project as unknown as Record<string, unknown>
    );
    if (mediaPaths.length > 0) {
      await deleteGreetingMediaPaths(mediaPaths);
      deletedMediaCount = mediaPaths.length;
    }
  }

  return { deleted: true, deletedMediaCount };
}
