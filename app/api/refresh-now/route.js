import { computeAllMetrics } from '../../../lib/metrics';
import { insertSnapshot, getLatestSnapshot } from '../../../lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MIN_INTERVAL_MS = 5 * 60 * 1000; // don't let the public "Refresh now" button be spammed

export async function POST() {
  try {
    const latest = await getLatestSnapshot();
    if (latest) {
      const ageMs = Date.now() - new Date(latest.createdAt).getTime();
      if (ageMs < MIN_INTERVAL_MS) {
        return Response.json(
          { ok: false, error: 'rate-limited', retryAfterMs: MIN_INTERVAL_MS - ageMs, snapshot: latest.data },
          { status: 429 }
        );
      }
    }

    const snapshot = await computeAllMetrics();
    const dbResult = await insertSnapshot(snapshot);
    return Response.json({ ok: true, storedInDb: dbResult.ok, snapshot });
  } catch (err) {
    console.error('[refresh-now] failed:', err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
