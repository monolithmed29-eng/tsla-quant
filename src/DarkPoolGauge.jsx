import { useState, useEffect } from 'react';
import { darkPoolData } from './darkPoolData';

export default function DarkPoolGauge() {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tick, setTick] = useState(0);

  // Vibrating / Aggressive animation tick
  useEffect(() => {
    if (darkPoolData.needle_status === 'Static') return;
    const interval = setInterval(() => setTick(t => t + 1), 180);
    return () => clearInterval(interval);
  }, []);

  const { gauge_value, needle_status, roger_insight, updated, calls, puts } = darkPoolData;
  const pct = Math.max(0, Math.min(100, gauge_value));

  // Needle jitter offset
  let jitter = 0;
  if (needle_status === 'Vibrating') {
    jitter = (tick % 2 === 0 ? 1 : -1) * 1.5;
  } else if (needle_status === 'Aggressive') {
    jitter = (tick % 2 === 0 ? 1 : -1) * 4;
  }

  const needlePct = Math.max(1, Math.min(99, pct + jitter));

  // Color interpolation: red (0) → grey (50) → green (100)
  const barColor = pct >= 50
    ? `rgba(0, ${Math.round(180 * ((pct - 50) / 50) + 75)}, ${Math.round(100 * ((pct - 50) / 50))}, 0.9)`
    : `rgba(${Math.round(220 * ((50 - pct) / 50) + 35)}, ${Math.round(60 * (pct / 50))}, 60, 0.9)`;

  const needleColor = pct >= 55 ? '#00ff88' : pct <= 45 ? '#ff4444' : '#aaaaaa';

  const statusDot = {
    Static:     { color: '#666',    label: 'STATIC' },
    Vibrating:  { color: '#f59e0b', label: 'ACTIVE' },
    Aggressive: { color: '#ff4444', label: 'WHALE' },
  }[needle_status] || { color: '#666', label: 'STATIC' };

  const formatVal = (v) => v != null ? `$${(v / 1e6).toFixed(0)}M` : '—';

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', minWidth: '120px' }}>
      {/* Label row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <span style={{ fontSize: '8px', color: '#555', letterSpacing: '1.5px', textTransform: 'uppercase' }}>BEAR</span>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
          onClick={() => setShowTooltip(v => !v)}
        >
          <span
            style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: statusDot.color,
              boxShadow: needle_status !== 'Static' ? `0 0 6px 2px ${statusDot.color}88` : 'none',
              animation: needle_status === 'Aggressive' ? 'greenPulse 0.6s ease-in-out infinite' : 'none',
              display: 'inline-block',
            }}
          />
          <span style={{ fontSize: '8px', color: statusDot.color, letterSpacing: '2px', fontWeight: 600 }}>
            {statusDot.label}
          </span>
        </div>
        <span style={{ fontSize: '8px', color: '#555', letterSpacing: '1.5px', textTransform: 'uppercase' }}>BULL</span>
      </div>

      {/* Track */}
      <div
        style={{
          position: 'relative', width: '120px', height: '6px',
          background: 'linear-gradient(to right, #4a0a0a, #1a1a1a 50%, #0a2e1a)',
          borderRadius: '3px',
          border: '1px solid #222',
          cursor: 'pointer',
        }}
        onClick={() => setShowTooltip(v => !v)}
      >
        {/* Fill */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0, borderRadius: '3px',
          left: pct >= 50 ? '50%' : `${needlePct}%`,
          width: pct >= 50 ? `${(pct - 50) / 50 * 50}%` : `${(50 - needlePct)}%`,
          background: barColor,
          transition: 'width 0.4s ease',
        }} />

        {/* Center mark */}
        <div style={{
          position: 'absolute', top: '-1px', bottom: '-1px',
          left: '50%', transform: 'translateX(-50%)',
          width: '1px', background: '#333',
        }} />

        {/* Needle */}
        <div style={{
          position: 'absolute',
          left: `${needlePct}%`,
          top: '-3px', bottom: '-3px',
          width: '2px',
          background: needleColor,
          borderRadius: '1px',
          transform: 'translateX(-50%)',
          boxShadow: `0 0 4px 1px ${needleColor}88`,
          transition: needle_status === 'Static' ? 'left 0.4s ease' : 'left 0.05s ease',
        }} />
      </div>

      {/* Value + updated */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <span style={{ fontSize: '7px', color: '#444', letterSpacing: '1px' }}>DARK POOL</span>
        <span style={{ fontSize: '8px', color: needleColor, fontWeight: 700, letterSpacing: '1px' }}>
          {pct}
        </span>
        <span style={{ fontSize: '7px', color: '#444', letterSpacing: '1px' }}>{updated}</span>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div style={{
          position: 'absolute',
          top: '100%', left: '50%', transform: 'translateX(-50%)',
          marginTop: '8px',
          background: '#0a0a0a',
          border: '1px solid #2a2a2a',
          borderRadius: '6px',
          padding: '12px 14px',
          width: '260px',
          zIndex: 500,
          boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
        }}>
          <div style={{ fontSize: '9px', color: '#555', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>
            Dark Pool / Whale Flow
          </div>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '10px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '8px', color: '#00ff88', letterSpacing: '1px', marginBottom: '2px' }}>CALLS</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#00ff88' }}>{calls?.count?.toLocaleString() ?? '—'}</div>
              <div style={{ fontSize: '9px', color: '#666' }}>{formatVal(calls?.value)}</div>
            </div>
            <div style={{ width: '1px', background: '#1a1a1a' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '8px', color: '#ff4444', letterSpacing: '1px', marginBottom: '2px' }}>PUTS</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#ff4444' }}>{puts?.count?.toLocaleString() ?? '—'}</div>
              <div style={{ fontSize: '9px', color: '#666' }}>{formatVal(puts?.value)}</div>
            </div>
            <div style={{ width: '1px', background: '#1a1a1a' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '8px', color: '#aaa', letterSpacing: '1px', marginBottom: '2px' }}>SCORE</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: needleColor }}>{pct}</div>
              <div style={{ fontSize: '9px', color: statusDot.color }}>{needle_status}</div>
            </div>
          </div>
          <div style={{ fontSize: '10px', color: '#888', lineHeight: 1.6, borderTop: '1px solid #1a1a1a', paddingTop: '8px' }}>
            {roger_insight}
          </div>
          <div style={{ fontSize: '8px', color: '#333', marginTop: '6px', textAlign: 'right' }}>
            Updated: {updated}
          </div>
        </div>
      )}
    </div>
  );
}
