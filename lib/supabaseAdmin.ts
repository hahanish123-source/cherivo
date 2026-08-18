import "server-only";
import { createClient } from "@supabase/supabase-js";

export function getSupabaseAdminConfig() {
  const url = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Cherivo is missing its production database configuration. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel environment variables, then redeploy."
    );
  }

  return { url, serviceRoleKey };
}

export function supabaseAdmin() {
  const { url, serviceRoleKey } = getSupabaseAdminConfig();

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export function isMissingSupabaseConfigError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY|missing its production database configuration/i.test(message);
}
