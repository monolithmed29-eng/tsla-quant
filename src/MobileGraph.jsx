import { useState, useEffect, useRef, useCallback } from 'react';
import { catalysts } from './data';
import { useRemoteData } from './useRemoteData';
import { MEDIA_DIGEST as FALLBACK_DIGEST } from './tslaMediaData';
import OracleSearch from './OracleSearch';
import DarkPoolGauge from './DarkPoolGauge';

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORY_ORDER = ['autonomy', 'robotics', 'financials', 'product', 'manufacturing', 'energy'];

const CATEGORY_LABELS = {
  autonomy:      'Autonomy',
  robotics:      'Robotics / AI',
  financials:    'Financials',
  product:       'Product',
  manufacturing: 'Manufacturing',
  energy:        'Energy',
};

const CATEGORY_COLORS = {
  autonomy:      'hsl(210,100%,60%)',
  robotics:      'hsl(200,30%,65%)',
  financials:    'hsl(142,70%,55%)',
  product:       'hsl(270,80%,70%)',
  manufacturing: 'hsl(35,90%,60%)',
  energy:        'hsl(15,100%,60%)',
};

// Master orb layout: 2×3 grid positions (normalized 0–1)
// col, row within a 2-column layout
const MASTER_LAYOUT = [
  { col: 0, row: 0 }, // autonomy
  { col: 1, row: 0 }, // robotics
  { col: 0, row: 1 }, // financials
  { col: 1, row: 1 }, // product
  { col: 0, row: 2 }, // manufacturing
  { col: 1, row: 2 }, // energy
];

const ORB_R = 38;       // master orb radius px
const SUB_R = 26;       // sub-node radius px
const GHOST_SCALE = 0.5; // ghost orbs scale to 50%
const FAN_RADIUS = 110;  // sub-node orbit radius px

// ─── Helpers ─────────────────────────────────────────────────────────────────
function isUpdatedToday(updated) {
  if (!updated) return false;
  const d = new Date(updated);
  const t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
}

function getLum(likelihood) {
  if (likelihood >= 0.9) return { core: 'rgba(255,255,255,1.0)',   glow: 'rgba(255,255,255,0.30)' };
  if (likelihood >= 0.7) return { core: 'rgba(220,235,255,0.95)', glow: 'rgba(200,220,255,0.22)' };
  if (likelihood >= 0.5) return { core: 'rgba(180,200,230,0.85)', glow: 'rgba(160,185,220,0.16)' };
  if (likelihood >= 0.3) return { core: 'rgba(130,150,190,0.70)', glow: 'rgba(120,140,180,0.11)' };
  return                        { core: 'rgba(80,100,140,0.55)',  glow: 'rgba(70,90,130,0.07)'  };
}

function buildMasterNode(catId) {
  const children = catalysts.filter(c => c.category === catId);
  const avg = children.length
    ? children.reduce((s, c) => s + c.likelihood, 0) / children.length
    : 0.5;
  return {
    id: `__master_${catId}`,
    category: catId,
    label: CATEGORY_LABELS[catId] || catId,
    likelihood: avg,
    childCount: children.length,
    hasRecentUpdate: children.some(c => isUpdatedToday(c.updated)),
    children,
  };
}

// Fan angles: spread sub-nodes in a 160° arc, direction depends on orb Y position
function getFanAngles(count, facingUp) {
  if (count === 1) return [facingUp ? -90 : 90];
  const spread = Math.min(160, count * 30);
  const half = spread / 2;
  const baseAngle = facingUp ? -90 : 90;
  return Array.from({ length: count }, (_, i) => {
    const t = count === 1 ? 0 : i / (count - 1);
    return baseAngle + (t - 0.5) * spread * 2;
  });
}

// Ghost perimeter positions: top-left, top-right, left-mid, right-mid, bottom corners
const GHOST_POSITIONS = [
  { x: 0.08, y: 0.06 },
  { x: 0.92, y: 0.06 },
  { x: 0.06, y: 0.42 },
  { x: 0.94, y: 0.42 },
  { x: 0.08, y: 0.82 },
  { x: 0.92, y: 0.82 },
];

// ─── CSS ─────────────────────────────────────────────────────────────────────
const MOBILE_CSS = `
  @keyframes heartbeat {
    0%   { opacity: 0; transform: scale(0.8); }
    5%   { opacity: 1; transform: scale(1.2); }
    10%  { opacity: 0; transform: scale(0.8); }
    17%  { opacity: 1; transform: scale(1.1); }
    22%  { opacity: 0; transform: scale(0.8); }
    100% { opacity: 0; transform: scale(0.8); }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes growFromPoint {
    from { clip-path: circle(0% at var(--ox) var(--oy)); opacity: 0.6; }
    to   { clip-path: circle(150% at var(--ox) var(--oy)); opacity: 1; }
  }
  @keyframes oracleSlideUp {
    from { opacity: 0; transform: translateY(100%); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pillFadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .hb-dot  { animation: heartbeat 2.8s ease-in-out infinite; }
  .hb-sub  { animation: heartbeat 2.8s ease-in-out 0.4s infinite; }
  .oracle-sheet { animation: oracleSlideUp 0.32s cubic-bezier(0.34,1.2,0.64,1); }
  .bottom-pill  { animation: pillFadeIn 0.4s cubic-bezier(0.34,1.2,0.64,1); }
  .l3-panel     { animation: growFromPoint 0.38s cubic-bezier(0.22,1,0.36,1) forwards; }
  .m-orb, .m-sub {
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: transform 0.18s ease, opacity 0.35s ease;
  }
  .m-orb:active  { transform: scale(0.88) !important; }
  .m-sub:active  { transform: scale(0.82) !important; }
`;

// ─── Level 3: Detail full-screen overlay ─────────────────────────────────────
function Level3Panel({ node, originPct, onClose, onBack }) {
  if (!node) return null;
  const lum = getLum(node.likelihood);
  const catColor = CATEGORY_COLORS[node.category] || '#aaa';

  return (
    <div
      className="l3-panel"
      style={{
        '--ox': `${originPct.x}%`,
        '--oy': `${originPct.y}%`,
        position: 'fixed', inset: 0, zIndex: 9000,
        background: '#000',
        fontFamily: "'Space Grotesk', sans-serif",
        color: '#fff',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* Sticky header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 1,
        background: 'rgba(0,0,0,0.96)', backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #1a1a1a',
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: '1px solid #2a2a2a',
          color: '#888', padding: '6px 12px', fontSize: '12px',
          cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif",
          display: 'flex', alignItems: 'center', gap: '4px', borderRadius: '4px',
        }}>← Back</button>
        <button onClick={onClose} style={{
          background: 'none', border: '1px solid #2a2a2a',
          color: '#888', fontSize: '16px', cursor: 'pointer',
          padding: '6px 10px', fontFamily: "'Space Grotesk', sans-serif", borderRadius: '4px',
        }}>✕</button>
      </div>

      <div style={{ padding: '20px 16px 120px' }}>
        {node.status && (
          <div style={{
            display: 'inline-block', padding: '3px 10px', marginBottom: '14px',
            background: `${lum.core}18`, border: `1px solid ${lum.core}55`,
            color: lum.core, fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase',
            borderRadius: '2px',
          }}>{node.status.replace('_', ' ')}</div>
        )}

        <h2 style={{ fontSize: '20px', fontWeight: 700, lineHeight: 1.3, margin: '0 0 10px' }}>
          {node.label}
        </h2>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          marginBottom: '18px', fontSize: '11px',
          color: catColor, textTransform: 'uppercase', letterSpacing: '1.5px',
        }}>
          <span style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: catColor, boxShadow: `0 0 6px 2px ${catColor}`,
            display: 'inline-block', flexShrink: 0,
          }} />
          {CATEGORY_LABELS[node.category] || node.category}
        </div>

        <div style={{ height: '1px', background: '#1a1a1a', marginBottom: '18px' }} />

        {/* Likelihood bar */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontSize: '9px', color: '#555', letterSpacing: '1.5px', textTransform: 'uppercase',
            marginBottom: '8px',
          }}>
            <span>Likelihood</span>
            <span style={{ color: lum.core, fontSize: '18px', fontWeight: 700 }}>
              {Math.round(node.likelihood * 100)}%
            </span>
          </div>
          <div style={{ height: '3px', background: '#111', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${node.likelihood * 100}%`,
              background: `linear-gradient(90deg, ${lum.core}66, ${lum.core})`,
              boxShadow: `0 0 8px ${lum.core}`,
              transition: 'width 0.6s ease',
            }} />
          </div>
        </div>

        {/* Analysis */}
        <div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            marginBottom: '12px',
          }}>
            <div style={{ fontSize: '9px', color: '#555', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              Analysis
            </div>
            {node.updated && (
              <div style={{ fontSize: '9px', color: '#444', letterSpacing: '1px' }}>
                Updated {node.updated}
              </div>
            )}
          </div>
          {Array.isArray(node.description) ? (
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {node.description.map((pt, i) => {
                const isNew = i === 0 && isUpdatedToday(node.updated);
                return (
                  <li key={i} style={{
                    display: 'flex', gap: '8px',
                    fontSize: '13px', lineHeight: 1.65, alignItems: 'flex-start',
                    marginBottom: isNew ? '10px' : '6px',
                    ...(isNew ? {
                      background: 'rgba(255,50,50,0.07)',
                      border: '1px solid rgba(255,50,50,0.18)',
                      borderRadius: '4px',
                      padding: '7px 10px', color: '#fff',
                    } : { color: '#999' }),
                  }}>
                    <span style={{ color: isNew ? '#ff4444' : '#333', marginTop: '3px', flexShrink: 0 }}>
                      {isNew ? '●' : '·'}
                    </span>
                    <span>{pt}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p style={{ fontSize: '13px', color: '#999', lineHeight: 1.6, margin: 0 }}>
              {node.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Oracle bottom sheet ──────────────────────────────────────────────────────
function OracleSheet({ onClose }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 8500,
        background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        className="oracle-sheet"
        onClick={e => e.stopPropagation()}
        style={{
          background: '#070707', borderTop: '2px solid rgba(229,57,53,0.8)',
          borderRadius: '16px 16px 0 0',
          maxHeight: '88vh', overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: '#1e1e1e' }} />
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '4px 16px 10px', borderBottom: '1px solid #111',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '7px', height: '7px', borderRadius: '50%',
              background: '#ff1a1a', boxShadow: '0 0 8px 3px rgba(229,57,53,0.8)',
              display: 'inline-block',
            }} />
            <span style={{
              fontSize: '10px', letterSpacing: '2px', color: '#ff3333',
              textTransform: 'uppercase', fontWeight: 700,
            }}>Ask Roger</span>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#555',
            fontSize: '18px', cursor: 'pointer', padding: '4px 8px',
          }}>✕</button>
        </div>
        <div style={{ padding: '14px 10px 32px' }}>
          <OracleSearch />
        </div>
      </div>
    </div>
  );
}

// ─── Canvas Graph (Level 1 + 2) ───────────────────────────────────────────────
function GraphCanvas({ masterNodes, onSelectNode, activeTab }) {
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [activeMaster, setActiveMaster] = useState(null);   // which master is expanded
  const [subSpawned, setSubSpawned] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);   // for L3 panel
  const [originPct, setOriginPct] = useState({ x: 50, y: 50 });

  // Measure container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDims({ w: width, h: height });
    });
    ro.observe(el);
    setDims({ w: el.offsetWidth, h: el.offsetHeight });
    return () => ro.disconnect();
  }, [activeTab]);

  const { w, h } = dims;

  // Compute master orb screen positions from grid layout
  const masterPositions = MASTER_LAYOUT.map(({ col, row }) => {
    const cols = 2, rows = 3;
    const padX = 0.14, padY = 0.10;
    const usableW = 1 - padX * 2;
    const usableH = 1 - padY * 2;
    return {
      x: (padX + (col + 0.5) * (usableW / cols)) * w,
      y: (padY + (row + 0.5) * (usableH / rows)) * h,
    };
  });

  function handleMasterTap(master, idx) {
    if (activeMaster?.id === master.id) {
      // Collapse
      setActiveMaster(null);
      setSubSpawned(false);
      return;
    }
    setActiveMaster(master);
    setSubSpawned(false);
    setTimeout(() => setSubSpawned(true), 40);
  }

  function handleSubTap(child, subEl) {
    // Compute origin % for grow animation
    const rect = subEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setOriginPct({ x: (cx / window.innerWidth) * 100, y: (cy / window.innerHeight) * 100 });
    setSelectedNode(child);
  }

  function handleCloseL3() {
    setSelectedNode(null);
    setActiveMaster(null);
    setSubSpawned(false);
  }

  function handleBackL3() {
    setSelectedNode(null);
    // keep activeMaster — subnodes stay waiting
  }

  if (w === 0) return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;

  // Sub-node fan positions for active master
  let subPositions = [];
  if (activeMaster) {
    const masterIdx = masterNodes.findIndex(m => m.id === activeMaster.id);
    const mPos = masterPositions[masterIdx];
    const facingUp = mPos.y > h * 0.4;
    const angles = getFanAngles(activeMaster.children.length, facingUp);
    subPositions = angles.map(deg => {
      const rad = (deg * Math.PI) / 180;
      return {
        x: mPos.x + Math.cos(rad) * FAN_RADIUS,
        y: mPos.y + Math.sin(rad) * FAN_RADIUS,
      };
    });
  }

  // Ghost perimeter positions for inactive masters
  let ghostIdx = 0;
  const ghostSlots = [...GHOST_POSITIONS];

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* SVG connector lines */}
      {activeMaster && (
        <svg style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          pointerEvents: 'none', zIndex: 1,
        }}>
          {(() => {
            const masterIdx = masterNodes.findIndex(m => m.id === activeMaster.id);
            const mPos = masterPositions[masterIdx];
            return subPositions.map((sp, i) => (
              <line
                key={i}
                x1={mPos.x} y1={mPos.y}
                x2={sp.x} y2={sp.y}
                stroke={`${CATEGORY_COLORS[activeMaster.category]}33`}
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            ));
          })()}
        </svg>
      )}

      {/* Master orbs */}
      {masterNodes.map((master, idx) => {
        const pos = masterPositions[idx];
        const lum = getLum(master.likelihood);
        const isActive = activeMaster?.id === master.id;
        const isGhost = activeMaster && !isActive;

        // Ghost gets a perimeter slot
        let ghostPos = pos;
        if (isGhost) {
          const slot = ghostSlots[ghostIdx % ghostSlots.length];
          ghostPos = { x: slot.x * w, y: slot.y * h };
          ghostIdx++;
        }

        const targetPos = isGhost ? ghostPos : pos;
        const scale = isGhost ? GHOST_SCALE : 1;
        const opacity = isGhost ? 0.28 : 1;
        const size = ORB_R * 2;

        return (
          <div
            key={master.id}
            className="m-orb"
            onClick={() => handleMasterTap(master, idx)}
            style={{
              position: 'absolute',
              left: targetPos.x - ORB_R,
              top: targetPos.y - ORB_R,
              width: size, height: size,
              borderRadius: '50%',
              background: `radial-gradient(circle at 35% 35%, ${lum.core}, rgba(0,0,0,0.65))`,
              border: `1.5px solid ${lum.core}${isActive ? '99' : '44'}`,
              boxShadow: isActive
                ? `0 0 24px 8px ${lum.glow}, 0 0 48px 14px ${lum.glow}`
                : `0 0 14px 4px ${lum.glow}`,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              zIndex: isActive ? 10 : 5,
              transform: `scale(${scale})`,
              opacity,
              transition: 'left 0.42s cubic-bezier(0.34,1.2,0.64,1), top 0.42s cubic-bezier(0.34,1.2,0.64,1), transform 0.35s ease, opacity 0.35s ease',
            }}
          >
            {master.hasRecentUpdate && !isGhost && (
              <div className="hb-dot" style={{
                position: 'absolute', top: '4px', right: '4px',
                width: '7px', height: '7px', borderRadius: '50%',
                background: '#ff3333', boxShadow: '0 0 6px 2px rgba(255,50,50,0.7)',
              }} />
            )}
            <div style={{ fontSize: '14px', fontWeight: 700, color: lum.core, lineHeight: 1 }}>
              {Math.round(master.likelihood * 100)}%
            </div>
            {!isGhost && (
              <div style={{ fontSize: '8px', color: lum.core + '99', marginTop: '2px', letterSpacing: '0.5px' }}>
                {master.childCount}
              </div>
            )}
          </div>
        );
      })}

      {/* Master label (active only, below orb) */}
      {activeMaster && (() => {
        const masterIdx = masterNodes.findIndex(m => m.id === activeMaster.id);
        const mPos = masterPositions[masterIdx];
        return (
          <div style={{
            position: 'absolute',
            left: mPos.x - 60,
            top: mPos.y + ORB_R + 6,
            width: 120,
            textAlign: 'center',
            fontSize: '11px', fontWeight: 600, color: '#fff',
            letterSpacing: '0.5px',
            zIndex: 10,
            pointerEvents: 'none',
          }}>
            {activeMaster.label}
          </div>
        );
      })()}

      {/* Master labels (inactive, visible on L1) */}
      {!activeMaster && masterNodes.map((master, idx) => {
        const pos = masterPositions[idx];
        return (
          <div
            key={`lbl-${master.id}`}
            style={{
              position: 'absolute',
              left: pos.x - 50,
              top: pos.y + ORB_R + 6,
              width: 100,
              textAlign: 'center',
              fontSize: '10px', fontWeight: 600, color: '#aaa',
              letterSpacing: '0.3px',
              zIndex: 5,
              pointerEvents: 'none',
            }}
          >
            {master.label}
          </div>
        );
      })}

      {/* Sub-nodes */}
      {activeMaster && activeMaster.children.map((child, i) => {
        const sp = subPositions[i];
        if (!sp) return null;
        const clum = getLum(child.likelihood);
        const size = SUB_R * 2;
        // Clamp within canvas
        const cx = Math.max(SUB_R + 4, Math.min(w - SUB_R - 4, sp.x));
        const cy = Math.max(SUB_R + 4, Math.min(h - SUB_R - 4, sp.y));

        return (
          <div key={child.id} style={{ position: 'absolute', left: cx - SUB_R, top: cy - SUB_R, zIndex: 20 }}>
            <div
              className="m-sub"
              onClick={e => handleSubTap(child, e.currentTarget)}
              style={{
                width: size, height: size, borderRadius: '50%',
                background: `radial-gradient(circle at 35% 35%, ${clum.core}, rgba(0,0,0,0.7))`,
                border: `1px solid ${clum.core}55`,
                boxShadow: `0 0 10px 3px ${clum.glow}`,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                position: 'relative',
                opacity: subSpawned ? 1 : 0,
                transform: subSpawned ? 'scale(1)' : 'scale(0.1)',
                transition: `opacity 0.3s ease ${i * 40}ms, transform 0.35s cubic-bezier(0.34,1.56,0.64,1) ${i * 40}ms`,
              }}
            >
              {isUpdatedToday(child.updated) && (
                <div className="hb-sub" style={{
                  position: 'absolute', top: '2px', right: '2px',
                  width: '5px', height: '5px', borderRadius: '50%',
                  background: '#ff3333', boxShadow: '0 0 4px 2px rgba(255,50,50,0.7)',
                }} />
              )}
              <div style={{ fontSize: '10px', fontWeight: 700, color: clum.core }}>
                {Math.round(child.likelihood * 100)}%
              </div>
            </div>
            {/* Sub-label */}
            <div style={{
              position: 'absolute',
              top: size + 4,
              left: '50%', transform: 'translateX(-50%)',
              width: 72, textAlign: 'center',
              fontSize: '9px', color: '#bbb', lineHeight: 1.3,
              pointerEvents: 'none',
              opacity: subSpawned ? 1 : 0,
              transition: `opacity 0.3s ease ${i * 40 + 80}ms`,
            }}>
              {child.label}
            </div>
          </div>
        );
      })}

      {/* Tap hint */}
      {!activeMaster && (
        <div style={{
          position: 'absolute', bottom: 16, left: 0, right: 0,
          textAlign: 'center', fontSize: '10px', color: '#333',
          letterSpacing: '1px', pointerEvents: 'none',
        }}>
          Tap a node to explore
        </div>
      )}

      {/* Level 3 overlay — lives inside canvas so spatial map stays */}
      {selectedNode && (
        <Level3Panel
          node={selectedNode}
          originPct={originPct}
          onClose={handleCloseL3}
          onBack={handleBackL3}
        />
      )}
    </div>
  );
}

// ─── TSLA TUBE mobile view ────────────────────────────────────────────────────
function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return `${Math.floor(diff / 60000)}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtViews(n) {
  if (!n) return '';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M views`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K views`;
  return `${n} views`;
}

const CAT_COLORS = {
  Robotaxi: '#00ff88', FSD: '#00aaff', Earnings: '#f59e0b',
  Optimus: '#a78bfa', General: '#888', Energy: '#f97316',
};

function TubeView({ onAskRoger }) {
  const { data: digest, loading } = useRemoteData('tube_digest.json', FALLBACK_DIGEST);
  const [filter, setFilter] = useState('All');
  const [expanded, setExpanded] = useState({});

  const videos = digest?.videos || FALLBACK_DIGEST.videos || [];
  const categories = ['All', ...Array.from(new Set(videos.map(v => v.category).filter(Boolean)))];
  const filtered = filter === 'All' ? videos : videos.filter(v => v.category === filter);

  return (
    <div style={{
      flex: 1, overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
      paddingBottom: '100px',
      fontFamily: "'Space Grotesk', sans-serif",
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px 10px',
        borderBottom: '1px solid #111',
        background: 'rgba(0,0,0,0.9)',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '10px' }}>
          <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '2px', color: '#fff' }}>
            🎬 TSLA TUBE
          </span>
          <span style={{ fontSize: '9px', color: '#444', letterSpacing: '1px' }}>
            {digest?.generatedAt ? `Updated ${timeAgo(digest.generatedAt)}` : 'YouTube Digest'}
          </span>
        </div>
        {/* Category filter pills */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              style={{
                flexShrink: 0,
                background: filter === cat ? 'rgba(0,255,136,0.12)' : 'transparent',
                border: `1px solid ${filter === cat ? '#00ff88' : '#222'}`,
                borderRadius: '20px',
                color: filter === cat ? '#00ff88' : '#555',
                fontSize: '9px', letterSpacing: '1.5px', textTransform: 'uppercase',
                padding: '4px 10px', cursor: 'pointer',
                fontFamily: "'Space Grotesk', sans-serif",
                WebkitTapHighlightColor: 'transparent',
              }}
            >{cat}</button>
          ))}
        </div>
      </div>

      {/* Video cards */}
      <div style={{ padding: '0' }}>
        {filtered.map((video, i) => {
          const catColor = CAT_COLORS[video.category] || '#666';
          const isExpanded = expanded[video.videoId];
          return (
            <div
              key={video.videoId || i}
              style={{
                borderBottom: '1px solid #0e0e0e',
                background: video.curatedByRoger ? 'rgba(0,255,136,0.025)' : 'transparent',
              }}
            >
              {/* Thumbnail + meta row */}
              <a
                href={video.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', gap: '10px', padding: '12px 14px 8px', textDecoration: 'none' }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <img
                    src={`https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`}
                    alt=""
                    style={{
                      width: '110px', height: '62px',
                      objectFit: 'cover', borderRadius: '3px',
                      border: `1px solid ${video.curatedByRoger ? '#00ff8844' : '#1a1a1a'}`,
                      background: '#0a0a0a',
                      display: 'block',
                    }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                  {/* Play overlay */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.25)', borderRadius: '3px',
                  }}>
                    <span style={{ fontSize: '18px', opacity: 0.8 }}>▶</span>
                  </div>
                  {video.curatedByRoger && (
                    <div style={{
                      position: 'absolute', top: '3px', left: '3px',
                      background: '#00ff8833', border: '1px solid #00ff88',
                      color: '#00ff88', fontSize: '7px', letterSpacing: '1px',
                      padding: '1px 4px', borderRadius: '2px',
                    }}>ROGER</div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '12px', fontWeight: 600, color: '#e0e0e0',
                    lineHeight: 1.35, marginBottom: '5px',
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {video.title}
                  </div>
                  <div style={{ fontSize: '10px', color: '#555', marginBottom: '4px' }}>
                    {video.channelTitle}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    {video.category && (
                      <span style={{
                        fontSize: '8px', letterSpacing: '1px', textTransform: 'uppercase',
                        color: catColor, border: `1px solid ${catColor}55`,
                        padding: '1px 5px', borderRadius: '2px',
                      }}>{video.category}</span>
                    )}
                    <span style={{ fontSize: '9px', color: '#444' }}>
                      {video.publishedAt ? timeAgo(video.publishedAt) : ''}
                      {video.viewCount ? ` · ${fmtViews(video.viewCount)}` : ''}
                    </span>
                  </div>
                </div>
              </a>

              {/* Summary bullets + controls */}
              <div style={{ padding: '0 14px 10px' }}>
                {video.summaryBullets?.length > 0 && (
                  <div style={{ marginBottom: '8px' }}>
                    {(isExpanded ? video.summaryBullets : video.summaryBullets.slice(0, 2)).map((b, j) => (
                      <div key={j} style={{
                        fontSize: '11px', color: '#888', lineHeight: 1.6,
                        paddingLeft: '10px', borderLeft: `2px solid ${catColor}44`,
                        marginBottom: '3px',
                      }}>
                        {b.replace(/^[•\-]\s*/, '')}
                      </div>
                    ))}
                    {video.summaryBullets.length > 2 && (
                      <button
                        onClick={() => setExpanded(e => ({ ...e, [video.videoId]: !e[video.videoId] }))}
                        style={{
                          background: 'none', border: 'none', padding: '2px 0',
                          color: '#555', fontSize: '10px', cursor: 'pointer',
                          fontFamily: "'Space Grotesk', sans-serif', letterSpacing: '0.5px",
                          WebkitTapHighlightColor: 'transparent',
                        }}
                      >
                        {isExpanded ? '▲ less' : `▼ +${video.summaryBullets.length - 2} more`}
                      </button>
                    )}
                  </div>
                )}

                {/* Ask Roger about this video */}
                <button
                  onClick={() => onAskRoger(video)}
                  style={{
                    background: 'rgba(229,57,53,0.08)',
                    border: '1px solid rgba(229,57,53,0.4)',
                    color: '#ff5555', fontSize: '9px', letterSpacing: '1.5px',
                    textTransform: 'uppercase', padding: '5px 10px',
                    borderRadius: '12px', cursor: 'pointer',
                    fontFamily: "'Space Grotesk', sans-serif",
                    display: 'flex', alignItems: 'center', gap: '5px',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <span style={{
                    width: '5px', height: '5px', borderRadius: '50%',
                    background: '#ff3333', display: 'inline-block',
                    boxShadow: '0 0 5px 2px rgba(229,57,53,0.7)',
                  }} />
                  Ask Roger
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#333', fontSize: '12px' }}>
            No videos in this category
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Bottom Nav Pill ──────────────────────────────────────────────────────────
function BottomPill({ activeTab, onTab, onOracle }) {
  return (
    <div style={{
      position: 'fixed', bottom: '20px', left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 600,
      display: 'flex', alignItems: 'center',
    }}>
      {/* Main pill: Trading | Tube */}
      <div
        className="bottom-pill"
        style={{
          display: 'flex', alignItems: 'center',
          background: 'rgba(6,6,8,0.82)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(0,255,136,0.25)',
          borderRadius: '30px',
          padding: '2px',
          boxShadow: '0 4px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
          gap: '2px',
        }}
      >
        {[
          { key: 'trading', icon: '📈', label: 'Trading' },
          { key: 'tube',    icon: '📺', label: 'Tube' },
        ].map(({ key, icon, label }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => onTab(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '8px 16px',
                borderRadius: '26px',
                background: isActive ? 'rgba(0,255,136,0.12)' : 'transparent',
                border: 'none',
                color: isActive ? '#00ff88' : '#555',
                fontSize: '11px', fontWeight: isActive ? 700 : 500,
                letterSpacing: '0.5px',
                cursor: 'pointer',
                fontFamily: "'Space Grotesk', sans-serif",
                boxShadow: isActive ? '0 0 12px rgba(0,255,136,0.2)' : 'none',
                transition: 'all 0.22s ease',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span style={{ fontSize: '13px' }}>{icon}</span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Oracle FAB — glowing orb, separate to the right */}
      <button
        onClick={onOracle}
        style={{
          marginLeft: '10px',
          width: '48px', height: '48px',
          borderRadius: '50%',
          background: 'rgba(229,57,53,0.12)',
          border: '1.5px solid rgba(229,57,53,0.65)',
          color: '#ff3333',
          fontSize: '20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 0 18px rgba(229,57,53,0.35), 0 0 6px rgba(229,57,53,0.2)',
          backdropFilter: 'blur(12px)',
          WebkitTapHighlightColor: 'transparent',
          transition: 'box-shadow 0.2s ease',
          flexShrink: 0,
        }}
        onTouchStart={e => {
          e.currentTarget.style.boxShadow = '0 0 28px rgba(229,57,53,0.65), 0 0 10px rgba(229,57,53,0.4)';
        }}
        onTouchEnd={e => {
          e.currentTarget.style.boxShadow = '0 0 18px rgba(229,57,53,0.35), 0 0 6px rgba(229,57,53,0.2)';
        }}
        title="Ask Roger"
      >
        ◉
      </button>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function MobileGraph() {
  const [activeTab, setActiveTab] = useState('trading');
  const [prevTab, setPrevTab] = useState('trading');
  const [showOracle, setShowOracle] = useState(false);
  const [oracleVideoCtx, setOracleVideoCtx] = useState(null);

  const masterNodes = CATEGORY_ORDER.map(catId => buildMasterNode(catId));

  function handleTabSwitch(tab) {
    if (tab === activeTab) return;
    setPrevTab(activeTab);
    setActiveTab(tab);
  }

  function handleAskRogerVideo(video) {
    setOracleVideoCtx(video);
    setShowOracle(true);
  }

  // Slide direction: trading ← → tube
  const TAB_ORDER = ['trading', 'tube'];
  const slideDir = TAB_ORDER.indexOf(activeTab) > TAB_ORDER.indexOf(prevTab) ? -1 : 1;

  return (
    <>
      <style>{MOBILE_CSS}</style>

      {/* Tab content — full height minus bottom pill */}
      <div style={{
        position: 'fixed', inset: 0,
        paddingBottom: '90px',
        paddingTop: '90px',   // space for mobile header
        overflow: 'hidden',
      }}>
        {/* Trading / Graph tab */}
        <div style={{
          position: 'absolute', inset: 0,
          paddingBottom: '90px', paddingTop: '90px',
          transform: activeTab === 'trading' ? 'translateX(0)' : `translateX(${100 * slideDir}%)`,
          opacity: activeTab === 'trading' ? 1 : 0,
          transition: 'transform 0.32s cubic-bezier(0.4,0,0.2,1), opacity 0.28s ease',
          pointerEvents: activeTab === 'trading' ? 'auto' : 'none',
        }}>
          <GraphCanvas
            masterNodes={masterNodes}
            activeTab={activeTab}
          />
        </div>

        {/* Tube tab */}
        <div style={{
          position: 'absolute', inset: 0,
          paddingBottom: '90px', paddingTop: '90px',
          display: 'flex', flexDirection: 'column',
          transform: activeTab === 'tube' ? 'translateX(0)' : `translateX(${-100 * slideDir}%)`,
          opacity: activeTab === 'tube' ? 1 : 0,
          transition: 'transform 0.32s cubic-bezier(0.4,0,0.2,1), opacity 0.28s ease',
          pointerEvents: activeTab === 'tube' ? 'auto' : 'none',
        }}>
          <TubeView onAskRoger={handleAskRogerVideo} />
        </div>
      </div>

      {/* Bottom pill nav */}
      <BottomPill
        activeTab={activeTab}
        onTab={handleTabSwitch}
        onOracle={() => setShowOracle(true)}
      />

      {/* Oracle sheet */}
      {showOracle && (
        <OracleSheet
          videoCtx={oracleVideoCtx}
          onClose={() => { setShowOracle(false); setOracleVideoCtx(null); }}
        />
      )}
    </>
  );
}
