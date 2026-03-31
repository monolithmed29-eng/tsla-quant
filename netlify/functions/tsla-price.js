// Cache price in memory for 5 minutes to minimize function invocations
let cache = { price: null, fetchedAt: 0 };
const CACHE_TTL_MS = 5 * 60 * 1000;

function isMarketOpen() {
  const now = new Date();
  // Convert to ET
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day = et.getDay(); // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return false;
  const hours = et.getHours();
  const minutes = et.getMinutes();
  const timeInMinutes = hours * 60 + minutes;
  return timeInMinutes >= 570 && timeInMinutes < 960; // 9:30am = 570, 4:00pm = 960
}

export default async (req, context) => {
  if (!isMarketOpen()) {
    return new Response(JSON.stringify({ price: cache.price, marketOpen: false }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
      }
    });
  }

  const now = Date.now();
  if (cache.price && (now - cache.fetchedAt) < CACHE_TTL_MS) {
    return new Response(JSON.stringify({ price: cache.price, marketOpen: true, cached: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
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
    if (price) cache = { price, fetchedAt: now };

    return new Response(JSON.stringify({ price: price || cache.price || null, marketOpen: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ price: cache.price || null, marketOpen: true, error: e.message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};

export const config = { path: '/api/tsla-price' };
