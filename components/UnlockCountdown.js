import { daysUntil, fmtDate, fmtNum } from '../lib/format';

export default function UnlockCountdown({ nextEvent, monthlyUnlockEna, vestingEndDate }) {
  const days = nextEvent ? daysUntil(nextEvent.date) : null;

  return (
    <div className="card flex flex-col gap-3">
      <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400">ENA Unlock Countdown</div>

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
        Roughly <strong>{fmtNum(monthlyUnlockEna)} ENA per month</strong> enters circulation from Core Contributor and
        Investor vesting until it ends on {fmtDate(vestingEndDate)}. This is steady sell pressure any rally has to out-run.
      </p>
    </div>
  );
}
