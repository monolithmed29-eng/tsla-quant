// LeapsSignal.jsx — LEAPS Signal Card for Roger's Trading Corner
// Data fetched live from data/leaps-signal.json (no build needed to update)

import { useRemoteData } from './useRemoteData';

const FONT = "'Space Grotesk', sans-serif";

const FALLBACK = {
  strike: 340,
  expiry: "2027-06-17",
  type: "CALL",
  premium: 11245,
  efficiency: 3.436,
  iv: 56.0,
  quant_note: "Highest efficiency at the highest strike — the model is paying you to reach further.",
  updated: "Apr 22, 2026 · 9am ET",
};

export default function LeapsSignal({ isMobile = false }) {
  const { data: signal, loading } = useRemoteData('leaps-signal.json', FALLBACK);

  if (loading) return null;

  const expFormatted = signal.expiry
    ? new Date(signal.expiry + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : signal.expiry;

  const premiumFormatted = signal.premium
    ? `$${signal.premium.toLocaleString()}`
    : '—';

  return (
    <div style={{
      fontFamily: FONT,
      background: '#030608',
      border: '1px solid #00aaff22',
      borderTop: '2px solid #00aaff',
      padding: isMobile ? '14px 16px' : '18px 28px',
      position: 'relative',
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '14px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '10px', letterSpacing: '2.5px', textTransform: 'uppercase', color: '#00aaff', fontWeight: 800 }}>
            ⚡ LEAPS Signal
          </span>
          <span style={{
            fontSize: '8px', letterSpacing: '1.5px', textTransform: 'uppercase',
            color: '#00ff88', border: '1px solid #00ff8833', padding: '1px 6px',
            background: 'rgba(0,255,136,0.06)',
          }}>AI · High Conviction</span>
        </div>
        <span style={{ fontSize: '9px', color: '#aaa', letterSpacing: '1px' }}>{signal.updated}</span>
      </div>

      {/* Signal row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '20px',
        flexWrap: 'wrap', marginBottom: '14px', minWidth: 0,
      }}>
        {/* Strike + type */}
        <div>
          <div style={{ fontSize: '9px', color: '#ffffff', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 700 }}>Signal</div>
          <div style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px', lineHeight: 1 }}>
            ${signal.strike} {signal.type}
          </div>
          <div style={{ fontSize: '10px', color: '#cccccc', marginTop: '3px' }}>{expFormatted}</div>
        </div>

        <div style={{ width: '1px', height: '44px', background: '#111', flexShrink: 0 }} />

        {/* Entry */}
        <div>
          <div style={{ fontSize: '9px', color: '#ffffff', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 700 }}>Entry</div>
          <div style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: 700, color: '#00ff88', letterSpacing: '-0.3px' }}>
            {premiumFormatted}
          </div>
        </div>

        <div style={{ width: '1px', height: '44px', background: '#111', flexShrink: 0 }} />

        {/* Efficiency */}
        <div>
          <div style={{ fontSize: '9px', color: '#ffffff', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 700 }}>Efficiency</div>
          <div style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: 700, color: '#00aaff', letterSpacing: '-0.3px' }}>
            {signal.efficiency?.toFixed(3)}
          </div>
        </div>

        <div style={{ width: '1px', height: '44px', background: '#111', flexShrink: 0 }} />

        {/* IV */}
        <div>
          <div style={{ fontSize: '9px', color: '#ffffff', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 700 }}>IV</div>
          <div style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: 700, color: '#f59e0b', letterSpacing: '-0.3px' }}>
            {signal.iv?.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Quant Note — terminal green */}
      <div style={{
        background: 'rgba(0,255,136,0.04)',
        border: '1px solid #00ff8822',
        padding: '10px 14px',
        borderLeft: '3px solid #00ff88',
      }}>
        <div style={{ fontSize: '9px', color: '#00ff88', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '5px', fontWeight: 700 }}>
          Quant Note
        </div>
        <div style={{
          fontFamily: 'monospace',
          fontSize: isMobile ? '11px' : '12px',
          color: '#00ff88',
          lineHeight: 1.7,
          letterSpacing: '0.2px',
          wordBreak: 'break-word',
          overflowWrap: 'anywhere',
          whiteSpace: 'normal',
          maxWidth: '100%',
        }}>
          `{signal.quant_note}`
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{ fontSize: '9px', color: '#333', marginTop: '10px', lineHeight: 1.5 }}>
        Not financial advice. For informational purposes only.
      </div>
    </div>
  );
}
