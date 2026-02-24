-- Today queue: add is_today and today_rank to links.
-- Run after schema.sql (Supabase SQL Editor: New query, paste, Run).

alter table public.links
  add column if not exists is_today boolean not null default false,
  add column if not exists today_rank int;

create index if not exists idx_links_is_today_rank
  on public.links (is_today, today_rank asc nulls last)
  where is_today = true;

-- Allow delete for API (service role).
create policy "Allow delete links"
  on public.links for delete
  using (true);
