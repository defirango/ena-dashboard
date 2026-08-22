const LEVEL_CLASS = {
  good: { text: 'text-good', bg: 'bg-good-soft', border: 'var(--status-good)' },
  watch: { text: 'text-watch', bg: 'bg-watch-soft', border: 'var(--status-watch)' },
  danger: { text: 'text-danger', bg: 'bg-danger-soft', border: 'var(--status-danger)' }
};

export default function BiasMeter({ overall }) {
  const s = LEVEL_CLASS[overall.level] ?? LEVEL_CLASS.watch;

  return (
    <div className={`card ${s.bg}`} style={{ borderLeft: `4px solid ${s.border}` }}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Overall read, right now
          </div>
          <div className={`mt-1 text-3xl font-bold ${s.text}`}>{overall.label}</div>
          <p className="mt-2 max-w-xl text-sm text-neutral-700 dark:text-neutral-300">{overall.blurb}</p>
        </div>

        <div className="flex gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-good">{overall.goodCount}</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">Bullish</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-watch">{overall.watchCount}</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">Watch</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-danger">{overall.dangerCount}</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">Concern</div>
          </div>
        </div>
      </div>
    </div>
  );
}
