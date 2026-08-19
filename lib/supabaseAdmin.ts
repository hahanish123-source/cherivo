import "server-only";
import { createClient } from "@supabase/supabase-js";

export function isLocalDevelopmentFallbackEnabled() {
  return process.env.NODE_ENV !== "production" && process.env.CHERIVO_LOCAL_STORE !== "false";
}

export function getSupabaseRuntimeDiagnostics() {
  return {
    "SUPABASE_URL present": Boolean(process.env.SUPABASE_URL),
    "SUPABASE_SERVICE_ROLE_KEY present": Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    NODE_ENV: process.env.NODE_ENV ?? "undefined",
    VERCEL_ENV: process.env.VERCEL_ENV ?? "undefined",
    localDevelopmentFallbackEnabled: isLocalDevelopmentFallbackEnabled(),
  };
}

export function logSupabaseRuntimeDiagnostics(label: string) {
  console.info(label, getSupabaseRuntimeDiagnostics());
}

export function getSupabaseAdminConfig() {
  if (isLocalDevelopmentFallbackEnabled()) {
    return { url: "", serviceRoleKey: "", localFallback: true };
  }

  const url = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    const error = new Error(
      "Hanora is missing its production database configuration. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel environment variables, then redeploy."
    ) as Error & { code?: string };
    error.code = "missing_supabase_config";
    throw error;
  }

  return { url, serviceRoleKey, localFallback: false };
}

export function supabaseAdmin() {
  try {
    const { url, serviceRoleKey, localFallback } = getSupabaseAdminConfig();

    if (localFallback) {
      const error = new Error(
        "Local development mode is using the file-backed greeting store. Supabase is not required."
      ) as Error & { code?: string };
      error.code = "local_supabase_fallback";
      throw error;
    }

    return createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  } catch (error) {
    const normalized = error as Error & { code?: string };
    if (normalized?.code === "missing_supabase_config" || normalized?.code === "local_supabase_fallback") {
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
  if (code === "missing_supabase_config" || code === "local_supabase_fallback") {
    return true;
  }

  const message = error instanceof Error ? error.message : String(error ?? "");
  return /SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY|missing its production database configuration|file-backed greeting store/i.test(message);
}
