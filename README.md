# ENA Pulse — Ethena Investment Dashboard

A live, plain-English monitoring dashboard for 11 Ethena/ENA KPIs, each with a
green/yellow/red bullish-or-concerning read. Built for Vercel with Next.js 16.

---

## 1. Deploy it (about 5 minutes)

You do **not** need GitHub for this — the Vercel CLI deploys straight from your
computer.

```bash
# 1. Unzip this project, then cd into it
cd ena-dashboard

# 2. Install dependencies locally (only needed if you want to test with `npm run dev` first — optional)
npm install

# 3. Log in to Vercel (opens your browser once)
npx vercel login

# 4. Deploy
npx vercel --prod
```

The CLI will ask a few setup questions the first time (link to a new project,
which scope/team, etc.) — accept the defaults unless you know you want
something else. When it finishes you'll get a live `https://….vercel.app` URL.

**At this point the dashboard already works** — every KPI that has a live
public API will show real numbers. Historical trend charts will show a
"collecting data" placeholder until step 2 below has run at least twice.

---

## 2. Add the database (for historical trend charts)

Without a database the dashboard still shows live current values — you only
need this step for the trend-line charts.

1. Go to your project on [vercel.com](https://vercel.com) → **Storage** tab.
2. Click **Create Database** → choose **Neon** (Postgres, free tier).
3. Click **Connect to Project**. Vercel automatically adds a `DATABASE_URL`
   environment variable — you don't need to copy/paste anything.
4. Redeploy so the new environment variable takes effect:
   ```bash
   npx vercel --prod
   ```
5. Visit your dashboard URL once. The homepage automatically takes its first
   live snapshot and saves it to the database the first time it loads with an
   empty database — you'll see it working immediately, no extra step needed.
6. From here, the daily cron job (see below) keeps adding one snapshot a day.
   Once there are 2+ snapshots, the trend charts populate. Give it a few days
   for a chart worth looking at.

---

## 3. Confirm the daily refresh (cron) is running

This project ships with a Vercel Cron Job (`vercel.json`) that hits
`/api/cron/refresh` once a day at 06:00 UTC and stores a new snapshot.

- Check **Project → Settings → Cron Jobs** in the Vercel dashboard — you
  should see it listed there after your first deploy.
- **Free (Hobby) plan note:** Vercel Hobby limits cron jobs to once per day.
  If you're on Vercel Pro and want fresher history, edit the schedule in
  `vercel.json` (e.g. `"0 */6 * * *"` for every 6 hours) and redeploy.
- Don't want to wait for history? Click **"Refresh now"** on the dashboard
  itself — it fetches fresh data on demand (rate-limited to once per 5
  minutes so it can't be spammed) and saves a snapshot immediately.

### Optional: lock down the cron endpoint

Anyone could technically hit `/api/cron/refresh` directly — the worst case is
a few extra public-API calls (no sensitive data, no writes beyond one more
snapshot row). If you'd rather lock it down:

1. Generate a random secret: `openssl rand -hex 32`
2. Add it as an environment variable named `CRON_SECRET` in
   **Project → Settings → Environment Variables**.
3. Redeploy. Vercel automatically sends this value as a Bearer token when
   *it* calls your cron job, so its own daily run keeps working — only
   outside requests get rejected.

---

## 4. What's live vs. manually maintained

| KPI | Source | Live? |
|---|---|---|
| ENA price, market cap, 24h change | CoinGecko (DefiLlama fallback) | ✅ Live |
| USDe supply | DefiLlama stablecoins | ✅ Live |
| sUSDe APY | DefiLlama yields | ✅ Live |
| 3-month T-bill yield | FRED | ✅ Live (static fallback if FRED is briefly down) |
| ETH/BTC perp funding rate | OKX public API | ✅ Live |
| Aave/Morpho USDe loop concentration | DefiLlama yields | ✅ Live |
| sENA staking ratio | On-chain read, public RPC | ✅ Live |
| Reserve Fund balance | On-chain read, public RPC | ✅ Live |
| Converge chain TVL | DefiLlama chains | ✅ Live once DefiLlama indexes Converge (shows "Not yet indexed" until then) |
| sUSDe backing composition (perp % vs RWA %) | Manual | ⚠️ No free live API exists for this yet — update `config/manual-metrics.json` when Ethena/Oak Research publish new figures |
| StablecoinX ENA treasury holdings | Manual | ⚠️ Quarterly press releases only — update `config/manual-metrics.json` |
| ENA unlock schedule | Manual | ⚠️ Update `config/unlocks.js` if Ethena announces schedule changes |

Every manual field shows an **"as of [date]"** badge on the dashboard so it's
never mistaken for live data. A card that briefly can't reach its data source
shows "temporarily unavailable" instead of breaking the page — this is normal
with free public APIs and resolves on the next refresh.

---

## 5. Tuning the signals

Everything that decides green/yellow/red lives in **`config/thresholds.js`** —
one file, plain numbers, fully commented. Change a number, redeploy, done.
The plain-English sentence shown under each card lives in **`lib/messages.js`**
if you want to adjust the wording.

---

## 6. Local development

```bash
cp .env.example .env.local   # optional — the app runs fine with this empty
npm install
npm run dev
```

Open http://localhost:3000. Without a database connected, the page computes
live metrics on every load and shows a "collecting data" placeholder for the
trend charts — this is expected local behavior.

---

## 7. Project structure

```
app/
  page.js                 → the dashboard itself (Server Component)
  api/cron/refresh/        → daily automated refresh (Vercel Cron)
  api/refresh-now/         → manual "Refresh now" button endpoint
components/                → UI pieces (cards, charts, header, footer)
lib/
  sources.js               → every external API call, one function each, all defensive
  metrics.js               → combines sources into the 11 KPIs
  signals.js (thresholds.js)→ green/yellow/red classification
  messages.js              → the plain-English sentence per KPI per level
  db.js                    → Postgres persistence (Neon)
config/
  thresholds.js            → tune bullish/bearish cutoffs here
  manual-metrics.json      → the 2 metrics with no free live API
  unlocks.js                → ENA vesting/unlock schedule
```

---

Educational tool only — not investment advice.
