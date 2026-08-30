# ENA Pulse: Ethena Investment Dashboard

A live, plain-English monitoring dashboard for 11 Ethena/ENA KPIs, each with a
green/yellow/red bullish-or-concerning read. Built for Vercel with Next.js 16.

---

## 1. Deploy it (about 5 minutes)

You do not need GitHub for this. The Vercel CLI deploys straight from your computer.

```bash
# 1. Unzip this project, then cd into it
cd ena-dashboard

# 2. Install dependencies locally (only needed if you want to test with `npm run dev` first, optional)
npm install

# 3. Log in to Vercel (opens your browser once)
npx vercel login

# 4. Deploy
npx vercel --prod
```

The CLI will ask a few setup questions the first time (link to a new project,
which scope/team, etc.). Accept the defaults unless you know you want
something else. When it finishes you get a live `https://....vercel.app` URL.

**At this point the dashboard already works.** Every KPI that has a live
public API shows real numbers, and the trend charts show real history too:
they are built from CoinGecko, DefiLlama, and FRED on every page load, not
from a database. No waiting period.

---

## 2. Optional: add a database

The trend charts do not need this. A database only adds a second, cached
snapshot layer for the KPI cards, so a page load does not always trigger a
fresh round of API calls.

1. Go to your project on [vercel.com](https://vercel.com), then the **Storage** tab.
2. Click **Create Database**, choose **Neon** (Postgres, free tier).
3. Click **Connect to Project**. Vercel automatically adds a `DATABASE_URL`
   environment variable, nothing to copy or paste.
4. Redeploy so the new environment variable takes effect:
   ```bash
   npx vercel --prod
   ```

---

## 3. Confirm the daily refresh (cron) is running

This project ships with a Vercel Cron Job (`vercel.json`) that hits
`/api/cron/refresh` once a day at 06:00 UTC and refreshes the cached snapshot.

- Check **Project, Settings, Cron Jobs** in the Vercel dashboard. You
  should see it listed there after your first deploy.
- **Free (Hobby) plan note:** Vercel Hobby limits cron jobs to once per day.
  If you are on Vercel Pro and want a fresher cached snapshot, edit the
  schedule in `vercel.json` (for example `"0 */6 * * *"` for every 6 hours) and redeploy.
- Want fresh numbers right now? Click **Refresh now** on the dashboard
  itself. It fetches fresh data on demand (rate-limited to once per 5
  minutes so it cannot be spammed) and updates the cached snapshot immediately.

### Optional: lock down the cron endpoint

Anyone could technically hit `/api/cron/refresh` directly. The worst case is
a few extra public-API calls, no sensitive data, no writes beyond one cached
snapshot. If you would rather lock it down:

1. Generate a random secret: `openssl rand -hex 32`
2. Add it as an environment variable named `CRON_SECRET` in
   **Project, Settings, Environment Variables**.
3. Redeploy. Vercel automatically sends this value as a Bearer token when
   it calls your cron job, so its own daily run keeps working. Only
   outside requests get rejected.

---

## 4. What's live vs. manually maintained

| KPI | Source | Live? |
|---|---|---|
| ENA price, market cap, 24h change | CoinGecko (DefiLlama fallback) | Live |
| USDe supply, current and history | DefiLlama stablecoins | Live |
| sUSDe APY, current and history | DefiLlama yields | Live |
| 3-month T-bill yield, current and history | FRED | Live (static fallback if FRED is briefly down) |
| ETH/BTC perp funding rate | OKX public API | Live |
| Aave/Morpho USDe loop concentration | DefiLlama yields | Live |
| sENA staking ratio | On-chain read, public RPC | Live |
| Reserve Fund balance | On-chain read, public RPC | Live |
| Converge chain TVL | DefiLlama chains | Live once DefiLlama indexes Converge (shows "Not yet indexed" until then) |
| sUSDe backing composition (perp % vs RWA %) | Manual | No free live API exists for this yet. Update `config/manual-metrics.json` when Ethena or Oak Research publish new figures |
| StablecoinX ENA treasury holdings | Manual | Quarterly press releases only. Update `config/manual-metrics.json` |
| ENA unlock schedule | Manual | Update `config/unlocks.js` if Ethena announces schedule changes |

Every manual field shows an "as of [date]" badge on the dashboard so it is
never mistaken for live data. A card that briefly cannot reach its data source
shows "temporarily unavailable" instead of breaking the page. This is normal
with free public APIs and resolves on the next refresh.

---

## 5. Tuning the signals

Everything that decides green/yellow/red lives in `config/thresholds.js`,
one file, plain numbers, fully commented. Change a number, redeploy, done.
The plain sentence shown under each card lives in `lib/messages.js` if you
want to adjust the wording.

---

## 6. Local development

```bash
cp .env.example .env.local   # optional, the app runs fine with this empty
npm install
npm run dev
```

Open http://localhost:3000. The trend charts fetch real history from public
APIs on every load, same as production, so they work locally too.

---

## 7. Project structure

```
app/
  page.js                 -> the dashboard itself (Server Component)
  api/cron/refresh/        -> daily automated refresh (Vercel Cron)
  api/refresh-now/         -> manual "Refresh now" button endpoint
components/                -> UI pieces (cards, charts, header, footer)
lib/
  sources.js               -> every external API call, one function each, all defensive
  history.js                -> builds trend-chart data from published sources
  metrics.js               -> combines sources into the 11 KPIs
  thresholds.js (config/)  -> green/yellow/red classification
  messages.js               -> the plain sentence per KPI per level
  db.js                    -> Postgres persistence (Neon), optional caching layer
config/
  thresholds.js            -> tune bullish/bearish cutoffs here
  manual-metrics.json      -> the 2 metrics with no free live API
  unlocks.js                -> ENA vesting/unlock schedule
```

---

Educational tool only, not investment advice.

