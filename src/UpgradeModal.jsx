// ─── UpgradeModal ─────────────────────────────────────────────────────────────
// Shown when credits hit 0, or when gated content is clicked.
// `reason` prop: 'no_credits' | 'price_contribution' | 'pdf_upload'

import { setProStatus } from './creditManager';

// ── Stripe Price IDs (set via Netlify env vars) ───────────────────────────────
// VITE_STRIPE_KEY_SINGLE_QUERY   → Stripe Payment Link for $0.99 one-shot
// VITE_STRIPE_KEY_ACTIVE_TRADER  → Stripe Payment Link for $29/mo
// VITE_STRIPE_KEY_INSTITUTIONAL  → Stripe Payment Link for $129/mo
//
// In Stripe dashboard: create Payment Links, set success_url to
//   https://tslaquant.com?upgrade=active_trader   (or institutional / single)
// Then store those URLs as Netlify env vars:
//   VITE_STRIPE_LINK_SINGLE, VITE_STRIPE_LINK_TRADER, VITE_STRIPE_LINK_INST
const STRIPE_SINGLE      = import.meta.env.VITE_STRIPE_LINK_SINGLE      || 'https://buy.stripe.com/PLACEHOLDER_SINGLE';
const STRIPE_TRADER      = import.meta.env.VITE_STRIPE_LINK_TRADER      || 'https://buy.stripe.com/PLACEHOLDER_TRADER';
const STRIPE_INST        = import.meta.env.VITE_STRIPE_LINK_INST        || 'https://buy.stripe.com/PLACEHOLDER_INST';

const TIERS = [
  {
    id: 'single',
    label: 'Single Query',
    price: '$0.99',
    cadence: 'one-time',
    features: ['1 Oracle AI analysis', 'Full 4-phase quant report', 'No subscription'],
    highlight: false,
    cta: 'Buy One Query',
    link: STRIPE_SINGLE,
  },
  {
    id: 'active_trader',
    label: 'Active Trader',
    price: '$29',
    cadence: '/ month',
    features: ['Unlimited Oracle queries', 'All catalyst price contributions', 'Real-time model updates'],
    highlight: true,
    cta: 'Start Trading Edge',
    link: STRIPE_TRADER,
  },
  {
    id: 'institutional',
    label: 'Institutional',
    price: '$129',
    cadence: '/ month',
    features: ['Everything in Active Trader', 'PDF upload & analysis', 'Priority Oracle processing', 'Raw data export'],
    highlight: false,
    cta: 'Unlock Institutional',
    link: STRIPE_INST,
  },
];

const REASON_COPY = {
  no_credits: {
    eyebrow: 'Credits Used',
    headline: 'You\'ve used all 3 free queries.',
    sub: 'Upgrade to keep the edge going.',
  },
  price_contribution: {
    eyebrow: 'Pro Feature',
    headline: 'Exact price contribution is gated.',
    sub: 'See exactly how much each catalyst moves the model price.',
  },
  pdf_upload: {
    eyebrow: 'Institutional Feature',
    headline: 'PDF upload requires Institutional tier.',
    sub: 'Upload earnings reports and Tesla documents for AI analysis.',
  },
};

const glowAnim = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes tierPulse {
    0%,100% { box-shadow: 0 0 0 1px #e5393544, 0 0 20px 6px #e5393522; }
    50%     { box-shadow: 0 0 0 1px #e53935aa, 0 0 28px 10px #e5393533; }
  }
`;

export default function UpgradeModal({ reason = 'no_credits', onClose }) {
  const copy = REASON_COPY[reason] || REASON_COPY.no_credits;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 800,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
    >
      <style>{glowAnim}</style>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#08090a',
          border: '1px solid #1e1e1e',
          maxWidth: '760px',
          width: '100%',
          padding: '40px 44px',
          animation: 'fadeInUp 0.3s ease',
          position: 'relative',
          fontFamily: "'Space Grotesk', sans-serif",
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'none', border: 'none', color: '#444',
            cursor: 'pointer', fontSize: '18px',
          }}
        >✕</button>

        {/* Header */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <div style={{ fontSize: '9px', letterSpacing: '4px', color: '#e53935', textTransform: 'uppercase', marginBottom: '10px' }}>
            {copy.eyebrow}
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
            {copy.headline}
          </div>
          <div style={{ fontSize: '13px', color: '#666', letterSpacing: '0.3px' }}>
            {copy.sub}
          </div>
        </div>

        {/* Tier cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
        }}>
          {TIERS.map(tier => (
            <div
              key={tier.id}
              style={{
                background: tier.highlight ? '#0d0d0d' : '#0a0b0c',
                border: tier.highlight ? '1px solid #e53935' : '1px solid #1e1e1e',
                padding: '24px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                animation: tier.highlight ? 'tierPulse 3s ease-in-out infinite' : 'none',
                position: 'relative',
              }}
            >
              {tier.highlight && (
                <div style={{
                  position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)',
                  background: '#e53935', color: '#fff',
                  fontSize: '8px', letterSpacing: '2px', textTransform: 'uppercase',
                  padding: '3px 12px',
                }}>
                  Most Popular
                </div>
              )}

              <div>
                <div style={{ fontSize: '10px', letterSpacing: '2px', color: tier.highlight ? '#e53935' : '#555', textTransform: 'uppercase', marginBottom: '6px' }}>
                  {tier.label}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontSize: '26px', fontWeight: 700, color: '#fff' }}>{tier.price}</span>
                  <span style={{ fontSize: '11px', color: '#555' }}>{tier.cadence}</span>
                </div>
              </div>

              <div style={{ height: '1px', background: '#1a1a1a' }} />

              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '7px', flex: 1 }}>
                {tier.features.map(f => (
                  <li key={f} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '11px', color: '#aaa', lineHeight: 1.5 }}>
                    <span style={{ color: tier.highlight ? '#e53935' : '#444', marginTop: '1px', flexShrink: 0 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href={tier.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  background: tier.highlight ? '#e53935' : 'transparent',
                  border: tier.highlight ? 'none' : '1px solid #333',
                  color: tier.highlight ? '#fff' : '#888',
                  textAlign: 'center',
                  padding: '10px 0',
                  fontSize: '10px',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: tier.highlight ? 600 : 400,
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                  marginTop: 'auto',
                }}
                onMouseEnter={e => {
                  if (!tier.highlight) {
                    e.currentTarget.style.borderColor = '#666';
                    e.currentTarget.style.color = '#fff';
                  } else {
                    e.currentTarget.style.background = '#c62828';
                  }
                }}
                onMouseLeave={e => {
                  if (!tier.highlight) {
                    e.currentTarget.style.borderColor = '#333';
                    e.currentTarget.style.color = '#888';
                  } else {
                    e.currentTarget.style.background = '#e53935';
                  }
                }}
              >
                {tier.cta}
              </a>
            </div>
          ))}
        </div>

        {/* Fine print */}
        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '10px', color: '#333', letterSpacing: '0.5px' }}>
          Payments secured by Stripe · Cancel monthly plans anytime
        </div>
      </div>
    </div>
  );
}
