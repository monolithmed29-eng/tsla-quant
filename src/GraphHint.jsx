import { useState, useEffect } from 'react';

export default function GraphHint({ dismissed }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (dismissed) setVisible(false);
  }, [dismissed]);

  if (!visible) return null;

  return (
    <div
      onClick={() => setVisible(false)}
      style={{
        position: 'fixed',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 90,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
        animation: 'hintFade 0.8s ease',
        fontFamily: "'Space Grotesk', sans-serif",
      }}
    >
      <style>{`
        @keyframes hintFade {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes hintBob {
          0%,100% { transform: translateY(0); }
          50%     { transform: translateY(-4px); }
        }
      `}</style>

      <div style={{
        display: 'flex',
        gap: '32px',
        alignItems: 'flex-start',
      }}>
        {/* Hint 1 */}
        <div style={{
          background: 'rgba(5,5,5,0.88)',
          border: '1px solid #1a1a1a',
          padding: '12px 16px',
          maxWidth: '180px',
          textAlign: 'center',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ fontSize: '18px', marginBottom: '6px', animation: 'hintBob 2s ease-in-out infinite' }}>⬡</div>
          <div style={{ fontSize: '9px', letterSpacing: '2px', color: '#00ff88', textTransform: 'uppercase', marginBottom: '4px' }}>Full Network</div>
          <div style={{ fontSize: '11px', color: '#666', lineHeight: 1.5 }}>
            Click <span style={{ color: '#00ff88' }}>Full Network</span> to explode all 34 catalyst nodes
          </div>
        </div>

        {/* Hint 2 */}
        <div style={{
          background: 'rgba(5,5,5,0.88)',
          border: '1px solid #1a1a1a',
          padding: '12px 16px',
          maxWidth: '180px',
          textAlign: 'center',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ fontSize: '18px', marginBottom: '6px', animation: 'hintBob 2s ease-in-out infinite 0.3s' }}>◉</div>
          <div style={{ fontSize: '9px', letterSpacing: '2px', color: '#aaa', textTransform: 'uppercase', marginBottom: '4px' }}>Click Any Node</div>
          <div style={{ fontSize: '11px', color: '#666', lineHeight: 1.5 }}>
            Click any orb to open its <span style={{ color: '#aaa' }}>deep-dive analysis</span>
          </div>
        </div>

        {/* Hint 3 */}
        <div style={{
          background: 'rgba(5,5,5,0.88)',
          border: '1px solid #1a1a1a',
          padding: '12px 16px',
          maxWidth: '180px',
          textAlign: 'center',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ fontSize: '18px', marginBottom: '6px', animation: 'hintBob 2s ease-in-out infinite 0.6s' }}>🔗</div>
          <div style={{ fontSize: '9px', letterSpacing: '2px', color: '#aaa', textTransform: 'uppercase', marginBottom: '4px' }}>Connections</div>
          <div style={{ fontSize: '11px', color: '#666', lineHeight: 1.5 }}>
            Lines show <span style={{ color: '#aaa' }}>dependencies</span> — follow particles to trace catalyst chains
          </div>
        </div>
      </div>

      <div style={{ fontSize: '9px', color: '#333', letterSpacing: '2px', textTransform: 'uppercase', marginTop: '4px' }}>
        click any node to dismiss
      </div>
    </div>
  );
}
