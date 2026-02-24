# Deploy to Vercel

## 1. Create Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In the **SQL Editor**, create a new query and paste the full contents of `supabase/schema.sql`. Run it to create the `links` table, indexes, and RLS policies.
3. In **Project Settings → API**, note:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret; server-only)

The **service_role** key must never be exposed to the client. It is only used in API routes on the server (e.g. `getSupabaseAdmin()`). Do not add it to any `NEXT_PUBLIC_*` variable.

## 2. Set Vercel environment variables

In your Vercel project: **Settings → Environment Variables**. Add:

| Variable | Value | Notes |
|----------|--------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Required |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public key | Required |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key | Required; server-only |
| `OPENAI_API_KEY` | Your OpenAI API key | Optional; used for one-line summaries when metadata is missing |

Apply to **Production** (and Preview if you want).

## 3. Deploy

Connect the repo to Vercel and deploy (or push to the connected branch). Vercel will run `npm run build`; ensure all env vars above are set before the first deploy.

## 4. Post-deploy verification

1. **Health check**  
   Open `https://<your-app>.vercel.app/api/health`. You should see:
   - `ok: true`
   - `db: { ok: true }`
   - `env: { hasSupabaseUrl: true, hasAnonKey: true, hasServiceRoleKey: true }`
   - `openai: { configured: true/false }`  
   If `db.ok` is false or status is 500, check Supabase URL and service role key and that the schema was applied.

2. **App flow**  
   - Visit the app root, add a link (paste a URL and click Add link).
   - Confirm the link appears in Unread with title/summary/read time.
   - Click “Mark read” and confirm it moves to the Read tab and counters update.
   - Refresh the page and confirm data persists (Supabase).

## 5. RLS note

The current schema enables RLS with **permissive** policies (read/insert/update for all) so the app works without auth. If you add authentication later, tighten policies to restrict rows by user (e.g. `auth.uid()`).
