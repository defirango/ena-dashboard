import StatusDot from './StatusDot';

/**
 * Generic KPI card. Keep every card's job to ONE number, ONE color, ONE sentence —
 * that's what makes the dashboard readable by someone new to Ethena.
 */
export default function KpiCard({ icon, title, value, sub, level, message, asOf, children }) {
  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">
          <span aria-hidden="true">{icon}</span>
          <span>{title}</span>
        </div>
        <StatusDot level={level} showLabel={false} />
      </div>

      <div>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        {sub && <div className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{sub}</div>}
      </div>

      {message && <p className="text-sm leading-snug text-neutral-700 dark:text-neutral-300">{message}</p>}

      {children}

      {asOf && <div className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">As of {asOf}</div>}
    </div>
  );
}
