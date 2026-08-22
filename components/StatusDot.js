const LABELS = {
  good: 'Bullish signal',
  watch: 'Watch',
  danger: 'Concern',
  unknown: 'No data'
};

export default function StatusDot({ level = 'unknown', showLabel = true, size = 'sm' }) {
  const dotClass = `dot dot-${level}`;
  return (
    <span className="inline-flex items-center gap-2">
      <span className={dotClass} aria-hidden="true" />
      {showLabel && <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{LABELS[level] ?? LABELS.unknown}</span>}
    </span>
  );
}
