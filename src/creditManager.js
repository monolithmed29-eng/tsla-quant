// ─── TSLAquant Credit Manager ────────────────────────────────────────────────
// Manages guest credits (3 free), pro status, and tamper detection.

const CREDIT_KEY  = 'tsla_credits';
const SIG_KEY     = 'tsla_credits_sig';
const PRO_KEY     = 'tsla_pro_status';  // 'active_trader' | 'institutional' | null
const SALT        = 'tslaquant-v1';

// Lightweight deterministic hash (anti-casual-tamper, not cryptographic)
function sign(credits) {
  let h = 0;
  const s = `${SALT}:${credits}`;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return h.toString(36);
}

function _setCredits(n) {
  localStorage.setItem(CREDIT_KEY, String(n));
  localStorage.setItem(SIG_KEY, sign(n));
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Read current credit count. Auto-initialises to 3 on first visit. Resets tampered values. */
export function getCredits() {
  const raw = localStorage.getItem(CREDIT_KEY);
  const sig = localStorage.getItem(SIG_KEY);
  if (raw === null) { _setCredits(3); return 3; }
  const n = parseInt(raw, 10);
  if (isNaN(n) || sign(n) !== sig) { _setCredits(3); return 3; } // tamper reset
  return n;
}

/** Subtract 1 credit after a successful search. Returns new count. */
export function decrementCredit() {
  const n = getCredits();
  const next = Math.max(0, n - 1);
  _setCredits(next);
  return next;
}

/** Sync server-authoritative credit count into localStorage (called after server responds). */
export function syncCredits(n) {
  if (typeof n === 'number' && n >= 0) _setCredits(n);
}

/** Add credits (e.g. after Single Query purchase). Returns new count. */
export function addCredits(amount = 1) {
  const n = getCredits();
  const next = n + amount;
  _setCredits(next);
  return next;
}

/** Get pro tier string or null. */
export function getProStatus() {
  return localStorage.getItem(PRO_KEY) || null;
}

/** Set pro tier after verified subscription payment. */
export function setProStatus(tier) {
  if (tier) {
    localStorage.setItem(PRO_KEY, tier);
  } else {
    localStorage.removeItem(PRO_KEY);
  }
}

/** True if any paid monthly plan is active. */
export function isPro() {
  return !!getProStatus();
}

/** True only for Institutional tier (enables PDF uploads + price contributions). */
export function isInstitutional() {
  return getProStatus() === 'institutional';
}

// ── Backend Validation Helper (Mac Mini) ──────────────────────────────────────
// When a client sends { credits, sig } to your backend to prove their credit
// count hasn't been tampered with, validate it server-side with this function.
//
// Usage (Node.js / Mac Mini server):
//   const { validateCreditPayload } = require('./creditManager');
//   if (!validateCreditPayload({ credits: req.body.credits, sig: req.body.sig })) {
//     return res.status(403).json({ error: 'Credit payload tampered' });
//   }
//
export function validateCreditPayload({ credits, sig, salt = SALT }) {
  let h = 0;
  const s = `${salt}:${credits}`;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return h.toString(36) === sig;
}

/** Get raw sig for a given credit count (for sending to backend for validation). */
export function getCreditSig() {
  return localStorage.getItem(SIG_KEY) || '';
}
