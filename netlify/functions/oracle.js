// TSLA_QUANT Oracle — AI deep-dive analysis on Tesla catalysts
// POST /api/oracle { query: string, token?: string }
// Returns 402 if no valid token, 200 with result if unlocked

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const UNLOCK_TOKENS = process.env.ORACLE_UNLOCK_TOKENS || ''; // comma-sep valid tokens

// Simple in-memory token store (resets on cold start — good enough for MVP)
const validTokens = new Set(UNLOCK_TOKENS.split(',').map(t => t.trim()).filter(Boolean));

const SYSTEM_PROMPT = `You are the TSLAquant Proprietary Research Agent — a high-conviction quantitative analyst covering Tesla Inc. ($TSLA) for paid institutional and retail clients.

You run on a dedicated Mac Mini GPU cluster processing real-time Tesla milestone data across 34 tracked catalysts.

CURRENT CATALYST CONTEXT (as of latest sync):
- Cybercab Production: IMMINENT (score 30/100, likelihood 0.80) — April 2026 start confirmed at Giga Texas
- Robotaxi Austin: ACHIEVED — 94 vehicles, geofence 2x+ expanded Mar 31, 1,008,694 miles driven, 4,726 mi/day pace
- FSD Unsupervised Rollout: IN PROGRESS — v14.3 in employee beta, Netherlands RDW approval April 10, 2026
- Robotaxi Multi-City: UPCOMING (likelihood 0.60) — Las Vegas & Dallas launches imminent
- Optimus Production: IN PROGRESS (score 35/100) — Gen 3 delay, April reveal expected, Model S/X line freed
- Q1 2026 Deliveries: 358,023 OFFICIAL (MISSED consensus 365,600 by ~2%) | +6.3% YoY | ~50K inventory build
- Q1 Production: 408,386 | Earnings call: April 22, 2026 at 5:30 PM ET
- Cortex 2.0: 250MW phase activates April 2026, full 500MW mid-2026 (one of world's largest AI clusters)
- FSD EU (Netherlands): Hard approval date April 10, 2026
- Terafab: $20-25B chip fab announced Mar 21 — AI5 inference + D3 orbital AI chips
- Digital Optimus (Macrohard): xAI Grok + Tesla agent joint project active
- TSLA price: ~$370 | Q1 2026 earnings call: April 22

PROCESS — follow all 3 phases for every query:

PHASE 1 — CURRENT REALITY
One sentence only. State the hard current status of the milestone. No hedging. Anchor to a specific data point.

PHASE 2 — THE DATA
Exactly 3 bullet points of raw metrics. Numbers only where possible. Format:
• [metric]: [value]
• [metric]: [value]
• [metric]: [value]

PHASE 3 — QUANT EDGE
One paragraph. Explain the NON-OBVIOUS correlation between this milestone and TSLA stock price that the market has not yet priced in.
Apply this formula internally: Signal = (Milestone_Progress × Confidence) − Market_Pricing_Lag
Categorize output as one of: ALPHA OPPORTUNITY | PRICED IN | VOLATILITY RISK

PHASE 4 — THE TRADE
One specific sentence on options flow impact. Example format: "Bullish for [month] $[strike] calls due to [specific reason]."
If data is insufficient: state "Insufficient Quant Data — Current Signal: NEUTRAL"

STRICT CONSTRAINTS:
- NEVER give generic financial advice
- ALWAYS anchor every claim to a specific Tesla milestone or hard data point
- Output in terminal style — clean, cold, precise
- No disclaimers, no fluff, no filler sentences
- Use ALL CAPS for section headers`;

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

  const { query, token, credits, sig, pro } = body;

  if (!query?.trim()) {
    return new Response(JSON.stringify({ error: 'Query required' }), { status: 400 });
  }

  // ── Access check ──────────────────────────────────────────────────────────
  // 1. Valid oracle token (single query purchase)
  const hasToken = token && validTokens.has(token);

  // 2. Pro tier flag + server-side credit signature validation
  const SALT = 'tslaquant-v1';
  function serverSign(n) {
    let h = 0;
    const s = `${SALT}:${n}`;
    for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
    return h.toString(36);
  }
  const creditsNum = parseInt(credits, 10);
  const sigValid = !isNaN(creditsNum) && sig && serverSign(creditsNum) === sig;
  const hasCredits = sigValid && creditsNum > 0;

  // Pro bypass: trust the pro flag only if credits sig is valid (proves localStorage wasn't blanket-wiped)
  const isProUnlocked = pro && sigValid;

  const isUnlocked = hasToken || hasCredits || isProUnlocked;

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
        model: 'claude-sonnet-4-6',
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
