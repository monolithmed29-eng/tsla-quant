// TSLA_QUANT ENGINE — Mathematical Simulation for Options Strategies
// POST /api/tsla-quant { shares, cash, risk }

// Cumulative Normal Distribution (Black-Scholes)
function stdNormalCDF(x) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.7814779 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - p : p;
}

// Black-Scholes Delta
function calculateDelta(S, K, T, sigma, type = 'put') {
  const r = 0.043;
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  return type === 'call' ? stdNormalCDF(d1) : stdNormalCDF(d1) - 1;
}

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const shares = parseInt(body.shares) || 0;
  const cash = parseFloat(body.cash) || 0;
  const risk = Math.max(1, Math.min(10, parseInt(body.risk) || 5));

  try {
    // Fetch live TSLA price
    const priceRes = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/TSLA');
    const priceData = await priceRes.json();
    const S = priceData.chart.result[0].meta.regularMarketPrice;

    const targetDelta = 0.08 + (risk * 0.035);
    const iv = 0.48; // TSLA avg IV
    const dte = 30;
    const T = dte / 365;

    const recommendations = [];

    // STRATEGY A: CASH SECURED PUT
    if (cash >= (S * 0.8 * 100)) {
      const cspStrike = Math.floor(S * (1 - (targetDelta * 0.6)));
      const premium = parseFloat(((S * 0.03) * (risk / 5)).toFixed(2));
      const aroc = ((premium / cspStrike) * (365 / dte) * 100).toFixed(1);
      const score = (100 - (Math.abs(risk - 5) * 2)).toFixed(1);
      const delta = calculateDelta(S, cspStrike, T, iv, 'put');

      recommendations.push({
        category: "Monthly Income",
        strategy: "Cash Secured Put",
        strike: cspStrike,
        exp: "30 Days Out",
        premium: premium.toFixed(2),
        total_credit: (premium * 100).toFixed(2),
        aroc_annualized: aroc + "%",
        delta: delta.toFixed(2),
        match_score: score,
      });
    }

    // STRATEGY B: COVERED CALL
    if (shares >= 100) {
      const ccStrike = Math.ceil(S * (1 + (targetDelta * 0.5)));
      const premium = parseFloat(((S * 0.025) * (risk / 5)).toFixed(2));
      const aroc = ((premium / S) * (365 / dte) * 100).toFixed(1);
      const score = (100 - (Math.abs(risk - 5) * 1.5)).toFixed(1);
      const delta = calculateDelta(S, ccStrike, T, iv, 'call');

      recommendations.push({
        category: "Monthly Income",
        strategy: "Covered Call",
        strike: ccStrike,
        exp: "30 Days Out",
        premium: premium.toFixed(2),
        total_credit: (premium * 100).toFixed(2),
        aroc_annualized: aroc + "%",
        delta: delta.toFixed(2),
        match_score: score,
      });
    }

    return new Response(JSON.stringify({ success: true, data: recommendations }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};

export const config = { path: '/api/tsla-quant' };
