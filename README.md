# Reading Inbox

A **Supabase-first** reading list: paste URLs to save articles, get auto title/summary/read time, and manage Unread vs Read with instant toggles. Built with Next.js, Supabase, and Tailwind.

## Features

- **Add link** — Paste a URL; the app fetches title and description, cleans the title, and computes a one-line summary (OpenAI fallback when metadata is missing or useless) and read time (words / 220).
- **Unread / Read / Long Reads** — Three lists (tabs). Mark items read/unread; add/remove from **Long Reads** (articles that take more time); reorder Long Reads with move up/down.
- **Long Reads** — A list of longer articles you want to get through. Items can be in Long Reads and Unread or Long Reads and Read; marking read/unread does not change Long Reads. Delete removes from everywhere.
- **Counters** — Unread, Read, and Long Reads counts at the top.
- **Search** — By title or URL (debounced 300ms); sort is newest first (or by Long Reads order in the Long Reads tab).
- **Per link** — Copy, Mark read/unread, Add to Long Reads / Remove from Long Reads, Delete (with confirm).

## Local development

1. **Supabase**
   - Create a project at [supabase.com](https://supabase.com).
   - In the SQL Editor, run **in order**: (1) `supabase/schema.sql`, (2) `supabase/migrations/001_today_queue.sql`, then (3) `supabase/migrations/002_long_reads.sql`.
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
- [ ] Run `supabase/schema.sql`, then `supabase/migrations/001_today_queue.sql`, then `supabase/migrations/002_long_reads.sql` in the Supabase SQL Editor
- [ ] Restart the dev server (`Ctrl+C` then `npm run dev`, `npm run dev:3001`, `npm run dev:3002`, or `npm run dev:any`)
- [ ] Run `npm run check:env` (expect: ✅ Supabase env vars detected.)
- [ ] Visit `/api/health` (expect: `ok: true`, `db: { ok: true }`)

### Local development setup (quick reference)

1. Copy `.env.example` to `.env.local`
2. Fill in Supabase keys from **Project Settings → API** (URL, anon key, service_role key)
3. Restart the dev server after changing env vars (`Ctrl+C` then `npm run dev`)

## Database schema

1. Run **`supabase/schema.sql`** in the Supabase SQL Editor (creates `links` table, indexes, RLS).
2. Run **`supabase/migrations/001_today_queue.sql`** (adds columns that 002 renames; delete policy).
3. Run **`supabase/migrations/002_long_reads.sql`** (renames to `is_long_read`, `long_read_rank`, Long Reads index).

- **`links`** — `id`, `url` (unique), `domain`, `title`, `summary`, `description`, `read_time_minutes`, `is_read`, `created_at`, `read_at`, `is_long_read`, `long_read_rank`
- **Long Reads** — `is_long_read` flags items in the Long Reads list; `long_read_rank` defines order (lower = first).

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
- **GET /api/links** — Query: `is_read=true|false`, `is_long_read=true`, `query=...`. Returns `{ ok, links }` (newest first, or by `long_read_rank` when `is_long_read=true`).
- **POST /api/links/:id/toggle** — Body: `{ is_read }`. Updates `is_read` and `read_at`. Returns `{ ok, link }`.
- **POST /api/links/:id/long-read** — Body: `{ is_long_read }`. Adds/removes from Long Reads; sets `long_read_rank` when adding. Returns `{ ok, link }`.
- **POST /api/links/:id/long-read-move** — Body: `{ direction: "up"|"down" }`. Reorders within Long Reads. Returns `{ ok, link }`.
- **DELETE /api/links/:id** — Deletes the link. Returns `{ ok: true }`.
- **GET /api/stats** — Returns `{ ok, unreadCount, readCount, longReadCount }`.

## Production build

```bash
npm install
npm run build
npm start
```

For deployment (e.g. Vercel), see **[DEPLOY.md](./DEPLOY.md)** for env vars and post-deploy verification.

## Install on iPhone / Android (PWA)

The app is a Progressive Web App (PWA). You can install it on your home screen for full-screen, app-like use.

- **iPhone (Safari):** Open the app in Safari → tap **Share** → **Add to Home Screen**. Name it “Inbox” (or keep “Reading Inbox”) and add. It opens in standalone mode (no browser chrome).
- **Android (Chrome):** Open the app in Chrome. You may see an **Install app** or **Add to Home screen** prompt; use it. Or tap the menu (⋮) → **Install app** / **Add to Home screen**.
- **Desktop Chrome/Edge:** Use the install icon in the address bar or the “Install App” prompt on the homepage when available.

Icons and manifest are in `public/` and `app/manifest.ts`. To regenerate icons (bold “R” on neutral background), run `npm run generate-icons` (requires `sharp` as dev dependency).
