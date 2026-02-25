-- Replace Today queue with Long Reads: rename columns (run after 001_today_queue.sql).

alter table public.links
  rename column is_today to is_long_read;

alter table public.links
  rename column today_rank to long_read_rank;

drop index if exists public.idx_links_is_today_rank;

create index if not exists idx_links_is_long_read_rank
  on public.links (is_long_read, long_read_rank asc nulls last)
  where is_long_read = true;
