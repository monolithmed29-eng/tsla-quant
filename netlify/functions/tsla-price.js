export default async (req, context) => {
  try {
    const res = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/TSLA?interval=1d&range=1d',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json',
        }
      }
    );
    const data = await res.json();
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    return new Response(JSON.stringify({ price: price || null }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ price: null, error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config = { path: '/api/tsla-price' };
