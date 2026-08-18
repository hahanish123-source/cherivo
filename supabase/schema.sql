-- Cherivo production database
create extension if not exists pgcrypto;

create table if not exists public.greetings (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  title text not null default 'Cherivo moment',
  data jsonb not null,
  created_at timestamptz not null default now()
);

-- The browser must never query this table directly.
-- The Next.js server uses SUPABASE_SERVICE_ROLE_KEY to read/write it.
alter table public.greetings enable row level security;

drop policy if exists "deny public greeting access" on public.greetings;
create policy "deny public greeting access"
  on public.greetings for all
  using (false)
  with check (false);

create index if not exists greetings_token_idx on public.greetings(token);
