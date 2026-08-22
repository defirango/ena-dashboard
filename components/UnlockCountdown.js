import { daysUntil, fmtDate, fmtNum } from '../lib/format';

export default function UnlockCountdown({ nextEvent, monthlyUnlockEna, vestingEndDate }) {
  const days = nextEvent ? daysUntil(nextEvent.date) : null;

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-center gap-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">
        <span aria-hidden="true">⏳</span>
        <span>ENA Unlock Countdown</span>
      </div>

      {nextEvent ? (
        <>
          <div className="text-2xl font-semibold tracking-tight">
            {days !== null && days >= 0 ? `${fmtNum(days, { compact: false })} days` : 'Now unlocking'}
          </div>
          <div className="text-sm text-neutral-500 dark:text-neutral-400">
            Until: {nextEvent.label} ({fmtDate(nextEvent.date)})
          </div>
        </>
      ) : (
        <div className="text-2xl font-semibold tracking-tight">No scheduled events</div>
      )}

      <p className="text-sm leading-snug text-neutral-700 dark:text-neutral-300">
        Roughly <strong>{fmtNum(monthlyUnlockEna)} ENA/month</strong> enters circulation from Core Contributor + Investor
        vesting until vesting completes on {fmtDate(vestingEndDate)}. This is steady sell-side supply that any bullish
        catalyst has to out-run.
      </p>
    </div>
  );
}
