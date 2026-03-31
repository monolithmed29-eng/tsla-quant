import { calcPriceImpact } from './priceModel';
import { catalysts } from './data';

function getLuminescenceColor(likelihood) {
  if (likelihood >= 0.9) return 'rgba(255,255,255,1.0)';
  if (likelihood >= 0.7) return 'rgba(220,235,255,0.95)';
  if (likelihood >= 0.5) return 'rgba(180,200,230,0.85)';
  if (likelihood >= 0.3) return 'rgba(130,150,190,0.70)';
  return 'rgba(80,100,140,0.55)';
}

const CATEGORY_LABELS = {
  autonomy: 'Autonomy',
  robotics: 'Robotics / AI',
  financials: 'Financials',
  product: 'Product',
  manufacturing: 'Manufacturing',
  energy: 'Energy',
  corporate: 'Corporate',
};

export default function Panel({ node, onClose }) {
  if (!node) return null;

  const statusColor = getLuminescenceColor(node.likelihood);
  const catColor = 'rgba(160,185,220,0.85)';
  const priceImpact = calcPriceImpact(node, catalysts);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '340px',
      height: '100vh',
      background: 'rgba(0,0,0,0.95)',
      borderLeft: `1px solid ${statusColor}33`,
      padding: '24px 20px',
      zIndex: 1000,
      fontFamily: "'Space Grotesk', sans-serif",
      color: '#fff',
      overflowY: 'auto',
      boxShadow: `-8px 0 40px ${statusColor}22`,
    }}>
      {/* Close */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 16, right: 16,
          background: 'none', border: 'none',
          color: '#666', cursor: 'pointer', fontSize: '18px',
          fontFamily: "'Space Grotesk', sans-serif",
        }}
      >✕</button>

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
          background: catColor, display: 'inline-block',
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

      {/* Description */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
          <div style={{ fontSize: '10px', color: '#666', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Analysis</div>
          {node.updated && (
            <div style={{ fontSize: '9px', color: '#333', letterSpacing: '1px' }}>Updated {node.updated}</div>
          )}
        </div>
        {Array.isArray(node.description) ? (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {node.description.map((point, i) => (
              <li key={i} style={{
                display: 'flex', gap: '8px',
                fontSize: '12px', color: '#aaa', lineHeight: 1.6,
                marginBottom: '5px', alignItems: 'flex-start',
              }}>
                <span style={{ color: '#333', marginTop: '1px', flexShrink: 0 }}>·</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ fontSize: '13px', color: '#aaa', lineHeight: 1.6, margin: 0 }}>{node.description}</p>
        )}
      </div>

      {/* Price Impact */}
      <div style={{
        padding: '14px',
        background: '#0a0a0a',
        border: '1px solid #1a1a1a',
      }}>
        <div style={{ fontSize: '10px', color: '#666', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Price Impact</div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#00ff88' }}>
          +${priceImpact.toFixed(1)}
        </div>
        <div style={{ fontSize: '11px', color: '#555', marginTop: '4px' }}>
          Weight: {(node.weight * 100).toFixed(0)}% · Contribution to model price
        </div>
      </div>
    </div>
  );
}
