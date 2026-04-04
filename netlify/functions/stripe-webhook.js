// ─── Stripe Webhook Handler ───────────────────────────────────────────────────
// POST /api/stripe-webhook
//
// Listens for Stripe checkout.session.completed events.
// On successful Single Query purchase → returns a signed oracle_token.
// On successful Active Trader / Institutional → returns tier flag.
//
// The frontend reads the `?upgrade=` or `?oracle_token=` param on the
// Stripe success_url redirect instead of relying on this webhook directly.
//
// This webhook is used as a secondary verification path (optional but recommended).
//
// Required Netlify env vars:
//   STRIPE_WEBHOOK_SECRET  — from Stripe Dashboard > Webhooks > Signing secret
//   ORACLE_UNLOCK_TOKENS   — comma-sep pre-approved tokens (for Single Query)
//
// Stripe success_url should be set per price:
//   Single Query:    https://tslaquant.com?upgrade=single&oracle_token=TOKEN
//   Active Trader:   https://tslaquant.com?upgrade=active_trader
//   Institutional:   https://tslaquant.com?upgrade=institutional
//
// For Single Query, generate a token and embed in the success_url via Stripe metadata
// OR use this webhook to POST back to a serverless function that updates token store.

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// Simple token generator (use a UUID library in production)
function generateToken() {
  return Array.from({ length: 32 }, () =>
    Math.random().toString(36)[2] || '0'
  ).join('');
}

// Stripe signature verification (manual — no npm stripe package needed)
async function verifyStripeSignature(payload, sigHeader, secret) {
  const parts = sigHeader.split(',').reduce((acc, part) => {
    const [k, v] = part.split('=');
    acc[k] = v;
    return acc;
  }, {});

  const timestamp = parts.t;
  const signatures = sigHeader.split(',')
    .filter(p => p.startsWith('v1='))
    .map(p => p.slice(3));

  const signedPayload = `${timestamp}.${payload}`;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(signedPayload);

  const key = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, msgData);
  const expected = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  const valid = signatures.some(s => s === expected);
  // 5-minute tolerance
  const age = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10);
  return valid && age < 300;
}

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const sigHeader = req.headers.get('stripe-signature');
  if (!sigHeader || !STRIPE_WEBHOOK_SECRET) {
    return new Response(JSON.stringify({ error: 'Missing signature or secret' }), { status: 400 });
  }

  const body = await req.text();

  let verified = false;
  try {
    verified = await verifyStripeSignature(body, sigHeader, STRIPE_WEBHOOK_SECRET);
  } catch {
    return new Response(JSON.stringify({ error: 'Signature verification failed' }), { status: 400 });
  }

  if (!verified) {
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(body);
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  if (event.type !== 'checkout.session.completed') {
    // Acknowledge but ignore other event types
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  }

  const session = event.data?.object;
  const productType = session?.metadata?.product_type; // set in Stripe price metadata

  const response = { received: true, product_type: productType };

  if (productType === 'single_query') {
    // Generate a fresh single-use token and include in response
    // (For production: store in a DB and send via email or custom redirect)
    const token = generateToken();
    response.oracle_token = token;
    // Note: In production, you'd store this token server-side and
    // embed it in the Stripe success_url via a pre-generated URL
  }

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
};

export const config = { path: '/api/stripe-webhook' };
