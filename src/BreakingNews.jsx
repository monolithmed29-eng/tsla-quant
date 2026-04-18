import { useState, useRef, useEffect } from 'react';
import { useRemoteData } from './useRemoteData';
import { breakingNews as fallbackNews } from './newsData';

const glowStyle = `
  @keyframes redPulse {
    0%   { box-shadow: 0 0 6px 3px #ff3333, 0 0 14px 6px #ff333388; }
    50%  { box-shadow: 0 0 16px 8px #ff3333, 0 0 32px 14px #ff3333aa; }
    100% { box-shadow: 0 0 6px 3px #ff3333, 0 0 14px 6px #ff333388; }
  }
  .red-orb {
    animation: redPulse 1.4s ease-in-out infinite;
  }
`;

const CATEGORY_COLORS = {
  autonomy:      'hsl(210,100%,60%)',
  robotics:      'hsl(200,30%,65%)',
  financials:    'hsl(142,70%,55%)',
  product:       'hsl(270,80%,70%)',
  manufacturing: 'hsl(35,90%,60%)',
  energy:        'hsl(15,100%,60%)',
  corporate:     'hsl(55,80%,60%)',
};

const CATEGORY_LABELS = {
  autonomy:      'Autonomy',
  robotics:      'Robotics / AI',
  financials:    'Financials',
  product:       'Product',
  manufacturing: 'Manufacturing',
  energy:        'Energy',
  corporate:     'Corporate',
};

export default function BreakingNews({ isMobile = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { data: breakingNews } = useRemoteData('news.json', fallbackNews);

  // Outside-click to close on mobile
  useEffect(() => {
    if (!isMobile || !open) return;
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('touchstart', handleOutside);
    document.addEventListener('mousedown', handleOutside);
    return () => {
      document.removeEventListener('touchstart', handleOutside);
      document.removeEventListener('mousedown', handleOutside);
    };
  }, [isMobile, open]);

  const hovered = open;
  const interactionProps = isMobile
    ? { onClick: (e) => { e.stopPropagation(); setOpen(o => !o); } }
    : { onMouseEnter: () => setOpen(true), onMouseLeave: () => setOpen(false) };

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        ...(isMobile
          ? { bottom: '28px', top: 'auto', transform: 'none' }
          : { top: '50%', transform: 'translateY(-50%)' }
        ),
        zIndex: 300,
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'stretch',
      }}
      {...interactionProps}
    >
      <style>{glowStyle}</style>
      {/* Panel */}
      <div ref={ref} style={{
        width: hovered ? '340px' : '0px',
        overflow: 'hidden',
        transition: 'width 0.3s ease',
        background: 'rgba(5,5,5,0.97)',
        borderRight: '1px solid #1a1a1a',
        borderTop: '1px solid #1a1a1a',
        borderBottom: '1px solid #1a1a1a',
        backdropFilter: 'blur(8px)',
        maxHeight: '70vh',
        overflowY: hovered ? 'auto' : 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ padding: '20px', minWidth: '340px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span style={{
              width: '7px', height: '7px', borderRadius: '50%',
              background: '#ff3333',
              boxShadow: '0 0 6px 2px #ff3333',
              display: 'inline-block',
              animation: 'pulse 1.5s infinite',
            }} />
            <span style={{ fontSize: '10px', letterSpacing: '3px', color: '#fff', textTransform: 'uppercase', fontFamily: "'Space Grotesk', sans-serif" }}>
              Breaking News
            </span>
            {isMobile && (
              <button
                onClick={(e) => { e.stopPropagation(); setOpen(false); }}
                style={{
                  marginLeft: 'auto', background: 'none', border: 'none',
                  color: '#fff', fontSize: '18px', cursor: 'pointer',
                  padding: '0 4px', lineHeight: 1, fontWeight: 300,
                }}
              >✕</button>
            )}
          </div>

          {/* News items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {breakingNews.map((item, i) => {
              const color = CATEGORY_COLORS[item.category] || '#aaa';
              const label = CATEGORY_LABELS[item.category] || item.category;
              return (
                <div key={i} style={{
                  borderLeft: `2px solid ${color}33`,
                  paddingLeft: '12px',
                }}>
                  {/* Category + timestamp */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
                    <span style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      background: color,
                      boxShadow: `0 0 6px 2px ${color}`,
                      flexShrink: 0,
                      display: 'inline-block',
                    }} />
                    <span style={{ fontSize: '9px', color: color, letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: "'Space Grotesk', sans-serif" }}>
                      {label}
                    </span>
                    <span style={{ fontSize: '9px', color: '#666', marginLeft: 'auto', fontFamily: "'Space Grotesk', sans-serif" }}>
                      {item.timestamp}
                    </span>
                  </div>

                  {/* Headline */}
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '12px',
                        color: '#ddd',
                        lineHeight: 1.5,
                        textDecoration: 'none',
                        fontFamily: "'Space Grotesk', sans-serif",
                        display: 'block',
                      }}
                      onMouseEnter={e => e.target.style.color = '#fff'}
                      onMouseLeave={e => e.target.style.color = '#ddd'}
                    >
                      {item.headline}
                    </a>
                  ) : (
                    <p style={{
                      fontSize: '12px', color: '#ddd', lineHeight: 1.5,
                      margin: 0, fontFamily: "'Space Grotesk', sans-serif",
                    }}>
                      {item.headline}
                    </p>
                  )}

                  {/* Source */}
                  <div style={{ fontSize: '9px', color: '#555', marginTop: '4px', fontFamily: "'Space Grotesk', sans-serif" }}>
                    {item.source}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #111', fontSize: '9px', color: '#555', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '1px' }}>
            Updated 3× daily · Tesla IR + X
          </div>
        </div>
      </div>

      {/* Tab */}
      <div style={{
        background: 'rgba(5,5,5,0.95)',
        border: '1px solid #1a1a1a',
        borderLeft: 'none',
        padding: '16px 10px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        userSelect: 'none',
        minWidth: '28px',
      }}>
        {/* Orb — NOT rotated, sits on its own */}
        <span className="red-orb" style={{
          width: '9px', height: '9px', borderRadius: '50%',
          background: '#ff3333',
          display: 'block',
          flexShrink: 0,
        }} />
        {/* Rotated text */}
        <span style={{
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          fontSize: '9px', letterSpacing: '3px', color: '#aaa',
          textTransform: 'uppercase', fontFamily: "'Space Grotesk', sans-serif",
        }}>
          Breaking News
        </span>
      </div>
    </div>
  );
}
