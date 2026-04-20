import { useState, useEffect, useRef, useCallback } from 'react';
import { betaHistory, BETA_SPY, BETA_QQQ } from './betaData';

const FONT = "'Space Grotesk', sans-serif";

function isMarketOpen() {
  const et = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day = et.getDay();
  if (day === 0 || day === 6) return false;
  const mins = et.getHours() * 60 + et.getMinutes();
  return mins >= 570 && mins < 960;
}

function getDivergenceSignal(actual, expected, label) {
  const diff = actual - expected;
  if (diff > 0.5)  return { label: `β Outperforming  ▲ +${diff.toFixed(1)}%`, color: '#00ff88', icon: '▲' };
  if (diff < -0.5) return { label: `β Underperforming ▼ ${diff.toFixed(1)}%`, color: '#ff4444', icon: '▼' };
  return { label: `β Tracking Market  ≈ ${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`, color: '#aaa', icon: '≈' };
}

function fmt(n, sign = true) {
  if (n === null || n === undefined) return '—';
  const s = Math.abs(n).toFixed(2) + '%';
  if (!sign) return s;
  return (n >= 0 ? '+' : '-') + s;
}

// ── Scatter Plot ──────────────────────────────────────────────────────────────
function ScatterPlot({ mode, livePoint }) {
  const canvasRef = useRef(null);
  const beta = mode === 'spy' ? BETA_SPY : BETA_QQQ;
  const key = mode; // 'spy' | 'qqq'

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // Collect all points
    const pts = betaHistory
      .map(d => ({ x: d[key], y: d.tsla, date: d.date, live: false }))
      .filter(p => p.x != null && p.y != null);
    if (livePoint?.[key] != null && livePoint?.tsla != null) {
      pts.push({ x: livePoint[key], y: livePoint.tsla, date: 'Today', live: true });
    }

    // Axis range — pad to nearest 2%
    const allX = pts.map(p => p.x);
    const allY = pts.map(p => p.y);
    const xMin = Math.min(-3, ...allX) - 0.5;
    const xMax = Math.max(3, ...allX) + 0.5;
    const yMin = Math.min(-6, ...allY) - 0.5;
    const yMax = Math.max(6, ...allY) + 0.5;

    const PAD = { l: 42, r: 16, t: 16, b: 36 };
    const plotW = W - PAD.l - PAD.r;
    const plotH = H - PAD.t - PAD.b;

    const toX = v => PAD.l + ((v - xMin) / (xMax - xMin)) * plotW;
    const toY = v => PAD.t + ((yMax - v) / (yMax - yMin)) * plotH;

    // Background
    ctx.fillStyle = '#020508';
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = '#1e2a3a';
    ctx.lineWidth = 1;
    for (let v = Math.ceil(xMin); v <= Math.floor(xMax); v++) {
      ctx.beginPath(); ctx.moveTo(toX(v), PAD.t); ctx.lineTo(toX(v), H - PAD.b); ctx.stroke();
    }
    for (let v = Math.ceil(yMin); v <= Math.floor(yMax); v++) {
      ctx.beginPath(); ctx.moveTo(PAD.l, toY(v)); ctx.lineTo(W - PAD.r, toY(v)); ctx.stroke();
    }

    // Zero axes
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(toX(0), PAD.t); ctx.lineTo(toX(0), H - PAD.b); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(PAD.l, toY(0)); ctx.lineTo(W - PAD.r, toY(0)); ctx.stroke();

    // Beta line
    const bLineX1 = xMin, bLineY1 = xMin * beta;
    const bLineX2 = xMax, bLineY2 = xMax * beta;
    ctx.strokeStyle = '#00aaffaa';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(toX(bLineX1), toY(bLineY1));
    ctx.lineTo(toX(bLineX2), toY(bLineY2));
    ctx.stroke();
    ctx.setLineDash([]);

    // Beta line label
    ctx.fillStyle = '#00ccff';
    ctx.font = `bold 12px ${FONT}`;
    ctx.textAlign = 'left';
    const lblX = toX(xMax * 0.55);
    const lblY = toY(xMax * 0.55 * beta) - 8;
    ctx.fillText(`β=${beta}`, lblX, lblY);

    // Alpha/Laggard zone labels
    ctx.font = `bold 11px ${FONT}`;
    ctx.fillStyle = '#00ff88aa';
    ctx.fillText('α ALPHA DAYS', PAD.l + 4, PAD.t + 16);
    ctx.fillStyle = '#ff4444aa';
    ctx.fillText('LAGGARD DAYS', PAD.l + 4, H - PAD.b - 6);

    // Dots
    pts.forEach(p => {
      const expected = p.x * beta;
      const isAlpha = p.y > expected;
      const cx = toX(p.x), cy = toY(p.y);
      const r = p.live ? 5 : 3.5;

      if (p.live) {
        // Glow for live point
        const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 12);
        grd.addColorStop(0, 'rgba(255,220,0,0.4)');
        grd.addColorStop(1, 'rgba(255,220,0,0)');
        ctx.fillStyle = grd;
        ctx.beginPath(); ctx.arc(cx, cy, 12, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffdc00';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
      } else {
        ctx.fillStyle = isAlpha ? 'rgba(0,255,136,0.7)' : 'rgba(255,68,68,0.6)';
        ctx.strokeStyle = isAlpha ? '#00ff8844' : '#ff444444';
        ctx.lineWidth = 0.5;
      }
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    });

    // Axis labels — solid white, larger
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 11px ${FONT}`;
    ctx.textAlign = 'center';
    for (let v = Math.ceil(xMin); v <= Math.floor(xMax); v += 1) {
      if (v === 0) continue;
      ctx.fillText(`${v > 0 ? '+' : ''}${v}%`, toX(v), H - PAD.b + 16);
    }
    ctx.textAlign = 'right';
    for (let v = Math.ceil(yMin); v <= Math.floor(yMax); v += 2) {
      if (v === 0) continue;
      ctx.fillText(`${v > 0 ? '+' : ''}${v}%`, PAD.l - 5, toY(v) + 4);
    }

    // Axis titles — solid white
    ctx.fillStyle = '#cccccc';
    ctx.font = `11px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(mode === 'spy' ? 'SPY daily %' : 'QQQ daily %', PAD.l + plotW / 2, H - 2);
    ctx.save();
    ctx.translate(11, PAD.t + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('TSLA daily %', 0, 0);
    ctx.restore();

  }, [mode, livePoint, beta, key]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '220px', display: 'block' }}
    />
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function BetaDashboard({ isMobile = false }) {
  const [live, setLive] = useState(null);
  const [scatterMode, setScatterMode] = useState('spy');
  const [showScatter, setShowScatter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [infoPos, setInfoPos] = useState({ top: 0, left: 0 });
  const infoRef = useRef(null);
  const infoBtnRef = useRef(null);

  // Close info popover on outside click
  useEffect(() => {
    if (!showInfo) return;
    const handler = e => { if (infoRef.current && !infoRef.current.contains(e.target)) setShowInfo(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showInfo]);

  // Use most recent entry from betaHistory as today's data (Rooz-verified numbers)
  useEffect(() => {
    const latest = betaHistory[betaHistory.length - 1];
    if (latest) {
      setLive({
        tsla: latest.tsla,
        spy:  latest.spy,
        qqq:  latest.qqq,
        marketOpen: isMarketOpen(),
      });
    }
    setLoading(false);
  }, []);

  const marketOpen = live?.marketOpen ?? isMarketOpen();

  // Expected moves
  const expSpy = live?.spy != null ? live.spy * BETA_SPY : null;
  const expQqq = live?.qqq != null ? live.qqq * BETA_QQQ : null;
  const sigSpy = live?.tsla != null && expSpy != null ? getDivergenceSignal(live.tsla, expSpy, 'SPY') : null;
  const sigQqq = live?.tsla != null && expQqq != null ? getDivergenceSignal(live.tsla, expQqq, 'QQQ') : null;

  const rows = [
    {
      index: 'S&P 500', ticker: 'SPY', beta: BETA_SPY, symbol: 'β',
      actual: live?.spy, expected: expSpy, tsla: live?.tsla, signal: sigSpy,
      key: 'spy',
    },
    {
      index: 'Nasdaq-100', ticker: 'QQQ', beta: BETA_QQQ, symbol: 'β',
      actual: live?.qqq, expected: expQqq, tsla: live?.tsla, signal: sigQqq,
      key: 'qqq',
    },
  ];

  return (
    <div style={{
      fontFamily: FONT,
      borderBottom: '1px solid #111',
      background: '#030608',
    }}>
      {/* Header row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '6px 14px' : '6px 28px',
        borderBottom: '1px solid #0d1117',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '2px', color: '#fff', textTransform: 'uppercase' }}>
            Beta Dashboard
          </span>
          <span style={{ fontSize: '11px', color: '#fff', fontStyle: 'italic', letterSpacing: '0.2px' }}>
            Is this move Tesla-specific, or just market tide?
          </span>
          <span style={{
            fontSize: '10px', color: '#888', letterSpacing: '1px',
            borderLeft: '1px solid #1a1a1a', paddingLeft: '12px',
          }}>
            {marketOpen ? '● Live' : '○ Last Close'}
          </span>
          {/* ⓘ Info popover */}
          <div ref={infoRef} style={{ position: 'relative', marginLeft: '4px' }}>
            <button
              ref={infoBtnRef}
              onClick={() => {
                const rect = infoBtnRef.current?.getBoundingClientRect();
                if (rect) {
                  const popH = 220;
                  const top = rect.bottom + popH > window.innerHeight
                    ? rect.top - popH - 8
                    : rect.bottom + 8;
                  setInfoPos({ top, left: Math.min(rect.left, window.innerWidth - 340) });
                }
                setShowInfo(s => !s);
              }}
              style={{ background: showInfo ? 'rgba(0,170,255,0.15)' : 'transparent', border: `1px solid ${showInfo ? '#00aaff' : '#aaa'}`, borderRadius: '50%', color: showInfo ? '#00aaff' : '#fff', width: '20px', height: '20px', fontSize: '11px', cursor: 'pointer', fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s', fontWeight: 700 }}
            >i</button>
            {showInfo && (
              <div style={{ position: 'fixed', top: infoPos.top, left: infoPos.left, width: '320px', background: '#0a0d12', border: '1px solid #2a2a2a', padding: '14px 16px', zIndex: 99999, boxShadow: '0 8px 32px rgba(0,0,0,0.95)', fontSize: '12px', color: '#ddd', lineHeight: 1.8, WebkitFontSmoothing: 'antialiased', wordBreak: 'break-word', whiteSpace: 'normal', overflowWrap: 'break-word' }}>
                <div style={{ fontWeight: 700, color: '#fff', marginBottom: '8px', letterSpacing: '1px', textTransform: 'uppercase', fontSize: '11px' }}>What is Beta?</div>
                <div style={{ marginBottom: '10px' }}>Beta (β) measures how much TSLA moves relative to the broader market. A β of 2.3 vs S&P 500 means: if SPY rises +1%, TSLA is expected to rise +2.3%.</div>
                <div><span style={{ color: '#00ff88', fontWeight: 600 }}>Outperforming</span> — TSLA beats its expected β move. Stock-specific catalyst driving action.</div>
                <div style={{ marginTop: '4px' }}><span style={{ color: '#ff4444', fontWeight: 600 }}>Underperforming</span> — TSLA lags despite market tailwind. Stock-specific headwind.</div>
                <div style={{ marginTop: '4px' }}><span style={{ color: '#ccc', fontWeight: 600 }}>Tracking</span> — TSLA moving in line with beta. No special signal.</div>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowScatter(s => !s)}
          style={{
            background: showScatter ? 'rgba(0,170,255,0.1)' : 'transparent',
            border: `1px solid ${showScatter ? '#00aaff' : '#222'}`,
            borderRadius: '12px',
            color: showScatter ? '#00aaff' : '#555',
            fontSize: '9px', letterSpacing: '1.5px', textTransform: 'uppercase',
            padding: '3px 10px', cursor: 'pointer', fontFamily: FONT,
            transition: 'all 0.2s',
          }}
        >
          {showScatter ? '▲ Hide Chart' : '▼ Scatter Plot'}
        </button>
      </div>

      {/* Table */}
      <div style={{ padding: isMobile ? '0 14px 6px' : '0 28px 8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ color: '#bbb', letterSpacing: '1px', textTransform: 'uppercase', fontSize: '11px' }}>
              <td style={{ padding: '8px 10px 6px 0', width: '130px' }}>Index</td>
              <td style={{ padding: '8px 10px 6px', textAlign: 'center', width: '80px' }}>Δ Actual</td>
              <td style={{ padding: '8px 10px 6px', textAlign: 'center', width: '110px' }}>TSLA Expected</td>
              <td style={{ padding: '8px 10px 6px', textAlign: 'center', width: '100px' }}>TSLA Actual</td>
              <td style={{ padding: '8px 10px 6px', textAlign: 'left' }}>Signal</td>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.key} style={{ borderTop: '1px solid #0d1117' }}>
                <td style={{ padding: '10px 10px 10px 0' }}>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: '13px' }}>{row.index}</div>
                  <div style={{ color: '#aaa', fontSize: '11px', marginTop: '2px' }}>{row.ticker} · {row.symbol}={row.beta}</div>
                </td>
                <td style={{ padding: '10px', textAlign: 'center' }}>
                  <span style={{ color: row.actual == null ? '#555' : row.actual >= 0 ? '#00ff88' : '#ff4444', fontWeight: 600, fontSize: '13px' }}>
                    {loading ? '…' : fmt(row.actual)}
                  </span>
                </td>
                <td style={{ padding: '10px', textAlign: 'center' }}>
                  <span style={{ color: '#00aaff', fontWeight: 600, fontSize: '13px' }}>
                    {loading ? '…' : fmt(row.expected)}
                  </span>
                </td>
                <td style={{ padding: '10px', textAlign: 'center' }}>
                  <span style={{ color: row.tsla == null ? '#555' : row.tsla >= 0 ? '#00ff88' : '#ff4444', fontWeight: 700, fontSize: '15px' }}>
                    {loading ? '…' : fmt(row.tsla)}
                  </span>
                </td>
                <td style={{ padding: '10px' }}>
                  {row.signal ? (
                    <span style={{ color: row.signal.color, fontSize: '12px', letterSpacing: '0.5px', fontWeight: 600 }}>
                      {row.signal.label}
                    </span>
                  ) : (
                    <span style={{ color: '#888', fontSize: '12px' }}>{loading ? '…' : 'Awaiting data'}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>


      </div>

      {/* Scatter Plot */}
      {showScatter && (
        <div style={{ padding: isMobile ? '0 14px 14px' : '0 28px 16px' }}>
          {/* Mode toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{ fontSize: '9px', color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase' }}>vs.</span>
            {['spy', 'qqq'].map(m => (
              <button
                key={m}
                onClick={() => setScatterMode(m)}
                style={{
                  background: scatterMode === m ? 'rgba(0,170,255,0.12)' : 'transparent',
                  border: `1px solid ${scatterMode === m ? '#00aaff' : '#1e2a3a'}`,
                  borderRadius: '10px',
                  color: scatterMode === m ? '#00aaff' : '#555',
                  fontSize: '9px', letterSpacing: '1.5px', textTransform: 'uppercase',
                  padding: '3px 10px', cursor: 'pointer', fontFamily: FONT,
                  transition: 'all 0.15s',
                }}
              >
                {m === 'spy' ? `SPY  β=${BETA_SPY}` : `QQQ  β=${BETA_QQQ}`}
              </button>
            ))}
            <span style={{ marginLeft: 'auto', fontSize: '9px', color: '#777' }}>
              {betaHistory.length} days · <span style={{ color: '#00ff8866' }}>● alpha</span>  <span style={{ color: '#ff444466' }}>● laggard</span>  <span style={{ color: '#ffdc00' }}>● today</span>
            </span>
          </div>

          <div style={{ border: '1px solid #0d1117', borderRadius: '4px', overflow: 'hidden' }}>
            <ScatterPlot mode={scatterMode} livePoint={live} />
          </div>
        </div>
      )}
    </div>
  );
}
