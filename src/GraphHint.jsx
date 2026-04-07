import { useState, useEffect } from 'react';

export default function GraphHint({ dismissed }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (dismissed) setVisible(false);
  }, [dismissed]);

  if (!visible) return null;

  const code = `/* Apply this to your node class */
.node-orb {
  transition: transform 0.2s ease-in-out;
  cursor: crosshair; /* The Target Cursor */
}

.node-orb:hover {
  /* Scale up slightly to show it's "Active"
  without changing your brightness/glow logic */
  transform: scale(1.1);
}

/* Optional: Make the label brighter on target */
.node-container:hover .node-label {
  color: #ffffff !important;
  text-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
}`;

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '9vw',
      transform: 'translateY(-50%)',
      zIndex: 90,
      pointerEvents: 'none',
      animation: 'hintFade 0.8s ease',
      fontFamily: "'Space Mono', 'Courier New', monospace",
    }}>
      <style>{`
        @keyframes hintFade {
          from { opacity: 0; transform: translateY(calc(-50% + 8px)); }
          to   { opacity: 1; transform: translateY(-50%); }
        }
      `}</style>
      <pre style={{
        background: 'rgba(5,5,5,0.92)',
        border: '1px solid #1a1a1a',
        padding: '20px 24px',
        width: '300px',
        backdropFilter: 'blur(8px)',
        fontSize: '11px',
        lineHeight: 1.7,
        color: '#00ff88',
        margin: 0,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {code}
      </pre>
    </div>
  );
}
