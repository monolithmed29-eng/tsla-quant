// ─── Customer Lookup ──────────────────────────────────────────────────────────
// POST /api/customer-lookup { email, fp? }
// → { found: bool, tier, status, single_credits }
//
// Used by the "Restore Access" flow — lets subscribers reclaim their tier
// on a new device by entering their Stripe receipt email.
//
// If `fp` (browser fingerprint) is provided AND the customer has an active
// paid subscription (active_trader or institutional), we write pro: true
// into the oracle-credits store keyed by fp so server-side credit gates
// recognize this device as pro.

import { getStore } from '@netlify/blobs';

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS });
}

const PRO_TIERS = new Set(['active_trader', 'institutional']);

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body;
  try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const email = (body.email || '').toLowerCase().trim();
  const fp    = (body.fp    || '').trim();
  if (!email || !email.includes('@')) return json({ error: 'Valid email required' }, 400);

  const store = getStore('customers');
  const record = await store.get(email, { type: 'json' }).catch(() => null);

  if (!record) return json({ found: false });

  const isActive = record.status === 'active';
  const tier     = isActive ? (record.tier || null) : null;
  const isPro    = isActive && PRO_TIERS.has(tier);

  // ── Stamp fingerprint as pro on server so analyze-trade gate passes ────────
  if (fp && isPro) {
    try {
      const oracleStore = getStore('oracle-credits');
      const existing = await oracleStore.get(fp, { type: 'json' }).catch(() => null);
      const updated  = { ...(existing || {}), pro: tier, updated: Date.now() };
      await oracleStore.setJSON(fp, updated);
    } catch (e) {
      // Non-fatal — log but don't fail the response
      console.error('oracle-credits stamp failed:', e);
    }
  }

  return json({
    found: true,
    tier,
    status: record.status,
    single_credits: record.single_credits || 0,
    pro: isPro,
  });
};

export const config = { path: '/api/customer-lookup' };
