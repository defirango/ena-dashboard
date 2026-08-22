// ─────────────────────────────────────────────────────────────────────────────
// One plain-English sentence per KPI, per signal level. This is the layer that
// makes the dashboard readable by someone who has never heard of Ethena —
// they never need to interpret a raw number, just read the sentence.
// ─────────────────────────────────────────────────────────────────────────────

const MESSAGES = {
  usdeSupply: {
    good: 'Supply is growing toward prior highs — demand for the synthetic dollar is strong.',
    watch: 'Supply is stable but not clearly growing — the business is holding steady, not expanding.',
    danger: 'Supply has contracted sharply — demand for USDe is weak right now.',
    unknown: 'Supply data is temporarily unavailable.'
  },
  apySpread: {
    good: 'sUSDe pays well above safe T-bills — a strong reason for capital to prefer USDe over cash.',
    watch: 'The yield edge over T-bills is thin — USDe is only mildly more attractive than just holding cash.',
    danger: 'sUSDe yield has fallen to or below T-bill rates — there\'s currently little financial reason to hold USDe over safer alternatives.',
    unknown: 'Yield spread data is temporarily unavailable.'
  },
  fundingRateAnnualized: {
    good: 'Perpetual futures funding is rich and positive — the core trade generating Ethena\'s revenue is working well.',
    watch: 'Funding is positive but modest — the engine is running, just not at full power.',
    danger: 'Funding is weak or negative — the trade that backs USDe yield is currently struggling.',
    unknown: 'Funding-rate data is temporarily unavailable.'
  },
  perpBackingShare: {
    good: 'Most of the backing is still the original delta-neutral trade — Ethena is behaving like the yield-arbitrage machine it was designed to be.',
    watch: 'The mix is shifting — a meaningful share of backing has moved to Treasuries/RWA instead of the perp trade.',
    danger: 'Backing is now overwhelmingly Treasuries/RWA, not perp trades — Ethena today behaves more like a credit/RWA vehicle than a basis-trade engine. That changes the risk profile.',
    unknown: 'Backing composition data is temporarily unavailable.'
  },
  stablecoinXHoldingsPct: {
    good: 'A large, permanent public-market holder owns a big chunk of supply — a structural buy-side anchor for the token.',
    watch: 'There is a known institutional holder, but its position isn\'t yet large enough to meaningfully offset unlock pressure.',
    danger: 'No meaningful institutional treasury demand has been confirmed.',
    unknown: 'Institutional holdings data is temporarily unavailable.'
  },
  loopExposurePct: {
    good: 'USDe usage is spread across many venues — no single lending market can single-handedly trigger a supply shock.',
    watch: 'A meaningful share of USDe sits in a small number of lending markets — a policy change there could move the needle.',
    danger: 'A large share of USDe supply is concentrated in a few DeFi lending markets — exactly the setup that triggered the Oct 2025 deleveraging event. A parameter change on one platform could cascade.',
    unknown: 'Loop-concentration data is temporarily unavailable.'
  },
  sEnaStakingRatio: {
    good: 'A large share of ENA is staked — fee-switch revenue is concentrated among fewer holders, meaning a better payout per staked token.',
    watch: 'Staking participation is moderate — there\'s room for the per-token fee-switch yield to improve as more ENA gets staked.',
    danger: 'Very little ENA is staked yet — fee-switch revenue, even if healthy, is diluted across an inactive base.',
    unknown: 'Staking-ratio data is temporarily unavailable.'
  },
  convergeTvl: {
    good: 'Converge (the institutional chain) already has meaningful capital committed — the infrastructure bet is paying off.',
    watch: 'Converge is live with some capital, but still early — the infrastructure bet hasn\'t proven itself yet.',
    danger: 'Converge has little to no capital deployed yet.',
    unknown: 'Converge is too new to be indexed by public trackers yet — this will populate automatically once it is.'
  },
  reserveFundPctOfSupply: {
    good: 'The insurance cushion is comfortably sized relative to USDe supply — the protocol can absorb a rough patch of negative funding.',
    watch: 'The cushion exists but is thin relative to supply — worth watching if funding turns negative for an extended stretch.',
    danger: 'The safety buffer is small relative to USDe supply — limited room to absorb a sustained negative-funding period.',
    unknown: 'Reserve Fund data is temporarily unavailable.'
  }
};

function getMessage(key, level) {
  const set = MESSAGES[key];
  if (!set) return '';
  return set[level] ?? set.unknown;
}

module.exports = { getMessage };
