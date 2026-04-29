// TSLA_QUANT ENGINE — Mathematical Simulation for Options Strategies
// POST /api/tsla-quant { shares, cash, risk }
// Edge Function — ESM only, global fetch, no require()

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

  const risk = Math.max(1, Math.min(10, parseInt(body.risk) || 5));
  const shares = parseInt(body.shares) || 0;
  const cash = parseFloat(body.cash) || 0;

  // Fetch live TSLA price
  let currentPrice = 370.00; // fallback
  try {
    const res = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/TSLA?interval=1d&range=1d', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const data = await res.json();
    currentPrice = data.chart.result[0].meta.regularMarketPrice || currentPrice;
  } catch {
    // use fallback price
  }

  // Percentage buffer model: Risk 1 = ~23% buffer, Risk 10 = ~5% buffer
  const buffer = 0.25 - (risk * 0.02);
  const dte = 30;

  const recommendations = [];

  // COVERED CALL
  if (shares >= 100) {
    const contractCount = Math.floor(shares / 100);
    const ccStrike = Math.ceil(currentPrice * (1 + buffer));
    const premium = parseFloat(((currentPrice * 0.008) * (risk * 0.7)).toFixed(2));
    const totalCredit = parseFloat((premium * 100 * contractCount).toFixed(2));

    recommendations.push({
      category: "Monthly Income",
      strategy: "Covered Call",
      strike: ccStrike,
      exp: "30 Days Out",
      premium: premium.toFixed(2),
      contract_count: contractCount,
      total_credit: totalCredit.toFixed(2),
      aroc_annualized: ((premium / currentPrice) * (365 / dte) * 100).toFixed(1) + "%",
      match_score: (100 - (Math.abs(risk - 5) * 1.5)).toFixed(1),
      current_price: currentPrice.toFixed(2),
    });
  }

  // CASH SECURED PUT
  if (cash > 0) {
    const cspStrike = Math.floor(currentPrice * (1 - buffer));
    // Only proceed if user has enough cash for at least 1 contract
    if (cash >= cspStrike * 100) {
      const contractCount = Math.floor(cash / (cspStrike * 100));
      const premium = parseFloat(((currentPrice * 0.008) * (risk * 0.7) * 1.1).toFixed(2));
      const totalCredit = parseFloat((premium * 100 * contractCount).toFixed(2));

      recommendations.push({
        category: "Monthly Income",
        strategy: "Cash Secured Put",
        strike: cspStrike,
        exp: "30 Days Out",
        premium: premium.toFixed(2),
        contract_count: contractCount,
        total_credit: totalCredit.toFixed(2),
        aroc_annualized: ((premium / cspStrike) * (365 / dte) * 100).toFixed(1) + "%",
        match_score: (100 - (Math.abs(risk - 5) * 2)).toFixed(1),
        current_price: currentPrice.toFixed(2),
      });
    }
  }

  return new Response(JSON.stringify({ success: true, data: recommendations }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    }
  });
};

export const config = { path: '/api/tsla-quant' };
