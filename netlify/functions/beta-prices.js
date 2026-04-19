// beta-prices.js — fetches intraday % change for TSLA, SPY, QQQ in one call
// Returns: { tsla, spy, qqq } each with { price, changePercent, prevClose }

const CACHE_TTL_MS = 5 * 60 * 1000;
let cache = { data: null, fetchedAt: 0 };

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=300',
};

function isMarketOpen() {
  const et = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day = et.getDay();
  if (day === 0 || day === 6) return false;
  const mins = et.getHours() * 60 + et.getMinutes();
  return mins >= 570 && mins < 960;
}

async function fetchTicker(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2d`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
  });
  const data = await res.json();
  const meta = data?.chart?.result?.[0]?.meta;
  if (!meta) return null;
  const price = meta.regularMarketPrice;
  const prevClose = meta.chartPreviousClose || meta.previousClose;
  const changePercent = prevClose ? ((price - prevClose) / prevClose) * 100 : null;
  return { price, prevClose, changePercent };
}

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  const marketOpen = isMarketOpen();
  const now = Date.now();

  // Return cached data if fresh
  if (cache.data && (now - cache.fetchedAt) < CACHE_TTL_MS) {
    return new Response(JSON.stringify({ ...cache.data, marketOpen, cached: true }), { headers: CORS });
  }

  try {
    const [tsla, spy, qqq] = await Promise.all([
      fetchTicker('TSLA'),
      fetchTicker('SPY'),
      fetchTicker('QQQ'),
    ]);

    const result = { tsla, spy, qqq, marketOpen, fetchedAt: now };
    if (tsla && spy && qqq) cache = { data: result, fetchedAt: now };

    return new Response(JSON.stringify(result), { headers: CORS });
  } catch (e) {
    // Return cached even if stale on error
    if (cache.data) return new Response(JSON.stringify({ ...cache.data, marketOpen, stale: true }), { headers: CORS });
    return new Response(JSON.stringify({ error: e.message, marketOpen }), { status: 500, headers: CORS });
  }
};

export const config = { path: '/api/beta-prices' };
