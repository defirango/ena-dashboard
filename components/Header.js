import RefreshButton from './RefreshButton';
import { fmtUsd, fmtPct, fmtDateTime } from '../lib/format';

export default function Header({ priceUsd, marketCapUsd, change24hPct, generatedAt }) {
  const changePositive = (change24hPct ?? 0) >= 0;

  return (
    <header className="mb-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ENA Pulse</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Your at-a-glance investment monitor for Ethena ($ENA)</p>
        </div>
        <RefreshButton />
      </div>

      <div className="card flex flex-wrap items-center gap-x-8 gap-y-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">ENA Price</div>
          <div className="text-3xl font-bold">{fmtUsd(priceUsd, { compact: false })}</div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">24h Change</div>
          <div className={`text-xl font-semibold ${changePositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {change24hPct === null || change24hPct === undefined ? '—' : `${changePositive ? '+' : ''}${change24hPct.toFixed(2)}%`}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Market Cap</div>
          <div className="text-xl font-semibold">{fmtUsd(marketCapUsd)}</div>
        </div>
        <div className="ml-auto text-xs text-neutral-400 dark:text-neutral-500">Last updated {fmtDateTime(generatedAt)}</div>
      </div>
    </header>
  );
}
