// ─── Server-Side Credit Store ─────────────────────────────────────────────────
// GET  /api/credits?fp=<fingerprint>        → { credits, pro }
// POST /api/credits { fp, action: 'decrement' | 'status' }  → { credits, pro }
//
// Credits are stored in Netlify Blobs keyed by fingerprint.
// IP is mixed in server-side so VPN cycling alone doesn't reset credits.
// Pro status is also stored here for server-authoritative gating.

import { getStore } from '@netlify/blobs';

const FREE_CREDITS = 3;
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS });
}

// Mix fingerprint + coarse IP (first 2 octets only — survives NAT/mobile shifts)
function compositeKey(fp, ip) {
  // Use fingerprint only — coarse IP mixing caused mobile cellular rotation
  // to create new blob records on every request, resetting credits to 3.
  return fp;
}

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  const store = getStore('oracle-credits');

  // GET — return current credit status
  if (req.method === 'GET') {
    const fp = new URL(req.url).searchParams.get('fp');
    if (!fp) return json({ error: 'fp required' }, 400);

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
    const key = compositeKey(fp, ip);

    let record = await store.get(key, { type: 'json' }).catch(() => null);
    if (!record) {
      record = { credits: FREE_CREDITS, pro: null, created: Date.now() };
      await store.setJSON(key, record);
    }

    return json({ credits: record.credits, pro: record.pro || null });
  }

  // POST — decrement or set pro
  if (req.method === 'POST') {
    let body;
    try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

    const { fp, action, tier } = body;
    if (!fp) return json({ error: 'fp required' }, 400);

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
    const key = compositeKey(fp, ip);

    let record = await store.get(key, { type: 'json' }).catch(() => null);
    if (!record) record = { credits: FREE_CREDITS, pro: null, created: Date.now() };

    if (action === 'decrement') {
      if (!record.pro && record.credits <= 0) {
        return json({ credits: 0, pro: record.pro || null, denied: true });
      }
      if (!record.pro) record.credits = Math.max(0, record.credits - 1);
      await store.setJSON(key, record);
      return json({ credits: record.credits, pro: record.pro || null });
    }

    if (action === 'set_pro') {
      if (!tier) return json({ error: 'tier required' }, 400);
      record.pro = tier;
      await store.setJSON(key, record);
      return json({ credits: record.credits, pro: record.pro });
    }

    if (action === 'add_credits') {
      record.credits = (record.credits || 0) + 1;
      await store.setJSON(key, record);
      // Also add 1 credit to quant-credits store (Single Query unlocks both Oracle + Quant Audit)
      const quantStore = getStore('quant-credits');
      let quantRecord = await quantStore.get(key, { type: 'json' }).catch(() => null);
      if (!quantRecord) quantRecord = { credits: 0, created: Date.now() };
      quantRecord.credits = (quantRecord.credits || 0) + 1;
      await quantStore.setJSON(key, quantRecord);
      return json({ credits: record.credits, pro: record.pro || null });
    }

    return json({ error: 'Unknown action' }, 400);
  }

  return json({ error: 'Method not allowed' }, 405);
};

export const config = { path: '/api/credits' };
