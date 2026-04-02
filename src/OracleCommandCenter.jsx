import { useState, useRef, useEffect } from 'react';
import OracleSearch from './OracleSearch';

const pulseAnim = `
  @keyframes oraclePulseTab {
    0%,100% { box-shadow: 0 0 8px 3px rgba(229,57,53,0.9), 0 0 20px 8px rgba(229,57,53,0.5), 0 0 40px 16px rgba(229,57,53,0.2); }
    50%     { box-shadow: 0 0 16px 6px rgba(255,50,50,1.0), 0 0 36px 14px rgba(229,57,53,0.7), 0 0 60px 24px rgba(229,57,53,0.35); }
  }
`;

export default function OracleCommandCenter() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', fontFamily: "'Space Grotesk', sans-serif" }}>
      <style>{pulseAnim}</style>

      {/* Header button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: open ? 'rgba(229,57,53,0.12)' : 'transparent',
          border: `1px solid ${open ? '#e53935' : '#3a1a1a'}`,
          color: '#ff3333',
          fontSize: '10px',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          padding: '5px 14px',
          cursor: 'pointer',
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.2s ease',
          boxShadow: open ? '0 0 12px rgba(229,57,53,0.3)' : 'none',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = '#e53935';
          e.currentTarget.style.background = 'rgba(229,57,53,0.1)';
        }}
        onMouseLeave={e => {
          if (!open) {
            e.currentTarget.style.borderColor = '#3a1a1a';
            e.currentTarget.style.background = 'transparent';
          }
        }}
      >
        <span style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: '#ff1a1a',
          display: 'inline-block',
          flexShrink: 0,
          animation: 'oraclePulseTab 1.6s infinite',
        }} />
        Command Center
      </button>

      {/* Dropdown panel — opens downward from header */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          width: '780px',
          maxWidth: '90vw',
          background: 'rgba(2,2,2,1.0)',
          border: '1px solid #2a2a2a',
          borderTop: '2px solid #e53935',
          padding: '24px 28px 20px',
          zIndex: 500,
          backdropFilter: 'blur(16px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 40px rgba(229,57,53,0.08)',
          animation: 'fadeInDown 0.2s ease',
        }}>
          <style>{`@keyframes fadeInDown { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }`}</style>
          <OracleSearch />
        </div>
      )}
    </div>
  );
}
