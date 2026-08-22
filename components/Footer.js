export default function Footer({ warnings }) {
  return (
    <footer className="mt-10 flex flex-col gap-4 border-t border-neutral-200 pt-6 text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
      {warnings && warnings.length > 0 && (
        <div className="rounded-xl bg-amber-50 p-3 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          <strong>Heads up:</strong> {warnings.length} data source{warnings.length > 1 ? 's' : ''} didn't respond on the last
          refresh ({warnings.map((w) => w.source).join(', ')}). The dashboard is showing the most recent good value for those
          — nothing is broken, this just happens sometimes with free public APIs.
        </div>
      )}

      <div>
        <strong className="text-neutral-700 dark:text-neutral-300">Live sources:</strong> DefiLlama (USDe supply, sUSDe APY,
        DeFi lending exposure, Converge TVL), CoinGecko (ENA/ETH price), FRED (3M T-bill yield), OKX (ETH/BTC perp funding),
        on-chain reads via public RPC (sENA staking ratio, Reserve Fund balance).
      </div>
      <div>
        <strong className="text-neutral-700 dark:text-neutral-300">Manually maintained (updated a few times a year):</strong>{' '}
        sUSDe backing composition, StablecoinX ENA treasury, unlock schedule — each shows an &ldquo;as of&rdquo; date. Edit{' '}
        <code className="rounded bg-neutral-100 px-1 py-0.5 dark:bg-neutral-800">config/manual-metrics.json</code> and{' '}
        <code className="rounded bg-neutral-100 px-1 py-0.5 dark:bg-neutral-800">config/unlocks.js</code> to update.
      </div>
      <div>
        Signal thresholds are defined in <code className="rounded bg-neutral-100 px-1 py-0.5 dark:bg-neutral-800">config/thresholds.js</code> — tune them anytime.
      </div>
      <div className="text-xs text-neutral-400 dark:text-neutral-600">
        Educational tool only — not investment advice. Verify anything material against primary sources before acting on it.
      </div>
    </footer>
  );
}
