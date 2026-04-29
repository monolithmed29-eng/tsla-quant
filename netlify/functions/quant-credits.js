// /api/quant-credits?fp=<fingerprint>
// Returns quant credit balance. Separate from oracle-credits.
// New fingerprints start at 0 (no free tier for Quant Audit).

import { getStore } from '@netlify/blobs';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS });
}

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405);

  const fp = new URL(req.url).searchParams.get('fp');
  if (!fp) return json({ error: 'fp required' }, 400);

  // Check pro status from oracle-credits (shared pro tier)
  const oracleStore = getStore('oracle-credits');
  const oracleRecord = await oracleStore.get(fp, { type: 'json' }).catch(() => null);
  const pro = oracleRecord?.pro || null;

  // Get quant-specific credits (0 by default — no free tier)
  const store = getStore('quant-credits');
  const record = await store.get(fp, { type: 'json' }).catch(() => null);
  const credits = record?.credits ?? 0;

  return json({ credits, pro });
};

export const config = { path: '/api/quant-credits' };
