// Builds the data behind the trend charts from published sources (CoinGecko,
// DefiLlama, FRED). This runs on every page load, so charts show real history
// immediately after deploy. No database or waiting period required.

const sources = require('./sources');

function dayKey(date) {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD, used to line up series by day
}

// Collapses a raw [{date, value}] series to one value per calendar day
// (the last reading of that day wins).
function toDailyMap(series) {
  const map = new Map();
  for (const point of series) {
    if (!point || point.value === null || point.value === undefined) continue;
    map.set(dayKey(point.date), point.value);
  }
  return map;
}

async function computeChartHistory(days = 90) {
  const [enaRes, apyRes, supplyRes, tbillRes] = await Promise.all([
    sources.fetchEnaPriceHistory(days),
    sources.fetchSusdeApyHistory(days),
    sources.fetchUsdeSupplyHistory(days),
    sources.fetchTBillHistory(days)
  ]);

  const enaMap = enaRes.ok ? toDailyMap(enaRes.value) : new Map();
  const apyMap = apyRes.ok ? toDailyMap(apyRes.value) : new Map();
  const supplyMap = supplyRes.ok ? toDailyMap(supplyRes.value) : new Map();
  const tbillMap = tbillRes.ok ? toDailyMap(tbillRes.value) : new Map();

  const allKeys = new Set([...enaMap.keys(), ...apyMap.keys(), ...supplyMap.keys(), ...tbillMap.keys()]);
  const sortedKeys = Array.from(allKeys).sort();

  const rows = sortedKeys.map((key) => {
    const d = new Date(`${key}T00:00:00Z`);
    return {
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
      enaPrice: enaMap.get(key) ?? null,
      susdeApy: apyMap.get(key) ?? null,
      tbill: tbillMap.get(key) ?? null,
      usdeSupply: supplyMap.get(key) ?? null
    };
  });

  const warnings = [enaRes, apyRes, supplyRes, tbillRes]
    .filter((r) => !r.ok)
    .map((r) => ({ source: r.source, error: r.error }));

  return { rows, warnings };
}

module.exports = { computeChartHistory };
