# Reading Inbox

A **Supabase-first** reading list: paste URLs to save articles, get auto title/summary/read time, and manage Unread vs Read with instant toggles. Built with Next.js, Supabase, and Tailwind.

## Features

- **Add link** — Paste a URL; the app fetches title and description, cleans the title, and computes a one-line summary (OpenAI fallback when metadata is missing or useless) and read time (words / 220).
- **Unread / Read** — Two lists with tabs; mark items read/unread from the UI (instant).
- **Counters** — Unread and Read counts at the top.
- **Search** — By title or URL (debounced); sort is newest first.
- **Copy link** — Small copy icon on each card.

## Local development

1. **Supabase**
   - Create a project at [supabase.com](https://supabase.com).
   - In the SQL Editor, run the schema: paste the contents of `supabase/schema.sql`.
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
   Open [http://localhost:3000](http://localhost:3000).

### Local development setup (quick reference)

1. Copy `.env.example` to `.env.local`
2. Fill in Supabase keys from **Project Settings → API** (URL, anon key, service_role key)
3. Restart the dev server after changing env vars (`Ctrl+C` then `npm run dev`)

## Database schema

Run `supabase/schema.sql` in the Supabase SQL Editor. It creates:

- **`links`** — `id`, `url` (unique), `domain`, `title`, `summary`, `description`, `read_time_minutes`, `is_read`, `created_at`, `read_at`
- Indexes on `created_at desc` and `(is_read, created_at desc)`
- RLS enabled with permissive policies so the app works without auth (MVP).

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
- **GET /api/links** — Query: `is_read=true|false`, `query=...`. Returns `{ ok, links }` (newest first).
- **POST /api/links/:id/toggle** — Body: `{ is_read }`. Updates `is_read` and `read_at`. Returns `{ ok, link }`.
- **GET /api/stats** — Returns `{ ok, unreadCount, readCount }`.

## Production build

```bash
npm install
npm run build
npm start
```

For deployment (e.g. Vercel), see **[DEPLOY.md](./DEPLOY.md)** for env vars and post-deploy verification.
