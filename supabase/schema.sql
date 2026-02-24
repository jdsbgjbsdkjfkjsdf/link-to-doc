-- Run this entire file in Supabase SQL Editor before using the app.
-- Reading Inbox: links table (Dashboard → SQL Editor → New query).

create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  url text unique not null,
  domain text,
  title text,
  summary text,
  description text,
  read_time_minutes int,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists idx_links_created_at_desc
  on public.links (created_at desc);

create index if not exists idx_links_is_read_created_at
  on public.links (is_read, created_at desc);

-- url is unique via constraint above; explicit unique index optional
create unique index if not exists idx_links_url_unique
  on public.links (url);

-- RLS: enable but use permissive policies so app works without auth (MVP).
alter table public.links enable row level security;

-- Allow anon and authenticated to read all (for client if needed later)
create policy "Allow read links"
  on public.links for select
  using (true);

-- Allow anon and authenticated to insert (API uses service role; this is for flexibility)
create policy "Allow insert links"
  on public.links for insert
  with check (true);

-- Allow anon and authenticated to update (e.g. toggle is_read)
create policy "Allow update links"
  on public.links for update
  using (true)
  with check (true);

-- Optional: allow delete (uncomment if you want UI delete)
-- create policy "Allow delete links"
--   on public.links for delete
--   using (true);
