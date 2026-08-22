import { getLatestSnapshot, getHistory, insertSnapshot } from '../lib/db';
import { computeAllMetrics } from '../lib/metrics';
import { getMessage } from '../lib/messages';
import { fmtUsd, fmtPct, fmtNum, fmtDate } from '../lib/format';
import { KNOWN_EVENTS, MONTHLY_LINEAR_UNLOCK_ENA, VESTING_END_DATE } from '../config/unlocks';

import Header from '../components/Header';
import BiasMeter from '../components/BiasMeter';
import KpiCard from '../components/KpiCard';
import TrendChart from '../components/TrendChart';
import UnlockCountdown from '../components/UnlockCountdown';
import Footer from '../components/Footer';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const latest = await getLatestSnapshot();
  let snapshot;

  if (latest) {
    snapshot = latest.data;
  } else {
    // No history yet (fresh deploy, DB not connected, or cron hasn't run) —
    // compute live so the dashboard is never blank on first visit.
    snapshot = await computeAllMetrics();
    await insertSnapshot(snapshot); // best-effort; safely no-ops without a database
  }

  const historyRows = await getHistory(90);
  const history = historyRows.map((r) => ({
    date: new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    usdeSupply: r.data?.metrics?.usdeSupplyUsd ?? null,
    enaPrice: r.data?.metrics?.enaPriceUsd ?? null,
    susdeApy: r.data?.metrics?.susdeApyPct ?? null,
    tbill: r.data?.metrics?.tbillRatePct ?? null
  }));

  const { metrics, signals, overall, warnings, generatedAt } = snapshot;
  const nextUnlockEvent = KNOWN_EVENTS.find((e) => new Date(e.date).getTime() > Date.now()) ?? null;

  return (
    <main>
      <Header
        priceUsd={metrics.enaPriceUsd}
        marketCapUsd={metrics.enaMarketCapUsd}
        change24hPct={metrics.enaChange24hPct}
        generatedAt={generatedAt}
      />

      <div className="mb-8">
        <BiasMeter overall={overall} />
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Weekly KPIs</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiCard
            icon="💧"
            title="USDe Supply"
            value={fmtUsd(metrics.usdeSupplyUsd)}
            level={signals.usdeSupply.level}
            message={getMessage('usdeSupply', signals.usdeSupply.level)}
          />

          <KpiCard
            icon="📈"
            title="sUSDe Yield Spread vs T-Bills"
            value={fmtPct(metrics.apySpreadPct)}
            sub={`sUSDe ${fmtPct(metrics.susdeApyPct)} vs T-Bill ${fmtPct(metrics.tbillRatePct)}`}
            level={signals.apySpread.level}
            message={getMessage('apySpread', signals.apySpread.level)}
          />

          <KpiCard
            icon="⚡"
            title="Perp Funding Rate (annualized)"
            value={fmtPct(metrics.fundingRateAnnualizedPct)}
            sub={metrics.fundingByAsset ? `ETH ${fmtPct(metrics.fundingByAsset.ETH)} · BTC ${fmtPct(metrics.fundingByAsset.BTC)}` : null}
            level={signals.fundingRateAnnualized.level}
            message={getMessage('fundingRateAnnualized', signals.fundingRateAnnualized.level)}
          />

          <KpiCard
            icon="🧬"
            title="sUSDe Backing Composition"
            value={`${metrics.backingComposition.perpSharePct}% perp / ${metrics.backingComposition.rwaSharePct}% RWA`}
            level={signals.perpBackingShare.level}
            message={getMessage('perpBackingShare', signals.perpBackingShare.level)}
            asOf={fmtDate(metrics.backingComposition.asOf)}
          />

          <KpiCard
            icon="🏦"
            title="StablecoinX ENA Treasury"
            value={`${fmtNum(metrics.stablecoinX.enaHeldTokens)} ENA`}
            sub={`${fmtPct(metrics.stablecoinXHoldingsPct)} of total supply · ${fmtUsd(metrics.stablecoinX.treasuryValueUsd)} value`}
            level={signals.stablecoinXHoldingsPct.level}
            message={getMessage('stablecoinXHoldingsPct', signals.stablecoinXHoldingsPct.level)}
            asOf={fmtDate(metrics.stablecoinX.asOf)}
          />

          <KpiCard
            icon="🔁"
            title="DeFi Loop Concentration"
            value={fmtPct(metrics.loopExposurePct)}
            sub="Share of USDe supply parked in Aave + Morpho lending markets"
            level={signals.loopExposurePct.level}
            message={getMessage('loopExposurePct', signals.loopExposurePct.level)}
          />

          <KpiCard
            icon="🥩"
            title="sENA Staking Ratio"
            value={fmtPct(metrics.sEnaStakingRatioPct)}
            sub="Share of circulating ENA staked as sENA"
            level={signals.sEnaStakingRatio.level}
            message={getMessage('sEnaStakingRatio', signals.sEnaStakingRatio.level)}
          />

          <KpiCard
            icon="🌉"
            title="Converge Chain TVL"
            value={metrics.convergeIndexed ? fmtUsd(metrics.convergeTvlUsd) : 'Not yet indexed'}
            level={signals.convergeTvl.level}
            message={getMessage('convergeTvl', signals.convergeTvl.level)}
          />

          <KpiCard
            icon="🛡️"
            title="Reserve Fund Balance"
            value={fmtUsd(metrics.reserveFundUsd)}
            sub={`${fmtPct(metrics.reserveFundPctOfSupply)} of USDe supply`}
            level={signals.reserveFundPctOfSupply.level}
            message={getMessage('reserveFundPctOfSupply', signals.reserveFundPctOfSupply.level)}
          />
        </div>
      </section>

      <section className="mb-8">
        <UnlockCountdown nextEvent={nextUnlockEvent} monthlyUnlockEna={MONTHLY_LINEAR_UNLOCK_ENA} vestingEndDate={VESTING_END_DATE} />
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Trends (last 90 days)</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="card">
            <div className="mb-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">USDe Supply Over Time</div>
            <TrendChart data={history} series={[{ key: 'usdeSupply', name: 'USDe Supply' }]} format="usd" />
          </div>
          <div className="card">
            <div className="mb-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">sUSDe APY vs 3-Month T-Bill</div>
            <TrendChart
              data={history}
              series={[
                { key: 'susdeApy', name: 'sUSDe APY' },
                { key: 'tbill', name: '3M T-Bill' }
              ]}
              format="pct"
            />
          </div>
          <div className="card lg:col-span-2">
            <div className="mb-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">ENA Price Over Time</div>
            <TrendChart data={history} series={[{ key: 'enaPrice', name: 'ENA Price' }]} format="usdPrecise" />
          </div>
        </div>
      </section>

      <Footer warnings={warnings} />
    </main>
  );
}
