import { useState, useEffect, useRef } from 'react';
import { darkPoolData as fallbackDarkPool } from './darkPoolData';
import { useRemoteData } from './useRemoteData';

const PREV_KEY = 'whale_prev_score';

const CSS = `
  /* Smooth sinusoidal vibration — only translateX, never touches 'left' */
  @keyframes whaleVibrate {
    0%   { transform: translateX(calc(-50% + 0px));    }
    25%  { transform: translateX(calc(-50% - 1.6px)); }
    50%  { transform: translateX(calc(-50% + 0px));    }
    75%  { transform: translateX(calc(-50% + 1.6px));  }
    100% { transform: translateX(calc(-50% + 0px));    }
  }
  @keyframes whaleAggressive {
    0%   { transform: translateX(calc(-50% + 0px));   }
    20%  { transform: translateX(calc(-50% - 3.5px)); }
    50%  { transform: translateX(calc(-50% + 4px));   }
    80%  { transform: translateX(calc(-50% - 2.5px)); }
    100% { transform: translateX(calc(-50% + 0px));   }
  }
  @keyframes needleCenter {
    to { transform: translateX(-50%); }
  }
  @keyframes whaleFadeIn {
    from { opacity: 0; } to { opacity: 1; }
  }
  @keyframes ghostPulse {
    0%,100% { opacity: 0.25; }
    50%     { opacity: 0.45; }
  }
`;

function getNeedleAnimation(status) {
  if (status === 'Vibrating')  return 'whaleVibrate 0.85s ease-in-out infinite';
  if (status === 'Aggressive') return 'whaleAggressive 0.42s ease-in-out infinite';
  return 'none';
}

export default function DarkPoolGauge({ mobile = false }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const containerRef = useRef(null);
  const { data: darkPoolData } = useRemoteData('darkpool.json', fallbackDarkPool);

  const { gauge_value, needle_status, roger_insight, updated, calls, puts } = darkPoolData;
  const pct = Math.max(0, Math.min(100, gauge_value));

  // ── Prev-score tracking (delta from last read) ─────────────────────────────
  const [prevPct, setPrevPct] = useState(() => {
    const stored = localStorage.getItem(PREV_KEY);
    return stored !== null ? Number(stored) : pct;
  });
  const [displayPct, setDisplayPct] = useState(prevPct);
  const [animating, setAnimating] = useState(false);
  const hasMounted = useRef(false);

  useEffect(() => {
    if (hasMounted.current) return;
    hasMounted.current = true;

    const stored = localStorage.getItem(PREV_KEY);
    const prev = stored !== null ? Number(stored) : pct;
    setPrevPct(prev);
    setDisplayPct(prev); // start needle at prev position (no transition yet)

    // After a short paint delay, enable transition and slide to current value
    const t = setTimeout(() => {
      setAnimating(true);
      setDisplayPct(pct);
      // Save current as new prev for next session
      localStorage.setItem(PREV_KEY, String(pct));
    }, 120);
    return () => clearTimeout(t);
  }, [pct]);

  const delta = pct - prevPct;
  const showGhost = Math.abs(delta) >= 1; // only show ghost if meaningful delta

  // ── Derived colors ─────────────────────────────────────────────────────────
  const needleColor = pct >= 55 ? '#00ff88' : pct <= 45 ? '#ff4444' : '#cccccc';
  const ghostColor  = prevPct >= 55 ? '#00ff88' : prevPct <= 45 ? '#ff4444' : '#aaaaaa';

  const toneMode = (pct > 60 && needle_status !== 'Static')
    ? { label: 'OPTIMISTIC · CAUTIOUS', color: '#f59e0b' }
    : pct < 40
    ? { label: 'DEFENSIVE', color: '#ff6666' }
    : { label: 'NEUTRAL', color: '#888' };

  const statusDot = {
    Static:     { color: '#888',    label: 'STATIC' },
    Vibrating:  { color: '#f59e0b', label: 'ACTIVE' },
    Aggressive: { color: '#ff4444', label: 'WHALE'  },
  }[needle_status] || { color: '#888', label: 'STATIC' };

  // ── Tooltip outside-click ──────────────────────────────────────────────────
  useEffect(() => {
    if (!showTooltip) return;
    const handler = e => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setShowTooltip(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('touchstart', handler); };
  }, [showTooltip]);

  // ── Gradient fill: increases in brightness from center → needle ───────────
  // Bull (pct > 50): faint green at 50%, bright green at displayPct
  // Bear (pct < 50): faint red at 50%, bright red at displayPct
  function fillStyle(dp) {
    if (dp > 50) {
      return {
        left: '50%',
        width: `${(dp - 50) / 100 * 100}%`,
        background: `linear-gradient(to right, rgba(0,255,136,0.08), rgba(0,255,136,0.88))`,
      };
    } else if (dp < 50) {
      return {
        right: '50%',
        width: `${(50 - dp) / 100 * 100}%`,
        background: `linear-gradient(to left, rgba(255,68,68,0.08), rgba(255,68,68,0.88))`,
      };
    }
    return { width: 0 };
  }

  // ── Shared track markup (used in both desktop + mobile) ───────────────────
  function Track({ trackW, trackH, trackStyle = {} }) {
    const fill = fillStyle(displayPct);
    const ghostFill = fillStyle(prevPct);
    const needleAnim = getNeedleAnimation(needle_status);

    return (
      <div
        style={{
          position: 'relative',
          width: trackW, height: trackH,
          background: 'linear-gradient(to right, #2a0808, #111 50%, #082a14)',
          border: '1px solid #252525',
          cursor: 'pointer',
          ...trackStyle,
        }}
        onClick={() => setShowTooltip(v => !v)}
      >
        {/* Ghost fill (prev reading) — only if meaningful delta */}
        {showGhost && (
          <div style={{
            position: 'absolute', top: 0, bottom: 0,
            ...ghostFill,
            opacity: 0.2,
            transition: 'none',
          }} />
        )}

        {/* Current fill — brightness gradient */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0,
          ...fill,
          transition: animating ? 'width 1.4s cubic-bezier(0.22,1,0.36,1), left 1.4s cubic-bezier(0.22,1,0.36,1), right 1.4s cubic-bezier(0.22,1,0.36,1)' : 'none',
        }} />

        {/* Center divider */}
        <div style={{ position: 'absolute', top: '-1px', bottom: '-1px', left: '50%', transform: 'translateX(-50%)', width: '1px', background: '#333' }} />

        {/* Ghost needle (prev position) */}
        {showGhost && (
          <div style={{
            position: 'absolute',
            left: `${prevPct}%`,
            top: '-2px', bottom: '-2px',
            width: '1px',
            background: ghostColor,
            transform: 'translateX(-50%)',
            opacity: 0.3,
            animation: 'ghostPulse 2s ease-in-out infinite',
          }} />
        )}

        {/* Live needle — slides from prev to current via left transition,
            then oscillates via translateX animation (separate properties = no conflict) */}
        <div style={{
          position: 'absolute',
          left: `${displayPct}%`,
          top: '-3px', bottom: '-3px',
          width: '2px',
          background: needleColor,
          borderRadius: '1px',
          // translateX(-50%) centering is baked into the animation keyframes
          boxShadow: `0 0 5px 1px ${needleColor}99`,
          transition: animating ? 'left 1.4s cubic-bezier(0.22,1,0.36,1)' : 'none',
          animation: needleAnim || 'needleCenter 0s linear forwards',
          willChange: 'transform',
        }} />
      </div>
    );
  }

  // ── Score + delta display ─────────────────────────────────────────────────
  function ScoreRow() {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
        <span style={{ fontSize: '9px', color: needleColor, fontWeight: 700, letterSpacing: '1px' }}>{pct}</span>
        {showGhost && (
          <span style={{
            fontSize: '8px', fontWeight: 600, letterSpacing: '0.5px',
            color: delta > 0 ? '#00ff88' : '#ff4444',
          }}>
            {delta > 0 ? `+${delta}` : `${delta}`}
          </span>
        )}
      </div>
    );
  }

  // ── Mobile ────────────────────────────────────────────────────────────────
  if (mobile) return (
    <div ref={containerRef} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
      <style>{CSS}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '8px', color: '#fff', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 700 }}>BEAR</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} onClick={() => setShowTooltip(v => !v)}>
          <span style={{
            width: '5px', height: '5px', borderRadius: '50%',
            background: statusDot.color,
            boxShadow: needle_status !== 'Static' ? `0 0 5px 2px ${statusDot.color}88` : 'none',
            display: 'inline-block',
          }} />
          <span style={{ fontSize: '7px', color: statusDot.color, letterSpacing: '2px', fontWeight: 700 }}>{statusDot.label}</span>
        </div>
        <span style={{ fontSize: '8px', color: '#fff', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 700 }}>BULL</span>
      </div>
      <Track trackW="100%" trackH="5px" />
      <ScoreRow />
      {showTooltip && <TooltipPanel calls={calls} puts={puts} pct={pct} delta={delta} showGhost={showGhost} prevPct={prevPct} needleColor={needleColor} toneMode={toneMode} statusDot={statusDot} needle_status={needle_status} roger_insight={roger_insight} updated={updated} mobile={true} />}
    </div>
  );

  // ── Desktop ───────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', minWidth: '120px' }}>
      <style>{CSS}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <span style={{ fontSize: '8px', color: '#fff', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 700 }}>BEAR</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} onClick={() => setShowTooltip(v => !v)}>
          <span style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: statusDot.color,
            boxShadow: needle_status !== 'Static' ? `0 0 6px 2px ${statusDot.color}88` : 'none',
            animation: needle_status === 'Aggressive' ? 'greenPulse 0.6s ease-in-out infinite' : 'none',
            display: 'inline-block',
          }} />
          <span style={{ fontSize: '8px', color: statusDot.color, letterSpacing: '2px', fontWeight: 700 }}>{statusDot.label}</span>
        </div>
        <span style={{ fontSize: '8px', color: '#fff', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 700 }}>BULL</span>
      </div>
      <Track trackW="160px" trackH="8px" />
      <ScoreRow />
      {showTooltip && <TooltipPanel calls={calls} puts={puts} pct={pct} delta={delta} showGhost={showGhost} prevPct={prevPct} needleColor={needleColor} toneMode={toneMode} statusDot={statusDot} needle_status={needle_status} roger_insight={roger_insight} updated={updated} mobile={false} />}
    </div>
  );
}

// ── Tooltip Panel ─────────────────────────────────────────────────────────────
function TooltipPanel({ calls, puts, pct, delta, showGhost, prevPct, needleColor, toneMode, statusDot, needle_status, roger_insight, updated, mobile }) {
  return (
    <div style={{
      position: 'absolute',
      top: '100%',
      right: mobile ? '0' : '-20px',
      left: 'auto',
      marginTop: '8px',
      background: '#0a0d12',
      border: '1px solid #2a2a2a',
      padding: '14px 16px',
      width: '300px',
      zIndex: 9998,
      boxShadow: '0 12px 40px rgba(0,0,0,0.95)',
      animation: 'whaleFadeIn 0.18s ease',
      fontSmooth: 'always',
      WebkitFontSmoothing: 'antialiased',
    }}>
      <div style={{ fontSize: '9px', color: '#fff', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '10px', fontWeight: 600 }}>
        🐳 Whale Scale — Dark Pool Flow
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '10px', alignItems: 'center' }}>
        {calls && puts && (
          <>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '8px', color: '#aaa', letterSpacing: '1px', marginBottom: '4px' }}>FLOW LEAN</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: calls.count > puts.count ? '#00ff88' : '#ff4444' }}>
                {calls.count > puts.count ? '▲ CALL HEAVY' : calls.count < puts.count ? '▼ PUT HEAVY' : '— NEUTRAL'}
              </div>
            </div>
            <div style={{ width: '1px', background: '#1e1e1e', alignSelf: 'stretch' }} />
          </>
        )}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '8px', color: '#aaa', letterSpacing: '1px', marginBottom: '4px' }}>SCORE</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: needleColor, letterSpacing: '-0.5px', lineHeight: 1 }}>{pct}</div>
          {showGhost && (
            <div style={{ fontSize: '9px', color: delta > 0 ? '#00ff88' : '#ff4444', fontWeight: 600, marginTop: '2px' }}>
              {delta > 0 ? `▲ +${delta}` : `▼ ${delta}`} from prev
            </div>
          )}
          <div style={{ fontSize: '9px', color: statusDot.color, letterSpacing: '1px', fontWeight: 600, marginTop: '2px' }}>{needle_status}</div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '10px' }}>
        <div style={{ fontSize: '7px', color: toneMode.color, letterSpacing: '2px', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>
          Roger · {toneMode.label}
        </div>
        <div style={{ fontSize: '11px', color: '#ffffff', lineHeight: 1.7, fontWeight: 400, WebkitFontSmoothing: 'antialiased' }}>{roger_insight}</div>
      </div>
      <div style={{ fontSize: '8px', color: '#555', marginTop: '8px', textAlign: 'right' }}>Updated: {updated}</div>
    </div>
  );
}
