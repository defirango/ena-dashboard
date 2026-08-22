import { computeAllMetrics } from '../../../../lib/metrics';
import { insertSnapshot } from '../../../../lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Vercel Cron automatically sends `Authorization: Bearer <CRON_SECRET>` when
// the CRON_SECRET env var is set on the project — this checks that header so
// nobody else can trigger unlimited external API calls from your public URL.
function isAuthorized(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // no secret configured yet — allow (see README to lock this down)
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

export async function GET(request) {
  if (!isAuthorized(request)) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const snapshot = await computeAllMetrics();
    const dbResult = await insertSnapshot(snapshot);
    return Response.json({
      ok: true,
      storedInDb: dbResult.ok,
      dbReason: dbResult.reason ?? null,
      generatedAt: snapshot.generatedAt,
      warnings: snapshot.warnings
    });
  } catch (err) {
    console.error('[cron/refresh] failed:', err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
