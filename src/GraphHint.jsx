import { useState, useEffect } from 'react';

export default function GraphHint({ dismissed }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (dismissed) setVisible(false);
  }, [dismissed]);

  if (!visible) return null;

  return (
    <div style={{
        position: 'fixed',
        top: '50%',
        left: '20px',
        transform: 'translateY(-50%)',
        zIndex: 90,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        animation: 'hintFade 0.8s ease',
        fontFamily: "'Space Grotesk', sans-serif",
      }}
    >
      <style>{`
        @keyframes hintFade {
          from { opacity: 0; transform: translateY(calc(-50% + 8px)); }
          to   { opacity: 1; transform: translateY(-50%); }
        }
        @keyframes hintBob {
          0%,100% { transform: translateY(0); }
          50%     { transform: translateY(-3px); }
        }
      `}</style>

        {/* Hint 1 */}
        <div style={{
          background: 'rgba(5,5,5,0.92)',
          border: '1px solid #1a1a1a',
          padding: '12px 14px',
          width: '160px',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ fontSize: '16px', marginBottom: '6px', animation: 'hintBob 2s ease-in-out infinite' }}>⬡</div>
          <div style={{ fontSize: '9px', letterSpacing: '2px', color: '#00ff88', textTransform: 'uppercase', marginBottom: '4px' }}>Full Network</div>
          <div style={{ fontSize: '11px', color: '#666', lineHeight: 1.5 }}>
            Click <span style={{ color: '#00ff88' }}>Full Network</span> to explode all 34 catalyst nodes
          </div>
        </div>

        {/* Hint 2 */}
        <div style={{
          background: 'rgba(5,5,5,0.92)',
          border: '1px solid #1a1a1a',
          padding: '12px 14px',
          width: '160px',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ fontSize: '16px', marginBottom: '6px', animation: 'hintBob 2s ease-in-out infinite 0.3s' }}>◉</div>
          <div style={{ fontSize: '9px', letterSpacing: '2px', color: '#aaa', textTransform: 'uppercase', marginBottom: '4px' }}>Click Any Node</div>
          <div style={{ fontSize: '11px', color: '#666', lineHeight: 1.5 }}>
            Click any orb to open its <span style={{ color: '#aaa' }}>deep-dive analysis</span>
          </div>
        </div>

        {/* Hint 3 */}
        <div style={{
          background: 'rgba(5,5,5,0.92)',
          border: '1px solid #1a1a1a',
          padding: '12px 14px',
          width: '160px',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ fontSize: '16px', marginBottom: '6px', animation: 'hintBob 2s ease-in-out infinite 0.6s' }}>🔗</div>
          <div style={{ fontSize: '9px', letterSpacing: '2px', color: '#aaa', textTransform: 'uppercase', marginBottom: '4px' }}>Connections</div>
          <div style={{ fontSize: '11px', color: '#666', lineHeight: 1.5 }}>
            Lines show <span style={{ color: '#aaa' }}>dependencies</span> between catalysts
          </div>
        </div>

      <div style={{ fontSize: '9px', color: '#333', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
        click any node to dismiss
      </div>
    </div>
  );
}
