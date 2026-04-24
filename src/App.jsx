import { useState, useEffect, useRef } from 'react';
import Panel from './Panel';
import BreakingNews from './BreakingNews';
import PriceModal from './PriceModal';
import ProgressiveGraph from './ProgressiveGraph';
import MobileGraph from './MobileGraph';
import { logNodeClick } from './queryLogger';
import BetaDashboard from './BetaDashboard';
import ChartAnalysis from './ChartAnalysis';
import LeapsSignal from './LeapsSignal';
import ThetaGangSignal from './ThetaGangSignal';
import QueryEngine from './QueryEngine';
import DarkPoolGauge from './DarkPoolGauge';
import TSLAMedia from './TSLAMedia';
import { catalysts, links } from './data';
import { calcPredictedPrice, calcPriceBreakdown } from './priceModel';
import { useTSLAPrice } from './useTSLAPrice';

const PREDICTED = calcPredictedPrice(catalysts);
const BREAKDOWN = calcPriceBreakdown(catalysts);

// ─── Quant Model Daily Change ─────────────────────────────────────────────────
// PREV_PREDICTED = the model price before today's data updates.
// Update BOTH constants whenever a meaningful data change is deployed.
// QUANT_CHANGE_NOTE explains what drove the move from PREV_PREDICTED → PREDICTED.
const PREV_PREDICTED = 684; // model price before Apr 22, 2026 Q1 earnings beat update
const QUANT_CHANGE = PREDICTED !== PREV_PREDICTED ? PREDICTED - PREV_PREDICTED : null;
const QUANT_CHANGE_NOTE = "Apr 22, 2026: Q1 earnings beat — Rev $22.38B (+16% YoY), GM 21.1%, EPS $0.41 non-GAAP (+52%). Cybercab/Semi/Megapack3 volume production 2026 confirmed. 5-city robotaxi slippage partially offsets. Model moved $684 → $701.";

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
              <QueryEngine
                catalysts={catalysts}
                onGraphSearch={() => {}}
                onClearSearch={() => {}}
                isMobile={true}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const PANEL_WIDTH = 420;

// ── QueryEngineHeader: single merged rounded box ──────────────────────────────
function QueryEngineHeader({ open, onToggle }) {
  return (
    <div
      onClick={onToggle}
      className="pill-query"
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        border: `1px solid ${open ? '#00aaff' : 'rgba(0,170,255,0.6)'}`,
        borderRadius: '20px',
        padding: '5px 16px',
        cursor: 'pointer',
        background: open ? 'rgba(0,170,255,0.10)' : 'rgba(0,170,255,0.04)',
        transition: 'border-color 0.2s ease, background 0.2s ease',
        fontFamily: "'Space Grotesk', sans-serif",
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#00aaff'; e.currentTarget.style.background = 'rgba(0,170,255,0.08)'; }}
      onMouseLeave={e => { if (!open) { e.currentTarget.style.borderColor = '#fff'; e.currentTarget.style.background = 'transparent'; } }}
    >
      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#00aaff', display: 'inline-block', flexShrink: 0, boxShadow: '0 0 8px 3px rgba(0,170,255,0.6)' }} />
      <span style={{ color: '#00aaff', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 700 }}>Query Engine</span>
      <span style={{ color: '#888', fontSize: '10px', letterSpacing: '1px', margin: '0 2px' }}>·</span>
      <span style={{ color: '#00aaff', fontSize: '10px', letterSpacing: '1px', fontWeight: 600 }}>ROGER@TSLAQUANT:~$</span>
      <span style={{ color: '#fff', fontSize: '11px' }}>{open ? 'panel open →' : 'ask Roger...'}</span>
    </div>
  );
}

// ── QueryEnginePanel: full-height right-side slide-in panel ───────────────────
function QueryEnginePanel({ open, onClose, catalysts, onGraphSearch, onClearSearch, onSmartResult }) {
  return (
    <>
      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideOutRight { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
      `}</style>
      <div style={{
        position: 'fixed',
        top: 0, right: 0, bottom: 0,
        width: `${PANEL_WIDTH}px`,
        zIndex: 9999,
        background: 'rgb(2,5,10)',
        borderLeft: `1px solid ${open ? '#00aaff44' : '#1e2a3a'}`,
        display: 'flex',
        flexDirection: 'column',
        transform: open ? 'translateX(0)' : `translateX(100%)`,
        transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1), border-color 0.2s',
        boxShadow: open ? '-8px 0 40px rgba(0,170,255,0.08), -2px 0 12px rgba(0,0,0,0.6)' : 'none',
        pointerEvents: open ? 'all' : 'none',
      }}>
        {/* Panel header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid #111',
          background: 'rgba(0,170,255,0.04)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#00aaff', display: 'inline-block', boxShadow: '0 0 8px 3px rgba(0,170,255,0.6)' }} />
            <span style={{ fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: '#00aaff', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>Query Engine</span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: '1px solid #1e2a3a', color: '#555', fontSize: '14px', cursor: 'pointer', padding: '2px 8px', lineHeight: 1.4, transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.color = '#aaa'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e2a3a'; e.currentTarget.style.color = '#555'; }}
          >✕</button>
        </div>
        {/* QueryEngine fills remaining height */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 24px' }}>
          <QueryEngine
            catalysts={catalysts}
            onGraphSearch={onGraphSearch}
            onClearSearch={onClearSearch}
            onSmartResult={onSmartResult}
          />
        </div>
      </div>
    </>
  );
}

// ── Roger's Trading Corner pill + modal ──────────────────────────────────────
function BetaMetaTab({ tslaPrice, marketOpen, lastUpdated, predicted, quantChange, onShowPriceModal }) {
  const [open, setOpen] = useState(false);
  const F = "'Space Grotesk', sans-serif";

  return (
    <>
      {/* Pill */}
      <button onClick={() => setOpen(o => !o)} className="pill-corner" style={{ display: 'flex', alignItems: 'center', gap: '8px', border: `1px solid ${open ? '#00ff88' : 'rgba(0,255,136,0.5)'}`, borderRadius: '20px', padding: '5px 14px', background: open ? 'rgba(0,255,136,0.08)' : 'rgba(0,255,136,0.03)', cursor: 'pointer', fontFamily: F, transition: 'border-color 0.2s, background 0.2s', flexShrink: 0 }}
        onMouseEnter={e => { e.currentTarget.style.borderColor='#00aaff'; e.currentTarget.style.background='rgba(0,170,255,0.08)'; }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.borderColor='#fff'; e.currentTarget.style.background='transparent'; } }}>
        <span style={{ fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: '#00ff88', fontWeight: 700 }}>Roger's Trading Corner</span>
        <span style={{ fontSize: '9px', color: open ? '#00ff88' : '#aaa' }}>{open ? '▲' : '▼'}</span>
      </button>

      {/* Modal */}
      {open && (
        <div onClick={e => { if (e.target === e.currentTarget) setOpen(false); }} style={{ position: 'fixed', inset: 0, zIndex: 9500, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ border: '1px solid #1e2a3a', borderTop: '2px solid #00aaff', width: '900px', maxWidth: '96vw', maxHeight: '90vh', overflowY: 'auto', background: '#030608', fontFamily: F, boxShadow: '0 24px 80px rgba(0,0,0,0.95)', WebkitFontSmoothing: 'antialiased', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)' }}>
          <div>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '2px solid #00aaff22', background: 'linear-gradient(135deg, #040c18 0%, #060d1a 100%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Logo mark */}
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #00aaff22, #00ff8822)', border: '1px solid #00aaff44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>📈</div>
                <div>
                  <div style={{ fontSize: '14px', letterSpacing: '2.5px', textTransform: 'uppercase', color: '#fff', fontWeight: 800, lineHeight: 1 }}>Roger's Trading Corner</div>
                  <div style={{ fontSize: '9px', letterSpacing: '2px', color: '#00aaff', textTransform: 'uppercase', marginTop: '4px', fontWeight: 600 }}>Live Analysis · TSLA</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: '1px solid #555', color: '#ccc', fontSize: '14px', cursor: 'pointer', padding: '2px 8px', transition: 'all 0.15s', borderRadius: '4px' }}
                onMouseEnter={e => { e.currentTarget.style.color='#fff'; e.currentTarget.style.borderColor='#aaa'; }}
                onMouseLeave={e => { e.currentTarget.style.color='#ccc'; e.currentTarget.style.borderColor='#555'; }}>✕</button>
            </div>

            {/* Stats row: TSLA · Quant · Whale */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', background: '#080b10', borderBottom: '1px solid #0d1117', overflow: 'hidden' }}>
              {/* TSLA Live */}
              <div style={{ padding: '18px 24px', borderRight: '1px solid #0d1117' }}>
                <div style={{ fontSize: '9px', color: '#aaa', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>TSLA Live</div>
                <div style={{ fontSize: '30px', fontWeight: 700, color: marketOpen ? '#00aaff' : '#777', letterSpacing: '-0.5px' }}>{tslaPrice ? `$${tslaPrice.toFixed(2)}` : '—'}</div>
                <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>{marketOpen ? (lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : 'Live') : 'Market Closed'}</div>
              </div>
              {/* Quant Model */}
              <div style={{ padding: '18px 24px', borderRight: '1px solid #0d1117', cursor: 'pointer' }} onClick={() => { onShowPriceModal(); }}>
                <div style={{ fontSize: '9px', color: '#aaa', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>Quant Model ↗</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <div style={{ fontSize: '30px', fontWeight: 700, color: '#00ff88', textDecoration: 'underline', textUnderlineOffset: '3px', textDecorationColor: '#00ff8833' }}>${predicted.toFixed(0)}</div>
                  {quantChange !== null && <div style={{ fontSize: '14px', fontWeight: 600, color: quantChange >= 0 ? '#00ff88' : '#ff4444' }}>({quantChange >= 0 ? '+' : ''}{quantChange.toFixed(0)})</div>}
                </div>
                <div style={{ fontSize: '10px', color: '#555', marginTop: '4px' }}>Click for full breakdown</div>
              </div>
              {/* Whale Scale */}
              <div style={{ padding: '18px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden', position: 'relative', zIndex: 10 }}>
                <div style={{ fontSize: '9px', color: '#aaa', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '10px' }}>Whale Scale</div>
                <DarkPoolGauge />
              </div>
            </div>

{/* ── LEAPS Signal ── */}
            <LeapsSignal isMobile={false} />

{/* ── Theta Gang Signal ── */}
            <ThetaGangSignal isMobile={false} />

{/* ── Section divider: Tickers → Chart Analysis ── */}
            <div style={{ height: '3px', background: 'linear-gradient(to right, #00aaff33, #00ff8833, #00aaff33)', margin: '0' }} />

{/* Chart Analysis — Roger's TA */}
            <div style={{ display: 'block', width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
              <ChartAnalysis />
            </div>

{/* ── Section divider: Chart Analysis → Beta Dashboard ── */}
            <div style={{ height: '3px', background: 'linear-gradient(to right, #00aaff33, #00ff8833, #00aaff33)', margin: '0' }} />

{/* Beta Dashboard */}
            <BetaDashboard isMobile={false} inModal />
          </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function App() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [mobileOracleOpen, setMobileOracleOpen] = useState(false);
  const [mobileL3Open, setMobileL3Open] = useState(false);
  const [mobileTradingOpen, setMobileTradingOpen] = useState(false);
  const [mobileTubeOpen, setMobileTubeOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [selected, setSelected] = useState(null);
  const [showMedia, setShowMedia] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showToS, setShowToS] = useState(false);
  const [showRefund, setShowRefund] = useState(false);
  const [expandAll, setExpandAll] = useState(false);
  const [graphKey, setGraphKey] = useState(0);
  const [searchHighlightIds, setSearchHighlightIds] = useState(null);
  const [searchHighlightCats, setSearchHighlightCats] = useState(null);
  const [smartMode, setSmartMode] = useState(false);
  const [smartBadge, setSmartBadge] = useState(null);
  const graphRef = useRef(null);
  const [queryPanelOpen, setQueryPanelOpen] = useState(false);
  const activeQueryRef = useRef(''); // tracks last submitted query for click logging

  function handleSmartResult(ids, cats, badge, query) {
    setExpandAll(false);
    setSearchHighlightIds(ids);
    setSearchHighlightCats(cats);
    setSmartMode(true);
    setSmartBadge(badge);
    if (query) activeQueryRef.current = query;
    // Imperative call — bypasses all React effect timing issues
    setTimeout(() => graphRef.current?.expandCategories(cats), 0);
  }

  function exitSmartMode(goFull = false) {
    setSmartMode(false);
    setSmartBadge(null);
    setSearchHighlightIds(null);
    setSearchHighlightCats(null);
    if (goFull) setExpandAll(true);
  }
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
          <span style={{ color: '#444', fontSize: '10px' }}>·</span>
          <a
            href="https://x.com/RogerTSLAquant"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              color: '#fff', fontSize: '10px', letterSpacing: '1.5px',
              textTransform: 'uppercase', textDecoration: 'none',
              transition: 'color 0.15s',
              fontFamily: "'Space Grotesk', sans-serif",
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#1d9bf0'}
            onMouseLeave={e => e.currentTarget.style.color = '#fff'}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.261 5.636 5.902-5.636zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            @RogerTSLAquant
          </a>
        </div>
      )}

      {/* ── Desktop Header ── */}
      {!isMobile && (
        <header style={{
          position: 'fixed',
          top: '27px', left: 0, right: 0,
          zIndex: 100,
          background: 'rgba(0,0,0,0.95)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 28px',
          borderBottom: '1px solid #111',
          whiteSpace: 'nowrap', minWidth: 0,
        }}>

          {/* Brand */}
          <div style={{ flexShrink: 0, marginRight: '20px' }}>
            <div style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '2px', color: '#fff' }}>TSLA_QUANT</div>
            <div style={{ fontSize: '10px', letterSpacing: '3px', color: '#aaa', textTransform: 'uppercase', marginTop: '2px' }}>v1.3</div>
          </div>

          {/* Center: graph controls */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #fff', borderRadius: '20px', overflow: 'hidden', fontFamily: "'Space Grotesk', sans-serif" }}>
              <button onClick={() => { if (expandAll) { setExpandAll(false); setGraphKey(k => k + 1); } exitSmartMode(false); }}
                style={{ background: (!expandAll && !smartMode) ? 'rgba(0,255,136,0.18)' : 'transparent', border: 'none', borderRight: '1px solid #fff', color: (!expandAll && !smartMode) ? '#00ff88' : '#fff', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', padding: '5px 14px', cursor: (expandAll || smartMode) ? 'pointer' : 'default', fontFamily: "'Space Grotesk', sans-serif", display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s ease' }}>
                <span style={{ fontSize: '12px' }}>◉</span>Overview
              </button>
              <button onClick={() => { if (!expandAll) { setExpandAll(true); } exitSmartMode(false); }}
                style={{ background: (expandAll && !smartMode) ? 'rgba(0,255,136,0.18)' : 'transparent', border: 'none', color: (expandAll && !smartMode) ? '#00ff88' : '#fff', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', padding: '5px 14px', cursor: (!expandAll || smartMode) ? 'pointer' : 'default', fontFamily: "'Space Grotesk', sans-serif", display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s ease' }}>
                <span style={{ fontSize: '12px' }}>⬡</span>Full Network
              </button>
            </div>
            <div style={{ width: '1px', height: '28px', background: '#333' }} />
            <button onClick={() => setShowMedia(m => !m)} style={{
              background: showMedia ? 'rgba(255,50,50,0.12)' : 'transparent',
              border: `1px solid ${showMedia ? '#ff3333' : '#ff333388'}`,
              borderRadius: '20px', color: showMedia ? '#ff6666' : '#fff',
              fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase',
              padding: '5px 14px', cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif",
              transition: 'all 0.2s', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px',
            }}
              onMouseEnter={e => { if (!showMedia) { e.currentTarget.style.borderColor='#ff3333'; e.currentTarget.style.color='#ff6666'; }}}
              onMouseLeave={e => { if (!showMedia) { e.currentTarget.style.borderColor='#ff333388'; e.currentTarget.style.color='#fff'; }}}
            >
              <span style={{ fontSize: '12px' }}>🎬</span>TSLA TUBE
            </button>
            <div style={{ width: '1px', height: '28px', background: '#333' }} />
            <QueryEngineHeader open={queryPanelOpen} onToggle={() => setQueryPanelOpen(o => !o)} />
            <div style={{ width: '1px', height: '28px', background: '#333' }} />
            <button onClick={() => setShowHowTo(true)} style={{ background: 'none', border: '1px solid #666', color: '#fff', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', padding: '5px 14px', cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", transition: 'all 0.2s ease', borderRadius: '20px' }} onMouseEnter={e => e.currentTarget.style.borderColor='#aaa'} onMouseLeave={e => e.currentTarget.style.borderColor='#666'}>ⓘ Info</button>
          </div>

          {/* Right: prices + AI pulse + Trading Corner */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, marginLeft: '20px' }}>
            {/* Quant Model */}
            <div style={{ textAlign: 'right', cursor: 'pointer' }} onClick={() => setShowPriceModal(true)}>
              <div style={{ color: '#fff', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '2px' }}>Quant Model ↗</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', justifyContent: 'flex-end' }}>
                <span style={{ color: '#00ff88', fontWeight: 700, fontSize: '17px', textDecoration: 'underline', textUnderlineOffset: '3px', textDecorationColor: '#00ff8844' }}>${PREDICTED.toFixed(0)}</span>
                {QUANT_CHANGE !== null && <span style={{ fontSize: '10px', fontWeight: 600, color: QUANT_CHANGE >= 0 ? '#00ff88' : '#ff4444' }}>({QUANT_CHANGE >= 0 ? '+' : ''}{QUANT_CHANGE.toFixed(0)})</span>}
              </div>
            </div>
            <div style={{ width: '1px', height: '28px', background: '#333' }} />
            {/* TSLA Live */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#fff', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '2px' }}>TSLA Live</div>
              <div style={{ color: marketOpen ? '#00aaff' : '#888', fontWeight: 700, fontSize: '17px' }}>{tslaPrice ? `$${tslaPrice.toFixed(2)}` : '—'}</div>
            </div>
            <div style={{ width: '1px', height: '28px', background: '#333' }} />

            <BetaMetaTab tslaPrice={tslaPrice} marketOpen={marketOpen} lastUpdated={lastUpdated} predicted={PREDICTED} quantChange={QUANT_CHANGE} onShowPriceModal={() => setShowPriceModal(true)} />
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
            {/* Brand + badge + AI Engine */}
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
              <span style={{ fontSize: '7px', color: '#00ff8888', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 5px 2px rgba(0,255,136,0.6)', display: 'inline-block', flexShrink: 0 }} />
                AI Online · {syncLabel}
              </span>
              <a href="https://x.com/RogerTSLAquant" target="_blank" rel="noopener noreferrer" style={{ fontSize: '7px', color: '#ddd', letterSpacing: '0.5px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.741l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/></svg>
                @RogerTSLAquant
              </a>
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
            <div style={{ flex: 1, padding: '8px 0 8px 16px', borderRight: '1px solid #111' }}>
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
            {/* Whale Scale */}
            <div style={{ flex: 1, padding: '8px 0 8px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <DarkPoolGauge mobile />
            </div>
          </div>
        </>
      )}

      {/* Mobile: full-screen experience */}
      {isMobile && (
        <div style={{ position: 'absolute', inset: 0, paddingTop: '90px', zIndex: 1 }}>
          <MobileGraph
            onShowDisclaimer={() => setShowDisclaimer(true)}
            onShowToS={() => setShowToS(true)}
            onShowRefund={() => setShowRefund(true)}
            onOracleOpen={() => setMobileOracleOpen(true)}
            onOracleClose={() => setMobileOracleOpen(false)}
            onL3Open={() => setMobileL3Open(true)}
            onL3Close={() => setMobileL3Open(false)}
            onTradingOpen={() => setMobileTradingOpen(true)}
            onTradingClose={() => setMobileTradingOpen(false)}
            onTubeOpen={() => setMobileTubeOpen(true)}
            onTubeClose={() => setMobileTubeOpen(false)}
          />
        </div>
      )}

      {/* Desktop graph */}
      {!isMobile && (
        <div style={{
          position: 'absolute',
          inset: 0,
          paddingTop: '72px',
          paddingBottom: '56px',
          paddingRight: queryPanelOpen ? `${PANEL_WIDTH}px` : '0',
          transition: 'padding-right 0.28s cubic-bezier(0.4,0,0.2,1)',
          zIndex: 1,
        }}>
          <ProgressiveGraph
            ref={graphRef}
            key={graphKey}
            catalysts={catalysts}
            links={links}
            onNodeClick={(node) => {
              setSelected(node);
              if (node && activeQueryRef.current) {
                logNodeClick({ query: activeQueryRef.current, clickedId: node.id });
              }
            }}
            expandAll={expandAll}
            onAllExpanded={() => setExpandAll(true)}
            isMobile={false}
            highlightedIds={searchHighlightIds}
            highlightedCategories={searchHighlightCats}
            smartMode={smartMode}
            smartBadge={smartBadge}
            onExitSmart={() => exitSmartMode(true)}
          />
        </div>
      )}

      {/* Detail Panel (desktop only) */}
      {!isMobile && <Panel node={selected} onClose={() => setSelected(null)} isMobile={false} />}

      {/* Breaking News Tab */}
      <BreakingNews isMobile={isMobile} hidden={isMobile && (mobileOracleOpen || mobileL3Open || mobileTradingOpen || mobileTubeOpen)} />

      {/* Desktop: Query Engine right-side panel */}
      {!isMobile && (
        <QueryEnginePanel
          open={queryPanelOpen}
          onClose={() => setQueryPanelOpen(false)}
          catalysts={catalysts}
          onGraphSearch={(ids, cats) => { setSearchHighlightIds(ids); setSearchHighlightCats(cats); }}
          onClearSearch={() => { setSearchHighlightIds(null); setSearchHighlightCats(null); setSmartMode(false); setSmartBadge(null); }}
          onSmartResult={handleSmartResult}
        />
      )}



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
            <div style={{ fontSize: '9px', letterSpacing: '4px', color: '#555', textTransform: 'uppercase', marginBottom: '16px' }}>ⓘ Info</div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginBottom: '6px', letterSpacing: '-0.3px' }}>
              TSLA_QUANT
            </div>
            <p style={{ fontSize: '13px', color: '#888', lineHeight: 1.65, marginBottom: '28px' }}>
              A real-time catalyst tracking terminal powered by an agentic AI framework. While traditional analysts rely on quarterly reports, TSLAquant synthesizes live intelligence into a dynamic map of Tesla's milestone ecosystem — updated daily.
            </p>
            <div style={{ height: '1px', background: '#1e1e1e', marginBottom: '24px' }} />
            <div style={{ fontSize: '9px', letterSpacing: '3px', color: '#555', textTransform: 'uppercase', marginBottom: '20px' }}>How to Use</div>

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
                  heading: 'Overview / Full Network',
                  body: 'Use the segmented control in the header to switch views. Overview shows 8 master orbs — click any to bloom into its sub-catalysts. Full Network reveals all 34 nodes simultaneously across 6 business units — every connection and dependency at once.',
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
      {/* ── TSLA TUBE Media Overlay ── */}
      {showMedia && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9400,
          background: '#030608',
          display: 'flex', flexDirection: 'column',
          whiteSpace: 'normal',
          fontFamily: "'Space Grotesk', sans-serif",
        }}>
          {/* Header bar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 24px', borderBottom: '1px solid #111',
            background: '#020406', flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '2px', color: '#fff', fontFamily: "'Space Grotesk', sans-serif" }}>🎬 TSLA TUBE</span>
              <span style={{ fontSize: '10px', color: '#555', letterSpacing: '1px' }}>YouTube Digest · tslaquant.com</span>
            </div>
            <button onClick={() => setShowMedia(false)} style={{
              background: 'none', border: '1px solid #555', color: '#ccc',
              fontSize: '14px', cursor: 'pointer', padding: '2px 10px',
              fontFamily: "'Space Grotesk', sans-serif", borderRadius: '4px', transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.color='#fff'; e.currentTarget.style.borderColor='#aaa'; }}
              onMouseLeave={e => { e.currentTarget.style.color='#ccc'; e.currentTarget.style.borderColor='#555'; }}
            >✕</button>
          </div>
          {/* Scrollable content */}
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, whiteSpace: 'normal' }}>
            <TSLAMedia onAskRogerVideo={(video) => {
              setShowMedia(false);
              setQueryPanelOpen(true);
            }} />
          </div>
        </div>
      )}

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
              maxHeight: '80vh',
              overflowY: 'auto',
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
                  <div style={{ fontSize: '10px', letterSpacing: '1.5px', color: '#666', textTransform: 'uppercase', marginBottom: '6px' }}>{heading}</div>
                  <p style={{ fontSize: '13px', color: '#bbb', lineHeight: '1.7', margin: 0 }}>{body}</p>
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
          quantChangeNote={QUANT_CHANGE_NOTE}
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
            {/* AI Engine status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingRight: '16px', borderRight: '1px solid #222' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 6px 2px rgba(0,255,136,0.7)', display: 'inline-block', animation: 'greenPulse 2s ease-in-out infinite' }} />
              <span style={{ fontSize: '10px', color: '#00ff88', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 600 }}>AI Engine: Online</span>
              <span style={{ fontSize: '10px', color: '#555', letterSpacing: '1px' }}>· Last Sync: {syncLabel}</span>
            </div>
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
