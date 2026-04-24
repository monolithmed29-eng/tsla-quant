// ThetaGangSignal.jsx — Theta Gang Signal Card for Roger's Trading Corner
// Data fetched live from data/theta-gang.json (no build needed to update)
// Shows two cards: best CSP + best CC independently

import { useRemoteData } from './useRemoteData';

const FONT = "'Space Grotesk', sans-serif";

const FALLBACK = {
  updated: "Apr 23, 2026 · 11pm ET",
  csp: {
    signal_type: "PUT",
    strike: 350.0,
    expiry: "2026-05-22",
    premium: 7.62,
    aroc: 28.38,
    delta: -0.26,
    conviction: "STANDARD",
    quant_note: "The $350 CSP May 22 leads all CSP candidates at 28.38% AROC with 28 DTE — near-peak Theta decay territory. At -0.26 delta the strike sits ~5.9% OTM from ~$372, providing a meaningful cushion against near-term volatility.",
  },
  cc: {
    signal_type: "CALL",
    strike: 405.0,
    expiry: "2026-05-22",
    premium: 7.10,
    aroc: 24.80,
    delta: 0.27,
    conviction: "STANDARD",
    quant_note: "The $405 CC May 22 is the top CC candidate at 24.80% AROC with 28 DTE. Strike sits ~$33 OTM (~8.9% above ~$372), offering solid upside buffer while collecting premium. Shorter expiry maximizes Theta decay rate vs the May 29 equivalent.",
  },
};

function SignalCard({ signal, updated, isMobile }) {
  if (!signal) return null;

  const expFormatted = signal.expiry
    ? new Date(signal.expiry + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : signal.expiry;

  const premiumFormatted = signal.premium ? `$${Number(signal.premium).toFixed(2)}` : '—';
  const isHighConviction = signal.conviction === 'HIGH CONVICTION';
  const convictionColor = isHighConviction ? '#00ff88' : '#f59e0b';
  const convictionBg = isHighConviction ? 'rgba(0,255,136,0.08)' : 'rgba(245,158,11,0.08)';
  const convictionBorder = isHighConviction ? '#00ff8833' : '#f59e0b33';
  const isPut = signal.signal_type === 'PUT';
  const signalColor = isPut ? '#a78bfa' : '#38bdf8';
  const label = isPut ? '⚡ Cash Secured Put' : '⚡ Covered Call';

  return (
    <div style={{
      fontFamily: FONT,
      background: '#030608',
      border: '1px solid #00aaff22',
      borderTop: `2px solid ${isPut ? '#a78bfa' : '#38bdf8'}`,
      padding: isMobile ? '14px 16px' : '18px 28px',
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '10px', letterSpacing: '2.5px', textTransform: 'uppercase', color: signalColor, fontWeight: 800 }}>
            {label}
          </span>
          <span style={{
            fontSize: '8px', letterSpacing: '1.5px', textTransform: 'uppercase',
            color: convictionColor, border: `1px solid ${convictionBorder}`,
            padding: '1px 6px', background: convictionBg,
          }}>AI · {signal.conviction}</span>
        </div>
        <span style={{ fontSize: '9px', color: '#aaa', letterSpacing: '1px' }}>{updated}</span>
      </div>

      {/* Signal row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '20px',
        flexWrap: 'wrap', marginBottom: '14px', minWidth: 0,
      }}>
        <div>
          <div style={{ fontSize: '9px', color: '#ffffff', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 700 }}>Signal</div>
          <div style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 800, color: signalColor, letterSpacing: '-0.5px', lineHeight: 1 }}>
            ${signal.strike} {signal.signal_type}
          </div>
          <div style={{ fontSize: '10px', color: '#cccccc', marginTop: '3px' }}>{expFormatted}</div>
        </div>

        <div style={{ width: '1px', height: '44px', background: '#111', flexShrink: 0 }} />

        <div>
          <div style={{ fontSize: '9px', color: '#ffffff', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 700 }}>Entry (Premium)</div>
          <div style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: 700, color: '#00ff88', letterSpacing: '-0.3px' }}>
            {premiumFormatted}
          </div>
        </div>

        <div style={{ width: '1px', height: '44px', background: '#111', flexShrink: 0 }} />

        <div>
          <div style={{ fontSize: '9px', color: '#ffffff', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 700 }}>AROC</div>
          <div style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: 700, color: '#f59e0b', letterSpacing: '-0.3px' }}>
            {signal.aroc?.toFixed(2)}%
          </div>
        </div>

        <div style={{ width: '1px', height: '44px', background: '#111', flexShrink: 0 }} />

        <div>
          <div style={{ fontSize: '9px', color: '#ffffff', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 700 }}>Delta</div>
          <div style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.3px' }}>
            {signal.delta?.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Quant Note */}
      <div style={{
        background: `rgba(${isPut ? '167,139,250' : '56,189,248'},0.04)`,
        border: `1px solid ${signalColor}22`,
        padding: '10px 14px',
        borderLeft: `3px solid ${signalColor}`,
      }}>
        <div style={{ fontSize: '9px', color: signalColor, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '5px', fontWeight: 700 }}>
          Quant Note
        </div>
        <div style={{
          fontFamily: 'monospace',
          fontSize: isMobile ? '11px' : '12px',
          color: signalColor,
          lineHeight: 1.7,
          letterSpacing: '0.2px',
          wordBreak: 'break-word',
          overflowWrap: 'anywhere',
          whiteSpace: 'normal',
          maxWidth: '100%',
        }}>
          {signal.quant_note}
        </div>
      </div>

      <div style={{ fontSize: '9px', color: '#333', marginTop: '10px', lineHeight: 1.5 }}>
        Not financial advice. For informational purposes only.
      </div>
    </div>
  );
}

export default function ThetaGangSignal({ isMobile = false }) {
  const { data, loading } = useRemoteData('theta-gang.json', FALLBACK);

  if (loading) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', width: '100%' }}>
      <SignalCard signal={data.csp} updated={data.updated} isMobile={isMobile} />
      <SignalCard signal={data.cc} updated={data.updated} isMobile={isMobile} />
    </div>
  );
}
