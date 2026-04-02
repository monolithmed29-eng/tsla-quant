import { useState } from 'react';
import OracleSearch from './OracleSearch';

const pulseAnim = `
  @keyframes oraclePulseTab {
    0%,100% { box-shadow: 0 0 8px 3px rgba(229,57,53,0.9), 0 0 20px 8px rgba(229,57,53,0.5), 0 0 40px 16px rgba(229,57,53,0.2); }
    50%     { box-shadow: 0 0 16px 6px rgba(255,50,50,1.0), 0 0 36px 14px rgba(229,57,53,0.7), 0 0 60px 24px rgba(229,57,53,0.35); }
  }
`;

export default function OracleCommandCenter() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      position: 'fixed',
      bottom: '56px', // sits just above footer
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 150,
      width: 'calc(100% - 56px)',
      maxWidth: '800px',
      fontFamily: "'Space Grotesk', sans-serif",
    }}>
      <style>{pulseAnim}</style>

      {/* Expanded panel — slides up */}
      <div style={{
        overflow: 'hidden',
        maxHeight: open ? '600px' : '0px',
        transition: 'max-height 0.35s cubic-bezier(0.4,0,0.2,1)',
        background: 'rgba(2,2,2,1.0)',
        border: open ? '1px solid #2a2a2a' : 'none',
        borderBottom: 'none',
        backdropFilter: 'blur(16px)',
      }}>
        <div style={{ padding: '24px 28px 20px' }}>
          <OracleSearch />
        </div>
      </div>

      {/* Collapsed tab — always visible */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'rgba(2,2,2,1.0)',
          border: '1px solid #2a2a2a',
          borderBottom: 'none',
          padding: '8px 20px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backdropFilter: 'blur(16px)',
          userSelect: 'none',
          transition: 'border-color 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = '#e53935'}
        onMouseLeave={e => e.currentTarget.style.borderColor = '#2a2a2a'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            width: '10px', height: '10px', borderRadius: '50%',
            background: '#ff1a1a',
            display: 'inline-block',
            animation: 'oraclePulseTab 1.6s infinite',
            flexShrink: 0,
          }} />
          <span style={{
            fontSize: '9px',
            letterSpacing: '3px',
            color: '#ff3333',
            textTransform: 'uppercase',
            fontWeight: 700,
          }}>
            Command Center
          </span>
          <span style={{ fontSize: '10px', color: '#888', letterSpacing: '1px' }}>
            · Ask the Agent
          </span>
        </div>
        <span style={{
          fontSize: '10px',
          color: '#555',
          transition: 'transform 0.3s',
          display: 'inline-block',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        }}>▲</span>
      </div>
    </div>
  );
}
