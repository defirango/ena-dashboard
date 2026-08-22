const LEVEL_STYLES = {
  good: {
    ring: 'ring-green-200 dark:ring-green-900',
    bg: 'bg-green-50 dark:bg-green-950/40',
    text: 'text-green-800 dark:text-green-300',
    emoji: '🟢'
  },
  watch: {
    ring: 'ring-amber-200 dark:ring-amber-900',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-800 dark:text-amber-300',
    emoji: '🟡'
  },
  danger: {
    ring: 'ring-red-200 dark:ring-red-900',
    bg: 'bg-red-50 dark:bg-red-950/40',
    text: 'text-red-800 dark:text-red-300',
    emoji: '🔴'
  }
};

export default function BiasMeter({ overall }) {
  const s = LEVEL_STYLES[overall.level] ?? LEVEL_STYLES.watch;

  return (
    <div className={`card ring-2 ${s.ring} ${s.bg}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Overall read, right now
          </div>
          <div className={`mt-1 flex items-center gap-2 text-3xl font-bold ${s.text}`}>
            <span aria-hidden="true">{s.emoji}</span>
            <span>{overall.label}</span>
          </div>
          <p className="mt-2 max-w-xl text-sm text-neutral-700 dark:text-neutral-300">{overall.blurb}</p>
        </div>

        <div className="flex gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">{overall.goodCount}</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">Bullish</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{overall.watchCount}</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">Watch</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-700 dark:text-red-400">{overall.dangerCount}</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">Concern</div>
          </div>
        </div>
      </div>
    </div>
  );
}
