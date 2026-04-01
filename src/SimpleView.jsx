import { useEffect, useRef, useState } from 'react';

// Master category definitions
export const MASTER_NODES = [
  {
    id: 'autonomy',
    label: 'Autonomy',
    sublabel: 'FSD · Robotaxi · Cybercab',
    icon: '🚗',
    color: '#38bdf8',
    glow: 'rgba(56,189,248,0.6)',
    angle: -90,   // top
  },
  {
    id: 'robotics',
    label: 'Robotics / AI',
    sublabel: 'Optimus · Cortex · Terafab',
    icon: '🤖',
    color: '#34d399',
    glow: 'rgba(52,211,153,0.6)',
    angle: -30,
  },
  {
    id: 'financials',
    label: 'Financials',
    sublabel: 'Earnings · Margins · Buyback',
    icon: '📈',
    color: '#00ff88',
    glow: 'rgba(0,255,136,0.6)',
    angle: 30,
  },
  {
    id: 'energy',
    label: 'Energy',
    sublabel: 'Megapack · Powerwall · VPP',
    icon: '⚡',
    color: '#fb923c',
    glow: 'rgba(251,146,60,0.6)',
    angle: 90,  // bottom
  },
  {
    id: 'product',
    label: 'Product',
    sublabel: 'Model Y · Semi · Roadster',
    icon: '🔧',
    color: '#a78bfa',
    glow: 'rgba(167,139,250,0.6)',
    angle: 150,
  },
  {
    id: 'corporate',
    label: 'Corporate',
    sublabel: 'Brand · Elon Focus · Strategy',
    icon: '🏢',
    color: '#f472b6',
    glow: 'rgba(244,114,182,0.6)',
    angle: -150,
  },
  {
    id: 'manufacturing',
    label: 'Manufacturing',
    sublabel: '4680 · Unboxed · Giga Mexico',
    icon: '🏭',
    color: '#fbbf24',
    glow: 'rgba(251,191,36,0.6)',
    angle: 210,
  },
];

const glowCSS = `
  @keyframes orbitSpin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes orbitSpinRev {
    from { transform: rotate(0deg); }
    to   { transform: rotate(-360deg); }
  }
  @keyframes nodePulse {
    0%, 100% { transform: scale(1); filter: brightness(1); }
    50%       { transform: scale(1.07); filter: brightness(1.3); }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(18px) scale(0.92); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes lineGrow {
    from { stroke-dashoffset: 400; opacity: 0; }
    to   { stroke-dashoffset: 0; opacity: 1; }
  }
  @keyframes centerPulse {
    0%, 100% { transform: translate(-50%,-50%) scale(1);   opacity: 0.9; }
    50%       { transform: translate(-50%,-50%) scale(1.08); opacity: 1; }
  }
  @keyframes dotTravel {
    0%   { offset-distance: 0%;   opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 1; }
    100% { offset-distance: 100%; opacity: 0; }
  }
  .master-node {
    animation: fadeInUp 0.5s ease both;
    cursor: pointer;
    transition: transform 0.2s ease, filter 0.2s ease;
  }
  .master-node:hover {
    transform: scale(1.12) !important;
    filter: brightness(1.4);
  }
  .center-tsla {
    animation: centerPulse 3s ease-in-out infinite;
    position: absolute;
    left: 50%; top: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
  }
`;

export default function SimpleView({ catalysts, predicted, onCategoryClick }) {
  const [hovered, setHovered] = useState(null);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ w: 800, h: 600 });

  useEffect(() => {
    setMounted(true);
    const obs = new ResizeObserver(entries => {
      for (const e of entries) {
        setDims({ w: e.contentRect.width, h: e.contentRect.height });
      }
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Category → avg likelihood
  const catStats = {};
  for (const cat of MASTER_NODES) {
    const nodes = catalysts.filter(c => c.category === cat.id);
    if (nodes.length) {
      const avg = nodes.reduce((s, c) => s + c.likelihood, 0) / nodes.length;
      const count = nodes.length;
      catStats[cat.id] = { avg, count };
    } else {
      catStats[cat.id] = { avg: 0.5, count: 0 };
    }
  }

  const cx = dims.w / 2;
  const cy = dims.h / 2;
  const radius = Math.min(dims.w, dims.h) * 0.33;
  const nodeR = Math.min(72, Math.max(48, radius * 0.19));

  const positions = MASTER_NODES.map(node => {
    const rad = (node.angle * Math.PI) / 180;
    return {
      ...node,
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  });

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: 'transparent',
      }}
    >
      <style>{glowCSS}</style>

      {/* SVG layer — lines + orbit rings */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}
      >
        {/* Outer orbit ring */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth="1"
          strokeDasharray="4 8"
        />
        {/* Inner orbit ring */}
        <circle
          cx={cx} cy={cy} r={radius * 0.55}
          fill="none"
          stroke="rgba(255,255,255,0.03)"
          strokeWidth="1"
          strokeDasharray="2 12"
        />

        {/* Connection lines from center to each node */}
        {mounted && positions.map((node, i) => {
          const isHov = hovered === node.id;
          const stat = catStats[node.id];
          return (
            <g key={node.id}>
              <line
                x1={cx} y1={cy}
                x2={node.x} y2={node.y}
                stroke={isHov ? node.color : 'rgba(255,255,255,0.08)'}
                strokeWidth={isHov ? 2 : 1}
                strokeDasharray={isHov ? 'none' : '4 6'}
                style={{
                  transition: 'stroke 0.3s, stroke-width 0.3s',
                  filter: isHov ? `drop-shadow(0 0 6px ${node.color})` : 'none',
                }}
              />
              {/* Traveling dot on hover */}
              {isHov && (
                <circle r="3" fill={node.color} opacity="0.9">
                  <animateMotion
                    dur="1.2s"
                    repeatCount="indefinite"
                    path={`M ${cx} ${cy} L ${node.x} ${node.y}`}
                  />
                </circle>
              )}
            </g>
          );
        })}

        {/* Cross-connect lines between adjacent nodes */}
        {mounted && positions.map((node, i) => {
          const next = positions[(i + 1) % positions.length];
          return (
            <line
              key={`cross-${i}`}
              x1={node.x} y1={node.y}
              x2={next.x} y2={next.y}
              stroke="rgba(255,255,255,0.03)"
              strokeWidth="1"
            />
          );
        })}
      </svg>

      {/* Center TSLA node */}
      <div className="center-tsla" style={{ zIndex: 10 }}>
        <div style={{
          width: nodeR * 1.5,
          height: nodeR * 1.5,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,255,136,0.25) 0%, rgba(0,255,136,0.05) 60%, transparent 100%)',
          border: '1px solid rgba(0,255,136,0.3)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 40px rgba(0,255,136,0.2), 0 0 80px rgba(0,255,136,0.08)',
        }}>
          <div style={{ fontSize: '10px', letterSpacing: '3px', color: '#00ff88', textTransform: 'uppercase', marginBottom: '2px' }}>TSLA</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#00ff88', letterSpacing: '-0.5px', lineHeight: 1 }}>
            ${predicted ?? '—'}
          </div>
          <div style={{ fontSize: '8px', color: 'rgba(0,255,136,0.5)', letterSpacing: '1.5px', marginTop: '3px', textTransform: 'uppercase' }}>Quant</div>
        </div>
      </div>

      {/* Master nodes */}
      {mounted && positions.map((node, i) => {
        const stat = catStats[node.id] || { avg: 0.5, count: 0 };
        const pct = Math.round(stat.avg * 100);
        const isHov = hovered === node.id;

        return (
          <div
            key={node.id}
            className="master-node"
            style={{
              position: 'absolute',
              left: node.x,
              top: node.y,
              transform: 'translate(-50%, -50%)',
              animationDelay: `${i * 0.07}s`,
              zIndex: 20,
            }}
            onMouseEnter={() => setHovered(node.id)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onCategoryClick(node.id)}
          >
            {/* Outer glow ring — pulsing */}
            <div style={{
              position: 'absolute',
              inset: -(nodeR * 0.55),
              borderRadius: '50%',
              background: `radial-gradient(circle, ${node.glow.replace('0.6', '0.12')} 0%, transparent 70%)`,
              animation: isHov ? 'nodePulse 1.2s ease-in-out infinite' : 'nodePulse 3s ease-in-out infinite',
              pointerEvents: 'none',
            }} />

            {/* Orbit ring */}
            <div style={{
              position: 'absolute',
              inset: -(nodeR * 0.3),
              borderRadius: '50%',
              border: `1px solid ${node.color}33`,
              animation: `orbitSpin ${isHov ? 3 : 8}s linear infinite`,
              pointerEvents: 'none',
            }}>
              {/* Orbit dot */}
              <div style={{
                position: 'absolute',
                top: '0%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: node.color,
                boxShadow: `0 0 8px 3px ${node.color}`,
              }} />
            </div>

            {/* Inner counter-orbit */}
            <div style={{
              position: 'absolute',
              inset: -(nodeR * 0.1),
              borderRadius: '50%',
              border: `1px solid ${node.color}22`,
              animation: `orbitSpinRev ${isHov ? 2 : 5}s linear infinite`,
              pointerEvents: 'none',
            }} />

            {/* Main circle */}
            <div style={{
              width: nodeR * 2,
              height: nodeR * 2,
              borderRadius: '50%',
              background: `radial-gradient(circle at 35% 35%, ${node.color}44 0%, ${node.color}11 50%, transparent 100%)`,
              border: `1.5px solid ${node.color}88`,
              boxShadow: isHov
                ? `0 0 30px 10px ${node.glow}, 0 0 60px 20px ${node.glow.replace('0.6', '0.2')}`
                : `0 0 16px 4px ${node.glow.replace('0.6', '0.25')}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              transition: 'box-shadow 0.3s ease',
              position: 'relative',
              zIndex: 2,
            }}>
              <div style={{ fontSize: nodeR * 0.55 }}>{node.icon}</div>
              <div style={{
                fontSize: '10px', fontWeight: 700, color: '#fff',
                letterSpacing: '0.5px', textAlign: 'center',
                fontFamily: "'Space Grotesk', sans-serif",
                lineHeight: 1.2,
                textShadow: `0 0 12px ${node.color}`,
              }}>{node.label}</div>
              <div style={{
                fontSize: '10px', fontWeight: 700,
                color: node.color,
                fontFamily: "'Space Grotesk', sans-serif",
              }}>{pct}%</div>
            </div>

            {/* Hover tooltip */}
            {isHov && (
              <div style={{
                position: 'absolute',
                top: '110%',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.92)',
                border: `1px solid ${node.color}55`,
                padding: '8px 14px',
                whiteSpace: 'nowrap',
                zIndex: 100,
                fontFamily: "'Space Grotesk', sans-serif",
                boxShadow: `0 0 20px ${node.glow.replace('0.6', '0.3')}`,
                animation: 'fadeInUp 0.15s ease both',
                pointerEvents: 'none',
              }}>
                <div style={{ fontSize: '10px', color: node.color, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>
                  {node.sublabel}
                </div>
                <div style={{ fontSize: '11px', color: '#aaa' }}>
                  {stat.count} catalysts · {pct}% avg confidence
                </div>
                <div style={{ fontSize: '10px', color: '#555', marginTop: '4px' }}>
                  Click to explore →
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Bottom hint */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '10px',
        color: '#333',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        fontFamily: "'Space Grotesk', sans-serif",
        pointerEvents: 'none',
      }}>
        Click any node to explore · Toggle Full Network above
      </div>
    </div>
  );
}


