import "server-only";
import { createClient } from "@supabase/supabase-js";

export function getSupabaseRuntimeDiagnostics() {
  return {
    "SUPABASE_URL present": Boolean(process.env.SUPABASE_URL),
    "SUPABASE_SERVICE_ROLE_KEY present": Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    NODE_ENV: process.env.NODE_ENV ?? "undefined",
    VERCEL_ENV: process.env.VERCEL_ENV ?? "undefined",
  };
}

export function logSupabaseRuntimeDiagnostics(label: string) {
  console.info(label, getSupabaseRuntimeDiagnostics());
}

export function getSupabaseAdminConfig() {
  const url = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    const error = new Error(
      "Hanora is missing its production database configuration. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel environment variables, then redeploy."
    ) as Error & { code?: string };
    error.code = "missing_supabase_config";
    throw error;
  }

  return { url, serviceRoleKey };
}

export function supabaseAdmin() {
  try {
    const { url, serviceRoleKey } = getSupabaseAdminConfig();

    return createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  } catch (error) {
    const normalized = error as Error & { code?: string };
    if (normalized?.code === "missing_supabase_config") {
      throw error;
    }

    const wrapped = new Error(
      "Supabase client initialization failed. Check the server environment and Supabase project configuration."
    ) as Error & { code?: string };
    wrapped.code = "supabase_client_init_failed";
    throw wrapped;
  }
}

export function isMissingSupabaseConfigError(error: unknown) {
  const code = (error as { code?: string } | null)?.code;
  if (code === "missing_supabase_config") {
    return true;
  }

  const message = error instanceof Error ? error.message : String(error ?? "");
  return /SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY|missing its production database configuration/i.test(message);
}
