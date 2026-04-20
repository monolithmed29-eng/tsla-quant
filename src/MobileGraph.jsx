import React, { useState, useEffect, useRef } from 'react';
import { catalysts } from './data';
import { useRemoteData, fetchRemoteData } from './useRemoteData';
import { MEDIA_DIGEST as FALLBACK_DIGEST } from './tslaMediaData';
import { searchCatalysts } from './useNodeSearch';
import { getCredits, isPro, decrementCredit } from './creditManager';
import { getFingerprint } from './fingerprint';
import { darkPoolData as fallbackDarkPool } from './darkPoolData';
import UpgradeModal from './UpgradeModal';
import RestoreAccess from './RestoreAccess';
import DarkPoolGauge from './DarkPoolGauge';
import ChartAnalysis from './ChartAnalysis';
import BetaDashboard from './BetaDashboard';
import { calcPredictedPrice } from './priceModel';
import { useTSLAPrice } from './useTSLAPrice';

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORY_ORDER = ['autonomy', 'robotics', 'financials', 'product', 'manufacturing', 'energy'];
const CATEGORY_LABELS = {
  autonomy: 'Autonomy', robotics: 'Robotics / AI', financials: 'Financials',
  product: 'Product', manufacturing: 'Manufacturing', energy: 'Energy',
};
const CATEGORY_COLORS = {
  autonomy: 'hsl(210,100%,60%)', robotics: 'hsl(200,30%,65%)', financials: 'hsl(142,70%,55%)',
  product: 'hsl(270,80%,70%)', manufacturing: 'hsl(35,90%,60%)', energy: 'hsl(15,100%,60%)',
};
const MASTER_LAYOUT = [
  { col: 0, row: 0 }, { col: 1, row: 0 },
  { col: 0, row: 1 }, { col: 1, row: 1 },
  { col: 0, row: 2 }, { col: 1, row: 2 },
];
const ORB_R = 38;
const SUB_R = 26;
const FAN_RADIUS = 145;
// Fixed anchor: active master snaps here (center of canvas)
const ANCHOR_X_PCT = 0.50;
const ANCHOR_Y_PCT = 0.48;
// Ghost slots: top corners + side mids
const GHOST_SLOTS = [
  { x: 0.10, y: 0.08 }, { x: 0.90, y: 0.08 },
  { x: 0.06, y: 0.40 }, { x: 0.94, y: 0.40 },
  { x: 0.10, y: 0.70 }, { x: 0.90, y: 0.70 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function isUpdatedToday(u) {
  if (!u) return false;
  const d = new Date(u), t = new Date();
  return d.getFullYear()===t.getFullYear() && d.getMonth()===t.getMonth() && d.getDate()===t.getDate();
}
function getLum(l) {
  if (l >= 0.9) return { core:'rgba(255,255,255,1.0)',   glow:'rgba(255,255,255,0.30)' };
  if (l >= 0.7) return { core:'rgba(220,235,255,0.95)', glow:'rgba(200,220,255,0.22)' };
  if (l >= 0.5) return { core:'rgba(180,200,230,0.85)', glow:'rgba(160,185,220,0.16)' };
  if (l >= 0.3) return { core:'rgba(130,150,190,0.70)', glow:'rgba(120,140,180,0.11)' };
  return               { core:'rgba(80,100,140,0.55)',  glow:'rgba(70,90,130,0.07)'  };
}
function buildMasterNode(catId) {
  const ch = catalysts.filter(c => c.category === catId);
  const avg = ch.length ? ch.reduce((s,c) => s+c.likelihood, 0)/ch.length : 0.5;
  return { id:`__master_${catId}`, category:catId, label:CATEGORY_LABELS[catId]||catId,
    likelihood:avg, childCount:ch.length, hasRecentUpdate:ch.some(c=>isUpdatedToday(c.updated)), children:ch };
}
function getFanAngles(count, facingUp) {
  const spread = Math.min(160, Math.max(60, count * 28));
  return Array.from({length:count}, (_,i) => {
    const t = count===1 ? 0.5 : i/(count-1);
    const base = facingUp ? -90 : 90;
    return base + (t-0.5)*spread*2;
  });
}
function timeAgo(iso) {
  const diff = Date.now()-new Date(iso).getTime(), h=Math.floor(diff/3600000);
  if (h<1) return `${Math.floor(diff/60000)}m ago`;
  if (h<24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
}
function fmtViews(n) {
  if (!n) return '';
  if (n>=1e6) return `${(n/1e6).toFixed(1)}M views`;
  if (n>=1000) return `${(n/1000).toFixed(0)}K views`;
  return `${n} views`;
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
  @keyframes heartbeat {
    0%   { opacity:0; transform:scale(0.8); }
    5%   { opacity:1; transform:scale(1.2); }
    10%  { opacity:0; transform:scale(0.8); }
    17%  { opacity:1; transform:scale(1.1); }
    22%  { opacity:0; transform:scale(0.8); }
    100% { opacity:0; transform:scale(0.8); }
  }
  @keyframes orbPulseBright {
    0%,100% { box-shadow: 0 0 0 0 rgba(220,235,255,0); }
    50%     { box-shadow: 0 0 0 8px rgba(220,235,255,0.20); }
  }
  @keyframes orbPulseMed {
    0%,100% { box-shadow: 0 0 0 0 rgba(180,200,230,0); }
    50%     { box-shadow: 0 0 0 6px rgba(180,200,230,0.14); }
  }
  @keyframes orbPulseLow {
    0%,100% { box-shadow: 0 0 0 0 rgba(100,120,160,0); }
    50%     { box-shadow: 0 0 0 4px rgba(100,120,160,0.10); }
  }
  @keyframes greenRing {
    0%,100% { box-shadow: 0 0 0 3px rgba(0,255,136,0.6), 0 0 16px 4px rgba(0,255,136,0.2); }
    50%     { box-shadow: 0 0 0 6px rgba(0,255,136,0.3), 0 0 28px 8px rgba(0,255,136,0.1); }
  }
  @keyframes oracleSlideUp {
    from { opacity:0; transform:translateY(100%); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes pillFadeIn {
    from { opacity:0; transform:translateY(16px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes fadeInUp {
    from { opacity:0; transform:translateY(10px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes scaleGrow {
    from { opacity:0; transform:scale(0.92); }
    to   { opacity:1; transform:scale(1); }
  }
  .hb  { animation: heartbeat 2.8s ease-in-out infinite; }
  .hbs { animation: heartbeat 2.8s ease-in-out 0.4s infinite; }
  .oracle-sheet { animation: oracleSlideUp 0.32s cubic-bezier(0.34,1.2,0.64,1); }
  .pill-anim    { animation: pillFadeIn 0.4s cubic-bezier(0.34,1.2,0.64,1); }
  .m-orb, .m-sub { cursor:pointer; -webkit-tap-highlight-color:transparent; }
  .m-orb:active  { filter:brightness(1.3); }
  .m-sub:active  { filter:brightness(1.4); }
`;

// ─── Level 3 detail overlay ───────────────────────────────────────────────────
function Level3Panel({ node, originXY, onBack }) {
  if (!node) return null;
  const lum = getLum(node.likelihood);
  const catColor = CATEGORY_COLORS[node.category] || '#aaa';
  const pro = isPro();

  // Animate: grow from sub-node position using transform-origin trick
  return (
    <div style={{
      position:'fixed', inset:0, zIndex:9500,
      background:'#000',
      fontFamily:"'Space Grotesk', sans-serif",
      color:'#fff',
      animation:'scaleGrow 0.28s cubic-bezier(0.22,1,0.36,1) forwards',
      overflowY:'auto', WebkitOverflowScrolling:'touch',
    }}>
      {/* Top sticky header */}
      <div style={{
        position:'sticky', top:0, zIndex:2,
        background:'rgba(0,0,0,0.97)', backdropFilter:'blur(8px)',
        borderBottom:'1px solid #1a1a1a',
        padding:'12px 16px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
      }}>
        <button onClick={onBack} style={{
          background:'none', border:'1px solid #2a2a2a', color:'#fff',
          padding:'7px 14px', fontSize:'13px', cursor:'pointer',
          fontFamily:"'Space Grotesk', sans-serif", borderRadius:'4px',
          display:'flex', alignItems:'center', gap:'5px', fontWeight:600,
        }}>← Back</button>
        <button onClick={onBack} style={{
          background:'rgba(255,255,255,0.1)', border:'1px solid #555',
          color:'#fff', fontSize:'13px', fontWeight:700,
          cursor:'pointer', padding:'7px 16px', lineHeight:1,
          fontFamily:"'Space Grotesk', sans-serif", borderRadius:'4px',
          letterSpacing:'0.5px',
        }}>✕ Close</button>
      </div>

      {/* Left padding clears the BreakingNews tab (~32px), bottom clears pill+legal (~120px) */}
      <div style={{ padding:'18px 16px 120px 44px' }}>
        {node.status && (
          <div style={{
            display:'inline-block', padding:'3px 10px', marginBottom:'14px',
            background:`${lum.core}18`, border:`1px solid ${lum.core}55`,
            color:lum.core, fontSize:'9px', letterSpacing:'2px', textTransform:'uppercase', borderRadius:'2px',
          }}>{node.status.replace('_',' ')}</div>
        )}
        <h2 style={{ fontSize:'20px', fontWeight:700, lineHeight:1.3, margin:'0 0 10px' }}>{node.label}</h2>
        <div style={{
          display:'flex', alignItems:'center', gap:'6px', marginBottom:'18px',
          fontSize:'11px', color:catColor, textTransform:'uppercase', letterSpacing:'1.5px',
        }}>
          <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:catColor, boxShadow:`0 0 6px 2px ${catColor}`, display:'inline-block', flexShrink:0 }} />
          {CATEGORY_LABELS[node.category]||node.category}
        </div>
        <div style={{ height:'1px', background:'#1a1a1a', marginBottom:'18px' }} />

        {/* Likelihood bar */}
        <div style={{ marginBottom:'20px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'9px', color:'#aaa', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:'8px' }}>
            <span>Likelihood</span>
            <span style={{ color:lum.core, fontSize:'18px', fontWeight:700 }}>{Math.round(node.likelihood*100)}%</span>
          </div>
          <div style={{ height:'3px', background:'#111', borderRadius:'2px', overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${node.likelihood*100}%`, background:`linear-gradient(90deg,${lum.core}66,${lum.core})`, boxShadow:`0 0 8px ${lum.core}`, transition:'width 0.6s ease' }} />
          </div>
        </div>

        {/* Price contribution — blurred for non-pro */}
        {node.weight != null && (
          <div style={{ marginBottom:'20px', position:'relative' }}>
            <div style={{ fontSize:'9px', color:'#aaa', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:'6px' }}>Price Contribution</div>
            <div style={{ filter: pro ? 'none' : 'blur(6px)', userSelect: pro ? 'auto' : 'none', pointerEvents: pro ? 'auto' : 'none' }}>
              <span style={{ fontSize:'20px', fontWeight:700, color:'#00ff88' }}>
                +${((node.weight||0) * node.likelihood * 200).toFixed(0)}
              </span>
              <span style={{ fontSize:'11px', color:'#aaa', marginLeft:'6px' }}>to model price</span>
            </div>
            {!pro && (
              <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontSize:'10px', color:'#00ff88', letterSpacing:'1px', border:'1px solid #00ff8844', padding:'4px 10px', borderRadius:'12px', background:'rgba(0,0,0,0.85)', cursor:'pointer' }}>
                  🔒 View Exact Impact
                </span>
              </div>
            )}
          </div>
        )}

        {/* Analysis */}
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:'12px' }}>
            <div style={{ fontSize:'9px', color:'#aaa', letterSpacing:'1.5px', textTransform:'uppercase' }}>Analysis</div>
            {node.updated && <div style={{ fontSize:'9px', color:'#444', letterSpacing:'1px' }}>Updated {node.updated}</div>}
          </div>
          {Array.isArray(node.description) ? (
            <ul style={{ margin:0, padding:0, listStyle:'none' }}>
              {node.description.map((pt,i) => {
                const isNew = i===0 && isUpdatedToday(node.updated);
                return (
                  <li key={i} style={{
                    display:'flex', gap:'8px', fontSize:'13px', lineHeight:1.65,
                    alignItems:'flex-start', marginBottom: isNew?'10px':'6px',
                    ...(isNew ? { background:'rgba(255,50,50,0.07)', border:'1px solid rgba(255,50,50,0.18)', borderRadius:'4px', padding:'7px 10px', color:'#fff' } : { color:'#999' }),
                  }}>
                    <span style={{ color:isNew?'#ff4444':'#333', marginTop:'3px', flexShrink:0 }}>{isNew?'●':'·'}</span>
                    <span>{pt}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p style={{ fontSize:'13px', color:'#ccc', lineHeight:1.6, margin:0 }}>{node.description}</p>
          )}
        </div>
      </div>


    </div>
  );
}

// ─── Canvas Graph ─────────────────────────────────────────────────────────────
function GraphCanvas({ masterNodes, onSubNodeTap }) {
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ w:0, h:0 });
  const [activeMaster, setActiveMaster] = useState(null);
  const [subSpawned, setSubSpawned] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setDims({ w:e.contentRect.width, h:e.contentRect.height }));
    ro.observe(el);
    setDims({ w:el.offsetWidth, h:el.offsetHeight });
    return () => ro.disconnect();
  }, []);

  const { w, h } = dims;

  // Compute base grid positions
  const gridPositions = MASTER_LAYOUT.map(({ col, row }) => {
    const padX=0.14, padY=0.10, usableW=1-padX*2, usableH=1-padY*2;
    return {
      x: (padX + (col+0.5)*(usableW/2)) * w,
      y: (padY + (row+0.5)*(usableH/3)) * h,
    };
  });

  // Active master anchor point
  const anchorX = w * ANCHOR_X_PCT;
  const anchorY = h * ANCHOR_Y_PCT;

  function handleMasterTap(master, idx) {
    if (activeMaster?.id === master.id) {
      setActiveMaster(null); setSubSpawned(false); return;
    }
    setActiveMaster(master); setSubSpawned(false);
    setTimeout(() => setSubSpawned(true), 50);
  }

  function handleSubTap(child, el) {
    const r = el.getBoundingClientRect();
    onSubNodeTap(child, { x: r.left+r.width/2, y: r.top+r.height/2 });
  }

  if (w===0) return <div ref={containerRef} style={{ width:'100%', height:'100%' }} />;

  // Sub-node positions fan from anchor
  let subPositions = [];
  if (activeMaster) {
    const facingUp = anchorY > h*0.4;
    const angles = getFanAngles(activeMaster.children.length, facingUp);
    subPositions = angles.map(deg => {
      const rad = (deg*Math.PI)/180;
      return {
        x: Math.max(SUB_R+8, Math.min(w-SUB_R-8, anchorX + Math.cos(rad)*FAN_RADIUS)),
        y: Math.max(SUB_R+8, Math.min(h-SUB_R-8, anchorY + Math.sin(rad)*FAN_RADIUS)),
      };
    });
  }

  // Assign ghost slots to inactive masters
  let ghostSlotIdx = 0;
  const ghostSlotMap = {};
  masterNodes.forEach((m, i) => {
    if (activeMaster && m.id !== activeMaster.id) {
      ghostSlotMap[m.id] = GHOST_SLOTS[ghostSlotIdx % GHOST_SLOTS.length];
      ghostSlotIdx++;
    }
  });

  const activeIdx = activeMaster ? masterNodes.findIndex(m => m.id === activeMaster.id) : -1;

  return (
    <div ref={containerRef} style={{ position:'relative', width:'100%', height:'100%' }}>
      {/* SVG lines from anchor to subnodes */}
      {activeMaster && (
        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:1 }}>
          {subPositions.map((sp,i) => (
            <line key={i} x1={anchorX} y1={anchorY} x2={sp.x} y2={sp.y}
              stroke={`${CATEGORY_COLORS[activeMaster.category]}33`} strokeWidth="1" strokeDasharray="4 4" />
          ))}
        </svg>
      )}

      {/* Master orbs */}
      {masterNodes.map((master, idx) => {
        const lum = getLum(master.likelihood);
        const isActive = activeMaster?.id === master.id;
        const isGhost = !!activeMaster && !isActive;
        const slot = ghostSlotMap[master.id];

        // Position: active → anchor, ghost → slot, idle → grid
        const targetX = isActive ? anchorX : isGhost ? (slot.x*w) : gridPositions[idx].x;
        const targetY = isActive ? anchorY : isGhost ? (slot.y*h) : gridPositions[idx].y;
        const scale = isGhost ? 0.5 : 1;
        const opacity = isGhost ? 0.25 : 1;
        const size = ORB_R*2;

        // Pulse animation keyed to likelihood (white-toned glow, not green)
        const pulseAnim = master.likelihood >= 0.7
          ? 'orbPulseBright 2.5s ease-in-out infinite'
          : master.likelihood >= 0.4
          ? 'orbPulseMed 3s ease-in-out infinite'
          : 'orbPulseLow 3.5s ease-in-out infinite';

        return (
          <div key={master.id} className="m-orb" onClick={() => handleMasterTap(master, idx)} style={{
            position:'absolute',
            left: targetX - ORB_R,
            top:  targetY - ORB_R,
            width:size, height:size, borderRadius:'50%',
            background:`radial-gradient(circle at 35% 35%, ${lum.core}, rgba(0,0,0,0.65))`,
            border:`1.5px solid ${lum.core}${isActive?'99':'44'}`,
            animation: isActive ? 'greenRing 1.8s ease-in-out infinite' : pulseAnim,
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
            zIndex: isActive ? 10 : 5,
            transform:`scale(${scale})`,
            opacity,
            transition:'left 0.45s cubic-bezier(0.34,1.2,0.64,1), top 0.45s cubic-bezier(0.34,1.2,0.64,1), transform 0.35s ease, opacity 0.35s ease',
          }}>
            {master.hasRecentUpdate && !isGhost && (
              <div className="hb" style={{ position:'absolute', top:'4px', right:'4px', width:'7px', height:'7px', borderRadius:'50%', background:'#ff3333', boxShadow:'0 0 6px 2px rgba(255,50,50,0.7)' }} />
            )}
            <div style={{ fontSize:'13px', fontWeight:700, color:lum.core, lineHeight:1 }}>
              {Math.round(master.likelihood*100)}%
            </div>
            {!isGhost && (
              <div style={{ fontSize:'8px', color:lum.core+'99', marginTop:'2px' }}>{master.childCount}</div>
            )}
          </div>
        );
      })}

      {/* Labels — idle state */}
      {!activeMaster && masterNodes.map((master, idx) => (
        <div key={`lbl-${idx}`} style={{
          position:'absolute',
          left: gridPositions[idx].x - 50,
          top: gridPositions[idx].y + ORB_R + 6,
          width:100, textAlign:'center',
          fontSize:'10px', fontWeight:600, color:'#aaa',
          pointerEvents:'none', zIndex:4,
        }}>{master.label}</div>
      ))}

      {/* Active master label */}
      {activeMaster && (
        <div style={{
          position:'absolute',
          left: anchorX - 60, top: anchorY + ORB_R + 6,
          width:120, textAlign:'center',
          fontSize:'11px', fontWeight:700, color:'#fff',
          pointerEvents:'none', zIndex:10,
        }}>{activeMaster.label}</div>
      )}

      {/* Sub-nodes */}
      {activeMaster && activeMaster.children.map((child, i) => {
        const sp = subPositions[i]; if (!sp) return null;
        const clum = getLum(child.likelihood);
        const size = SUB_R*2;
        return (
          <div key={child.id} style={{ position:'absolute', left:sp.x-SUB_R, top:sp.y-SUB_R, zIndex:20 }}>
            <div className="m-sub" onClick={e => handleSubTap(child, e.currentTarget)} style={{
              width:size, height:size, borderRadius:'50%',
              background:`radial-gradient(circle at 35% 35%, ${clum.core}, rgba(0,0,0,0.7))`,
              border:`1px solid ${clum.core}55`,
              boxShadow:`0 0 10px 3px ${clum.glow}`,
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              position:'relative',
              opacity: subSpawned ? 1 : 0,
              transform: subSpawned ? 'scale(1)' : 'scale(0.1)',
              transition:`opacity 0.28s ease ${i*45}ms, transform 0.32s cubic-bezier(0.34,1.56,0.64,1) ${i*45}ms`,
            }}>
              {isUpdatedToday(child.updated) && (
                <div className="hbs" style={{ position:'absolute', top:'2px', right:'2px', width:'5px', height:'5px', borderRadius:'50%', background:'#ff3333', boxShadow:'0 0 4px 2px rgba(255,50,50,0.7)' }} />
              )}
              <div style={{ fontSize:'10px', fontWeight:700, color:clum.core }}>{Math.round(child.likelihood*100)}%</div>
            </div>
            <div style={{
              position:'absolute', top:size+4, left:'50%', transform:'translateX(-50%)',
              width:82, textAlign:'center', fontSize:'9px', color:'#bbb', lineHeight:1.3,
              pointerEvents:'none',
              opacity: subSpawned ? 1 : 0,
              transition:`opacity 0.28s ease ${i*45+80}ms`,
            }}>{child.label}</div>
          </div>
        );
      })}

      {/* Instructions */}
      <div style={{
        position:'absolute', bottom:14, left:0, right:0,
        textAlign:'center', fontSize:'11px', color:'#fff',
        letterSpacing:'0.5px', pointerEvents:'none', fontWeight:500,
      }}>
        {activeMaster ? 'Tap subnode for analysis' : 'Tap a node to explore'}
      </div>



    </div>
  );
}

// ─── Mobile Oracle sheet with node search + upgrade tab ───────────────────────
function OracleSheet({ onClose }) {
  const [tab, setTab] = useState('ask');        // 'ask' | 'upgrade' | 'restore'
  const [query, setQuery] = useState('');
  const [matched, setMatched] = useState([]);
  const [phase, setPhase] = useState('idle');
  const [result, setResult] = useState('');
  const [loadingText, setLoadingText] = useState('');
  const [credits, setCredits] = useState(getCredits);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (query.trim().length > 1) {
      setMatched(searchCatalysts(query, catalysts).slice(0, 5));
    } else {
      setMatched([]);
    }
  }, [query]);

  const PHASES = ['Scanning catalysts…', 'Running quant model…', 'Generating analysis…', 'Finalizing…'];
  async function handleSubmit() {
    if (!query.trim()) return;
    const pro = isPro();
    const cr = getCredits();
    if (!pro && cr <= 0) { setShowUpgrade(true); return; }
    setPhase('loading'); setResult('');
    let pi = 0;
    setLoadingText(PHASES[0]);
    const timer = setInterval(() => { pi++; if(pi < PHASES.length) setLoadingText(PHASES[pi]); }, 2200);
    try {
      const fingerprint = await getFingerprint();
      let liveWhale = fallbackDarkPool;
      try { liveWhale = await fetchRemoteData('darkpool.json'); } catch(_) {}

      const res = await fetch('/api/oracle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          fp: fingerprint,
          token: null,
          content: '',
          whaleScale: {
            gauge_value: liveWhale.gauge_value,
            needle_status: liveWhale.needle_status,
            roger_insight: liveWhale.roger_insight,
            updated: liveWhale.updated,
            flowLean: liveWhale.calls && liveWhale.puts
              ? liveWhale.calls.value > liveWhale.puts.value ? 'CALL HEAVY' : 'PUT HEAVY'
              : 'UNKNOWN',
          },
        }),
      });
      clearInterval(timer);

      if (res.status === 402) { setShowUpgrade(true); setPhase('idle'); return; }

      const data = await res.json();
      if (data.unlocked && data.result) {
        const next = decrementCredit();
        setCredits(next);
        setResult(data.result);
        setPhase('result');
      } else if (data.result) {
        setResult(data.result);
        setPhase('result');
      } else {
        setShowUpgrade(true);
        setPhase('idle');
      }
    } catch(e) {
      clearInterval(timer);
      setResult('Connection error. Please try again.');
      setPhase('result');
    }
  }

  return (
    <>
      <div style={{ position:'fixed', inset:0, zIndex:8500, background:'rgba(0,0,0,0.72)', backdropFilter:'blur(4px)', display:'flex', flexDirection:'column', justifyContent:'flex-end' }} onClick={onClose}>
        <div className="oracle-sheet" onClick={e=>e.stopPropagation()} style={{
          background:'#070707', borderTop:'2px solid rgba(229,57,53,0.8)',
          borderRadius:'16px 16px 0 0',
          maxHeight:'88vh', overflowY:'auto', WebkitOverflowScrolling:'touch',
        }}>
          {/* Handle */}
          <div style={{ display:'flex', justifyContent:'center', padding:'10px 0 4px' }}>
            <div style={{ width:'36px', height:'4px', borderRadius:'2px', background:'#1e1e1e' }} />
          </div>

          {/* Header */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'4px 16px 10px', borderBottom:'1px solid #111' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#ff1a1a', boxShadow:'0 0 8px 3px rgba(229,57,53,0.8)', display:'inline-block' }} />
              <span style={{ fontSize:'10px', letterSpacing:'2px', color:'#ff3333', textTransform:'uppercase', fontWeight:700 }}>Ask Roger</span>
            </div>
            <button onClick={onClose} style={{ background:'none', border:'none', color:'#666', fontSize:'20px', cursor:'pointer', padding:'4px 8px' }}>✕</button>
          </div>

          {/* Sub-tabs */}
          <div style={{ display:'flex', borderBottom:'1px solid #111' }}>
            {[['ask','Oracle'],['upgrade','Upgrade'],['restore','Sign In']].map(([key,label]) => (
              <button key={key} onClick={()=>setTab(key)} style={{
                flex:1, padding:'9px 0',
                background: tab===key ? 'rgba(229,57,53,0.08)' : 'transparent',
                border:'none',
                borderBottom: tab===key ? '2px solid #ff3333' : '2px solid transparent',
                color: tab===key ? '#ff4444' : '#555',
                fontSize:'10px', letterSpacing:'1.5px', textTransform:'uppercase',
                cursor:'pointer', fontFamily:"'Space Grotesk', sans-serif", fontWeight: tab===key ? 700 : 400,
                transition:'all 0.18s',
              }}>{label}</button>
            ))}
          </div>

          {/* Oracle ask tab */}
          {tab==='ask' && (
            <div style={{ padding:'14px 14px 32px' }}>
              {/* Credits badge */}
              <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'8px' }}>
                {isPro() ? (
                  <span style={{ fontSize:'9px', color:'#00ff88', letterSpacing:'1px', border:'1px solid #00ff8844', padding:'2px 8px', borderRadius:'10px' }}>PRO ✓</span>
                ) : (
                  <span style={{ fontSize:'9px', color: credits>0?'#aaa':'#ff4444', letterSpacing:'1px', border:`1px solid ${credits>0?'#2a2a2a':'#ff444444'}`, padding:'2px 8px', borderRadius:'10px' }}>
                    {credits} {credits===1?'credit':'credits'} left
                  </span>
                )}
              </div>

              {/* Input */}
              <div style={{ position:'relative', marginBottom:'8px' }}>
                <textarea
                  ref={inputRef}
                  value={query}
                  onChange={e=>setQuery(e.target.value)}
                  onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); handleSubmit(); } }}
                  placeholder="Ask anything about Tesla catalysts, FSD, robotaxi, earnings…"
                  rows={3}
                  style={{
                    width:'100%', background:'#0a0a0a', border:'1px solid #1e1e1e',
                    borderRadius:'6px', color:'#fff', fontSize:'13px',
                    fontFamily:"'Space Grotesk', sans-serif", padding:'10px 12px',
                    resize:'vertical', outline:'none', boxSizing:'border-box',
                    lineHeight:1.55,
                  }}
                />
              </div>

              {/* Matched node chips */}
              {matched.length > 0 && phase==='idle' && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:'5px', marginBottom:'10px' }}>
                  {matched.map(n => (
                    <span key={n.id} style={{
                      fontSize:'9px', padding:'3px 8px', borderRadius:'10px',
                      background:`${CATEGORY_COLORS[n.category]||'#aaa'}18`,
                      border:`1px solid ${CATEGORY_COLORS[n.category]||'#aaa'}44`,
                      color: CATEGORY_COLORS[n.category]||'#aaa',
                      letterSpacing:'0.5px',
                    }}>{n.label}</span>
                  ))}
                </div>
              )}

              {/* Submit */}
              <button onClick={handleSubmit} disabled={phase==='loading'||!query.trim()} style={{
                width:'100%', padding:'11px',
                background: query.trim() ? 'rgba(229,57,53,0.15)' : 'rgba(40,40,40,0.5)',
                border:`1px solid ${query.trim() ? 'rgba(229,57,53,0.6)' : '#1e1e1e'}`,
                color: query.trim() ? '#ff4444' : '#444',
                fontSize:'11px', letterSpacing:'2px', textTransform:'uppercase',
                cursor: query.trim() ? 'pointer' : 'default',
                fontFamily:"'Space Grotesk', sans-serif", fontWeight:700,
                borderRadius:'6px', transition:'all 0.18s',
              }}>
                {phase==='loading' ? loadingText : 'Analyze →'}
              </button>

              {/* Result */}
              {phase==='result' && result && (
                <div style={{
                  marginTop:'14px', padding:'12px', background:'#080808',
                  border:'1px solid #1a1a1a', borderRadius:'6px',
                  fontSize:'13px', color:'#ddd', lineHeight:1.7,
                  animation:'fadeInUp 0.25s ease',
                  whiteSpace:'pre-wrap',
                }}>
                  {result}
                  <button onClick={()=>{setPhase('idle');setResult('');setQuery('');}} style={{
                    display:'block', marginTop:'12px',
                    background:'none', border:'1px solid #222',
                    color:'#555', fontSize:'10px', letterSpacing:'1px',
                    padding:'5px 12px', cursor:'pointer', borderRadius:'4px',
                    fontFamily:"'Space Grotesk', sans-serif",
                  }}>← New Query</button>
                </div>
              )}
            </div>
          )}

          {/* Upgrade tab — 3-tier cards */}
          {tab==='upgrade' && (
            <div style={{ padding:'16px 12px 40px' }}>
              <div style={{ fontSize:'11px', color:'#555', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:'16px', textAlign:'center' }}>
                Unlock Oracle Deep
              </div>
              {[
                { id:'single', label:'Single Query', price:'$0.99', cadence:'one-time',
                  features:['1 Oracle AI analysis','Full 4-phase quant report','No subscription'],
                  highlight:false, cta:'Buy One Query',
                  link: import.meta.env.VITE_STRIPE_LINK_SINGLE||'https://buy.stripe.com/6oU3cw0qT5Oz19h8X29Ve00' },
                { id:'trader', label:'Active Trader', price:'$29', cadence:'/mo',
                  features:['Unlimited Oracle analyses','Oracle Deep + RAG','Exact price contribution','Smart Network mode'],
                  highlight:true, cta:'Start Trader',
                  link: import.meta.env.VITE_STRIPE_LINK_TRADER||'https://buy.stripe.com/6oUbJ2gpR2Cn05dgpu9Ve01' },
                { id:'inst', label:'Institutional', price:'$129', cadence:'/mo',
                  features:['Everything in Trader','PDF upload + AI analysis','Raw data export (soon)'],
                  highlight:false, cta:'Go Institutional',
                  link: import.meta.env.VITE_STRIPE_LINK_INST||'https://buy.stripe.com/00wfZic9Ba4PcRZflq9Ve02' },
              ].map(tier => (
                <div key={tier.id} style={{
                  marginBottom:'12px', padding:'14px',
                  background: tier.highlight ? 'rgba(0,170,255,0.06)' : 'rgba(255,255,255,0.02)',
                  border:`1px solid ${tier.highlight ? '#00aaff55' : '#1e1e1e'}`,
                  borderRadius:'8px', position:'relative',
                }}>
                  {tier.highlight && (
                    <div style={{ position:'absolute', top:'-1px', right:'14px', background:'#00aaff', color:'#000', fontSize:'8px', letterSpacing:'1.5px', textTransform:'uppercase', padding:'2px 8px', fontWeight:800 }}>POPULAR</div>
                  )}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:'8px' }}>
                    <span style={{ fontSize:'13px', fontWeight:700, color:'#fff' }}>{tier.label}</span>
                    <span style={{ fontSize:'18px', fontWeight:800, color: tier.highlight?'#00aaff':'#fff' }}>
                      {tier.price}<span style={{ fontSize:'10px', color:'#555', fontWeight:400 }}>{tier.cadence}</span>
                    </span>
                  </div>
                  <ul style={{ margin:'0 0 10px', padding:0, listStyle:'none' }}>
                    {tier.features.map((f,i) => (
                      <li key={i} style={{ fontSize:'11px', color:'#888', lineHeight:1.6, display:'flex', gap:'6px' }}>
                        <span style={{ color:'#00ff8899' }}>✓</span>{f}
                      </li>
                    ))}
                  </ul>
                  <button onClick={()=>window.open(tier.link,'_blank')} style={{
                    width:'100%', padding:'9px',
                    background: tier.highlight ? 'rgba(0,170,255,0.15)' : 'rgba(255,255,255,0.05)',
                    border:`1px solid ${tier.highlight?'#00aaff66':'#333'}`,
                    color: tier.highlight ? '#00aaff' : '#ccc',
                    fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase',
                    cursor:'pointer', borderRadius:'5px', fontFamily:"'Space Grotesk', sans-serif", fontWeight:700,
                  }}>{tier.cta}</button>
                </div>
              ))}
            </div>
          )}

          {/* Restore / Sign In tab */}
          {tab==='restore' && (
            <div style={{ padding:'20px 14px 40px' }}>
              <div style={{ fontSize:'11px', color:'#555', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:'16px', textAlign:'center' }}>
                Already a member?
              </div>
              <RestoreAccess
                onClose={()=>setTab('ask')}
                onRestored={()=>{ setCredits(getCredits()); setTimeout(()=>setTab('ask'),1500); }}
              />
            </div>
          )}
        </div>
      </div>

      {showUpgrade && <UpgradeModal reason="no_credits" onClose={()=>setShowUpgrade(false)} />}
    </>
  );
}

// ─── Safe section wrapper ─────────────────────────────────────────────────────
class TradingSectionSafe extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(e) { return { err: e?.message || 'Error' }; }
  render() {
    if (this.state.err) return (
      <div style={{ padding:'16px', color:'#555', fontSize:'11px', fontFamily:"'Space Grotesk', sans-serif" }}>
        {this.props.title}: unavailable on mobile
      </div>
    );
    return (
      <div style={{ borderBottom:'1px solid #111', overflow:'hidden' }}>
        {this.props.children}
      </div>
    );
  }
}

// ─── Trading Corner bottom sheet ──────────────────────────────────────────────
function TradingSheet({ onClose }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:8000, background:'rgba(0,0,0,0.8)', backdropFilter:'blur(4px)', display:'flex', flexDirection:'column', justifyContent:'flex-end' }} onClick={onClose}>
      <div className="oracle-sheet" onClick={e=>e.stopPropagation()} style={{
        background:'#060608', borderTop:'2px solid #00aaff88',
        borderRadius:'16px 16px 0 0',
        height:'92vh', overflowY:'auto', WebkitOverflowScrolling:'touch',
        fontFamily:"'Space Grotesk', sans-serif",
        display:'flex', flexDirection:'column',
      }}>
        {/* Handle */}
        <div style={{ display:'flex', justifyContent:'center', padding:'10px 0 4px', flexShrink:0 }}>
          <div style={{ width:'36px', height:'4px', borderRadius:'2px', background:'#333' }} />
        </div>

        {/* Sticky header */}
        <div style={{ flexShrink:0, background:'#060608', borderBottom:'1px solid #111', padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <span style={{ fontSize:'16px' }}>📈</span>
            <span style={{ fontSize:'13px', fontWeight:800, letterSpacing:'2px', textTransform:'uppercase', color:'#fff' }}>Trading Corner</span>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#fff', fontSize:'24px', cursor:'pointer', padding:'4px 10px', lineHeight:1 }}>✕</button>
        </div>

        {/* Scrollable content */}
        <div style={{ flex:1, overflowY:'auto', WebkitOverflowScrolling:'touch' }}>
          {/* Chart Analysis */}
          <TradingSectionSafe title="Chart Analysis"><ChartAnalysis /></TradingSectionSafe>

          {/* Beta Dashboard */}
          <TradingSectionSafe title="Beta Dashboard"><BetaDashboard isMobile={true} /></TradingSectionSafe>

          {/* Bottom close */}
          <div style={{ padding:'16px', display:'flex', justifyContent:'center' }}>
            <button onClick={onClose} style={{
              background:'rgba(255,255,255,0.06)', border:'1px solid #333',
              color:'#fff', padding:'10px 48px', fontSize:'13px', fontWeight:600,
              cursor:'pointer', fontFamily:"'Space Grotesk', sans-serif", borderRadius:'6px',
            }}>✕ Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TSLA Tube view ───────────────────────────────────────────────────────────
const CAT_COLORS = {
  Robotaxi:'#00ff88', FSD:'#00aaff', Earnings:'#f59e0b',
  Optimus:'#a78bfa', General:'#888', Energy:'#f97316',
};

function TubeView({ onAskRoger }) {
  const { data:digest } = useRemoteData('tube_digest.json', FALLBACK_DIGEST);
  const [filter, setFilter] = useState('All');
  const [expanded, setExpanded] = useState({});

  const videos = digest?.videos || FALLBACK_DIGEST.videos || [];
  const categories = ['All', ...Array.from(new Set(videos.map(v=>v.category).filter(Boolean)))];
  const filtered = filter==='All' ? videos : videos.filter(v=>v.category===filter);

  return (
    <div style={{ flex:1, overflowY:'auto', WebkitOverflowScrolling:'touch', paddingBottom:'100px', fontFamily:"'Space Grotesk', sans-serif" }}>
      <div style={{ padding:'12px 14px 8px', borderBottom:'1px solid #111', background:'rgba(0,0,0,0.9)' }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:'8px', marginBottom:'10px' }}>
          <span style={{ fontSize:'15px', fontWeight:800, letterSpacing:'2px', color:'#fff' }}>🎬 TSLA TUBE</span>
          <span style={{ fontSize:'9px', color:'#444', letterSpacing:'1px' }}>
            {digest?.generatedAt ? `Updated ${timeAgo(digest.generatedAt)}` : 'YouTube Digest'}
          </span>
        </div>
        <div style={{ display:'flex', gap:'6px', overflowX:'auto', paddingBottom:'2px' }}>
          {categories.map(cat => (
            <button key={cat} onClick={()=>setFilter(cat)} style={{
              flexShrink:0, background:filter===cat?'rgba(0,255,136,0.12)':'transparent',
              border:`1px solid ${filter===cat?'#00ff88':'#222'}`, borderRadius:'20px',
              color:filter===cat?'#00ff88':'#555', fontSize:'9px', letterSpacing:'1.5px',
              textTransform:'uppercase', padding:'4px 10px', cursor:'pointer',
              fontFamily:"'Space Grotesk', sans-serif", WebkitTapHighlightColor:'transparent',
            }}>{cat}</button>
          ))}
        </div>
      </div>
      {filtered.map((video,i) => {
        const catColor = CAT_COLORS[video.category]||'#666';
        const isExp = expanded[video.videoId];
        return (
          <div key={video.videoId||i} style={{ borderBottom:'1px solid #0e0e0e', background:video.curatedByRoger?'rgba(0,255,136,0.025)':'transparent' }}>
            <a href={video.videoUrl} target="_blank" rel="noopener noreferrer" style={{ display:'flex', gap:'10px', padding:'12px 14px 8px', textDecoration:'none' }} onClick={e=>e.stopPropagation()}>
              <div style={{ position:'relative', flexShrink:0 }}>
                <img src={`https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`} alt="" style={{ width:'110px', height:'62px', objectFit:'cover', borderRadius:'3px', border:`1px solid ${video.curatedByRoger?'#00ff8844':'#1a1a1a'}`, background:'#0a0a0a', display:'block' }} onError={e=>{e.target.style.display='none';}} />
                <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.25)', borderRadius:'3px' }}>
                  <span style={{ fontSize:'18px', opacity:0.8 }}>▶</span>
                </div>
                {video.curatedByRoger && <div style={{ position:'absolute', top:'3px', left:'3px', background:'#00ff8833', border:'1px solid #00ff88', color:'#00ff88', fontSize:'7px', letterSpacing:'1px', padding:'1px 4px', borderRadius:'2px' }}>ROGER</div>}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:'12px', fontWeight:600, color:'#e0e0e0', lineHeight:1.35, marginBottom:'5px', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{video.title}</div>
                <div style={{ fontSize:'10px', color:'#555', marginBottom:'4px' }}>{video.channelTitle}</div>
                <div style={{ display:'flex', alignItems:'center', gap:'6px', flexWrap:'wrap' }}>
                  {video.category && <span style={{ fontSize:'8px', letterSpacing:'1px', textTransform:'uppercase', color:catColor, border:`1px solid ${catColor}55`, padding:'1px 5px', borderRadius:'2px' }}>{video.category}</span>}
                  <span style={{ fontSize:'9px', color:'#444' }}>{video.publishedAt?timeAgo(video.publishedAt):''}{video.viewCount?` · ${fmtViews(video.viewCount)}`:''}</span>
                </div>
              </div>
            </a>
            <div style={{ padding:'0 14px 10px' }}>
              {video.summaryBullets?.length>0 && (
                <div style={{ marginBottom:'8px' }}>
                  {(isExp?video.summaryBullets:video.summaryBullets.slice(0,2)).map((b,j) => (
                    <div key={j} style={{ fontSize:'11px', color:'#888', lineHeight:1.6, paddingLeft:'10px', borderLeft:`2px solid ${catColor}44`, marginBottom:'3px' }}>{b.replace(/^[•\-]\s*/,'')}</div>
                  ))}
                  {video.summaryBullets.length>2 && (
                    <button onClick={()=>setExpanded(e=>({...e,[video.videoId]:!e[video.videoId]}))} style={{ background:'none', border:'none', padding:'2px 0', color:'#555', fontSize:'10px', cursor:'pointer', fontFamily:"'Space Grotesk', sans-serif", WebkitTapHighlightColor:'transparent' }}>
                      {isExp ? '▲ less' : `▼ +${video.summaryBullets.length-2} more`}
                    </button>
                  )}
                </div>
              )}
              <button onClick={()=>onAskRoger(video)} style={{
                background:'rgba(229,57,53,0.08)', border:'1px solid rgba(229,57,53,0.4)',
                color:'#ff5555', fontSize:'9px', letterSpacing:'1.5px', textTransform:'uppercase',
                padding:'5px 10px', borderRadius:'12px', cursor:'pointer',
                fontFamily:"'Space Grotesk', sans-serif", display:'flex', alignItems:'center', gap:'5px',
                WebkitTapHighlightColor:'transparent',
              }}>
                <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#ff3333', display:'inline-block', boxShadow:'0 0 5px 2px rgba(229,57,53,0.7)' }} />
                Ask Roger
              </button>
            </div>
          </div>
        );
      })}
      {filtered.length===0 && <div style={{ padding:'40px 20px', textAlign:'center', color:'#333', fontSize:'12px' }}>No videos in this category</div>}
    </div>
  );
}

// ─── Bottom pill + Oracle FAB ─────────────────────────────────────────────────
function BottomPill({ activeTab, onTab, onOracle }) {
  return (
    <div style={{ position:'fixed', bottom:'20px', left:'50%', transform:'translateX(-50%)', zIndex:600, display:'flex', alignItems:'center' }}>
      <div className="pill-anim" style={{
        display:'flex', alignItems:'center',
        background:'rgba(6,6,8,0.85)', backdropFilter:'blur(16px)',
        border:'1px solid rgba(0,255,136,0.25)', borderRadius:'30px',
        padding:'2px', boxShadow:'0 4px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
        gap:'2px',
      }}>
        {[
          { key:'trading', icon:'📈', label:'Trading' },
          { key:'tube',    icon:'📺', label:'Tube' },
        ].map(({ key, icon, label }) => {
          const isActive = activeTab === key && key !== 'trading';
          return (
            <button key={key} onClick={()=>onTab(key)} style={{
              display:'flex', alignItems:'center', gap:'5px',
              padding:'8px 14px', borderRadius:'26px',
              background: isActive ? 'rgba(0,255,136,0.18)' : 'transparent',
              border: isActive ? '1px solid rgba(0,255,136,0.5)' : '1px solid transparent',
              color: isActive ? '#00ff88' : '#ddd',
              fontSize:'11px', fontWeight: isActive?700:600,
              letterSpacing:'0.5px', cursor:'pointer',
              fontFamily:"'Space Grotesk', sans-serif",
              boxShadow: isActive ? '0 0 16px rgba(0,255,136,0.3)' : 'none',
              transition:'all 0.22s ease',
              WebkitTapHighlightColor:'transparent',
            }}>
              <span style={{ fontSize:'12px' }}>{icon}</span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Oracle FAB — red pill style */}
      <button onClick={onOracle} style={{
        marginLeft:'10px',
        background:'rgba(229,57,53,0.12)',
        border:'1px solid rgba(229,57,53,0.7)',
        color:'#ff3333',
        padding:'9px 18px',
        borderRadius:'24px',
        fontSize:'10px', fontWeight:700, letterSpacing:'2px', textTransform:'uppercase',
        cursor:'pointer',
        fontFamily:"'Space Grotesk', sans-serif",
        display:'flex', alignItems:'center', gap:'7px',
        boxShadow:'0 0 20px rgba(229,57,53,0.25)',
        backdropFilter:'blur(8px)',
        WebkitTapHighlightColor:'transparent',
        whiteSpace:'nowrap', flexShrink:0,
      }}>
        <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#ff1a1a', display:'inline-block', boxShadow:'0 0 8px 3px rgba(229,57,53,0.8)', flexShrink:0 }} />
        Ask Roger
      </button>
    </div>
  );
}

// ─── Legal footer strip (for Network tab) ────────────────────────────────────
function LegalStrip({ onDisclaimer, onToS, onRefund }) {
  return (
    <div style={{
      position:'fixed', bottom:0, left:0, right:0, zIndex:100,
      padding:'5px 14px',
      borderTop:'1px solid #1a1a1a',
      background:'rgba(0,0,0,0.94)', backdropFilter:'blur(8px)',
      display:'flex', alignItems:'center', justifyContent:'space-between',
    }}>
      {/* Dim → Bright legend */}
      <div style={{ display:'flex', alignItems:'center', gap:'5px', flexShrink:0 }}>
        <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:'rgba(80,100,140,0.6)', boxShadow:'0 0 3px rgba(70,90,130,0.5)', flexShrink:0 }} />
        <span style={{ fontSize:'8px', color:'#888', letterSpacing:'0.5px' }}>DIM</span>
        <span style={{ fontSize:'8px', color:'#555' }}>→</span>
        <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:'rgba(255,255,255,1.0)', boxShadow:'0 0 5px rgba(255,255,255,0.9)', flexShrink:0 }} />
        <span style={{ fontSize:'8px', color:'#aaa', letterSpacing:'0.5px' }}>BRIGHT = likelihood</span>
      </div>
      {/* Legal links */}
      <div style={{ display:'flex', gap:'12px' }}>
        {[['Disclaimer',onDisclaimer],['Terms',onToS],['Refunds',onRefund]].map(([label,fn]) => (
          <button key={label} onClick={fn} style={{
            background:'none', border:'none', padding:0,
            color:'#888', fontSize:'9px', letterSpacing:'1px',
            textTransform:'uppercase', cursor:'pointer',
            fontFamily:"'Space Grotesk', sans-serif",
            textDecoration:'underline', textUnderlineOffset:'2px',
          }}>{label}</button>
        ))}
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function MobileGraph({ onShowDisclaimer, onShowToS, onShowRefund, onOracleOpen, onOracleClose, onL3Open, onL3Close }) {
  const [activeTab, setActiveTab] = useState('');
  const [prevTab, setPrevTab] = useState('');
  const [showOracle, setShowOracle] = useState(false);
  const [showTrading, setShowTrading] = useState(false);
  const [l3Node, setL3Node] = useState(null);
  const [l3Origin, setL3Origin] = useState(null);
  const { tslaPrice, marketOpen, lastUpdated } = useTSLAPrice();

  function openOracle() { setShowOracle(true); onOracleOpen?.(); }
  function closeOracle() { setShowOracle(false); onOracleClose?.(); }

  const masterNodes = CATEGORY_ORDER.map(catId => buildMasterNode(catId));

  function handleTab(tab) {
    if (tab === 'trading') { setShowTrading(true); return; }
    if (tab === activeTab) return;
    setPrevTab(activeTab);
    setActiveTab(tab);
  }

  const TAB_ORDER = ['tube'];
  const slideDir = 1;

  return (
    <>
      <style>{CSS}</style>

      {/* Canvas — always visible as base layer */}
      <div style={{ position:'fixed', inset:0, paddingTop:'90px', paddingBottom:'88px', overflow:'hidden', zIndex:1 }}>
        <GraphCanvas
          masterNodes={masterNodes}
          onSubNodeTap={(node, origin) => { setL3Node(node); setL3Origin(origin); onL3Open?.(); }}
        />
      </div>

      {/* Tube tab — slides in over canvas */}
      <div style={{
        position:'fixed', inset:0, paddingTop:'90px', paddingBottom:'88px',
        display:'flex', flexDirection:'column',
        transform: activeTab==='tube' ? 'translateX(0)' : 'translateX(100%)',
        transition:'transform 0.32s cubic-bezier(0.4,0,0.2,1)',
        pointerEvents: activeTab==='tube' ? 'auto' : 'none',
        zIndex:2, background:'#000',
        visibility: activeTab==='tube' ? 'visible' : 'hidden',
      }}>
        <TubeView onAskRoger={() => openOracle()} />
      </div>

      {/* Bottom pill — always visible */}
      <BottomPill
        activeTab={activeTab}
        onTab={handleTab}
        onOracle={() => openOracle()}
      />

      {/* Legal strip — always visible */}
      <LegalStrip onDisclaimer={onShowDisclaimer} onToS={onShowToS} onRefund={onShowRefund} />

      {/* Level 3 — rendered at root so it's above BreakingNews stacking context */}
      {l3Node && (
        <Level3Panel
          node={l3Node}
          originXY={l3Origin}
          onBack={() => { setL3Node(null); onL3Close?.(); }}
        />
      )}

      {/* Oracle sheet */}
      {showOracle && <OracleSheet onClose={() => closeOracle()} />}

      {/* Trading Corner sheet */}
      {showTrading && <TradingSheet onClose={() => setShowTrading(false)} />}
    </>
  );
}
