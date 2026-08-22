export default function Footer({ warnings }) {
  return (
    <footer className="mt-10 flex flex-col gap-4 border-t border-neutral-200 pt-6 text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
      {warnings && warnings.length > 0 && (
        <div className="rounded-xl bg-watch-soft p-3 text-watch">
          <strong>Heads up:</strong> {warnings.length} data source{warnings.length > 1 ? 's' : ''} did not respond on the
          last refresh ({warnings.map((w) => w.source).join(', ')}). Showing the most recent good value for those.
        </div>
      )}

      <div className="text-xs text-neutral-400 dark:text-neutral-600">
        Educational tool only, not investment advice.
      </div>
    </footer>
  );
}
