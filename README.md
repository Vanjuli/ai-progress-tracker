# AI Progress Tracker

Track how AI advances across fields through **benchmark charts over time**, built
from data the community **submits and verifies by voting**.

- **Frontend:** React + TypeScript + Vite, charts via Recharts
- **Backend:** Supabase (Postgres + Auth + auto REST API) secured with Row-Level Security
- **Auth:** email magic-link sign-in
- **Verification:** community up/down voting; a Postgres trigger promotes a data
  point to `verified` once its net votes cross a threshold (or `rejected` below the negative)

## Run locally (demo mode — no setup)

```bash
npm install
npm run dev      # open the printed localhost URL
npm test         # unit tests for the verification rules
npm run build    # type-check + production build
```

With no Supabase keys set, the app runs in **demo mode**: bundled sample data, with
your votes/submissions saved in the browser's localStorage so you can try the whole
flow. A "Demo mode" badge appears in the header.

## Go live (free) — Supabase + Vercel

### 1. Create the database (Supabase)
1. Create a free project at <https://supabase.com>.
2. In the dashboard: **SQL Editor → New query**, paste `supabase/schema.sql`, run it.
3. New query again, paste `supabase/seed.sql`, run it (once) to load starter data.
4. **Authentication → Providers → Email**: ensure Email is enabled (magic links work by default).
5. **Project Settings → API**: copy the **Project URL** and the **anon public** key.

### 2. Configure the app
```bash
cp .env.example .env.local
```
Fill in:
```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY
VITE_VERIFY_THRESHOLD=3
```
Run `npm run dev` again — the "Demo mode" badge disappears and the app now reads/writes
your real database. (The anon key is safe to expose; RLS protects the data.)

### 3. Deploy (Vercel)
1. Push this folder to a GitHub repo.
2. At <https://vercel.com>, **Add New → Project**, import the repo (framework auto-detected as Vite).
3. Add the env vars from `.env.local` under **Settings → Environment Variables**.
4. Deploy. `vercel.json` already routes client-side paths to `index.html`.
5. In Supabase **Authentication → URL Configuration**, add your Vercel URL to the
   **Site URL / Redirect URLs** so magic links return to the live site.

> CLI alternative: `npm i -g vercel`, then `vercel` in this folder (run `vercel login` yourself first).

## How verification works
Signed-in users submit data points (`pending`). Everyone sees `verified` data; signed-in
users also see pending items to vote on. Net votes ≥ `VERIFY_THRESHOLD` → `verified`;
≤ `-VERIFY_THRESHOLD` → `rejected`. Curated seed rows are `protected` so votes can't flip
them. The rule lives in both `src/lib/verification.ts` (client) and the Postgres trigger
in `supabase/schema.sql` (server) — keep the threshold in sync.

## Project layout
```
supabase/   schema.sql (tables, RLS, trigger), seed.sql (starter data)
src/
  lib/        types, config, supabaseClient, api (+demo fallback), demoData, verification, format
  context/    AuthContext (magic-link auth)
  components/ Header, BenchmarkChart, BenchmarkCard, VoteButtons, StatusBadge
  pages/      Home, Field, Benchmark, Submit, Pending (verify), SignIn, About
test/         verification rules
```

## Note on seed data
Starter figures are widely-cited but **approximate** reference points, included as
curated rows to bootstrap the charts. They're meant to be refined by the community —
verify against original sources.
