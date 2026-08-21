import { createClient } from "@supabase/supabase-js";

export function getSupabaseCredentials() {
  const url =
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    "";

  const hasValidSupabase =
    (url.startsWith("http://") || url.startsWith("https://")) && key.length > 20;

  return { url, key, hasValidSupabase };
}

export function isLocalDevelopmentFallbackEnabled() {
  const { hasValidSupabase } = getSupabaseCredentials();
  const isProd =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL === "1" ||
    process.env.VERCEL_ENV === "production";

  if (hasValidSupabase && process.env.CHERIVO_LOCAL_STORE !== "true") {
    return false;
  }

  if (isProd && hasValidSupabase) {
    return false;
  }

  // If in production without Supabase, do NOT crash with local write
  return !hasValidSupabase;
}

export function getSupabaseRuntimeDiagnostics() {
  const { url, key, hasValidSupabase } = getSupabaseCredentials();

  return {
    "SUPABASE_URL present": Boolean(url),
    "SUPABASE_URL valid": url.startsWith("http://") || url.startsWith("https://"),
    "SUPABASE_SERVICE_ROLE_KEY present": Boolean(key),
    NODE_ENV: process.env.NODE_ENV ?? "undefined",
    VERCEL_ENV: process.env.VERCEL_ENV ?? "undefined",
    localDevelopmentFallbackEnabled: isLocalDevelopmentFallbackEnabled(),
    hasValidSupabase,
  };
}

export function logSupabaseRuntimeDiagnostics(label: string) {
  console.info(label, getSupabaseRuntimeDiagnostics());
}

export function getSupabaseAdminConfig() {
  const { url, key, hasValidSupabase } = getSupabaseCredentials();

  if (isLocalDevelopmentFallbackEnabled() && !hasValidSupabase) {
    return { url: "", serviceRoleKey: "", localFallback: true };
  }

  if (!hasValidSupabase) {
    const error = new Error(
      "Hanora is missing its production database configuration. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel environment variables, then redeploy."
    ) as Error & { code?: string };
    error.code = "missing_supabase_config";
    throw error;
  }

  return { url, serviceRoleKey: key, localFallback: false };
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
      `Supabase client initialization failed: ${error instanceof Error ? error.message : String(error)}`
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
