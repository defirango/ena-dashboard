import StatusDot from './StatusDot';
import { Sparkline } from './TrendChart';

/**
 * Generic KPI card. Keep every card's job to one number, one color, one
 * sentence. That is what makes the dashboard readable by someone new to Ethena.
 */
export default function KpiCard({ title, value, sub, level, message, asOf, trend, children }) {
  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{title}</div>
        <StatusDot level={level} showLabel={false} />
      </div>

      <div>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        {sub && <div className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{sub}</div>}
      </div>

      {message && <p className="text-sm leading-snug text-neutral-700 dark:text-neutral-300">{message}</p>}

      {trend && trend.length >= 2 && (
        <div>
          <Sparkline data={trend} level={level} />
          <div className="text-xs text-neutral-400 dark:text-neutral-500">Last {trend.length} days</div>
        </div>
      )}

      {children}

      {asOf && <div className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">As of {asOf}</div>}
    </div>
  );
}
