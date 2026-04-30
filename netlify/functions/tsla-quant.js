// TSLA_QUANT ENGINE — Real Options Chain Simulation
// POST /api/tsla-quant { shares, cash, risk }
//
// DATA SOURCE: Yahoo Finance options chain API
//   GET https://query1.finance.yahoo.com/v7/finance/options/TSLA?date=<unix_epoch>
//   Returns full options chain for a given expiry date.
//
// PREMIUM CALCULATION:
//   Uses bid/ask MIDPOINT = (bid + ask) / 2
//   Falls back to lastPrice ONLY if bid === 0 AND ask === 0 (illiquid contract)
//   NEVER uses lastPrice as primary — it reflects stale last trade, not current market.
//
// STRIKE SELECTION:
//   Filters real strikes from the live chain within the user's buffer range.
//   Picks the strike closest to the target buffer percentage.

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

  // ── Step 1: Fetch live TSLA price ─────────────────────────────────────────
  let currentPrice = 370.00;
  try {
    const res = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/TSLA?interval=1d&range=1d',
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    const data = await res.json();
    currentPrice = data?.chart?.result?.[0]?.meta?.regularMarketPrice || currentPrice;
  } catch {
    // use fallback
  }

  // ── Step 2: Find the nearest monthly expiry ~25–35 DTE ───────────────────
  // Yahoo Finance returns available expiry timestamps via the base options endpoint
  let expiryTimestamp = null;
  let expiryLabel = '~30 Days Out';
  try {
    const res = await fetch(
      'https://query1.finance.yahoo.com/v7/finance/options/TSLA',
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    const data = await res.json();
    const expirationDates = data?.optionChain?.result?.[0]?.expirationDates || [];

    const now = Math.floor(Date.now() / 1000);
    const targetMin = now + 20 * 86400;   // at least 20 DTE
    const targetMax = now + 45 * 86400;   // at most 45 DTE

    // Pick the first expiry that falls in the 20–45 DTE window
    const preferred = expirationDates.find(ts => ts >= targetMin && ts <= targetMax);
    expiryTimestamp = preferred || expirationDates.find(ts => ts > now) || null;

    if (expiryTimestamp) {
      const d = new Date(expiryTimestamp * 1000);
      const dte = Math.round((expiryTimestamp - now) / 86400);
      expiryLabel = `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} (${dte}d)`;
    }
  } catch {
    // will use fallback below
  }

  // ── Step 3: Fetch the real options chain for that expiry ─────────────────
  let calls = [];
  let puts = [];
  const dte = expiryTimestamp
    ? Math.max(1, Math.round((expiryTimestamp - Math.floor(Date.now() / 1000)) / 86400))
    : 30;

  if (expiryTimestamp) {
    try {
      const res = await fetch(
        `https://query1.finance.yahoo.com/v7/finance/options/TSLA?date=${expiryTimestamp}`,
        { headers: { 'User-Agent': 'Mozilla/5.0' } }
      );
      const data = await res.json();
      const chain = data?.optionChain?.result?.[0]?.options?.[0];
      calls = chain?.calls || [];
      puts  = chain?.puts  || [];
    } catch {
      // chain stays empty — will use formula fallback
    }
  }

  // ── Step 4: Midpoint premium helper ──────────────────────────────────────
  // Primary: (bid + ask) / 2
  // Fallback: lastPrice (only when bid === 0 AND ask === 0)
  function midpointPremium(contract) {
    const bid = parseFloat(contract.bid) || 0;
    const ask = parseFloat(contract.ask) || 0;
    if (bid > 0 || ask > 0) {
      return parseFloat(((bid + ask) / 2).toFixed(2));
    }
    // Illiquid — fall back to lastPrice
    return parseFloat(parseFloat(contract.lastPrice || 0).toFixed(2));
  }

  // ── Step 5: Strike selection ──────────────────────────────────────────────
  // Risk 1 = ~23% OTM buffer, Risk 10 = ~5% OTM buffer
  const buffer = 0.25 - (risk * 0.02);

  // Find the real contract closest to the target strike
  function findBestContract(chain, targetStrike, side) {
    if (!chain.length) return null;
    // Filter: must have a non-zero midpoint, must be liquid (open interest > 0 preferred)
    const liquid = chain.filter(c => {
      const bid = parseFloat(c.bid) || 0;
      const ask = parseFloat(c.ask) || 0;
      const last = parseFloat(c.lastPrice) || 0;
      return (bid + ask + last) > 0;
    });
    if (!liquid.length) return null;

    // Sort by distance from target strike, pick closest
    liquid.sort((a, b) =>
      Math.abs(a.strike - targetStrike) - Math.abs(b.strike - targetStrike)
    );
    return liquid[0];
  }

  const recommendations = [];

  // ── COVERED CALL ──────────────────────────────────────────────────────────
  if (shares >= 100) {
    const contractCount = Math.floor(shares / 100);
    const targetStrike = currentPrice * (1 + buffer);
    const contract = findBestContract(calls, targetStrike, 'call');

    let strike, premium;
    if (contract) {
      strike  = parseFloat(contract.strike);
      premium = midpointPremium(contract);
    } else {
      // Formula fallback (no live data)
      strike  = Math.ceil(targetStrike);
      premium = parseFloat(((currentPrice * 0.008) * (risk * 0.7)).toFixed(2));
    }

    if (premium > 0) {
      const totalCredit = parseFloat((premium * 100 * contractCount).toFixed(2));
      recommendations.push({
        category: 'Monthly Income',
        strategy: 'Covered Call',
        strike: strike,
        exp: expiryLabel,
        premium: premium.toFixed(2),
        contract_count: contractCount,
        total_credit: totalCredit.toFixed(2),
        aroc_annualized: ((premium / currentPrice) * (365 / dte) * 100).toFixed(1) + '%',
        match_score: (100 - (Math.abs(risk - 5) * 1.5)).toFixed(1),
        current_price: currentPrice.toFixed(2),
        data_source: contract ? 'Yahoo Finance (bid/ask midpoint)' : 'Formula fallback',
      });
    }
  }

  // ── CASH SECURED PUT ──────────────────────────────────────────────────────
  if (cash > 0) {
    const targetStrike = currentPrice * (1 - buffer);
    if (cash >= targetStrike * 100) {
      const contract = findBestContract(puts, targetStrike, 'put');

      let strike, premium;
      if (contract) {
        strike  = parseFloat(contract.strike);
        premium = midpointPremium(contract);
      } else {
        // Formula fallback
        strike  = Math.floor(targetStrike);
        premium = parseFloat(((currentPrice * 0.008) * (risk * 0.7) * 1.1).toFixed(2));
      }

      if (cash >= strike * 100 && premium > 0) {
        const contractCount = Math.floor(cash / (strike * 100));
        const totalCredit = parseFloat((premium * 100 * contractCount).toFixed(2));
        recommendations.push({
          category: 'Monthly Income',
          strategy: 'Cash Secured Put',
          strike: strike,
          exp: expiryLabel,
          premium: premium.toFixed(2),
          contract_count: contractCount,
          total_credit: totalCredit.toFixed(2),
          aroc_annualized: ((premium / strike) * (365 / dte) * 100).toFixed(1) + '%',
          match_score: (100 - (Math.abs(risk - 5) * 2)).toFixed(1),
          current_price: currentPrice.toFixed(2),
          data_source: contract ? 'Yahoo Finance (bid/ask midpoint)' : 'Formula fallback',
        });
      }
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
