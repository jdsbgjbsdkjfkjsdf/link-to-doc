# Reading Inbox

A **Supabase-first** reading list: paste URLs to save articles, get auto title/summary/read time, and manage Unread vs Read with instant toggles. Built with Next.js, Supabase, and Tailwind.

## Features

- **Add link** — Paste a URL; the app fetches title and description, cleans the title, and computes a one-line summary (OpenAI fallback when metadata is missing or useless) and read time (words / 220).
- **Unread / Read / Today** — Three lists (tabs). Mark items read/unread; add/remove from **Today** queue; reorder Today with move up/down.
- **Today queue** — A shortlist of links you want to focus on today. Items can be in Today and Unread or Today and Read; marking read/unread does not change Today. Delete removes from everywhere.
- **Counters** — Unread, Read, and Today counts at the top.
- **Search** — By title or URL (debounced 300ms); sort is newest first (or by Today order in the Today tab).
- **Per link** — Copy, Mark read/unread, Add to Today / Remove from Today, Delete (with confirm).

## Local development

1. **Supabase**
   - Create a project at [supabase.com](https://supabase.com).
   - In the SQL Editor, run **in order**: (1) `supabase/schema.sql`, then (2) `supabase/migrations/001_today_queue.sql`.
   - In Project Settings → API: copy **Project URL**, **anon public** key, and **service_role** key.

2. **Env**
   ```bash
   cp .env.example .env.local
   ```
   Set in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` — Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon public key
   - `SUPABASE_SERVICE_ROLE_KEY` — service_role key (server-only)
   - `OPENAI_API_KEY` — optional; used for one-line summary when metadata is missing/useless

3. **Run**
   ```bash
   npm install
   npm run dev
   ```
   Or on port 3001 (if 3000 is in use): `npm run dev:3001` or `npm run dev -- -p 3001`.  
   If 3001 is already in use (EADDRINUSE), run `npm run dev:3002` or `npm run dev:any` (Next picks a free port).

   Open the URL shown in the terminal (e.g. [http://localhost:3000](http://localhost:3000), 3001, 3002, or the port from `dev:any`).

   **Verify:** `curl http://localhost:<port>/api/health` (use the port you started; expect `ok: true` when Supabase is configured).

### Local Setup Checklist

- [ ] Copy `.env.example` to `.env.local`
- [ ] Fill the 3 Supabase vars from **Project Settings → API** (Project URL, anon public key, service_role key)
- [ ] Run `supabase/schema.sql` then `supabase/migrations/001_today_queue.sql` in the Supabase SQL Editor
- [ ] Restart the dev server (`Ctrl+C` then `npm run dev`, `npm run dev:3001`, `npm run dev:3002`, or `npm run dev:any`)
- [ ] Run `npm run check:env` (expect: ✅ Supabase env vars detected.)
- [ ] Visit `/api/health` (expect: `ok: true`, `db: { ok: true }`)

### Local development setup (quick reference)

1. Copy `.env.example` to `.env.local`
2. Fill in Supabase keys from **Project Settings → API** (URL, anon key, service_role key)
3. Restart the dev server after changing env vars (`Ctrl+C` then `npm run dev`)

## Database schema

1. Run **`supabase/schema.sql`** in the Supabase SQL Editor (creates `links` table, indexes, RLS).
2. Run **`supabase/migrations/001_today_queue.sql`** (adds `is_today`, `today_rank`, Today index, delete policy).

- **`links`** — `id`, `url` (unique), `domain`, `title`, `summary`, `description`, `read_time_minutes`, `is_read`, `created_at`, `read_at`, `is_today`, `today_rank`
- **Today queue** — `is_today` flags items in the Today list; `today_rank` defines order (lower = first).

## Env reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon (public) key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-only; used by API routes). |
| `OPENAI_API_KEY` | No | Used to generate a one-line summary when the page has no or useless meta description. |
| `OPENAI_MODEL` | No | Model for summary (default: `gpt-4o-mini`). |

## API

- **GET /api/health** — Health check: `ok`, `db`, `openai`, `env`. Returns 500 if DB is unreachable.
- **POST /api/links** — Body: `{ url }`. Normalizes URL, fetches metadata + HTML, derives summary and read time, upserts into `links`. Returns `{ ok, link }`.
- **GET /api/links** — Query: `is_read=true|false`, `is_today=true`, `query=...`. Returns `{ ok, links }` (newest first, or by `today_rank` when `is_today=true`).
- **POST /api/links/:id/toggle** — Body: `{ is_read }`. Updates `is_read` and `read_at`. Returns `{ ok, link }`.
- **POST /api/links/:id/today** — Body: `{ is_today }`. Adds/removes from Today queue; sets `today_rank` when adding. Returns `{ ok, link }`.
- **POST /api/links/:id/today-move** — Body: `{ direction: "up"|"down" }`. Reorders within Today. Returns `{ ok, link }`.
- **DELETE /api/links/:id** — Deletes the link. Returns `{ ok: true }`.
- **GET /api/stats** — Returns `{ ok, unreadCount, readCount, todayCount }`.

## Production build

```bash
npm install
npm run build
npm start
```

For deployment (e.g. Vercel), see **[DEPLOY.md](./DEPLOY.md)** for env vars and post-deploy verification.
