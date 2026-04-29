// /api/analyze-trade — AI-powered trade explanation
// POST { fp, strategy, strike, premium, aroc_annualized, risk, current_price, contract_count }
// Requires positive credit balance. Decrements 1 credit per call.

import { getStore } from '@netlify/blobs';

const FREE_CREDITS = 3;
const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-3-5-sonnet-20241022';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS });
}

const SYSTEM_PROMPT = `You are the TSLA_QUANT analytical engine. Your role is to explain options strategy selections in objective, institutional-grade language.

Rules:
- No greetings, no "I", no "you should", no fluff
- Lead with the math, not the opinion
- Max 200 words — tight, gritty, useful
- Always include: (1) why this strike distance at this risk level, (2) break-even price, (3) probability-of-assignment context
- Use "The simulation identified..." or "This strike was selected because..." — never "I recommend"
- End with a one-line risk factor`;

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body;
  try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { fp, strategy, strike, premium, aroc_annualized, risk, current_price, contract_count } = body;
  if (!fp) return json({ error: 'fp required' }, 400);
  if (!strategy || !strike || !premium || !risk || !current_price) {
    return json({ error: 'Missing required fields' }, 400);
  }

  // ── Credit gate (server-authoritative) ────────────────────────────────────
  const store = getStore('oracle-credits');
  let record = await store.get(fp, { type: 'json' }).catch(() => null);
  if (!record) record = { credits: FREE_CREDITS, pro: null, created: Date.now() };

  // No free credits — hard gate
  if (!record.pro && record.credits <= 0) {
    return json({ credits: 0, denied: true, error: 'No credits remaining' }, 402);
  }

  // Decrement (pro users don't consume credits)
  if (!record.pro) {
    record.credits = Math.max(0, record.credits - 1);
    await store.setJSON(fp, record);
  }

  // ── Build prompt ──────────────────────────────────────────────────────────
  const isPut = strategy.toLowerCase().includes('put');
  const bufferPct = isPut
    ? (((current_price - strike) / current_price) * 100).toFixed(1)
    : (((strike - current_price) / current_price) * 100).toFixed(1);
  const breakeven = isPut
    ? (parseFloat(strike) - parseFloat(premium)).toFixed(2)
    : (parseFloat(strike) + parseFloat(premium)).toFixed(2);
  const contracts = contract_count || 1;

  const userPrompt = `Strategy: ${strategy}
Risk Level: ${risk}/10
TSLA Current Price: $${current_price}
Strike: $${strike} (${bufferPct}% ${isPut ? 'below' : 'above'} current price)
Premium: $${premium}/contract
Total Credit: $${(premium * 100 * contracts).toFixed(2)} (${contracts} contract${contracts > 1 ? 's' : ''})
AROC: ${aroc_annualized}
Break-even at expiry: $${breakeven}

Explain why this strike and premium were selected at risk level ${risk}/10, what the break-even means, and the probability-of-assignment context.`;

  // ── Call Claude ───────────────────────────────────────────────────────────
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) return json({ error: 'API key not configured' }, 500);

  let analysis = '';
  try {
    const res = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });
    const data = await res.json();
    analysis = data.content?.[0]?.text || 'Analysis unavailable.';
  } catch (err) {
    // Restore credit on API failure
    if (!record.pro) {
      record.credits = Math.min(record.credits + 1, FREE_CREDITS);
      await store.setJSON(fp, record);
    }
    return json({ error: 'Analysis engine error: ' + err.message }, 500);
  }

  return json({
    success: true,
    analysis,
    credits: record.credits,
    pro: record.pro || null,
  });
};

export const config = { path: '/api/analyze-trade' };
