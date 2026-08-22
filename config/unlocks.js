// ENA vesting/unlock schedule. Manually maintained (no reliable free live API
// for this). Source: Ethena docs (TGE terms), Tokenomist.ai, and Nansen research.
// Update this array whenever a new cliff or schedule change is announced.

const TGE_DATE = '2024-03-05';
const CLIFF_DATE = '2025-04-02'; // 1-year cliff, 25% of core+investor allocation unlocked
const VESTING_END_DATE = '2028-04-02'; // end of 3-year linear vesting after cliff

// Approximate combined monthly unlock (core contributors + investors), in ENA tokens,
// during the linear-vesting window between CLIFF_DATE and VESTING_END_DATE.
const MONTHLY_LINEAR_UNLOCK_ENA = 172_500_000;

// Known discrete/named unlock events worth flagging on the dashboard.
const KNOWN_EVENTS = [
  { date: '2025-04-02', label: 'First cliff unlock (25% of Core + Investor allocations)', amountEna: null },
  { date: '2026-09-02', label: 'Scheduled core-contributor monthly tranche', amountEna: 172_500_000 }
  // Add new confirmed events here as they're announced.
];

module.exports = { TGE_DATE, CLIFF_DATE, VESTING_END_DATE, MONTHLY_LINEAR_UNLOCK_ENA, KNOWN_EVENTS };
