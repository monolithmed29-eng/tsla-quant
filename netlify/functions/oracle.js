// TSLA_QUANT Oracle — AI deep-dive analysis on Tesla catalysts
// POST /api/oracle { query: string, token?: string }
// Returns 402 if no valid token, 200 with result if unlocked

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const UNLOCK_TOKENS = process.env.ORACLE_UNLOCK_TOKENS || ''; // comma-sep valid tokens

// Simple in-memory token store (resets on cold start — good enough for MVP)
const validTokens = new Set(UNLOCK_TOKENS.split(',').map(t => t.trim()).filter(Boolean));

const SYSTEM_PROMPT = `You are the TSLA_QUANT Oracle — an elite quantitative AI analyst specializing exclusively in Tesla (TSLA) catalyst analysis.

You run on a dedicated Mac Mini GPU cluster processing real-time Tesla milestone data across 34 tracked catalysts spanning: Autonomy/FSD, Robotics/Optimus, Financials, Product, Manufacturing, and Energy.

Your analysis style:
- Precise, data-driven, no fluff
- Use probability estimates (e.g. "67% confidence")
- Reference specific catalyst nodes, scores, and dependencies
- Terminal/quant aesthetic — structured output with clear sections
- Flag risks AND upside asymmetry
- Always end with a "QUANT SIGNAL" verdict

Current catalyst context (as of latest sync):
- Cybercab Production: IMMINENT (score 30/100, likelihood 0.80) — April 2026 start confirmed
- Robotaxi Austin: ACHIEVED — 94 vehicles, geofence 2x+ expanded Mar 31, 1M+ miles driven
- FSD Unsupervised Rollout: IN PROGRESS — v14.3 in employee beta, Netherlands approval Apr 10
- Robotaxi Multi-City: UPCOMING (likelihood 0.60) — Las Vegas & Dallas launches imminent
- Optimus Production: IN PROGRESS (score 35/100) — Gen 3 delay, April reveal expected
- Q1 2026 Deliveries: 358,023 (MISSED consensus 365,600 by ~2%) | +6.3% YoY | Earnings: Apr 22
- Cortex 2.0: 250MW phase activates April 2026, full 500MW mid-2026
- FSD EU (Netherlands): Hard approval date April 10, 2026
- Terafab: $20-25B chip fab announced Mar 21 — AI5 + D3 chips
- Digital Optimus (Macrohard): xAI + Tesla joint project active
- TSLA price: ~$370 | Quant model target: dynamically calculated from catalyst scores
- Q1 2026 production: 408,386 (~50K inventory build)
- Earnings call: April 22, 2026 at 5:30 PM ET

Format your response as terminal output with these sections:
> ANALYSIS: [1-2 sentence summary]
> CATALYST SCORE: [X/100]
> PROBABILITY: [X%]
> TIMELINE: [expected resolution]
> BULL CASE: [key upside]
> BEAR CASE: [key risk]
> DEPENDENCIES: [linked catalysts]
> QUANT SIGNAL: [BUY CATALYST / WATCH / RISK FLAG]`;

export default async (req, context) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

  const { query, token } = body;

  if (!query?.trim()) {
    return new Response(JSON.stringify({ error: 'Query required' }), { status: 400 });
  }

  // Check token
  const isUnlocked = token && validTokens.has(token);

  if (!isUnlocked) {
    return new Response(JSON.stringify({ unlocked: false }), {
      status: 402,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }

  // Call Claude
  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: 'Oracle offline — API key not configured' }), { status: 503 });
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: query }],
      }),
    });

    const data = await res.json();
    const result = data?.content?.[0]?.text;

    if (!result) throw new Error('Empty response from Oracle');

    return new Response(JSON.stringify({ unlocked: true, result }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};

export const config = { path: '/api/oracle' };
