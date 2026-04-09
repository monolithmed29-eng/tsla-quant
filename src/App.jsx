import { useState, useEffect, useRef } from 'react';
import Panel from './Panel';
import BreakingNews from './BreakingNews';
import PriceModal from './PriceModal';
import ProgressiveGraph from './ProgressiveGraph';
import OracleSearch from './OracleSearch';
import OracleCommandCenter from './OracleCommandCenter';
import { catalysts, links } from './data';
import { calcPredictedPrice, calcPriceBreakdown } from './priceModel';
import { useTSLAPrice } from './useTSLAPrice';

const PREDICTED = calcPredictedPrice(catalysts);
const BREAKDOWN = calcPriceBreakdown(catalysts);

// ─── Quant Model Daily Change ─────────────────────────────────────────────────
// PREV_PREDICTED = the model price before today's data updates.
// Update this manually whenever a meaningful data change is deployed.
// This ensures ALL visitors see the delta, not just returning ones.
const PREV_PREDICTED = 649; // model price before Apr 9, 2026 catalyst updates
const QUANT_CHANGE = PREDICTED !== PREV_PREDICTED ? PREDICTED - PREV_PREDICTED : null;

// Starfield
function Starfield() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const stars = Array.from({ length: 180 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.2 + 0.2,
      a: Math.random(),
      speed: Math.random() * 0.008 + 0.002,
    }));
    let frame;
    function draw() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of stars) {
        s.a += s.speed;
        const alpha = 0.3 + 0.5 * Math.abs(Math.sin(s.a));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fill();
      }
      frame = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    />
  );
}

function MobileOracleFAB({ onShowDisclaimer, onShowToS, onShowRefund }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* Simplified mobile footer: just legend + legal */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        padding: '5px 14px',
        borderTop: '1px solid #111',
        background: 'rgba(0,0,0,0.92)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Dim → Very Bright */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(80,100,140,0.55)', boxShadow: '0 0 4px rgba(70,90,130,0.4)', flexShrink: 0 }} />
          <span style={{ fontSize: '8px', color: '#444', letterSpacing: '1px' }}>DIM</span>
          <span style={{ fontSize: '8px', color: '#333' }}>→</span>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,1.0)', boxShadow: '0 0 6px rgba(255,255,255,0.8)', flexShrink: 0 }} />
          <span style={{ fontSize: '8px', color: '#aaa', letterSpacing: '1px' }}>BRIGHT</span>
          <span style={{ fontSize: '8px', color: '#444', marginLeft: '4px' }}>= likelihood</span>
        </div>
        {/* Legal */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {[['Disclaimer', onShowDisclaimer], ['Terms', onShowToS], ['Refunds', onShowRefund]].map(([label, fn]) => (
            <button key={label} onClick={fn} style={{
              background: 'none', border: 'none', padding: 0,
              color: '#444', fontSize: '8px', letterSpacing: '1px',
              textTransform: 'uppercase', cursor: 'pointer',
              fontFamily: "'Space Grotesk', sans-serif",
              textDecoration: 'underline', textUnderlineOffset: '2px',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Oracle FAB — centered above footer */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 200,
          background: 'rgba(229,57,53,0.12)',
          border: '1px solid rgba(229,57,53,0.7)',
          color: '#ff3333',
          padding: '9px 20px',
          borderRadius: '24px',
          fontSize: '10px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase',
          cursor: 'pointer',
          fontFamily: "'Space Grotesk', sans-serif",
          display: 'flex', alignItems: 'center', gap: '8px',
          boxShadow: '0 0 20px rgba(229,57,53,0.25)',
          backdropFilter: 'blur(8px)',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ff1a1a', display: 'inline-block', boxShadow: '0 0 8px 3px rgba(229,57,53,0.8)' }} />
        Ask Roger
      </button>

      {/* Oracle bottom sheet */}
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
          onClick={() => setOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#060606',
              border: '1px solid #1e1e1e',
              borderRadius: '16px 16px 0 0',
              borderTop: '2px solid #e53935',
              maxHeight: '85vh', overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              padding: '0 0 32px',
            }}
          >
            {/* Handle + header */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
              <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: '#222' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 16px 12px', borderBottom: '1px solid #111' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ff1a1a', display: 'inline-block', boxShadow: '0 0 8px 3px rgba(229,57,53,0.8)' }} />
                <span style={{ fontSize: '10px', letterSpacing: '2px', color: '#ff3333', textTransform: 'uppercase', fontWeight: 700 }}>Ask Roger</span>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#666', fontSize: '18px', cursor: 'pointer', padding: '4px 8px' }}>✕</button>
            </div>
            <div style={{ padding: '16px 12px 0' }}>
              <OracleSearch />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function App() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [selected, setSelected] = useState(null);
  const [showAbout, setShowAbout] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showToS, setShowToS] = useState(false);
  const [showRefund, setShowRefund] = useState(false);
  const [expandAll, setExpandAll] = useState(false);
  const [graphKey, setGraphKey] = useState(0);
  const { price: tslaPrice, lastUpdated, marketOpen } = useTSLAPrice();

  const luminescenceLevels = [
    { label: 'Dim', color: 'rgba(80,100,140,0.55)', glow: 'rgba(70,90,130,0.4)' },
    { label: 'Low', color: 'rgba(130,150,190,0.70)', glow: 'rgba(120,140,180,0.5)' },
    { label: 'Medium', color: 'rgba(180,200,230,0.85)', glow: 'rgba(160,185,220,0.6)' },
    { label: 'Bright', color: 'rgba(220,235,255,0.95)', glow: 'rgba(200,220,255,0.7)' },
    { label: 'Very Bright', color: 'rgba(255,255,255,1.0)', glow: 'rgba(255,255,255,0.8)' },
  ];

  const formatTime = (d) => d ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—';

  // Live Pulse — minutes since last data sync (10am ET cron)
  const [minsSinceSync, setMinsSinceSync] = useState(0);
  useEffect(() => {
    function calcMins() {
      const now = new Date();
      const sync = new Date(now);
      sync.setHours(10, 0, 0, 0); // 10am ET
      if (now < sync) sync.setDate(sync.getDate() - 1);
      setMinsSinceSync(Math.floor((now - sync) / 60000));
    }
    calcMins();
    const iv = setInterval(calcMins, 30000);
    return () => clearInterval(iv);
  }, []);

  const syncLabel = minsSinceSync < 60
    ? `${minsSinceSync}m ago`
    : minsSinceSync < 1440
      ? `${Math.floor(minsSinceSync / 60)}h ago`
      : 'today';

  return (
    <div style={{
      background: '#000',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      fontFamily: "'Space Grotesk', sans-serif",
      color: '#fff',
      position: 'relative',
    }}>
      <Starfield />
      <style>{`
        @keyframes greenPulse {
          0%, 100% { box-shadow: 0 0 8px 3px rgba(0,255,136,0.7), 0 0 16px 6px rgba(0,255,136,0.3); }
          50%       { box-shadow: 0 0 14px 6px rgba(0,255,136,1.0), 0 0 28px 10px rgba(0,255,136,0.5); }
        }
      `}</style>

      {/* Affiliation bar — desktop only */}
      {!isMobile && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          zIndex: 200,
          background: '#0d0d0d',
          borderBottom: '1px solid #1a1a1a',
          padding: '5px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
        }}>
          <span style={{ fontSize: '10px', color: '#666', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
            Independent TSLA Analysis Platform — Not affiliated with Tesla, Inc.
          </span>
          <span style={{ color: '#444', fontSize: '10px' }}>·</span>
          <button
            onClick={() => setShowDisclaimer(true)}
            style={{
              background: 'none', border: 'none', padding: 0,
              color: '#555', fontSize: '10px', letterSpacing: '1.5px',
              textTransform: 'uppercase', cursor: 'pointer',
              fontFamily: "'Space Grotesk', sans-serif",
              textDecoration: 'underline', textUnderlineOffset: '3px',
            }}
            onMouseEnter={e => e.target.style.color = '#999'}
            onMouseLeave={e => e.target.style.color = '#555'}
          >Disclaimer</button>
        </div>
      )}

      {/* ── Desktop Header ── */}
      {!isMobile && (
        <header style={{
          position: 'fixed',
          top: '27px', left: 0, right: 0,
          zIndex: 100,
          padding: '16px 28px',
          borderBottom: '1px solid #111',
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '2px', color: '#fff' }}>
              TSLA_QUANT
            </div>
            <div style={{ fontSize: '10px', letterSpacing: '3px', color: '#888', textTransform: 'uppercase', marginTop: '3px' }}>
              v1.3
            </div>
          </div>
          <div style={{ display: 'flex', gap: '32px', alignItems: 'center', fontSize: '13px' }}>
            <button
              onClick={() => { const next = !expandAll; setExpandAll(next); if (!next) setGraphKey(k => k + 1); }}
              style={{
                background: 'rgba(0,255,136,0.12)', border: '1px solid #00ff88', color: '#00ff88',
                boxShadow: '0 0 10px rgba(0,255,136,0.45), 0 0 20px rgba(0,255,136,0.2)',
                fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase',
                padding: '5px 14px', cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif",
                transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', gap: '7px',
              }}
            >
              <span style={{ fontSize: '12px' }}>{!expandAll ? '⬡' : '◉'}</span>
              {!expandAll ? 'Full Network' : 'Overview'}
            </button>
            <div style={{ width: '1px', height: '32px', background: '#222' }} />
            <OracleCommandCenter />
            <div style={{ width: '1px', height: '32px', background: '#222' }} />
            <button onClick={() => setShowHowTo(true)} style={{ background: 'none', border: '1px solid #444', color: '#aaa', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', padding: '5px 12px', cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif" }} onMouseEnter={e => { e.target.style.borderColor = '#888'; e.target.style.color = '#fff'; }} onMouseLeave={e => { e.target.style.borderColor = '#444'; e.target.style.color = '#aaa'; }}>How to Use</button>
            <button onClick={() => setShowAbout(true)} style={{ background: 'none', border: '1px solid #444', color: '#aaa', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', padding: '5px 12px', cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif" }} onMouseEnter={e => { e.target.style.borderColor = '#888'; e.target.style.color = '#fff'; }} onMouseLeave={e => { e.target.style.borderColor = '#444'; e.target.style.color = '#aaa'; }}>About</button>
            <div style={{ width: '1px', height: '32px', background: '#222' }} />
            <div style={{ textAlign: 'right', cursor: 'pointer' }} onClick={() => setShowPriceModal(true)}>
              <div style={{ color: '#999', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '2px' }}>Quant Model ↗</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', justifyContent: 'flex-end' }}>
                <div style={{ color: '#00ff88', fontWeight: 700, fontSize: '18px', textDecoration: 'underline', textUnderlineOffset: '3px', textDecorationColor: '#00ff8844' }}>${PREDICTED.toFixed(0)}</div>
                {QUANT_CHANGE !== null && <div style={{ fontSize: '11px', fontWeight: 600, color: QUANT_CHANGE >= 0 ? '#00ff88' : '#ff4444' }}>({QUANT_CHANGE >= 0 ? '+' : ''}{QUANT_CHANGE.toFixed(0)})</div>}
              </div>
            </div>
            <div style={{ width: '1px', height: '32px', background: '#222' }} />
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#999', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '2px' }}>TSLA Live</div>
              <div style={{ color: marketOpen ? '#00aaff' : '#666', fontWeight: 700, fontSize: '18px' }}>{tslaPrice ? `$${tslaPrice.toFixed(2)}` : '—'}</div>
              <div style={{ color: '#888', fontSize: '9px', marginTop: '2px' }}>{marketOpen ? (lastUpdated ? formatTime(lastUpdated) : '—') : 'Market Closed'}</div>
            </div>
            <div style={{ width: '1px', height: '32px', background: '#222' }} />
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginBottom: '4px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 8px 3px rgba(0,255,136,0.7)', display: 'inline-block', animation: 'greenPulse 2s ease-in-out infinite' }} />
                <span style={{ fontSize: '9px', color: '#00ff88', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600 }}>AI Engine: Online</span>
              </div>
              <div style={{ fontSize: '9px', color: '#666', letterSpacing: '1px', textAlign: 'right' }}>Last Sync: {syncLabel}</div>
            </div>
          </div>
        </header>
      )}

      {/* ── Mobile Header ── two rows: brand + price bar */}
      {isMobile && (
        <>
          {/* Row 1: brand + oracle */}
          <header style={{
            position: 'fixed',
            top: 0, left: 0, right: 0,
            zIndex: 100,
            padding: '7px 14px',
            borderBottom: '1px solid #161616',
            background: 'rgba(0,0,0,0.92)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            {/* Brand + badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '2px', color: '#fff' }}>
                TSLA_QUANT
              </span>
              <span style={{
                fontSize: '7px', fontWeight: 600, letterSpacing: '2px',
                color: '#00ff88', border: '1px solid #00ff8844',
                padding: '2px 6px', textTransform: 'uppercase',
                background: 'rgba(0,255,136,0.06)',
              }}>
                Mobile
              </span>
            </div>

            {/* How to Use — top right */}
            <button
              onClick={() => setShowHowTo(true)}
              style={{
                background: 'none', border: 'none',
                color: '#fff', fontSize: '15px', fontWeight: 300,
                cursor: 'pointer', padding: '2px 6px',
                fontFamily: "'Space Grotesk', sans-serif",
                letterSpacing: '0',
                lineHeight: 1,
                opacity: 0.85,
              }}
            >?</button>
          </header>

          {/* Row 2: price bar */}
          <div style={{
            position: 'fixed',
            top: '38px', left: 0, right: 0,
            zIndex: 99,
            background: 'rgba(0,0,0,0.88)',
            backdropFilter: 'blur(8px)',
            borderBottom: '1px solid #111',
            display: 'flex',
            alignItems: 'stretch',
          }}>
            {/* Quant Model */}
            <div
              onClick={() => setShowPriceModal(true)}
              style={{
                flex: 1, cursor: 'pointer',
                padding: '8px 0 8px 16px',
                borderRight: '1px solid #111',
              }}
            >
              <div style={{ fontSize: '8px', color: '#666', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '2px' }}>Quant Model ↗</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '22px', fontWeight: 700, color: '#00ff88', letterSpacing: '-0.5px' }}>${PREDICTED.toFixed(0)}</span>
                {QUANT_CHANGE !== null && (
                  <span style={{ fontSize: '11px', fontWeight: 600, color: QUANT_CHANGE >= 0 ? '#00ff88' : '#ff4444' }}>
                    ({QUANT_CHANGE >= 0 ? '+' : ''}{QUANT_CHANGE.toFixed(0)})
                  </span>
                )}
              </div>
            </div>
            {/* TSLA Live */}
            <div style={{ flex: 1, padding: '8px 0 8px 16px' }}>
              <div style={{ fontSize: '8px', color: '#666', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '2px' }}>
                TSLA Live {marketOpen ? '' : '· Closed'}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '22px', fontWeight: 700, color: marketOpen ? '#00aaff' : '#555', letterSpacing: '-0.5px' }}>
                  {tslaPrice ? `$${tslaPrice.toFixed(2)}` : '—'}
                </span>
                {marketOpen && lastUpdated && (
                  <span style={{ fontSize: '10px', color: '#444' }}>{formatTime(lastUpdated)}</span>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Graph — same ProgressiveGraph for both, different paddingTop */}
      <div style={{
        position: 'absolute',
        inset: 0,
        paddingTop: isMobile ? '90px' : '99px',
        paddingBottom: isMobile ? '0' : '56px',
        zIndex: 1,
      }}>
        <ProgressiveGraph
          key={graphKey}
          catalysts={catalysts}
          links={links}
          onNodeClick={setSelected}
          expandAll={expandAll}
          onAllExpanded={() => setExpandAll(true)}
          isMobile={isMobile}
        />
      </div>

      {/* Detail Panel */}
      <Panel node={selected} onClose={() => setSelected(null)} isMobile={isMobile} />

      {/* Breaking News Tab */}
      <BreakingNews isMobile={isMobile} />

      {/* Mobile: Oracle FAB (centered bottom) */}
      {isMobile && !selected && <MobileOracleFAB onShowDisclaimer={() => setShowDisclaimer(true)} onShowToS={() => setShowToS(true)} onShowRefund={() => setShowRefund(true)} />}



      {/* How to Use Modal */}
      {showHowTo && (
        <div
          onClick={() => setShowHowTo(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 500,
            background: 'rgba(0,0,0,0.80)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#0a0a0a',
              border: '1px solid #1e1e1e',
              padding: isMobile ? '24px 18px' : '44px 48px',
              maxWidth: '560px',
              width: '92%',
              maxHeight: '88vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ fontSize: '9px', letterSpacing: '4px', color: '#333', textTransform: 'uppercase', marginBottom: '16px' }}>Guide</div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginBottom: '28px', letterSpacing: '-0.3px' }}>
              How to Use TSLA_QUANT
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {(isMobile ? [
                {
                  icon: '⚪',
                  heading: 'Orb Brightness — Likelihood',
                  body: 'Each orb\'s brightness reflects the probability of that catalyst occurring. Bright white = high confidence (90%+). Dim = uncertain or unlikely.',
                },
                {
                  icon: '🔴',
                  heading: 'Red Pulsing Dot — Updated Today',
                  body: 'A heartbeat red dot on an orb means new data arrived today. On the main view it means at least one sub-catalyst in that category was updated.',
                },
                {
                  icon: '👆',
                  heading: 'Tap a Category Orb',
                  body: 'Tap any of the 8 main orbs to burst it into its sub-catalysts. A green ring appears around it. Tap the same orb again to collapse back to the main view.',
                },
                {
                  icon: '📋',
                  heading: 'Tap a Sub-Node',
                  body: 'Tap any sub-node to open its full analysis — likelihood score, timestamped bullets, and price contribution. Tap ✕ Close to dismiss.',
                },
                {
                  icon: '🔗',
                  heading: 'Connections',
                  body: 'Lines between orbs show causal dependencies. Animated particles show how one catalyst accelerates another.',
                },
                {
                  icon: '💲',
                  heading: 'Quant Model Price',
                  body: 'The green price target is a sum-of-parts model across 34 catalysts and 6 business units. Tap it to see the full breakdown. Updated daily at 10am ET.',
                },
                {
                  icon: '◉',
                  heading: 'Ask Roger — AI Oracle',
                  body: 'Tap the red "Ask Roger" button at the bottom. Ask anything about Tesla catalysts, FSD, robotaxi, or earnings. Roger delivers a 4-phase quant analysis. 3 free queries to start — each uses 1 credit.',
                },
                {
                  icon: '📰',
                  heading: 'Breaking News',
                  body: 'Tap the red tab on the left edge to open the breaking news feed. Tap ✕ or anywhere outside to close. Refreshed 3× daily.',
                },
              ] : [
                {
                  icon: '⚪',
                  heading: 'Orb Brightness — Likelihood',
                  body: 'Each orb\'s brightness reflects the probability of that catalyst successfully occurring. A bright white orb means high confidence (90%+). A dim, dark orb means the outcome is uncertain or unlikely. The brighter the glow, the stronger the signal.',
                },
                {
                  icon: '🔵',
                  heading: 'Orb Size — Impact Score',
                  body: 'Larger orbs carry more weight in the quant price model. Size represents how much that catalyst contributes to Tesla\'s valuation if achieved. A large orb that\'s dim means high potential but low confidence — a key risk to watch.',
                },
                {
                  icon: '🔴',
                  heading: 'Red Pulsing Dot — Updated Today',
                  body: 'A small red dot heartbeating at the top-right of an orb means that catalyst received new data today. Two quick pulses, then silence — like a heartbeat. On the main overview, a red dot on a category orb means at least one sub-catalyst inside it was updated.',
                },
                {
                  icon: '🖱️',
                  heading: 'Click Any Orb',
                  body: 'Click on any orb to open its detail panel. You\'ll see a full analysis with timestamped bullet points, likelihood score, expected timeline, and its estimated contribution to the model price target. Click a different orb at any time to switch — no need to close first.',
                },
                {
                  icon: '⬡',
                  heading: 'Full Network',
                  body: 'Click "Full Network" in the header to reveal all 34 catalyst nodes simultaneously across all 6 business units. Every connection and dependency becomes visible at once — a complete map of Tesla\'s milestone ecosystem. Click "Overview" to return to the clustered master-node view.',
                },
                {
                  icon: '🔗',
                  heading: 'Connections — Dependencies',
                  body: 'The lines connecting orbs show causal relationships. If one catalyst depends on another to succeed, they are linked. Animated particles travel along these lines — follow them to understand how progress in one area accelerates another.',
                },
                {
                  icon: '💲',
                  heading: 'Quant Model Price',
                  body: 'The green price target in the header is a sum-of-parts valuation model. It is recalculated dynamically from the current likelihood scores of all 34 catalysts across 6 business units: Auto, Energy, Robotaxi, Optimus, FSD Software, and AI Infrastructure. Updated daily at 10am ET.',
                },
                {
                  icon: '◉',
                  heading: 'Command Center — Ask Roger',
                  body: 'Click "Command Center" in the header to query Roger, the TSLAquant AI expert. Ask anything — catalyst progress, model price drivers, FSD timelines, robotaxi expansion, earnings outlook. Roger delivers a 4-phase quant analysis: Current Reality → Raw Data → Quant Edge → The Trade. Free users get 3 queries.',
                },
                {
                  icon: '📰',
                  heading: 'Breaking News Tab',
                  body: 'Hover over the "Breaking News" tab on the left edge of the screen to see the latest Tesla developments. Each story is tagged with a color-coded category dot matching the neural network. The feed is automatically refreshed 3× daily (8am, 1pm, 6pm ET) from Tesla IR and Tesla\'s X account.',
                },
              ]).map(({ icon, heading, body }) => (
                <div key={heading} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }}>{icon}</div>
                  <div>
                    <div style={{ fontSize: '11px', letterSpacing: '1.5px', color: '#ffffff', textTransform: 'uppercase', marginBottom: '6px' }}>{heading}</div>
                    <p style={{ fontSize: '13px', color: '#b0b0b0', lineHeight: '1.7', margin: 0 }}>{body}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowHowTo(false)}
              style={{
                marginTop: '36px',
                background: 'none',
                border: '1px solid #222',
                color: '#444',
                fontSize: '10px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                padding: '7px 18px',
                cursor: 'pointer',
                fontFamily: "'Space Grotesk', sans-serif",
              }}
              onMouseEnter={e => { e.target.style.borderColor = '#444'; e.target.style.color = '#888'; }}
              onMouseLeave={e => { e.target.style.borderColor = '#222'; e.target.style.color = '#444'; }}
            >Got It</button>
          </div>
        </div>
      )}

      {/* About Modal */}
      {showAbout && (
        <div
          onClick={() => setShowAbout(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 500,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#0a0a0a',
              border: '1px solid #222',
              padding: '40px 44px',
              maxWidth: '520px',
              width: '90%',
              position: 'relative',
            }}
          >
            <div style={{ fontSize: '9px', letterSpacing: '4px', color: '#444', textTransform: 'uppercase', marginBottom: '16px' }}>
              About
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '20px', letterSpacing: '2px' }}>
              TSLA_QUANT
            </div>
            <p style={{ fontSize: '14px', lineHeight: '1.75', color: '#aaa', margin: 0 }}>
              TeslaQuant is a real-time tracking terminal designed to quantify the progress of Tesla's most critical technical and financial catalysts.
            </p>
            <p style={{ fontSize: '14px', lineHeight: '1.75', color: '#aaa', margin: '16px 0 0' }}>
              While traditional analysts rely on quarterly reports and delayed data, TeslaQuant uses an agentic AI framework to synthesize real-time "on-the-ground" intelligence into a dynamic, interactive map of the Tesla ecosystem.
            </p>
            <button
              onClick={() => setShowAbout(false)}
              style={{
                marginTop: '32px',
                background: 'none',
                border: '1px solid #333',
                color: '#555',
                fontSize: '10px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                padding: '7px 18px',
                cursor: 'pointer',
                fontFamily: "'Space Grotesk', sans-serif",
                transition: 'border-color 0.2s, color 0.2s',
              }}
              onMouseEnter={e => { e.target.style.borderColor = '#555'; e.target.style.color = '#aaa'; }}
              onMouseLeave={e => { e.target.style.borderColor = '#333'; e.target.style.color = '#555'; }}
            >Close</button>
          </div>
        </div>
      )}

      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <div
          onClick={() => setShowDisclaimer(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 500,
            background: 'rgba(0,0,0,0.80)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#0a0a0a',
              border: '1px solid #1e1e1e',
              padding: '44px 48px',
              maxWidth: '560px',
              width: '90%',
            }}
          >
            <div style={{ fontSize: '9px', letterSpacing: '4px', color: '#333', textTransform: 'uppercase', marginBottom: '16px' }}>Legal</div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginBottom: '28px', letterSpacing: '-0.3px' }}>
              Disclaimer
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                {
                  heading: 'Not Investment Advice',
                  body: 'All content on this platform is provided for informational and recreational purposes only. Nothing on this site constitutes financial, investment, legal, or tax advice. Do not make any investment decisions based solely on information presented here.',
                },
                {
                  heading: 'No Affiliation',
                  body: 'This is an independent, community-built platform. It is not affiliated with, authorized by, endorsed by, or officially connected with Tesla, Inc. or any of its subsidiaries. "Tesla" and "TSLA" are referenced solely to identify the publicly traded company.',
                },
                {
                  heading: 'Forward-Looking Statements',
                  body: 'This platform contains speculative analysis, probability estimates, and forward-looking commentary. Actual outcomes may differ materially. Past catalyst performance is not indicative of future results.',
                },
                {
                  heading: 'No Liability',
                  body: 'The creators of this platform accept no liability for any loss or damage — direct or indirect — arising from use of, or reliance on, any information presented here. Use at your own risk.',
                },
              ].map(({ heading, body }) => (
                <div key={heading} style={{ borderLeft: '2px solid #1e1e1e', paddingLeft: '16px' }}>
                  <div style={{ fontSize: '10px', letterSpacing: '1.5px', color: '#555', textTransform: 'uppercase', marginBottom: '6px' }}>{heading}</div>
                  <p style={{ fontSize: '13px', color: '#666', lineHeight: '1.7', margin: 0 }}>{body}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowDisclaimer(false)}
              style={{
                marginTop: '36px',
                background: 'none',
                border: '1px solid #222',
                color: '#444',
                fontSize: '10px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                padding: '7px 18px',
                cursor: 'pointer',
                fontFamily: "'Space Grotesk', sans-serif",
              }}
              onMouseEnter={e => { e.target.style.borderColor = '#444'; e.target.style.color = '#888'; }}
              onMouseLeave={e => { e.target.style.borderColor = '#222'; e.target.style.color = '#444'; }}
            >Close</button>
          </div>
        </div>
      )}

      {/* Terms of Service Modal */}
      {showToS && (
        <div onClick={() => setShowToS(false)} style={{
          position: 'fixed', inset: 0, zIndex: 500,
          background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#0a0a0a', border: '1px solid #1e1e1e',
            padding: '44px 48px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto',
          }}>
            <div style={{ fontSize: '9px', letterSpacing: '4px', color: '#333', textTransform: 'uppercase', marginBottom: '16px' }}>Legal</div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginBottom: '28px' }}>Terms of Service</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {[
                { h: 'Acceptance', b: 'By accessing or using TSLAquant ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Platform.' },
                { h: 'Description of Service', b: 'TSLAquant is an independent, AI-assisted research and information platform that tracks Tesla-related catalysts and provides probabilistic valuation modeling. All content is for informational and educational purposes only.' },
                { h: 'No Financial Advice', b: 'Nothing on this Platform constitutes financial, investment, legal, or tax advice. The quant model, price targets, and catalyst scores are speculative in nature. Do not make investment decisions based solely on content from this Platform. Always consult a qualified financial professional.' },
                { h: 'Paid Features', b: 'Certain features (such as Oracle AI analysis) require a one-time access fee. Payments are processed securely via Stripe. By purchasing access, you agree to pay the stated fee. All purchases are final unless otherwise stated in our Refund Policy.' },
                { h: 'Intellectual Property', b: 'All original content, design, and code on the Platform is the property of TSLAquant. You may not reproduce, distribute, or create derivative works without express written permission.' },
                { h: 'No Warranty', b: 'The Platform is provided "as is" without warranty of any kind. We do not guarantee accuracy, completeness, or timeliness of any information. Data may be delayed or incorrect.' },
                { h: 'Limitation of Liability', b: 'To the maximum extent permitted by law, TSLAquant and its operators shall not be liable for any direct, indirect, incidental, or consequential damages arising from your use of the Platform.' },
                { h: 'Changes to Terms', b: 'We reserve the right to modify these Terms at any time. Continued use of the Platform after changes constitutes acceptance of the revised Terms.' },
                { h: 'Contact', b: 'Questions about these Terms? Contact us at: info@tslaquant.com' },
              ].map(({ h, b }) => (
                <div key={h} style={{ borderLeft: '2px solid #1e1e1e', paddingLeft: '16px' }}>
                  <div style={{ fontSize: '10px', letterSpacing: '1.5px', color: '#666', textTransform: 'uppercase', marginBottom: '6px' }}>{h}</div>
                  <p style={{ fontSize: '13px', color: '#bbb', lineHeight: '1.7', margin: 0 }}>{b}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setShowToS(false)} style={{
              marginTop: '36px', background: 'none', border: '1px solid #222', color: '#666',
              fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase',
              padding: '7px 18px', cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif",
            }}
              onMouseEnter={e => { e.target.style.borderColor = '#444'; e.target.style.color = '#aaa'; }}
              onMouseLeave={e => { e.target.style.borderColor = '#222'; e.target.style.color = '#666'; }}
            >Close</button>
          </div>
        </div>
      )}

      {/* Refund Policy Modal */}
      {showRefund && (
        <div onClick={() => setShowRefund(false)} style={{
          position: 'fixed', inset: 0, zIndex: 500,
          background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#0a0a0a', border: '1px solid #1e1e1e',
            padding: '44px 48px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto',
          }}>
            <div style={{ fontSize: '9px', letterSpacing: '4px', color: '#333', textTransform: 'uppercase', marginBottom: '16px' }}>Legal</div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginBottom: '28px' }}>Refund Policy</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {[
                { h: 'Digital Access Purchases', b: 'TSLAquant sells digital access tokens for AI-powered features such as Oracle Analysis. Because access is granted immediately upon purchase, all sales are generally final.' },
                { h: 'Eligibility for Refund', b: 'We will issue a full refund if: (1) you were charged but did not receive access due to a technical error on our end, or (2) you were charged more than once for the same purchase. Refund requests must be submitted within 7 days of the original transaction.' },
                { h: 'Non-Refundable Circumstances', b: 'We do not offer refunds for: change of mind after purchase, dissatisfaction with AI-generated analysis content, or failure to use purchased access within the validity period.' },
                { h: 'How to Request a Refund', b: 'Email info@tslaquant.com with your purchase receipt or Stripe transaction ID. We will respond within 2 business days and process approved refunds within 5–10 business days.' },
                { h: 'Stripe Processing', b: 'Payments are processed by Stripe, Inc. Refunds are issued to the original payment method. Processing times may vary by bank or card issuer.' },
                { h: 'Contact', b: 'For refund requests or billing questions: info@tslaquant.com' },
              ].map(({ h, b }) => (
                <div key={h} style={{ borderLeft: '2px solid #1e1e1e', paddingLeft: '16px' }}>
                  <div style={{ fontSize: '10px', letterSpacing: '1.5px', color: '#666', textTransform: 'uppercase', marginBottom: '6px' }}>{h}</div>
                  <p style={{ fontSize: '13px', color: '#bbb', lineHeight: '1.7', margin: 0 }}>{b}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setShowRefund(false)} style={{
              marginTop: '36px', background: 'none', border: '1px solid #222', color: '#666',
              fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase',
              padding: '7px 18px', cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif",
            }}
              onMouseEnter={e => { e.target.style.borderColor = '#444'; e.target.style.color = '#aaa'; }}
              onMouseLeave={e => { e.target.style.borderColor = '#222'; e.target.style.color = '#666'; }}
            >Close</button>
          </div>
        </div>
      )}

      {/* Price Breakdown Modal */}
      {showPriceModal && (
        <PriceModal
          breakdown={BREAKDOWN}
          total={PREDICTED}
          livePrice={tslaPrice}
          quantChange={QUANT_CHANGE}
          onClose={() => setShowPriceModal(false)}
        />
      )}

      {/* Bottom Legend — desktop only */}
      {!isMobile && (
        <footer style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          zIndex: 100,
          padding: '10px 28px',
          borderTop: '1px solid #111',
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          gap: '32px',
          alignItems: 'center',
          transition: 'right 0.3s ease',
        }}>
          <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: '#888', letterSpacing: '2px', textTransform: 'uppercase' }}>Likelihood</span>
            {luminescenceLevels.map(lv => (
              <div key={lv.label} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: lv.color, boxShadow: `0 0 8px 2px ${lv.glow}, 0 0 16px 4px ${lv.glow}` }} />
                <span style={{ fontSize: '11px', color: '#bbb', fontWeight: 500 }}>{lv.label}</span>
              </div>
            ))}
            <span style={{ fontSize: '11px', color: '#888', marginLeft: '4px' }}>→ Bright (high likelihood)</span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '20px', alignItems: 'center' }}>
            {[
              { label: 'Disclaimer', fn: () => setShowDisclaimer(true) },
              { label: 'Terms of Service', fn: () => setShowToS(true) },
              { label: 'Refund Policy', fn: () => setShowRefund(true) },
            ].map(({ label, fn }) => (
              <button key={label} onClick={fn} style={{
                background: 'none', border: 'none', padding: 0,
                color: '#aaa', fontSize: '11px', letterSpacing: '1.5px',
                textTransform: 'uppercase', cursor: 'pointer',
                fontFamily: "'Space Grotesk', sans-serif",
                textDecoration: 'underline', textUnderlineOffset: '3px',
              }}
                onMouseEnter={e => e.target.style.color = '#fff'}
                onMouseLeave={e => e.target.style.color = '#aaa'}
              >{label}</button>
            ))}
          </div>
        </footer>
      )}
    </div>
  );
}
