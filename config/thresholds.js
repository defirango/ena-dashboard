// ─────────────────────────────────────────────────────────────────────────────
// Signal thresholds — the single place that decides "green / yellow / red"
// for every KPI. Tune these anytime; nothing else in the app needs to change.
//
// Sources for the starting values: Ethena docs, TokenIntel's May 2026 memo,
// Nansen's unlock research, and DefiLlama historical ranges (see README).
// ─────────────────────────────────────────────────────────────────────────────

const THRESHOLDS = {
  usdeSupply: {
    label: 'USDe Supply',
    good: 8_000_000_000, // >= $8B: reflating toward prior highs
    watch: 3_000_000_000 // >= $3B but < good: stable but not growing; < watch: contracting hard
  },
  apySpread: {
    // sUSDe APY minus 3-month T-bill yield, in percentage points
    label: 'sUSDe Yield Spread vs T-Bills',
    good: 3.5,
    watch: 1.0
  },
  fundingRateAnnualized: {
    // Average of ETH + BTC perp funding, annualized %
    label: 'Perp Funding Rate (annualized)',
    good: 8,
    watch: 3
  },
  perpBackingShare: {
    // % of sUSDe backing that is delta-neutral perp positions (vs RWA/stable)
    label: 'sUSDe Backing — Perp Share',
    good: 40, // healthy basis-trade engine
    watch: 10 // below this, Ethena is mostly a credit/RWA vehicle, not a yield-arb machine
  },
  stablecoinXHoldingsPct: {
    // % of ENA supply held by StablecoinX (permanent-capital bid)
    label: 'StablecoinX ENA Treasury',
    good: 15,
    watch: 5
  },
  loopExposurePct: {
    // % of total USDe supply parked in Aave/Morpho lending markets (concentration risk — inverted: LOWER is better)
    label: 'DeFi Loop Concentration',
    good: 35, // below this = healthy diversification
    watch: 55 // above this = concentration risk builds
  },
  sEnaStakingRatio: {
    // % of circulating ENA staked as sENA
    label: 'sENA Staking Ratio',
    good: 25,
    watch: 10
  },
  convergeTvl: {
    label: 'Converge Chain TVL',
    good: 1_000_000_000,
    watch: 100_000_000
  },
  reserveFundPctOfSupply: {
    // Reserve Fund balance as a % of USDe supply — the insurance cushion against negative funding periods
    label: 'Reserve Fund Cushion',
    good: 1.5,
    watch: 0.5
  }
};

// Which direction is "good"? Almost everything is higher-is-better except loop concentration.
const INVERTED = new Set(['loopExposurePct']);

function classify(key, value) {
  const t = THRESHOLDS[key];
  if (!t || value === null || value === undefined || Number.isNaN(value)) {
    return { level: 'unknown', label: t?.label ?? key };
  }
  const inverted = INVERTED.has(key);
  let level;
  if (inverted) {
    if (value <= t.good) level = 'good';
    else if (value <= t.watch) level = 'watch';
    else level = 'danger';
  } else {
    if (value >= t.good) level = 'good';
    else if (value >= t.watch) level = 'watch';
    else level = 'danger';
  }
  return { level, label: t.label };
}

module.exports = { THRESHOLDS, classify };
