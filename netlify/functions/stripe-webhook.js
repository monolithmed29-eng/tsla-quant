// ─── Stripe Webhook Handler ───────────────────────────────────────────────────
// POST /api/stripe-webhook
//
// Events handled:
//   checkout.session.completed  → record customer, grant tier/credit
//   invoice.paid                → renew monthly subscription
//   customer.subscription.deleted → revoke pro access
//   invoice.payment_failed      → mark as lapsed
//
// Customer records stored in Netlify Blobs store: 'customers'
//   key: email (lowercase)
//   value: { stripe_customer_id, email, tier, status, subscription_id, created, updated }
//
// Tier discrimination by amount_total (cents):
//   99    → single_query  (one-time)
//   2900  → active_trader (subscription)
//   12900 → institutional (subscription)
//
// Required Netlify env vars:
//   STRIPE_WEBHOOK_SECRET

import { getStore } from '@netlify/blobs';

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS });
}

function tierFromAmount(amountCents, mode) {
  if (mode === 'payment' && amountCents === 99)    return 'single_query';
  if (amountCents === 2900)  return 'active_trader';
  if (amountCents === 12900) return 'institutional';
  return null;
}

async function verifyStripeSignature(payload, sigHeader, secret) {
  const parts = sigHeader.split(',').reduce((acc, part) => {
    const [k, v] = part.split('=');
    acc[k] = v;
    return acc;
  }, {});
  const timestamp = parts.t;
  const signatures = sigHeader.split(',').filter(p => p.startsWith('v1=')).map(p => p.slice(3));
  const signedPayload = `${timestamp}.${payload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
  const expected = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
  const valid = signatures.some(s => s === expected);
  const age = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10);
  return valid && age < 300;
}

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const sigHeader = req.headers.get('stripe-signature');
  if (!sigHeader || !STRIPE_WEBHOOK_SECRET) {
    return json({ error: 'Missing signature or secret' }, 400);
  }

  const body = await req.text();
  let verified = false;
  try { verified = await verifyStripeSignature(body, sigHeader, STRIPE_WEBHOOK_SECRET); }
  catch { return json({ error: 'Signature verification error' }, 400); }
  if (!verified) return json({ error: 'Invalid signature' }, 401);

  let event;
  try { event = JSON.parse(body); }
  catch { return json({ error: 'Invalid JSON' }, 400); }

  const store = getStore('customers');
  const now = Date.now();

  // ── checkout.session.completed ────────────────────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = (session.customer_details?.email || session.customer_email || '').toLowerCase().trim();
    const customerId = session.customer;
    const amountCents = session.amount_total;
    const mode = session.mode; // 'payment' | 'subscription'
    const tier = tierFromAmount(amountCents, mode);
    const subscriptionId = session.subscription || null;

    if (email && tier) {
      let record = await store.get(email, { type: 'json' }).catch(() => null);
      if (!record) {
        record = { email, stripe_customer_id: customerId, tier: null, status: 'active', subscription_id: null, single_credits: 0, created: now, updated: now };
      }
      record.stripe_customer_id = customerId;
      record.updated = now;

      if (tier === 'single_query') {
        record.single_credits = (record.single_credits || 0) + 1;
        record.status = 'active';
        // Don't overwrite a subscription tier with 'single_query'
        if (!record.tier || record.tier === 'single_query') record.tier = 'single_query';
      } else {
        record.tier = tier;
        record.status = 'active';
        record.subscription_id = subscriptionId;
      }

      await store.setJSON(email, record);
      // Also index by stripe_customer_id for webhook lookups
      if (customerId) await store.setJSON(`cid_${customerId}`, { email });
    }
    return json({ received: true, tier, email });
  }

  // ── invoice.paid → renew subscription ────────────────────────────────────
  if (event.type === 'invoice.paid') {
    const invoice = event.data.object;
    const customerId = invoice.customer;
    if (!customerId) return json({ received: true });

    const idx = await store.get(`cid_${customerId}`, { type: 'json' }).catch(() => null);
    if (!idx?.email) return json({ received: true });

    const record = await store.get(idx.email, { type: 'json' }).catch(() => null);
    if (!record) return json({ received: true });

    record.status = 'active';
    record.updated = now;
    await store.setJSON(idx.email, record);
    return json({ received: true, renewed: idx.email });
  }

  // ── customer.subscription.deleted → revoke ────────────────────────────────
  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    const customerId = sub.customer;
    if (!customerId) return json({ received: true });

    const idx = await store.get(`cid_${customerId}`, { type: 'json' }).catch(() => null);
    if (!idx?.email) return json({ received: true });

    const record = await store.get(idx.email, { type: 'json' }).catch(() => null);
    if (!record) return json({ received: true });

    record.tier = null;
    record.status = 'cancelled';
    record.subscription_id = null;
    record.updated = now;
    await store.setJSON(idx.email, record);
    return json({ received: true, cancelled: idx.email });
  }

  // ── invoice.payment_failed → lapse ───────────────────────────────────────
  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object;
    const customerId = invoice.customer;
    if (!customerId) return json({ received: true });

    const idx = await store.get(`cid_${customerId}`, { type: 'json' }).catch(() => null);
    if (!idx?.email) return json({ received: true });

    const record = await store.get(idx.email, { type: 'json' }).catch(() => null);
    if (!record) return json({ received: true });

    record.status = 'lapsed';
    record.updated = now;
    await store.setJSON(idx.email, record);
    return json({ received: true, lapsed: idx.email });
  }

  // Acknowledge all other events
  return json({ received: true });
};

export const config = { path: '/api/stripe-webhook' };
