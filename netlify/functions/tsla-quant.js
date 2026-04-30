// TSLA_QUANT ENGINE — Real Options Chain Simulation
// POST /api/tsla-quant { shares, cash, risk }
//
// DATA SOURCE: CBOE Delayed Quotes API (no auth required)
//   GET https://cdn.cboe.com/api/global/delayed_quotes/options/TSLA.json
//   Returns full options chain with real bid/ask/OI/IV for all expirations.
//   ~15-min delayed during market hours. Free, no API key.
//
// PREMIUM CALCULATION:
//   Midpoint = (bid + ask) / 2  ← ALWAYS primary
//   Fallback = lastPrice only if bid=0 AND ask=0 (illiquid/no market)
//
// STRIKE SELECTION:
//   Parses OCC option symbols (e.g. TSLA260530C00380000) to get expiry + strike.
//   Filters to 20–45 DTE window, selects strike closest to risk-adjusted buffer.

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

  const risk    = Math.max(1, Math.min(10, parseInt(body.risk)    || 5));
  const shares  = parseInt(body.shares)   || 0;
  const cash    = parseFloat(body.cash)   || 0;
  const buffer  = 0.25 - (risk * 0.02);   // Risk 1 = ~23% OTM, Risk 10 = ~5% OTM

  // ── Step 1: Fetch CBOE options chain ────────────────────────────────────
  let currentPrice = 370.00;
  let calls = [];
  let puts  = [];
  let dataSource = 'Formula fallback (CBOE unavailable)';

  try {
    const res = await fetch(
      'https://cdn.cboe.com/api/global/delayed_quotes/options/TSLA.json',
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    const data = await res.json();
    const chainData = data?.data;

    if (chainData) {
      currentPrice = chainData.current_price || currentPrice;
      const now = Date.now() / 1000;

      // Parse each option from OCC symbol: TSLA260530C00380000
      // Format: TSLAYYMMDD[C/P]STRIKE*1000 (8 digits, zero-padded)
      const OCC_RE = /^TSLA(\d{2})(\d{2})(\d{2})([CP])(\d{8})$/;

      for (const o of (chainData.options || [])) {
        if (!o || typeof o !== 'object') continue;
        const sym = o.option || '';
        const m = OCC_RE.exec(sym);
        if (!m) continue;

        const [, yy, mm, dd, cp, strikeRaw] = m;
        const expDate = new Date(2000 + parseInt(yy), parseInt(mm) - 1, parseInt(dd));
        const dte = (expDate.getTime() / 1000 - now) / 86400;

        // Only consider 20–45 DTE window
        if (dte < 20 || dte > 45) continue;

        const strike = parseInt(strikeRaw) / 1000;
        const bid    = parseFloat(o.bid)  || 0;
        const ask    = parseFloat(o.ask)  || 0;
        const last   = parseFloat(o.last_trade_price || o.change || 0);
        const oi     = parseFloat(o.open_interest) || 0;

        // Midpoint premium — fall back to last only if truly no market
        const mid = (bid > 0 || ask > 0) ? (bid + ask) / 2 : last;

        const contract = {
          strike,
          bid,
          ask,
          mid: parseFloat(mid.toFixed(2)),
          dte: Math.round(dte),
          exp: expDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          oi,
          symbol: sym,
        };

        if (cp === 'C') calls.push(contract);
        else            puts.push(contract);
      }

      if (calls.length > 0 || puts.length > 0) {
        dataSource = 'CBOE Delayed Quotes (bid/ask midpoint)';
      }
    }
  } catch {
    // falls through to formula fallback
  }

  // ── Step 2: Select best contract near target strike ──────────────────────
  function bestContract(chain, targetStrike) {
    if (!chain.length) return null;
    // Filter: must have a real midpoint > 0, prefer liquid (OI > 0)
    const liquid = chain.filter(c => c.mid > 0);
    if (!liquid.length) return null;
    // Sort by distance from target strike
    liquid.sort((a, b) => Math.abs(a.strike - targetStrike) - Math.abs(b.strike - targetStrike));
    return liquid[0];
  }

  const recommendations = [];

  // ── COVERED CALL ──────────────────────────────────────────────────────────
  if (shares >= 100) {
    const contractCount  = Math.floor(shares / 100);
    const targetStrike   = currentPrice * (1 + buffer);
    const contract       = bestContract(calls, targetStrike);

    let strike, premium, exp, dte;
    if (contract) {
      strike  = contract.strike;
      premium = contract.mid;
      exp     = `${contract.exp} (${contract.dte}d)`;
      dte     = contract.dte;
    } else {
      // Formula fallback
      strike  = Math.ceil(targetStrike);
      premium = parseFloat(((currentPrice * 0.008) * (risk * 0.7)).toFixed(2));
      exp     = '~30 Days Out';
      dte     = 30;
    }

    if (premium > 0) {
      const totalCredit = parseFloat((premium * 100 * contractCount).toFixed(2));
      recommendations.push({
        category:         'Monthly Income',
        strategy:         'Covered Call',
        strike,
        exp,
        premium:          premium.toFixed(2),
        contract_count:   contractCount,
        total_credit:     totalCredit.toFixed(2),
        aroc_annualized:  ((premium / currentPrice) * (365 / dte) * 100).toFixed(1) + '%',
        match_score:      (100 - Math.abs(risk - 5) * 1.5).toFixed(1),
        current_price:    currentPrice.toFixed(2),
        data_source:      contract ? dataSource : 'Formula fallback',
      });
    }
  }

  // ── CASH SECURED PUT ──────────────────────────────────────────────────────
  if (cash > 0) {
    const targetStrike = currentPrice * (1 - buffer);
    if (cash >= targetStrike * 100) {
      const contract = bestContract(puts, targetStrike);

      let strike, premium, exp, dte;
      if (contract) {
        strike  = contract.strike;
        premium = contract.mid;
        exp     = `${contract.exp} (${contract.dte}d)`;
        dte     = contract.dte;
      } else {
        strike  = Math.floor(targetStrike);
        premium = parseFloat(((currentPrice * 0.008) * (risk * 0.7) * 1.1).toFixed(2));
        exp     = '~30 Days Out';
        dte     = 30;
      }

      if (cash >= strike * 100 && premium > 0) {
        const contractCount = Math.floor(cash / (strike * 100));
        const totalCredit   = parseFloat((premium * 100 * contractCount).toFixed(2));
        recommendations.push({
          category:         'Monthly Income',
          strategy:         'Cash Secured Put',
          strike,
          exp,
          premium:          premium.toFixed(2),
          contract_count:   contractCount,
          total_credit:     totalCredit.toFixed(2),
          aroc_annualized:  ((premium / strike) * (365 / dte) * 100).toFixed(1) + '%',
          match_score:      (100 - Math.abs(risk - 5) * 2).toFixed(1),
          current_price:    currentPrice.toFixed(2),
          data_source:      contract ? dataSource : 'Formula fallback',
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
