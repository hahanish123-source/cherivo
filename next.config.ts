import type { NextConfig } from "next";

const resolvedSupabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEW_SUPABASE_PROJECT_URL ||
  process.env.next_public_supabase_url ||
  process.env.SUPABASE_URL ||
  "";

const resolvedSupabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_SUPABASE_ANON_KEY ||
  process.env.next_public_supabase_anon_key ||
  process.env.SUPABASE_ANON_KEY ||
  "";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: resolvedSupabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: resolvedSupabaseAnonKey,
    NEW_SUPABASE_PROJECT_URL: resolvedSupabaseUrl,
    NEXT_SUPABASE_ANON_KEY: resolvedSupabaseAnonKey
  }
};

export default nextConfig;