import { useState } from 'react';
import OracleSearch from './OracleSearch';

const pulseAnim = `
  @keyframes oraclePulseTab {
    0%,100% { box-shadow: 0 0 6px 2px rgba(229,57,53,0.4); }
    50%     { box-shadow: 0 0 12px 4px rgba(229,57,53,0.7); }
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
        background: 'rgba(5,5,5,0.97)',
        border: open ? '1px solid #1e1e1e' : 'none',
        borderBottom: 'none',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ padding: '24px 28px 20px' }}>
          <OracleSearch />
        </div>
      </div>

      {/* Collapsed tab — always visible */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'rgba(8,8,8,0.97)',
          border: '1px solid #1e1e1e',
          borderBottom: 'none',
          padding: '8px 20px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backdropFilter: 'blur(8px)',
          userSelect: 'none',
          transition: 'border-color 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = '#e5393544'}
        onMouseLeave={e => e.currentTarget.style.borderColor = '#1e1e1e'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: '#e53935',
            display: 'inline-block',
            animation: 'oraclePulseTab 2s infinite',
          }} />
          <span style={{
            fontSize: '9px',
            letterSpacing: '3px',
            color: '#e53935',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}>
            Command Center
          </span>
          <span style={{ fontSize: '10px', color: '#444', letterSpacing: '1px' }}>
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
