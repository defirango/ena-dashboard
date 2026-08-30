import { getLatestSnapshot, insertSnapshot } from '../lib/db';
import { computeAllMetrics } from '../lib/metrics';
import { computeChartHistory } from '../lib/history';
import { getMessage } from '../lib/messages';
import { fmtUsd, fmtPct, fmtNum, fmtDate } from '../lib/format';

import Header from '../components/Header';
import BiasMeter from '../components/BiasMeter';
import KpiCard from '../components/KpiCard';
import TrendChart from '../components/TrendChart';
import Footer from '../components/Footer';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const latest = await getLatestSnapshot();
  let snapshot;

  if (latest) {
    snapshot = latest.data;
  } else {
    // No snapshot yet (fresh deploy, no database connected, or cron has not run).
    // Compute live so the dashboard is never blank on first visit.
    snapshot = await computeAllMetrics();
    await insertSnapshot(snapshot); // best-effort, safely no-ops without a database
  }

  // Trend charts are built from published data (CoinGecko, DefiLlama, FRED) on
  // every load, not from stored snapshots. Real history shows up immediately,
  // no database and no waiting required.
  const { rows: history, warnings: historyWarnings } = await computeChartHistory(90);

  const { metrics, signals, overall, warnings, generatedAt } = snapshot;
  const allWarnings = [...warnings, ...historyWarnings];

  const usdeSupplyTrend = history.filter((h) => h.usdeSupply !== null).map((h) => ({ value: h.usdeSupply }));
  const apySpreadTrend = history
    .filter((h) => h.susdeApy !== null && h.tbill !== null)
    .map((h) => ({ value: h.susdeApy - h.tbill }));

  const backing = metrics.backingComposition;
  const otherSharePct = Math.max(0, 100 - backing.perpSharePct - backing.rwaSharePct);
  const fundingNote = metrics.fundingRateAnnualizedPct !== null
    ? `Perp funding is ${fmtPct(metrics.fundingRateAnnualizedPct)} annualized right now. A richer funding rate is what would draw backing back toward the perp trade.`
    : null;

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
        <h2 className="mb-3 text-lg font-semibold">Trends (last 90 days)</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="card lg:col-span-2">
            <div className="mb-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">ENA Price</div>
            <TrendChart data={history} series={[{ key: 'enaPrice', name: 'ENA Price' }]} format="usdPrecise" />
          </div>
          <div className="card">
            <div className="mb-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">USDe Supply</div>
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
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Weekly KPIs</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiCard
            title="USDe Supply"
            value={fmtUsd(metrics.usdeSupplyUsd)}
            level={signals.usdeSupply.level}
            message={getMessage('usdeSupply', signals.usdeSupply.level)}
            trend={usdeSupplyTrend}
          />

          <KpiCard
            title="sUSDe Yield Spread vs T-Bills"
            value={fmtPct(metrics.apySpreadPct)}
            sub={`sUSDe ${fmtPct(metrics.susdeApyPct)} vs T-Bill ${fmtPct(metrics.tbillRatePct)}`}
            level={signals.apySpread.level}
            message={getMessage('apySpread', signals.apySpread.level)}
            trend={apySpreadTrend}
          />

          <KpiCard
            title="Perp Funding Rate (annualized)"
            value={fmtPct(metrics.fundingRateAnnualizedPct)}
            sub={metrics.fundingByAsset ? `ETH ${fmtPct(metrics.fundingByAsset.ETH)}, BTC ${fmtPct(metrics.fundingByAsset.BTC)}` : null}
            level={signals.fundingRateAnnualized.level}
            message={getMessage('fundingRateAnnualized', signals.fundingRateAnnualized.level)}
          />

          <KpiCard
            title="sUSDe Backing Composition"
            value={`${backing.perpSharePct}% perp, ${backing.rwaSharePct}% RWA`}
            level={signals.perpBackingShare.level}
            message={getMessage('perpBackingShare', signals.perpBackingShare.level)}
            asOf={fmtDate(backing.asOf)}
          >
            <div>
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                <div className="bg-good" style={{ width: `${backing.perpSharePct}%` }} title={`Perp ${backing.perpSharePct}%`} />
                <div className="bg-neutral-400 dark:bg-neutral-600" style={{ width: `${backing.rwaSharePct}%` }} title={`RWA ${backing.rwaSharePct}%`} />
                <div className="bg-neutral-200 dark:bg-neutral-700" style={{ width: `${otherSharePct}%` }} title={`Other ${otherSharePct}%`} />
              </div>
              <div className="mt-1 flex justify-between text-xs text-neutral-400 dark:text-neutral-500">
                <span>Perp {backing.perpSharePct}%</span>
                <span>RWA {backing.rwaSharePct}%</span>
                <span>Other {otherSharePct}%</span>
              </div>
            </div>
            {fundingNote && <p className="text-xs leading-snug text-neutral-500 dark:text-neutral-400">{fundingNote}</p>}
          </KpiCard>

          <KpiCard
            title="StablecoinX ENA Treasury"
            value={`${fmtNum(metrics.stablecoinX.enaHeldTokens)} ENA`}
            sub={`${fmtPct(metrics.stablecoinXHoldingsPct)} of total supply, ${fmtUsd(metrics.stablecoinX.treasuryValueUsd)} value`}
            level={signals.stablecoinXHoldingsPct.level}
            message={getMessage('stablecoinXHoldingsPct', signals.stablecoinXHoldingsPct.level)}
            asOf={fmtDate(metrics.stablecoinX.asOf)}
          />

          <KpiCard
            title="DeFi Loop Concentration"
            value={fmtPct(metrics.loopExposurePct)}
            sub="Share of USDe supply parked in Aave and Morpho lending markets"
            level={signals.loopExposurePct.level}
            message={getMessage('loopExposurePct', signals.loopExposurePct.level)}
          />

          <KpiCard
            title="sENA Staking Ratio"
            value={fmtPct(metrics.sEnaStakingRatioPct)}
            sub="Share of circulating ENA staked as sENA"
            level={signals.sEnaStakingRatio.level}
            message={getMessage('sEnaStakingRatio', signals.sEnaStakingRatio.level)}
          />

          <KpiCard
            title="Converge Chain TVL"
            value={metrics.convergeIndexed ? fmtUsd(metrics.convergeTvlUsd) : 'Not yet indexed'}
            level={signals.convergeTvl.level}
            message={getMessage('convergeTvl', signals.convergeTvl.level)}
          />

          <KpiCard
            title="Reserve Fund Balance"
            value={fmtUsd(metrics.reserveFundUsd)}
            sub={`${fmtPct(metrics.reserveFundPctOfSupply)} of USDe supply`}
            level={signals.reserveFundPctOfSupply.level}
            message={getMessage('reserveFundPctOfSupply', signals.reserveFundPctOfSupply.level)}
            asOf={fmtDate(metrics.reserveFund.asOf)}
          >
            <p className="text-xs leading-snug text-neutral-500 dark:text-neutral-400">
              {fmtUsd(metrics.reserveFund.usdtbUsd)} USDtb + {fmtUsd(metrics.reserveFund.usdtbUsdcLpUsd)} USDtb-USDC LP. {metrics.reserveFund.note}
            </p>
          </KpiCard>
        </div>
      </section>

      <Footer warnings={allWarnings} />
    </main>
  );
}
