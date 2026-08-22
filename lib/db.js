// Postgres persistence via Neon's serverless driver (HTTP-based, no TCP pool
// needed, ideal for Vercel functions). Every function degrades gracefully to
// a no-op / null when no database is connected yet, so the app runs fine
// locally, and on Vercel even before you have added storage.
//
// Checks every env var name Vercel's Neon integration has used, in priority
// order, so this works regardless of which exact integration flow provisioned it.
//
// This snapshot table backs the KPI cards' cached "latest" value. Trend
// charts do not depend on it, they are built from published data (see lib/history.js).

function connectionString() {
  return (
    process.env.DATABASE_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_PRISMA_URL ||
    null
  );
}

function hasDb() {
  return Boolean(connectionString());
}

let _sql = null;
async function getSql() {
  if (_sql) return _sql;
  const { neon } = await import('@neondatabase/serverless');
  _sql = neon(connectionString());
  return _sql;
}

async function ensureSchema() {
  if (!hasDb()) return false;
  try {
    const sql = await getSql();
    await sql`
      CREATE TABLE IF NOT EXISTS snapshots (
        id BIGSERIAL PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        data JSONB NOT NULL
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS snapshots_created_at_idx ON snapshots (created_at);`;
    return true;
  } catch (err) {
    console.error('[db] ensureSchema failed:', err.message);
    return false;
  }
}

async function insertSnapshot(data) {
  if (!hasDb()) return { ok: false, reason: 'no-database-configured' };
  try {
    await ensureSchema();
    const sql = await getSql();
    await sql`INSERT INTO snapshots (data) VALUES (${JSON.stringify(data)}::jsonb);`;
    return { ok: true };
  } catch (err) {
    console.error('[db] insertSnapshot failed:', err.message);
    return { ok: false, reason: err.message };
  }
}

async function getLatestSnapshot() {
  if (!hasDb()) return null;
  try {
    await ensureSchema();
    const sql = await getSql();
    const rows = await sql`SELECT created_at, data FROM snapshots ORDER BY created_at DESC LIMIT 1;`;
    if (!rows.length) return null;
    return { createdAt: rows[0].created_at, data: rows[0].data };
  } catch (err) {
    console.error('[db] getLatestSnapshot failed:', err.message);
    return null;
  }
}

async function getHistory(days = 90) {
  if (!hasDb()) return [];
  try {
    await ensureSchema();
    const sql = await getSql();
    const rows = await sql`
      SELECT created_at, data FROM snapshots
      WHERE created_at > now() - (${days} || ' days')::interval
      ORDER BY created_at ASC;
    `;
    return rows.map((r) => ({ createdAt: r.created_at, data: r.data }));
  } catch (err) {
    console.error('[db] getHistory failed:', err.message);
    return [];
  }
}

module.exports = { hasDb, ensureSchema, insertSnapshot, getLatestSnapshot, getHistory };
