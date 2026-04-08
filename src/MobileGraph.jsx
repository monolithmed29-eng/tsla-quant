import { useState, useEffect } from 'react';
import { catalysts } from './data';

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

// ─── Helpers ─────────────────────────────────────────────────────────────────
function isUpdatedToday(updated) {
  if (!updated) return false;
  const d = new Date(updated);
  const t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
}

function getLum(likelihood) {
  if (likelihood >= 0.9) return { core: 'rgba(255,255,255,1.0)',   outerGlow: 'rgba(255,255,255,0.30)' };
  if (likelihood >= 0.7) return { core: 'rgba(220,235,255,0.95)', outerGlow: 'rgba(200,220,255,0.22)' };
  if (likelihood >= 0.5) return { core: 'rgba(180,200,230,0.85)', outerGlow: 'rgba(160,185,220,0.16)' };
  if (likelihood >= 0.3) return { core: 'rgba(130,150,190,0.70)', outerGlow: 'rgba(120,140,180,0.11)' };
  return                        { core: 'rgba(80,100,140,0.55)',  outerGlow: 'rgba(70,90,130,0.07)'  };
}

function buildMasterNode(catId) {
  const children = catalysts.filter(c => c.category === catId);
  const avg = children.length
    ? children.reduce((s, c) => s + c.likelihood, 0) / children.length
    : 0.5;
  const hasRecentUpdate = children.some(c => isUpdatedToday(c.updated));
  return {
    id: `__master_${catId}`,
    category: catId,
    label: CATEGORY_LABELS[catId] || catId,
    likelihood: avg,
    childCount: children.length,
    hasRecentUpdate,
    children,
  };
}

// ─── CSS Animations ───────────────────────────────────────────────────────────
const MOBILE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');

  @keyframes heartbeat {
    0%   { opacity: 0; transform: scale(0.8); }
    5%   { opacity: 1; transform: scale(1.2); }
    10%  { opacity: 0; transform: scale(0.8); }
    17%  { opacity: 1; transform: scale(1.1); }
    22%  { opacity: 0; transform: scale(0.8); }
    100% { opacity: 0; transform: scale(0.8); }
  }

  @keyframes orbPulse {
    0%, 100% { box-shadow: 0 0 18px 4px rgba(255,255,255,0.12), 0 0 40px 8px rgba(255,255,255,0.06); }
    50%       { box-shadow: 0 0 28px 8px rgba(255,255,255,0.22), 0 0 60px 16px rgba(255,255,255,0.10); }
  }

  .mobile-orb {
    animation: orbPulse 3s ease-in-out infinite;
    transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .mobile-orb:active {
    transform: scale(0.92) !important;
  }

  .mobile-sub-node {
    transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .mobile-sub-node:active {
    transform: scale(0.88) !important;
  }

  .heartbeat-dot {
    animation: heartbeat 2.8s ease-in-out infinite;
  }

  .heartbeat-dot-sub {
    animation: heartbeat 2.8s ease-in-out 0.4s infinite;
  }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .level3-panel {
    animation: fadeInUp 0.25s ease;
  }
`;

// ─── Level 3: Detail Panel ────────────────────────────────────────────────────
function Level3Panel({ node, onClose, onBack }) {
  if (!node) return null;

  const statusColor = getLum(node.likelihood).core;
  const catColor = CATEGORY_COLORS[node.category] || 'rgba(160,185,220,0.85)';
  const updated = node.updated;

  return (
    <div className="level3-panel" style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: '#000',
      fontFamily: "'Space Grotesk', sans-serif",
      color: '#fff',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
    }}>
      {/* Header */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 1,
        background: 'rgba(0,0,0,0.95)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #1a1a1a',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: '1px solid #333',
            color: '#aaa',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '13px',
            cursor: 'pointer',
            fontFamily: "'Space Grotesk', sans-serif",
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          ← Back
        </button>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#666',
            fontSize: '22px',
            cursor: 'pointer',
            padding: '4px 8px',
            lineHeight: 1,
          }}
        >✕</button>
      </div>

      {/* Content */}
      <div style={{ padding: '20px 16px 48px' }}>
        {/* Status badge */}
        {node.status && (
          <div style={{
            display: 'inline-block',
            padding: '3px 10px',
            background: `${statusColor}22`,
            border: `1px solid ${statusColor}`,
            color: statusColor,
            fontSize: '10px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            marginBottom: '16px',
            borderRadius: '2px',
          }}>
            {node.status.replace('_', ' ')}
          </div>
        )}

        {/* Title */}
        <h2 style={{
          fontSize: '20px',
          fontWeight: 700,
          lineHeight: 1.3,
          marginBottom: '8px',
          letterSpacing: '-0.3px',
          margin: '0 0 10px 0',
        }}>
          {node.label}
        </h2>

        {/* Category */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '20px',
          fontSize: '12px',
          color: 'rgba(160,185,220,0.85)',
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
        }}>
          <span style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: catColor,
            boxShadow: `0 0 8px 3px ${catColor}, 0 0 16px 4px ${catColor}`,
            display: 'inline-block', flexShrink: 0,
          }} />
          {CATEGORY_LABELS[node.category] || node.category}
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: '#222', marginBottom: '20px' }} />

        {/* Expected */}
        {node.expected && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '10px', color: '#666', letterSpacing: '1.5px', marginBottom: '4px', textTransform: 'uppercase' }}>Expected</div>
            <div style={{ fontSize: '14px', color: '#ccc' }}>{node.expected}</div>
          </div>
        )}

        {/* Likelihood */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontSize: '10px', color: '#666', letterSpacing: '1.5px', textTransform: 'uppercase',
            marginBottom: '8px',
          }}>
            <span>Likelihood</span>
            <span style={{ color: statusColor, fontSize: '18px', fontWeight: 700 }}>
              {Math.round(node.likelihood * 100)}%
            </span>
          </div>
          <div style={{
            height: '4px', background: '#111',
            borderRadius: '2px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${node.likelihood * 100}%`,
              background: `linear-gradient(90deg, ${statusColor}88, ${statusColor})`,
              boxShadow: `0 0 8px ${statusColor}`,
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
            <div style={{ fontSize: '10px', color: '#666', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Analysis</div>
            {updated && (
              <div style={{ fontSize: '9px', color: '#666', letterSpacing: '1px' }}>Updated {updated}</div>
            )}
          </div>
          {Array.isArray(node.description) ? (
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {node.description.map((point, i) => {
                const isNew = i === 0 && isUpdatedToday(updated);
                return (
                  <li key={i} style={{
                    display: 'flex', gap: '8px',
                    fontSize: '13px', lineHeight: 1.65,
                    marginBottom: isNew ? '10px' : '6px',
                    alignItems: 'flex-start',
                    ...(isNew ? {
                      background: 'rgba(255,50,50,0.07)',
                      border: '1px solid rgba(255,50,50,0.18)',
                      borderRadius: '4px',
                      padding: '7px 10px',
                      color: '#fff',
                    } : { color: '#aaa' }),
                  }}>
                    <span style={{ color: isNew ? '#ff4444' : '#333', marginTop: '2px', flexShrink: 0 }}>
                      {isNew ? '●' : '·'}
                    </span>
                    <span>{point}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p style={{ fontSize: '13px', color: '#aaa', lineHeight: 1.6, margin: 0 }}>{node.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Level 2: Radial Sub-nodes ────────────────────────────────────────────────
function Level2View({ masterNode, onSelectNode, onBack }) {
  const [spawned, setSpawned] = useState(false);

  useEffect(() => {
    // Trigger spawn animation after mount
    const t = setTimeout(() => setSpawned(true), 30);
    return () => clearTimeout(t);
  }, []);

  const children = masterNode.children;
  const lum = getLum(masterNode.likelihood);
  const catColor = CATEGORY_COLORS[masterNode.category] || '#fff';

  // Layout sub-nodes in a radial grid pattern
  // We'll use a responsive wrap layout instead of absolute positioning for simplicity
  const cols = Math.min(3, Math.ceil(Math.sqrt(children.length)));

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000',
      fontFamily: "'Space Grotesk', sans-serif",
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingBottom: '100px',
    }}>
      {/* Master orb (top center) */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '40px',
        paddingBottom: '28px',
      }}>
        <div
          className="mobile-orb"
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, ${lum.core}, rgba(0,0,0,0.6))`,
            border: `1.5px solid ${lum.core}55`,
            boxShadow: `0 0 20px 6px ${lum.outerGlow}, 0 0 50px 12px ${lum.outerGlow}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {masterNode.hasRecentUpdate && (
            <div className="heartbeat-dot" style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#ff3333',
              boxShadow: '0 0 6px 2px rgba(255,50,50,0.6)',
            }} />
          )}
          <div style={{ fontSize: '16px', fontWeight: 700, color: lum.core }}>
            {Math.round(masterNode.likelihood * 100)}%
          </div>
        </div>
        <div style={{
          marginTop: '10px',
          fontSize: '14px',
          fontWeight: 700,
          color: '#fff',
          letterSpacing: '0.5px',
        }}>
          {masterNode.label}
        </div>
        <div style={{
          fontSize: '11px',
          color: '#555',
          marginTop: '3px',
        }}>
          {children.length} catalysts
        </div>
        {/* Connector line */}
        <div style={{
          width: '1px',
          height: '24px',
          background: `linear-gradient(to bottom, ${catColor}44, transparent)`,
          marginTop: '12px',
        }} />
      </div>

      {/* Sub-nodes grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: '16px 12px',
        padding: '0 20px',
        width: '100%',
        maxWidth: '400px',
      }}>
        {children.map((child, i) => {
          const childLum = getLum(child.likelihood);
          const updatedToday = isUpdatedToday(child.updated);
          return (
            <div
              key={child.id}
              className="mobile-sub-node"
              onClick={() => onSelectNode(child)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                opacity: spawned ? 1 : 0,
                transform: spawned ? 'scale(1)' : 'scale(0.3)',
                transitionDelay: `${i * 35}ms`,
              }}
            >
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: `radial-gradient(circle at 35% 35%, ${childLum.core}, rgba(0,0,0,0.7))`,
                border: `1px solid ${childLum.core}44`,
                boxShadow: `0 0 12px 3px ${childLum.outerGlow}, 0 0 24px 6px ${childLum.outerGlow}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                flexShrink: 0,
              }}>
                {updatedToday && (
                  <div className="heartbeat-dot-sub" style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#ff3333',
                    boxShadow: '0 0 5px 2px rgba(255,50,50,0.6)',
                  }} />
                )}
                <div style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: childLum.core,
                }}>
                  {Math.round(child.likelihood * 100)}%
                </div>
              </div>
              <div style={{
                fontSize: '10px',
                color: '#ccc',
                textAlign: 'center',
                lineHeight: 1.3,
                maxWidth: '80px',
              }}>
                {child.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Return FAB */}
      <div style={{ position: 'fixed', bottom: '24px', left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 100 }}>
        <button
          onClick={onBack}
          style={{
            background: 'rgba(0,0,0,0.92)',
            border: '1px solid #00ff8866',
            color: '#00ff88',
            padding: '12px 24px',
            borderRadius: '24px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: '0.5px',
            boxShadow: '0 0 20px rgba(0,255,136,0.15)',
            backdropFilter: 'blur(8px)',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          ↩ Return to Network
        </button>
      </div>
    </div>
  );
}

// ─── Level 1: Master Orbs Grid ────────────────────────────────────────────────
function Level1View({ masterNodes, onSelectMaster }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#000',
      fontFamily: "'Space Grotesk', sans-serif",
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: '20px',
      paddingBottom: '48px',
    }}>
      {/* Header */}
      <div style={{
        fontSize: '11px',
        letterSpacing: '3px',
        textTransform: 'uppercase',
        color: '#444',
        marginBottom: '28px',
      }}>
        Catalyst Network
      </div>

      {/* 2×3 grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '28px 20px',
        padding: '0 24px',
        width: '100%',
        maxWidth: '380px',
      }}>
        {masterNodes.map((master) => {
          const lum = getLum(master.likelihood);
          return (
            <div
              key={master.id}
              className="mobile-orb"
              onClick={() => onSelectMaster(master)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              {/* Orb */}
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: `radial-gradient(circle at 35% 35%, ${lum.core}, rgba(0,0,0,0.6))`,
                border: `1.5px solid ${lum.core}55`,
                boxShadow: `0 0 20px 6px ${lum.outerGlow}, 0 0 50px 14px ${lum.outerGlow}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                flexShrink: 0,
              }}>
                {master.hasRecentUpdate && (
                  <div className="heartbeat-dot" style={{
                    position: 'absolute',
                    top: '5px',
                    right: '5px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#ff3333',
                    boxShadow: '0 0 6px 3px rgba(255,50,50,0.7)',
                  }} />
                )}
                <div style={{ fontSize: '18px', fontWeight: 700, color: lum.core }}>
                  {Math.round(master.likelihood * 100)}%
                </div>
                <div style={{ fontSize: '10px', color: lum.core + 'aa', marginTop: '2px' }}>
                  {master.childCount} nodes
                </div>
              </div>

              {/* Label */}
              <div style={{
                textAlign: 'center',
              }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#fff',
                  lineHeight: 1.2,
                }}>
                  {master.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div style={{
        marginTop: '36px',
        fontSize: '11px',
        color: '#333',
        letterSpacing: '1px',
        textAlign: 'center',
      }}>
        Tap a node to explore
      </div>
    </div>
  );
}

// ─── Main MobileGraph ─────────────────────────────────────────────────────────
export default function MobileGraph() {
  const [level, setLevel] = useState(1); // 1, 2, or 3
  const [selectedMaster, setSelectedMaster] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  const masterNodes = CATEGORY_ORDER.map(catId => buildMasterNode(catId));

  function handleSelectMaster(master) {
    setSelectedMaster(master);
    setLevel(2);
  }

  function handleSelectNode(node) {
    setSelectedNode(node);
    setLevel(3);
  }

  function handleBackToLevel1() {
    setSelectedMaster(null);
    setSelectedNode(null);
    setLevel(1);
  }

  function handleBackToLevel2() {
    setSelectedNode(null);
    setLevel(2);
  }

  return (
    <>
      <style>{MOBILE_STYLES}</style>

      {level === 1 && (
        <Level1View
          masterNodes={masterNodes}
          onSelectMaster={handleSelectMaster}
        />
      )}

      {level === 2 && selectedMaster && (
        <Level2View
          masterNode={selectedMaster}
          onSelectNode={handleSelectNode}
          onBack={handleBackToLevel1}
        />
      )}

      {level === 3 && selectedNode && (
        <Level3Panel
          node={selectedNode}
          onClose={handleBackToLevel1}
          onBack={handleBackToLevel2}
        />
      )}
    </>
  );
}
