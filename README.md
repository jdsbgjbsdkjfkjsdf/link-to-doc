# link-to-doc

Paste a link and it appends to your Google Doc as a **checkbox item** (TODO-style): title (bold, checkbox), one-line summary, and URL (as a link). Built with Next.js.

Each new item in the doc looks like:

- **☐ &lt;TITLE&gt;** (checkbox line — check off when read)
- *&lt;ONE-LINE SUMMARY&gt;* (italic subheadline)
- &lt;URL&gt; (clickable)

Checkbox items in Google Doc with title + 1-line summary + URL. Each entry is one paragraph (soft line breaks), so when you check the box, strikethrough applies to the **entire** entry (title, summary, and URL). Checking the box is manual; appends don’t update previous entries.

The **Articles Read** counter on the app shows how many entries you’ve checked. “Read” is defined as a checked checkbox title line: a list item (bullet/listId) whose text is title-style (bold) and **fully** strikethrough. Random strikethrough or partial strikes elsewhere are not counted.

## Local development

1. Copy env template and add your values:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with real `GOOGLE_SERVICE_ACCOUNT_JSON` and `GOOGLE_DOC_ID`. Never commit `.env.local`.

2. Install and run the dev server:
   ```bash
   npm install
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Production build (local)

Use these exact commands to build and run in production mode locally:

```bash
npm install
npm run build
npm start
```

The app will listen on port 3000 (or `PORT` if set). For production env vars locally: use `.env.production.local` (same variable names as `.env.example`) or export them in the shell. Do not commit `.env.production.local`.

## Deploy to Vercel (public URL)

1. **Push your code** to a Git repo (GitHub, GitLab, or Bitbucket). Ensure no secrets are in the repo — use only `.env.example` as a template; real values go in Vercel.

2. **Import the project in Vercel**
   - Go to [vercel.com](https://vercel.com) and sign in.
   - Click **Add New…** → **Project**.
   - Import your repository (e.g. GitHub) and select the `link-to-doc` repo.
   - Leave **Framework Preset** as Next.js and **Root Directory** as `.`.
   - Do **not** deploy yet.

3. **Set environment variables in Vercel**
   - In the import screen, open **Environment Variables**.
   - Add each variable (for **Production**, and optionally Preview/Development):
     - `GOOGLE_SERVICE_ACCOUNT_JSON` — paste the full service account JSON as a **single-line string** (same as in `.env.local`).
     - `GOOGLE_DOC_ID` — your Google Doc ID.
     - `TZ` (optional) — e.g. `America/New_York` for timestamps.
   - Then click **Deploy**.

4. **After deployment**
   - Vercel will give you a public URL (e.g. `https://your-project.vercel.app`). Use it to paste links from any device; no need to run `npm run dev` locally.

5. **Ongoing updates**
   - Push to your main branch; Vercel will redeploy automatically. Env vars are set in the Vercel dashboard (Project → Settings → Environment Variables), not in the repo.

## Env reference

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Yes | JSON key for a service account with access to the Doc (single-line string). |
| `GOOGLE_DOC_ID` | Yes | ID of the Google Doc (from the URL: `.../d/<GOOGLE_DOC_ID>/edit`). |
| `TZ` | No | Timezone for timestamps (default: `America/New_York`). |
| `OPENAI_API_KEY` | No | If set, used to generate a one-line summary when the page has no or useless meta description. |
| `OPENAI_MODEL` | No | Model for summary (default: `gpt-4o-mini`). |

### Usage

1. Run the app and open the form.
2. Paste a URL and submit. The app fetches the page, extracts title (og:title or `<title>`) and description (og:description or meta description), optionally generates a summary with OpenAI if needed, and appends a checkbox block to your Google Doc.
3. **Dry run**: `POST /api/append` with body `{ "url": "https://example.com", "dryRun": true }` to see the computed `batchUpdate` payload without writing to the doc.

### Example output in the Doc

```
☐ Example Article Title
A concise one-line summary of the page.
https://example.com/article
```

Enable the **Google Docs API** for your Google Cloud project and share the Doc with the service account email (e.g. `...@...iam.gserviceaccount.com`) as an editor.
