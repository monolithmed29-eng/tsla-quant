import { useState, useEffect } from 'react';
import { darkPoolData } from './darkPoolData';

export default function DarkPoolGauge({ mobile = false }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (darkPoolData.needle_status === 'Static') return;
    const interval = setInterval(() => setTick(t => t + 1), 180);
    return () => clearInterval(interval);
  }, []);

  const { gauge_value, needle_status, roger_insight, updated, calls, puts } = darkPoolData;
  const pct = Math.max(0, Math.min(100, gauge_value));

  // Roger tone mode — drives tooltip label + color
  const toneMode = (pct > 60 && needle_status !== 'Static')
    ? { label: 'OPTIMISTIC · CAUTIOUS', color: '#f59e0b' }
    : pct < 40
    ? { label: 'DEFENSIVE', color: '#ff6666' }
    : { label: 'NEUTRAL', color: '#888' };

  let jitter = 0;
  if (needle_status === 'Vibrating') {
    jitter = (tick % 2 === 0 ? 1 : -1) * 1.5;
  } else if (needle_status === 'Aggressive') {
    jitter = (tick % 2 === 0 ? 1 : -1) * 4;
  }

  const needlePct = Math.max(1, Math.min(99, pct + jitter));

  const barColor = pct >= 50
    ? `rgba(0, ${Math.round(180 * ((pct - 50) / 50) + 75)}, ${Math.round(100 * ((pct - 50) / 50))}, 0.9)`
    : `rgba(${Math.round(220 * ((50 - pct) / 50) + 35)}, ${Math.round(60 * (pct / 50))}, 60, 0.9)`;

  const needleColor = pct >= 55 ? '#00ff88' : pct <= 45 ? '#ff4444' : '#cccccc';

  const statusDot = {
    Static:     { color: '#888',    label: 'STATIC' },
    Vibrating:  { color: '#f59e0b', label: 'ACTIVE' },
    Aggressive: { color: '#ff4444', label: 'WHALE' },
  }[needle_status] || { color: '#888', label: 'STATIC' };

  if (mobile) return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
      {/* Label row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.55)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>BEAR</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} onClick={() => setShowTooltip(v => !v)}>
          <span style={{
            width: '5px', height: '5px', borderRadius: '50%',
            background: statusDot.color,
            boxShadow: needle_status !== 'Static' ? `0 0 5px 2px ${statusDot.color}88` : 'none',
            display: 'inline-block',
          }} />
          <span style={{ fontSize: '7px', color: statusDot.color, letterSpacing: '2px', fontWeight: 700 }}>{statusDot.label}</span>
        </div>
        <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.55)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>BULL</span>
      </div>
      {/* Track */}
      <div
        style={{
          position: 'relative', width: '100%', height: '5px',
          background: 'linear-gradient(to right, #4a0a0a, #1a1a1a 50%, #0a2e1a)',
          borderRadius: '3px', border: '1px solid #333', cursor: 'pointer',
        }}
        onClick={() => setShowTooltip(v => !v)}
      >
        <div style={{
          position: 'absolute', top: 0, bottom: 0, borderRadius: '3px',
          left: pct >= 50 ? '50%' : `${needlePct}%`,
          width: pct >= 50 ? `${(pct - 50) / 50 * 50}%` : `${(50 - needlePct)}%`,
          background: barColor,
        }} />
        <div style={{ position: 'absolute', top: '-1px', bottom: '-1px', left: '50%', transform: 'translateX(-50%)', width: '1px', background: '#444' }} />
        <div style={{
          position: 'absolute', left: `${needlePct}%`,
          top: '-3px', bottom: '-3px', width: '2px',
          background: needleColor, borderRadius: '1px',
          transform: 'translateX(-50%)',
          boxShadow: `0 0 4px 1px ${needleColor}88`,
          transition: needle_status === 'Static' ? 'left 0.4s ease' : 'left 0.05s ease',
        }} />
      </div>
      {/* Score */}
      <div style={{ textAlign: 'center' }}>
        <span style={{ fontSize: '9px', color: needleColor, fontWeight: 700, letterSpacing: '1px' }}>{pct}</span>
      </div>
      {/* Tooltip — anchored below, full width */}
      {showTooltip && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          marginTop: '6px',
          background: '#0a0a0a', border: '1px solid #2a2a2a',
          borderRadius: '6px', padding: '10px 12px',
          zIndex: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.9)',
        }}>
          <div style={{ fontSize: '9px', color: '#aaa', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>🐳 Whale Scale</div>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '8px', alignItems: 'center' }}>
            {calls && puts && (
              <>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '8px', color: '#bbb', letterSpacing: '1px', marginBottom: '3px' }}>FLOW LEAN</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: calls.count > puts.count ? '#00ff88' : '#ff4444' }}>
                    {calls.count > puts.count ? '▲ CALL HEAVY' : calls.count < puts.count ? '▼ PUT HEAVY' : '— NEUTRAL'}
                  </div>
                </div>
                <div style={{ width: '1px', background: '#2a2a2a', alignSelf: 'stretch' }} />
              </>
            )}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '8px', color: '#bbb', letterSpacing: '1px', marginBottom: '3px' }}>SCORE</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: needleColor }}>{pct}</div>
              <div style={{ fontSize: '9px', color: statusDot.color, fontWeight: 600 }}>{needle_status}</div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '8px' }}>
            <div style={{ fontSize: '7px', color: toneMode.color, letterSpacing: '2px', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase' }}>
              Roger · {toneMode.label}
            </div>
            <div style={{ fontSize: '10px', color: '#ccc', lineHeight: 1.6 }}>{roger_insight}</div>
          </div>
          <div style={{ fontSize: '8px', color: '#555', marginTop: '6px', textAlign: 'right' }}>Updated: {updated}</div>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', minWidth: '120px' }}>
      {/* Label row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.55)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>BEAR</span>
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
          <span style={{ fontSize: '8px', color: statusDot.color, letterSpacing: '2px', fontWeight: 700 }}>
            {statusDot.label}
          </span>
        </div>
        <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.55)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>BULL</span>
      </div>

      {/* Track */}
      <div
        style={{
          position: 'relative', width: '120px', height: '6px',
          background: 'linear-gradient(to right, #4a0a0a, #1a1a1a 50%, #0a2e1a)',
          borderRadius: '3px',
          border: '1px solid #333',
          cursor: 'pointer',
        }}
        onClick={() => setShowTooltip(v => !v)}
      >
        <div style={{
          position: 'absolute', top: 0, bottom: 0, borderRadius: '3px',
          left: pct >= 50 ? '50%' : `${needlePct}%`,
          width: pct >= 50 ? `${(pct - 50) / 50 * 50}%` : `${(50 - needlePct)}%`,
          background: barColor,
          transition: 'width 0.4s ease',
        }} />
        <div style={{
          position: 'absolute', top: '-1px', bottom: '-1px',
          left: '50%', transform: 'translateX(-50%)',
          width: '1px', background: '#444',
        }} />
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

      {/* Score only */}
      <div style={{ textAlign: 'center' }}>
        <span style={{ fontSize: '9px', color: needleColor, fontWeight: 700, letterSpacing: '1px' }}>
          {pct}
        </span>
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
          <div style={{ fontSize: '9px', color: '#aaa', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>
            🐳 Whale Scale — Dark Pool Flow
          </div>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '10px', alignItems: 'center' }}>
            {calls && puts && (
              <>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '8px', color: '#bbb', letterSpacing: '1px', marginBottom: '4px' }}>FLOW LEAN</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: calls.count > puts.count ? '#00ff88' : '#ff4444' }}>
                    {calls.count > puts.count ? '▲ CALL HEAVY' : calls.count < puts.count ? '▼ PUT HEAVY' : '— NEUTRAL'}
                  </div>
                </div>
                <div style={{ width: '1px', background: '#2a2a2a', alignSelf: 'stretch' }} />
              </>
            )}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '8px', color: '#bbb', letterSpacing: '1px', marginBottom: '4px' }}>SCORE</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: needleColor, letterSpacing: '-0.5px' }}>{pct}</div>
              <div style={{ fontSize: '9px', color: statusDot.color, letterSpacing: '1px', fontWeight: 600 }}>{needle_status}</div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '8px' }}>
            <div style={{ fontSize: '7px', color: toneMode.color, letterSpacing: '2px', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase' }}>
              Roger · {toneMode.label}
            </div>
            <div style={{ fontSize: '10px', color: '#ccc', lineHeight: 1.6 }}>{roger_insight}</div>
          </div>
          <div style={{ fontSize: '8px', color: '#666', marginTop: '6px', textAlign: 'right' }}>
            Updated: {updated}
          </div>
        </div>
      )}
    </div>
  );
}
