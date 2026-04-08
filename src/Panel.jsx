import { useState } from 'react';
import { calcPriceImpact } from './priceModel';
import { catalysts } from './data';
import { isPro } from './creditManager';
import UpgradeModal from './UpgradeModal';

function getLuminescenceColor(likelihood) {
  if (likelihood >= 0.9) return 'rgba(255,255,255,1.0)';
  if (likelihood >= 0.7) return 'rgba(220,235,255,0.95)';
  if (likelihood >= 0.5) return 'rgba(180,200,230,0.85)';
  if (likelihood >= 0.3) return 'rgba(130,150,190,0.70)';
  return 'rgba(80,100,140,0.55)';
}

const CATEGORY_COLORS = {
  autonomy:      'hsl(210,100%,60%)',
  robotics:      'hsl(200,30%,65%)',
  financials:    'hsl(142,70%,55%)',
  product:       'hsl(270,80%,70%)',
  manufacturing: 'hsl(35,90%,60%)',
  energy:        'hsl(15,100%,60%)',
  corporate:     'hsl(55,80%,60%)',
  spacex:        'hsl(270,60%,60%)',
};

const CATEGORY_LABELS = {
  autonomy:      'Autonomy',
  robotics:      'Robotics / AI',
  financials:    'Financials',
  product:       'Product',
  manufacturing: 'Manufacturing',
  energy:        'Energy',
  corporate:     'Corporate',
  spacex:        'SpaceX Synergy',
};

const blurAnim = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes softPulse {
    0%,100% { opacity: 0.7; }
    50%      { opacity: 1; }
  }
`;

export default function Panel({ node, onClose, isMobile = false }) {
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (!node) return null;

  const pro = isPro();
  const statusColor = getLuminescenceColor(node.likelihood);
  const catColor = 'rgba(160,185,220,0.85)';
  const priceImpact = calcPriceImpact(node, catalysts);

  return (
    <>
      <style>{blurAnim}</style>
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: isMobile ? '100vw' : '340px',
        height: '100vh',
        background: 'rgba(0,0,0,0.97)',
        borderLeft: isMobile ? 'none' : `1px solid ${statusColor}33`,
        borderTop: isMobile ? `1px solid ${statusColor}33` : 'none',
        padding: isMobile ? '56px 16px 24px' : '24px 20px',
        zIndex: 1000,
        fontFamily: "'Space Grotesk', sans-serif",
        color: '#fff',
        overflowY: 'auto',
        boxShadow: isMobile ? 'none' : `-8px 0 40px ${statusColor}22`,
      }}>
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: isMobile ? 12 : 16, right: 16,
            background: isMobile ? 'rgba(255,255,255,0.08)' : 'none',
            border: isMobile ? '1px solid #333' : 'none',
            color: '#aaa', cursor: 'pointer',
            fontSize: isMobile ? '14px' : '18px',
            fontFamily: "'Space Grotesk', sans-serif",
            padding: isMobile ? '6px 12px' : '0',
            display: 'flex', alignItems: 'center', gap: '4px',
          }}
        >{isMobile ? '✕ Close' : '✕'}</button>

        {/* Status badge */}
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
        }}>
          {node.status.replace('_', ' ')}
        </div>

        {/* Title */}
        <h2 style={{
          fontSize: '18px',
          fontWeight: 700,
          lineHeight: 1.3,
          marginBottom: '8px',
          letterSpacing: '-0.3px',
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
          color: catColor,
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
        }}>
          <span style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: CATEGORY_COLORS[node.category] || catColor,
            boxShadow: `0 0 8px 3px ${CATEGORY_COLORS[node.category] || catColor}, 0 0 16px 4px ${CATEGORY_COLORS[node.category] || catColor}`,
            display: 'inline-block', flexShrink: 0,
          }} />
          {CATEGORY_LABELS[node.category] || node.category}
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: '#222', marginBottom: '20px' }} />

        {/* Expected */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '10px', color: '#666', letterSpacing: '1.5px', marginBottom: '4px', textTransform: 'uppercase' }}>Expected</div>
          <div style={{ fontSize: '14px', color: '#ccc' }}>{node.expected}</div>
        </div>

        {/* Likelihood */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontSize: '10px', color: '#666', letterSpacing: '1.5px', textTransform: 'uppercase',
            marginBottom: '8px',
          }}>
            <span>Likelihood</span>
            <span style={{ color: statusColor, fontSize: '16px', fontWeight: 700 }}>
              {Math.round(node.likelihood * 100)}%
            </span>
          </div>
          <div style={{
            height: '4px', background: '#111',
            position: 'relative', overflow: 'hidden',
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

        {/* Avg Weight */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '10px', color: '#666', letterSpacing: '1.5px', marginBottom: '4px', textTransform: 'uppercase' }}>Avg Weight</div>
          <div style={{ fontSize: '14px', color: '#aaa' }}>{(node.weight * 100).toFixed(0)}% toward model price</div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
            <div style={{ fontSize: '10px', color: '#666', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Analysis</div>
            {node.updated && (
              <div style={{ fontSize: '9px', color: '#666', letterSpacing: '1px' }}>Updated {node.updated}</div>
            )}
          </div>
          {Array.isArray(node.description) ? (
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {node.description.map((point, i) => {
                const isNew = i === 0 && node.updated && (() => {
                  const d = new Date(node.updated), t = new Date();
                  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
                })();
                return (
                  <li key={i} style={{
                    display: 'flex', gap: '8px',
                    fontSize: '12px', lineHeight: 1.6,
                    marginBottom: isNew ? '8px' : '5px',
                    alignItems: 'flex-start',
                    ...(isNew ? {
                      background: 'rgba(255,50,50,0.07)',
                      border: '1px solid rgba(255,50,50,0.18)',
                      borderRadius: '3px',
                      padding: '5px 8px',
                      color: '#fff',
                    } : { color: '#aaa' }),
                  }}>
                    <span style={{ color: isNew ? '#ff4444' : '#333', marginTop: '1px', flexShrink: 0 }}>{isNew ? '●' : '·'}</span>
                    <span>{point}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p style={{ fontSize: '13px', color: '#aaa', lineHeight: 1.6, margin: 0 }}>{node.description}</p>
          )}
        </div>

        {/* Price Impact — gated for non-pro */}
        <div style={{
          padding: '14px',
          background: '#0a0a0a',
          border: '1px solid #1a1a1a',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ fontSize: '10px', color: '#666', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
            Price Contribution
          </div>

          {pro ? (
            // Unlocked — show exact price impact
            <>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#00ff88' }}>
                +${priceImpact.toFixed(1)}
              </div>
              <div style={{ fontSize: '11px', color: '#555', marginTop: '4px' }}>
                Estimated impact on model price · Weight: {(node.weight * 100).toFixed(0)}%
              </div>
            </>
          ) : (
            // Gated — blurred with upgrade prompt
            <div style={{ position: 'relative' }}>
              {/* Blurred value */}
              <div style={{
                filter: 'blur(6px)',
                userSelect: 'none',
                pointerEvents: 'none',
                fontSize: '24px',
                fontWeight: 700,
                color: '#00ff88',
              }}>
                +${priceImpact.toFixed(1)}
              </div>
              <div style={{
                filter: 'blur(4px)',
                userSelect: 'none',
                pointerEvents: 'none',
                fontSize: '11px',
                color: '#555',
                marginTop: '4px',
              }}>
                Estimated impact on model price · Weight: {(node.weight * 100).toFixed(0)}%
              </div>

              {/* Overlay prompt */}
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '6px',
                animation: 'fadeInUp 0.3s ease',
              }}>
                <button
                  onClick={() => setShowUpgrade(true)}
                  style={{
                    background: 'rgba(0,0,0,0.85)',
                    border: '1px solid #e5393566',
                    color: '#e53935',
                    fontSize: '9px',
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    padding: '6px 14px',
                    cursor: 'pointer',
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                    animation: 'softPulse 2s ease-in-out infinite',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#e5393522';
                    e.currentTarget.style.borderColor = '#e53935';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(0,0,0,0.85)';
                    e.currentTarget.style.borderColor = '#e5393566';
                  }}
                >
                  🔒 View Exact Impact
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showUpgrade && (
        <UpgradeModal reason="price_contribution" onClose={() => setShowUpgrade(false)} />
      )}
    </>
  );
}
