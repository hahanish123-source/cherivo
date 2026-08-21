-- Hanora production database
create extension if not exists pgcrypto;

create table if not exists public.greetings (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  title text not null default 'Hanora moment',
  data jsonb not null,
  user_id text,
  target_event_date text,
  reminder_date text,
  created_at timestamptz not null default now()
);

-- Recipient responses & reactions
create table if not exists public.greeting_responses (
  id uuid primary key default gen_random_uuid(),
  token text not null references public.greetings(token) on delete cascade,
  sender_name text,
  message text not null,
  emojis jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- User drafts with event & reminder dates
create table if not exists public.greeting_drafts (
  id text primary key,
  user_id text not null,
  title text not null default 'Untitled draft',
  target_event_date text,
  reminder_date text,
  target_event_title text,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.greetings enable row level security;
alter table public.greeting_responses enable row level security;
alter table public.greeting_drafts enable row level security;

drop policy if exists "allow server side greeting access" on public.greetings;
create policy "allow server side greeting access"
  on public.greetings for all
  using (true)
  with check (true);

drop policy if exists "allow server side response access" on public.greeting_responses;
create policy "allow server side response access"
  on public.greeting_responses for all
  using (true)
  with check (true);

drop policy if exists "allow server side drafts access" on public.greeting_drafts;
create policy "allow server side drafts access"
  on public.greeting_drafts for all
  using (true)
  with check (true);

create index if not exists greetings_token_idx on public.greetings(token);
create index if not exists greetings_responses_token_idx on public.greeting_responses(token);
create index if not exists greeting_drafts_user_idx on public.greeting_drafts(user_id);

-- Private greeting media is uploaded by the Next.js server with the service role
-- and delivered to recipients through short-lived signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('hanora-media', 'hanora-media', false, 52428800, array['audio/mpeg', 'video/mp4', 'video/webm', 'video/quicktime', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "hanora media server read" on storage.objects;
drop policy if exists "hanora media server insert" on storage.objects;
drop policy if exists "hanora media server update" on storage.objects;
drop policy if exists "hanora media server delete" on storage.objects;

-- These policies document the intended boundary. The server's service-role
-- client bypasses RLS; browser clients never receive that key.
create policy "hanora media server read"
  on storage.objects for select to service_role
  using (bucket_id = 'hanora-media');

create policy "hanora media server insert"
  on storage.objects for insert to service_role
  with check (bucket_id = 'hanora-media');

create policy "hanora media server update"
  on storage.objects for update to service_role
  using (bucket_id = 'hanora-media')
  with check (bucket_id = 'hanora-media');

create policy "hanora media server delete"
  on storage.objects for delete to service_role
  using (bucket_id = 'hanora-media');
