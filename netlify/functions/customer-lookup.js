// ─── Customer Lookup ──────────────────────────────────────────────────────────
// POST /api/customer-lookup { email }
// → { found: bool, tier, status, single_credits }
//
// Used by the "Restore Access" flow — lets subscribers reclaim their tier
// on a new device by entering their Stripe receipt email.

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

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body;
  try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const email = (body.email || '').toLowerCase().trim();
  if (!email || !email.includes('@')) return json({ error: 'Valid email required' }, 400);

  const store = getStore('customers');
  const record = await store.get(email, { type: 'json' }).catch(() => null);

  if (!record) return json({ found: false });

  // Only return active/valid records
  const isActive = record.status === 'active';
  return json({
    found: true,
    tier: isActive ? (record.tier || null) : null,
    status: record.status,
    single_credits: record.single_credits || 0,
  });
};

export const config = { path: '/api/customer-lookup' };
