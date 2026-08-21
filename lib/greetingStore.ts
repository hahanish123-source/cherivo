import fs from "node:fs/promises";
import path from "node:path";
import { randomBytes, randomUUID } from "node:crypto";
import { supabaseAdmin } from "./supabaseAdmin";
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

const localDir = path.join(process.cwd(), ".cherivo-local");
const localGreetingsFile = path.join(localDir, "greetings.json");
const localResponsesFile = path.join(localDir, "responses.json");
const localDraftsFile = path.join(localDir, "drafts.json");

async function localRead<T>(file: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(file, "utf8");
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

async function localWrite<T>(file: string, rows: T[]) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(rows, null, 2), "utf8");
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

    if (useLocalStore()) {
      const rows = await localRead<StoredGreeting>(localGreetingsFile);
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
      const rows = await localRead<StoredGreeting>(localGreetingsFile);
      if (!rows.some((row) => row.token === token)) {
        return token;
      }
    }
  }

  throw new Error("Unable to generate a unique private greeting token.");
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
    created_at: new Date().toISOString()
  };

  if (useLocalStore()) {
    const rows = await localRead<StoredGreeting>(localGreetingsFile);
    rows.push(row);
    await localWrite(localGreetingsFile, rows);
    return { token };
  }

  try {
    const supabase = supabaseAdmin();
    const { error } = await supabase.from("greetings").insert(row);
    if (error) {
      throw new Error(`Database publish failed: ${error.message}`);
    }
    return { token };
  } catch (err) {
    if (process.env.CHERIVO_LOCAL_STORE !== "false") {
      const rows = await localRead<StoredGreeting>(localGreetingsFile);
      rows.push(row);
      await localWrite(localGreetingsFile, rows);
      return { token };
    }
    throw err;
  }
}

export async function getGreeting(token: string): Promise<StoredGreeting | null> {
  if (useLocalStore()) {
    const rows = await localRead<StoredGreeting>(localGreetingsFile);
    return rows.find((row) => row.token === token) ?? null;
  }

  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("greetings")
      .select("token,title,data,user_id,target_event_date,reminder_date,created_at")
      .eq("token", token)
      .maybeSingle();

    if (error) {
      throw new Error(`Database read failed: ${error.message}`);
    }

    if (data) return data;
  } catch (err) {
    if (process.env.CHERIVO_LOCAL_STORE !== "false") {
      const rows = await localRead<StoredGreeting>(localGreetingsFile);
      const match = rows.find((row) => row.token === token);
      if (match) return match;
    }
    throw err;
  }

  if (process.env.CHERIVO_LOCAL_STORE !== "false") {
    const rows = await localRead<StoredGreeting>(localGreetingsFile);
    return rows.find((row) => row.token === token) ?? null;
  }

  return null;
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
    createdAt: new Date().toISOString()
  };

  if (useLocalStore()) {
    const rows = await localRead<GreetingResponse>(localResponsesFile);
    rows.push(item);
    await localWrite(localResponsesFile, rows);
    return item;
  }

  try {
    const supabase = supabaseAdmin();
    const { error } = await supabase.from("greeting_responses").insert({
      id: item.id,
      token: item.token,
      sender_name: item.senderName,
      message: item.message,
      emojis: item.emojis,
      created_at: item.createdAt
    });
    if (error) throw new Error(error.message);
    return item;
  } catch (err) {
    const rows = await localRead<GreetingResponse>(localResponsesFile);
    rows.push(item);
    await localWrite(localResponsesFile, rows);
    return item;
  }
}

export async function getGreetingResponses(token: string): Promise<GreetingResponse[]> {
  if (useLocalStore()) {
    const rows = await localRead<GreetingResponse>(localResponsesFile);
    return rows.filter((r) => r.token === token);
  }

  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("greeting_responses")
      .select("id,token,sender_name,message,emojis,created_at")
      .eq("token", token)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map((row: any) => ({
      id: row.id,
      token: row.token,
      senderName: row.sender_name,
      message: row.message,
      emojis: row.emojis,
      createdAt: row.created_at
    }));
  } catch {
    const rows = await localRead<GreetingResponse>(localResponsesFile);
    return rows.filter((r) => r.token === token);
  }
}

export async function saveDraftRecord(draft: GreetingDraft): Promise<GreetingDraft> {
  const updated: GreetingDraft = {
    ...draft,
    id: draft.id || randomUUID(),
    updatedAt: new Date().toISOString()
  };

  if (useLocalStore()) {
    const rows = await localRead<GreetingDraft>(localDraftsFile);
    const idx = rows.findIndex((r) => r.id === updated.id);
    if (idx >= 0) rows[idx] = updated;
    else rows.unshift(updated);
    await localWrite(localDraftsFile, rows);
    return updated;
  }

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
      updated_at: updated.updatedAt
    });
    if (error) throw new Error(error.message);
    return updated;
  } catch {
    const rows = await localRead<GreetingDraft>(localDraftsFile);
    const idx = rows.findIndex((r) => r.id === updated.id);
    if (idx >= 0) rows[idx] = updated;
    else rows.unshift(updated);
    await localWrite(localDraftsFile, rows);
    return updated;
  }
}

export async function getDraftRecords(userId: string): Promise<GreetingDraft[]> {
  if (useLocalStore()) {
    const rows = await localRead<GreetingDraft>(localDraftsFile);
    return rows.filter((r) => !userId || r.userId === userId || r.userId === "anonymous");
  }

  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("greeting_drafts")
      .select("id,user_id,title,target_event_date,reminder_date,target_event_title,data,updated_at")
      .or(`user_id.eq.${userId},user_id.eq.anonymous`)
      .order("updated_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      targetEventDate: row.target_event_date,
      reminderDate: row.reminder_date,
      targetEventTitle: row.target_event_title,
      project: row.data,
      updatedAt: row.updated_at
    }));
  } catch {
    const rows = await localRead<GreetingDraft>(localDraftsFile);
    return rows.filter((r) => !userId || r.userId === userId || r.userId === "anonymous");
  }
}

export async function deleteDraftRecord(draftId: string, userId?: string): Promise<{ deleted: boolean; deletedMediaCount: number }> {
  let draftToDelete: GreetingDraft | null = null;

  const rows = await localRead<GreetingDraft>(localDraftsFile);
  const foundIdx = rows.findIndex((r) => r.id === draftId);
  if (foundIdx >= 0) {
    draftToDelete = rows[foundIdx];
    rows.splice(foundIdx, 1);
    await localWrite(localDraftsFile, rows);
  }

  if (!useLocalStore()) {
    try {
      const supabase = supabaseAdmin();
      const { data } = await supabase.from("greeting_drafts").select("data").eq("id", draftId).maybeSingle();
      if (data?.data && !draftToDelete) {
        draftToDelete = { id: draftId, title: "", updatedAt: "", project: data.data };
      }
      await supabase.from("greeting_drafts").delete().eq("id", draftId);
    } catch (err) {
      console.warn("Supabase draft delete warning:", err);
    }
  }

  let deletedMediaCount = 0;
  if (draftToDelete?.project) {
    const mediaPaths = extractMediaPaths(draftToDelete.project as unknown as Record<string, unknown>);
    if (mediaPaths.length > 0) {
      await deleteGreetingMediaPaths(mediaPaths);
      deletedMediaCount = mediaPaths.length;
    }
  }

  return { deleted: true, deletedMediaCount };
}
