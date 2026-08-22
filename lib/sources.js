// ─────────────────────────────────────────────────────────────────────────────
// Raw data-source fetchers. Every function here is defensive by design:
// it NEVER throws — it always resolves to { ok, value, asOf, source, error }.
// A failure in one source must never take down the rest of the dashboard.
// ─────────────────────────────────────────────────────────────────────────────

const { createPublicClient, http, formatUnits } = require('viem');
const { mainnet } = require('viem/chains');

const TIMEOUT_MS = 8000;

// Verified against Ethena's own docs (docs.ethena.fi/technical-design/key-addresses)
const ADDR = {
  ENA_TOKEN: '0x57e114B691Db790C35207b2e685D4A43181e6061',
  SENA_TOKEN: '0x8bE3460A480c80728a8C4D7a5D5303c85ba7B3b9',
  USDE_TOKEN: '0x4c9EDD5852cd905f086C759E8383e09bff1E68B3',
  RESERVE_FUND: '0x2b5AB59163a6e93b4486f6055D33cA4a115dD4D5'
};

const PUBLIC_RPCS = [
  process.env.ETH_RPC_URL,
  'https://eth.llamarpc.com',
  'https://ethereum-rpc.publicnode.com',
  'https://cloudflare-eth.com'
].filter(Boolean);

const ERC20_ABI = [
  { name: 'totalSupply', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] }
];

function ok(value, extra = {}) {
  return { ok: true, value, asOf: new Date().toISOString(), error: null, ...extra };
}
function fail(error, extra = {}) {
  return { ok: false, value: null, asOf: new Date().toISOString(), error: String(error?.message || error), ...extra };
}

async function fetchJson(url, opts = {}) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal, headers: { accept: 'application/json', ...(opts.headers || {}) } });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

async function fetchText(url) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

let _rpcClient = null;
async function getRpcClient() {
  if (_rpcClient) return _rpcClient;
  for (const url of PUBLIC_RPCS) {
    try {
      const client = createPublicClient({ chain: mainnet, transport: http(url, { timeout: TIMEOUT_MS }) });
      await client.getBlockNumber(); // smoke test
      _rpcClient = client;
      return client;
    } catch {
      continue; // try next RPC in the list
    }
  }
  throw new Error('All public RPC endpoints unreachable');
}

// ── ENA price, market cap, 24h change ──────────────────────────────────────
async function fetchEnaMarket() {
  try {
    const d = await fetchJson(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethena&vs_currencies=usd&include_market_cap=true&include_24hr_change=true'
    );
    const e = d.ethena;
    if (!e) throw new Error('CoinGecko: no "ethena" entry');
    return ok({ priceUsd: e.usd, marketCapUsd: e.usd_market_cap, change24hPct: e.usd_24h_change }, { source: 'coingecko' });
  } catch (err) {
    // Fallback: DefiLlama's coins API (also free, no key)
    try {
      const d = await fetchJson('https://coins.llama.fi/prices/current/coingecko:ethena');
      const p = d?.coins?.['coingecko:ethena'];
      if (!p) throw new Error('DefiLlama fallback: no price');
      return ok({ priceUsd: p.price, marketCapUsd: null, change24hPct: null }, { source: 'defillama-fallback', warning: 'market cap unavailable from fallback source' });
    } catch (err2) {
      return fail(err2, { source: 'coingecko+defillama' });
    }
  }
}

async function fetchEthPriceUsd() {
  try {
    const d = await fetchJson('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
    return ok(d.ethereum.usd, { source: 'coingecko' });
  } catch (err) {
    return fail(err, { source: 'coingecko' });
  }
}

// ── USDe circulating supply ─────────────────────────────────────────────────
async function fetchUsdeSupply() {
  try {
    const d = await fetchJson('https://stablecoins.llama.fi/stablecoins?includePrices=false');
    const asset = (d.peggedAssets || []).find((a) => a.symbol === 'USDe' || a.name === 'Ethena USDe');
    if (!asset) throw new Error('USDe not found in DefiLlama stablecoins list');
    const circUsd = asset.circulating?.peggedUSD ?? null;
    return ok(circUsd, { source: 'defillama-stablecoins', assetId: asset.id });
  } catch (err) {
    // Fallback: protocol TVL as a rough proxy
    try {
      const d = await fetchJson('https://api.llama.fi/protocol/ethena');
      const tvls = d.chainTvls?.Ethereum;
      const last = Array.isArray(tvls) ? tvls[tvls.length - 1] : null;
      if (!last) throw new Error('No fallback TVL data');
      return ok(last.totalLiquidityUSD, { source: 'defillama-protocol-fallback', warning: 'proxy via protocol TVL, not exact circulating supply' });
    } catch (err2) {
      return fail(err2, { source: 'defillama' });
    }
  }
}

// ── sUSDe APY ────────────────────────────────────────────────────────────────
async function fetchSusdeApy() {
  try {
    const d = await fetchJson('https://yields.llama.fi/pools');
    const pool = (d.data || []).find((p) => p.project === 'ethena' && /SUSDE/i.test(p.symbol));
    if (!pool) throw new Error('sUSDe pool not found in DefiLlama yields');
    return ok(pool.apy, { source: 'defillama-yields', apyBase: pool.apyBase, apyReward: pool.apyReward, tvlUsd: pool.tvlUsd });
  } catch (err) {
    return fail(err, { source: 'defillama-yields' });
  }
}

// ── 3-month T-bill yield (risk-free rate benchmark) ─────────────────────────
async function fetchTBillRate() {
  try {
    const csv = await fetchText('https://fred.stlouisfed.org/graph/fredgraph.csv?id=DTB3');
    const lines = csv.trim().split('\n').filter(Boolean);
    // Walk from the end to find the last row with a real numeric value (FRED uses "." for missing days)
    for (let i = lines.length - 1; i >= 1; i--) {
      const [date, val] = lines[i].split(',');
      const num = parseFloat(val);
      if (!Number.isNaN(num)) {
        return ok(num, { source: 'fred', asOfDate: date });
      }
    }
    throw new Error('No numeric DTB3 value found in FRED CSV');
  } catch (err) {
    // Conservative static fallback so the spread calc never breaks — update if this goes stale.
    return fail(err, { source: 'fred', fallbackValue: 3.6 });
  }
}

// ── ETH & BTC perp funding rates (OKX — no key, not geo-restricted) ─────────
async function fetchFundingRates() {
  const instruments = { ETH: 'ETH-USD-SWAP', BTC: 'BTC-USD-SWAP' };
  const out = {};
  let anyOk = false;
  for (const [asset, instId] of Object.entries(instruments)) {
    try {
      const d = await fetchJson(`https://www.okx.com/api/v5/public/funding-rate?instId=${instId}`);
      const row = d?.data?.[0];
      if (!row) throw new Error(`No funding-rate row for ${instId}`);
      const perPeriod = parseFloat(row.fundingRate); // OKX settles every 8h
      const annualizedPct = perPeriod * 3 * 365 * 100;
      out[asset] = annualizedPct;
      anyOk = true;
    } catch (err) {
      out[asset] = null;
    }
  }
  if (!anyOk) return fail('OKX funding-rate fetch failed for both assets', { source: 'okx' });
  const values = Object.values(out).filter((v) => v !== null);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return ok(avg, { source: 'okx', perAsset: out });
}

// ── Aave / Morpho USDe concentration (loop-exposure proxy) ──────────────────
async function fetchLoopExposure(usdeSupplyUsd) {
  try {
    const d = await fetchJson('https://yields.llama.fi/pools');
    const pools = (d.data || []).filter(
      (p) => /^USDE$/i.test(p.symbol) && ['aave-v3', 'morpho-blue'].includes(p.project)
    );
    const totalParked = pools.reduce((sum, p) => sum + (p.tvlUsd || 0), 0);
    if (!usdeSupplyUsd || usdeSupplyUsd <= 0) throw new Error('USDe supply unavailable, cannot compute %');
    const pct = (totalParked / usdeSupplyUsd) * 100;
    return ok(pct, { source: 'defillama-yields', totalParkedUsd: totalParked, byMarket: pools.map((p) => ({ project: p.project, chain: p.chain, tvlUsd: p.tvlUsd })) });
  } catch (err) {
    return fail(err, { source: 'defillama-yields' });
  }
}

// ── sENA staking ratio (on-chain, public RPC, no key) ───────────────────────
async function fetchSEnaStakingRatio(enaCirculatingSupply) {
  try {
    const client = await getRpcClient();
    const [sEnaSupplyRaw, decimals] = await Promise.all([
      client.readContract({ address: ADDR.SENA_TOKEN, abi: ERC20_ABI, functionName: 'totalSupply' }),
      client.readContract({ address: ADDR.SENA_TOKEN, abi: ERC20_ABI, functionName: 'decimals' })
    ]);
    const sEnaSupply = parseFloat(formatUnits(sEnaSupplyRaw, decimals));
    if (!enaCirculatingSupply || enaCirculatingSupply <= 0) throw new Error('ENA circulating supply unavailable');
    const pct = (sEnaSupply / enaCirculatingSupply) * 100;
    return ok(pct, { source: 'onchain', sEnaSupply });
  } catch (err) {
    return fail(err, { source: 'onchain' });
  }
}

// ── Reserve Fund balance (on-chain, public RPC, no key) ─────────────────────
async function fetchReserveFundUsd(ethPriceUsd) {
  try {
    const client = await getRpcClient();
    const [ethBalanceRaw, usdeBalanceRaw, usdeDecimals] = await Promise.all([
      client.getBalance({ address: ADDR.RESERVE_FUND }),
      client.readContract({ address: ADDR.USDE_TOKEN, abi: ERC20_ABI, functionName: 'balanceOf', args: [ADDR.RESERVE_FUND] }),
      client.readContract({ address: ADDR.USDE_TOKEN, abi: ERC20_ABI, functionName: 'decimals' })
    ]);
    const ethBalance = parseFloat(formatUnits(ethBalanceRaw, 18));
    const usdeBalance = parseFloat(formatUnits(usdeBalanceRaw, usdeDecimals));
    const ethUsd = ethPriceUsd || 0;
    const totalUsd = ethBalance * ethUsd + usdeBalance; // USDe ≈ $1
    return ok(totalUsd, { source: 'onchain', ethBalance, usdeBalance });
  } catch (err) {
    return fail(err, { source: 'onchain' });
  }
}

// ── Converge chain TVL (auto-populates once DefiLlama indexes it) ──────────
async function fetchConvergeTvl() {
  try {
    const d = await fetchJson('https://api.llama.fi/v2/chains');
    const chain = (d || []).find((c) => /converge/i.test(c.name));
    if (!chain) return ok(null, { source: 'defillama-chains', notIndexedYet: true });
    return ok(chain.tvl, { source: 'defillama-chains' });
  } catch (err) {
    return fail(err, { source: 'defillama-chains' });
  }
}

module.exports = {
  ADDR,
  fetchEnaMarket,
  fetchEthPriceUsd,
  fetchUsdeSupply,
  fetchSusdeApy,
  fetchTBillRate,
  fetchFundingRates,
  fetchLoopExposure,
  fetchSEnaStakingRatio,
  fetchReserveFundUsd,
  fetchConvergeTvl
};
