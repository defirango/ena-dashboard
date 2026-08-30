export default function Footer({ warnings }) {
  return (
    <footer className="mt-10 flex flex-col gap-4 border-t border-neutral-200 pt-6 text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
      {warnings && warnings.length > 0 && (
        <div className="rounded-xl bg-watch-soft p-3 text-watch">
          <strong>Heads up:</strong> {warnings.length} data source{warnings.length > 1 ? 's' : ''} did not respond on the
          last refresh ({warnings.map((w) => w.source).join(', ')}). Showing the most recent good value for those.
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-400 dark:text-neutral-600">
        <span>Educational tool only, not investment advice.</span>
        <span>
          Built by{' '}
          <a
            href="https://x.com/DefiRango"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-dotted underline-offset-4 hover:text-neutral-600 dark:hover:text-neutral-300"
          >
            @DefiRango
          </a>
          {' · '}
          <a
            href="https://tldrbyrango.substack.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-dotted underline-offset-4 hover:text-neutral-600 dark:hover:text-neutral-300"
          >
            TL;DR by Rango
          </a>
        </span>
      </div>
    </footer>
  );
}
