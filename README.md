# AI Progress Tracker
🔗 **Live site:** https://aiprogresstracker.org

Track how AI advances across fields through **benchmark charts over time**, built
from curated public benchmark sources, automatically collected arXiv field-popularity
counts, Grand View Research market reports, and Epoch AI benchmark data where available.

- **Frontend:** React + TypeScript + Vite, charts via Recharts
- **Data backend:** Supabase (Postgres + auto REST API) for read-only app data when configured
- **Demo fallback:** bundled read-only data when Supabase env vars are absent
- **Collection:** scripts gather field popularity from arXiv and benchmark data from Epoch AI

## Run locally (demo mode — no setup)

```bash
npm install
npm run dev      # open the printed localhost URL
npm test         # unit tests
npm run build    # type-check + production build
```

With no Supabase keys set, the app runs in **demo mode** with bundled sample data.
Demo mode is only a data-source fallback; the frontend is read-only and does not require
accounts.

## Go live (free) — Supabase + Vercel

### 1. Create the database (Supabase)
1. Create a free project at <https://supabase.com>.
2. In the dashboard: **SQL Editor → New query**, paste `supabase/schema.sql`, run it.
3. New query again, paste `supabase/seed.sql`, run it (once) to load starter data.
4. **Project Settings → API**: copy the **Project URL** and the **anon public** key.

### 2. Configure the app
```bash
cp .env.example .env.local
```
Fill in:
```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```
Run `npm run dev` again. The app now reads verified data from your Supabase database.
The anon key is safe to expose when Row-Level Security policies protect the data.

### 3. Deploy (Vercel)
1. Push this folder to a GitHub repo.
2. At <https://vercel.com>, **Add New → Project**, import the repo (framework auto-detected as Vite).
3. Add the env vars from `.env.local` under **Settings → Environment Variables**.
4. Deploy. `vercel.json` already routes client-side paths to `index.html`.

> CLI alternative: `npm i -g vercel`, then `vercel` in this folder (run `vercel login` yourself first).

## How the data is collected

The public site is read-only. Benchmark rows are curated from linked public sources and
supplemented by the Epoch AI benchmark dataset where available. Popularity is a
research-activity proxy: annual submission counts to each field's main arXiv category.
Market-value rows come from Grand View Research reports, with forecast years and
interpolations noted in the source data.

The Supabase schema still contains dormant auth/submission/voting tables from earlier
versions, but the frontend no longer exposes sign-in, submission, or voting flows.

## Project layout
```
supabase/   schema.sql (database), seed.sql (starter data)
src/
  lib/        types, config, supabaseClient, api (+demo fallback), demoData, format
  components/ Header, charts, cards, ErrorBoundary
  pages/      Home, Field, Benchmark, Compare, About
test/         metric, chart/theme, and data-collection tests
```

## Note on seed data
Starter figures are widely cited but **approximate** reference points, included as
curated rows to bootstrap the charts. Always verify important figures against original
sources.
