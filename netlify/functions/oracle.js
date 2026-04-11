// TSLA_QUANT Oracle — AI deep-dive analysis on Tesla catalysts
// POST /api/oracle { query, fp, token? }
// Returns 402 if no valid credits/token, 200 with result if unlocked

import { getStore } from '@netlify/blobs';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const UNLOCK_TOKENS = process.env.ORACLE_UNLOCK_TOKENS || '';
const FREE_CREDITS = 3;

const validTokens = new Set(UNLOCK_TOKENS.split(',').map(t => t.trim()).filter(Boolean));

function compositeKey(fp, ip) {
  // Use fingerprint only — coarse IP mixing caused mobile cellular rotation
  // to create new blob records on every request, resetting credits to 3.
  return fp;
}

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

  const { query, fp, token, content } = body;

  if (!query?.trim()) {
    return new Response(JSON.stringify({ error: 'Query required' }), { status: 400 });
  }

  // ── Access check ──────────────────────────────────────────────────────────
  const hasToken = token && validTokens.has(token);

  // Server-side credit/pro check via Netlify Blobs
  let serverRecord = null;
  let blobKey = null;
  if (fp) {
    try {
      const store = getStore('oracle-credits');
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
      blobKey = compositeKey(fp, ip);
      serverRecord = await store.get(blobKey, { type: 'json' }).catch(() => null);
      if (!serverRecord) {
        serverRecord = { credits: FREE_CREDITS, pro: null, created: Date.now() };
        await store.setJSON(blobKey, serverRecord);
      }
    } catch { /* blob unavailable — fall through to token check */ }
  }

  const isPro = serverRecord?.pro;
  const hasServerCredits = serverRecord && serverRecord.credits > 0;
  const isUnlocked = hasToken || isPro || hasServerCredits;

  if (!isUnlocked) {
    return new Response(JSON.stringify({ unlocked: false, credits: serverRecord?.credits ?? 0 }), {
      status: 402,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  // Build Claude message content — text only, or text + document/image (institutional only)
  const isInstitutional = serverRecord?.pro === 'institutional' || hasToken;
  const hasAttachment = Array.isArray(content) && content.some(c => c.type === 'document' || c.type === 'image');
  if (hasAttachment && !isInstitutional) {
    return new Response(JSON.stringify({ error: 'Document upload requires Institutional tier.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
  const userContent = Array.isArray(content) && content.length > 0
    ? content
    : [{ type: 'text', text: query }];

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
        max_tokens: 1200,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userContent }],
      }),
    });

    const data = await res.json();
    const result = data?.content?.[0]?.text;

    if (!result) throw new Error('Empty response from Oracle');

    // Decrement server-side credits (skip for pro — token holders still burn credits)
    let creditsRemaining = serverRecord?.credits ?? 0;
    if (!isPro && serverRecord && blobKey) {
      try {
        const store = getStore('oracle-credits');
        serverRecord.credits = Math.max(0, serverRecord.credits - 1);
        await store.setJSON(blobKey, serverRecord);
        creditsRemaining = serverRecord.credits; // updated count post-decrement
      } catch {
        // blob write failed — still decrement in-memory so response reflects real state
        creditsRemaining = Math.max(0, creditsRemaining - 1);
      }
    }

    return new Response(JSON.stringify({ unlocked: true, result, credits: creditsRemaining }), {
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
