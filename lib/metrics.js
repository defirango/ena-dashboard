// ─────────────────────────────────────────────────────────────────────────────
// Composes raw sources into the 11 KPIs, applies signal thresholds, and
// produces one clean snapshot object the UI renders directly.
// ─────────────────────────────────────────────────────────────────────────────

const sources = require('./sources');
const { classify } = require('../config/thresholds');
const manual = require('../config/manual-metrics.json');

function pct(a, b) {
  if (!a || !b) return null;
  return (a / b) * 100;
}

async function computeAllMetrics() {
  const warnings = [];

  // Independent fetches first
  const [enaMarketRes, ethPriceRes, usdeSupplyRes, susdeApyRes, tbillRes, fundingRes, convergeRes] = await Promise.all([
    sources.fetchEnaMarket(),
    sources.fetchEthPriceUsd(),
    sources.fetchUsdeSupply(),
    sources.fetchSusdeApy(),
    sources.fetchTBillRate(),
    sources.fetchFundingRates(),
    sources.fetchConvergeTvl()
  ]);

  // Dependent fetches
  const enaCirculatingSupply = enaMarketRes.ok && enaMarketRes.value.marketCapUsd && enaMarketRes.value.priceUsd
    ? enaMarketRes.value.marketCapUsd / enaMarketRes.value.priceUsd
    : null;

  const [loopExposureRes, sEnaRatioRes, reserveFundRes] = await Promise.all([
    sources.fetchLoopExposure(usdeSupplyRes.ok ? usdeSupplyRes.value : null),
    sources.fetchSEnaStakingRatio(enaCirculatingSupply),
    sources.fetchReserveFundUsd(ethPriceRes.ok ? ethPriceRes.value : null)
  ]);

  [enaMarketRes, ethPriceRes, usdeSupplyRes, susdeApyRes, tbillRes, fundingRes, convergeRes, loopExposureRes, sEnaRatioRes, reserveFundRes]
    .forEach((r) => { if (!r.ok) warnings.push({ source: r.source, error: r.error }); });

  const apySpread = susdeApyRes.ok && tbillRes.ok ? susdeApyRes.value - (tbillRes.value ?? tbillRes.fallbackValue) : null;
  const tbillValueUsed = tbillRes.ok ? tbillRes.value : tbillRes.fallbackValue ?? null;

  const metrics = {
    enaPriceUsd: enaMarketRes.ok ? enaMarketRes.value.priceUsd : null,
    enaMarketCapUsd: enaMarketRes.ok ? enaMarketRes.value.marketCapUsd : null,
    enaChange24hPct: enaMarketRes.ok ? enaMarketRes.value.change24hPct : null,
    enaCirculatingSupply,

    usdeSupplyUsd: usdeSupplyRes.ok ? usdeSupplyRes.value : null,

    susdeApyPct: susdeApyRes.ok ? susdeApyRes.value : null,
    tbillRatePct: tbillValueUsed,
    apySpreadPct: apySpread,

    fundingRateAnnualizedPct: fundingRes.ok ? fundingRes.value : null,
    fundingByAsset: fundingRes.ok ? fundingRes.perAsset : null,

    loopExposurePct: loopExposureRes.ok ? loopExposureRes.value : null,
    sEnaStakingRatioPct: sEnaRatioRes.ok ? sEnaRatioRes.value : null,

    reserveFundUsd: reserveFundRes.ok ? reserveFundRes.value : null,
    convergeTvlUsd: convergeRes.ok ? convergeRes.value : null,
    convergeIndexed: convergeRes.ok && convergeRes.value !== null,

    // Manually maintained fields (no live API — see config/manual-metrics.json)
    backingComposition: manual.susdeBackingComposition,
    stablecoinX: manual.stablecoinX,
    enaTotalSupply: manual.enaTotalSupply,
    stablecoinXHoldingsPct: pct(manual.stablecoinX.enaHeldTokens, manual.enaTotalSupply)
  };

  metrics.reserveFundPctOfSupply = pct(metrics.reserveFundUsd, metrics.usdeSupplyUsd);

  const signals = {
    usdeSupply: classify('usdeSupply', metrics.usdeSupplyUsd),
    apySpread: classify('apySpread', metrics.apySpreadPct),
    fundingRateAnnualized: classify('fundingRateAnnualized', metrics.fundingRateAnnualizedPct),
    perpBackingShare: classify('perpBackingShare', metrics.backingComposition?.perpSharePct),
    stablecoinXHoldingsPct: classify('stablecoinXHoldingsPct', metrics.stablecoinXHoldingsPct),
    loopExposurePct: classify('loopExposurePct', metrics.loopExposurePct),
    sEnaStakingRatio: classify('sEnaStakingRatio', metrics.sEnaStakingRatioPct),
    convergeTvl: classify('convergeTvl', metrics.convergeIndexed ? metrics.convergeTvlUsd : null),
    reserveFundPctOfSupply: classify('reserveFundPctOfSupply', metrics.reserveFundPctOfSupply)
  };

  const classifiedLevels = Object.values(signals).filter((s) => s.level !== 'unknown').map((s) => s.level);
  const score = classifiedLevels.length
    ? classifiedLevels.reduce((sum, l) => sum + (l === 'good' ? 1 : l === 'danger' ? -1 : 0), 0) / classifiedLevels.length
    : 0;

  let overall;
  if (score >= 0.5) overall = { level: 'good', label: 'Bullish', blurb: 'Most signals point in the right direction — the underlying business is healthy.' };
  else if (score >= 0.15) overall = { level: 'good', label: 'Cautiously bullish', blurb: 'More green than red, but a few things need watching.' };
  else if (score > -0.15) overall = { level: 'watch', label: 'Neutral / mixed', blurb: 'Roughly balanced — no strong edge either way right now.' };
  else if (score > -0.5) overall = { level: 'watch', label: 'Cautious', blurb: 'More red than green — worth reading the flagged concerns before adding exposure.' };
  else overall = { level: 'danger', label: 'Bearish', blurb: 'Multiple structural warning signs are active at once.' };

  return {
    generatedAt: new Date().toISOString(),
    metrics,
    signals,
    overall: { ...overall, goodCount: classifiedLevels.filter((l) => l === 'good').length, watchCount: classifiedLevels.filter((l) => l === 'watch').length, dangerCount: classifiedLevels.filter((l) => l === 'danger').length, totalClassified: classifiedLevels.length },
    warnings
  };
}

module.exports = { computeAllMetrics };
