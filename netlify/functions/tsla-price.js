// Cache price in memory for 5 minutes to minimize function invocations
let cache = { price: null, fetchedAt: 0 };
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export default async (req, context) => {
  const now = Date.now();

  // Return cached price if still fresh
  if (cache.price && (now - cache.fetchedAt) < CACHE_TTL_MS) {
    return new Response(JSON.stringify({ price: cache.price, cached: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300', // also tell browser to cache 5 min
      }
    });
  }

  try {
    const res = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/TSLA?interval=1d&range=1d',
      { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } }
    );
    const data = await res.json();
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;

    if (price) {
      cache = { price, fetchedAt: now };
    }

    return new Response(JSON.stringify({ price: price || cache.price || null }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
      }
    });
  } catch (e) {
    // Return stale cache on error rather than failing
    return new Response(JSON.stringify({ price: cache.price || null, error: e.message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};

export const config = { path: '/api/tsla-price' };
