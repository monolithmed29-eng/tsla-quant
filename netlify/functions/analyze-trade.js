// /api/analyze-trade — AI-powered trade explanation
// POST { fp, strategy, strike, premium, aroc_annualized, risk, current_price, contract_count }
// Requires positive credit balance. Decrements 1 credit per call.

import { getStore } from '@netlify/blobs';

const FREE_CREDITS = 0; // Quant Audit has no free tier — purchase required
const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

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
  const store = getStore('quant-credits');
  // Also check pro status from oracle-credits store (shared pro tier)
  const oracleStore = getStore('oracle-credits');
  const oracleRecord = await oracleStore.get(fp, { type: 'json' }).catch(() => null);
  const isPro = oracleRecord?.pro || null;

  let record = await store.get(fp, { type: 'json' }).catch(() => null);
  if (!record) record = { credits: FREE_CREDITS, created: Date.now() };

  // No free credits — hard gate (pro users from oracle store bypass)
  if (!isPro && record.credits <= 0) {
    return json({ credits: 0, denied: true, error: 'No credits remaining' }, 402);
  }

  // Decrement (pro users don't consume credits)
  if (!isPro) {
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
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return json({ error: 'API key not configured' }, 500);

  let analysis = '';
  try {
    if (!apiKey) return json({ error: 'ANTHROPIC_API_KEY not set in environment' }, 500);

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
    // Surface API errors clearly
    if (data.error) return json({ error: `Anthropic error: ${data.error.message || JSON.stringify(data.error)}` }, 500);
    analysis = data.content?.[0]?.text || `Parse failed: ${JSON.stringify(data).slice(0, 200)}`;
  } catch (err) {
    // Restore credit on API failure
    if (!record.pro) {
      record.credits = record.credits + 1;
      await store.setJSON(fp, record);
    }
    return json({ error: 'Analysis engine error: ' + err.message }, 500);
  }

  return json({
    success: true,
    analysis,
    credits: record.credits,
    pro: isPro,
  });
};

export const config = { path: '/api/analyze-trade' };
