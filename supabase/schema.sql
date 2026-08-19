-- Hanora production database
create extension if not exists pgcrypto;

create table if not exists public.greetings (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  title text not null default 'Hanora moment',
  data jsonb not null,
  created_at timestamptz not null default now()
);

-- The browser must never query this table directly.
-- The Next.js server uses SUPABASE_SERVICE_ROLE_KEY to read/write it.
-- The service-role client bypasses RLS, but the database policy must still allow
-- the server-side insert/select path to work when the app is configured correctly.
alter table public.greetings enable row level security;

drop policy if exists "allow server side greeting access" on public.greetings;
create policy "allow server side greeting access"
  on public.greetings for all
  using (true)
  with check (true);

create index if not exists greetings_token_idx on public.greetings(token);
