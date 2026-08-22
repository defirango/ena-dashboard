'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RefreshButton() {
  const router = useRouter();
  const [state, setState] = useState('idle'); // idle | loading | error | rate-limited

  async function handleClick() {
    setState('loading');
    try {
      const res = await fetch('/api/refresh-now', { method: 'POST' });
      const body = await res.json();
      if (res.status === 429) {
        setState('rate-limited');
        setTimeout(() => setState('idle'), 4000);
        return;
      }
      if (!body.ok) {
        setState('error');
        setTimeout(() => setState('idle'), 4000);
        return;
      }
      setState('idle');
      router.refresh();
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 4000);
    }
  }

  const label =
    state === 'loading' ? 'Refreshing...' :
    state === 'rate-limited' ? 'Refreshed recently. Try again soon.' :
    state === 'error' ? 'Refresh failed. Try again.' :
    'Refresh now';

  return (
    <button
      onClick={handleClick}
      disabled={state === 'loading'}
      className="rounded-full border border-neutral-300 bg-white px-4 py-1.5 text-sm font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
    >
      {label}
    </button>
  );
}
