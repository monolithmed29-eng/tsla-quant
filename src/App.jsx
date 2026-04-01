import { useState, useEffect, useRef } from 'react';
import Graph from './Graph';
import Panel from './Panel';
import { catalysts, links } from './data';
import { calcPredictedPrice, calcPriceBreakdown } from './priceModel';
import { useTSLAPrice } from './useTSLAPrice';

const PREDICTED = calcPredictedPrice(catalysts);
const BREAKDOWN = calcPriceBreakdown(catalysts);

// Starfield
function Starfield() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const stars = Array.from({ length: 180 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.2 + 0.2,
      a: Math.random(),
      speed: Math.random() * 0.008 + 0.002,
    }));
    let frame;
    function draw() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of stars) {
        s.a += s.speed;
        const alpha = 0.3 + 0.5 * Math.abs(Math.sin(s.a));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fill();
      }
      frame = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    />
  );
}

export default function App() {
  const [selected, setSelected] = useState(null);
  const [showAbout, setShowAbout] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const { price: tslaPrice, lastUpdated, marketOpen } = useTSLAPrice();

  const luminescenceLevels = [
    { label: 'Dim', color: 'rgba(80,100,140,0.55)', glow: 'rgba(70,90,130,0.4)' },
    { label: 'Low', color: 'rgba(130,150,190,0.70)', glow: 'rgba(120,140,180,0.5)' },
    { label: 'Medium', color: 'rgba(180,200,230,0.85)', glow: 'rgba(160,185,220,0.6)' },
    { label: 'Bright', color: 'rgba(220,235,255,0.95)', glow: 'rgba(200,220,255,0.7)' },
    { label: 'Very Bright', color: 'rgba(255,255,255,1.0)', glow: 'rgba(255,255,255,0.8)' },
  ];

  const formatTime = (d) => d ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <div style={{
      background: '#000',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      fontFamily: "'Space Grotesk', sans-serif",
      color: '#fff',
      position: 'relative',
    }}>
      <Starfield />

      {/* Affiliation bar */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 200,
        background: '#0d0d0d',
        borderBottom: '1px solid #1a1a1a',
        padding: '5px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
      }}>
        <span style={{ fontSize: '10px', color: '#444', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
          Independent TSLA Analysis Platform — Not affiliated with Tesla, Inc.
        </span>
        <span style={{ color: '#222', fontSize: '10px' }}>·</span>
        <button
          onClick={() => setShowDisclaimer(true)}
          style={{
            background: 'none', border: 'none', padding: 0,
            color: '#333', fontSize: '10px', letterSpacing: '1.5px',
            textTransform: 'uppercase', cursor: 'pointer',
            fontFamily: "'Space Grotesk', sans-serif",
            textDecoration: 'underline', textUnderlineOffset: '3px',
          }}
          onMouseEnter={e => e.target.style.color = '#666'}
          onMouseLeave={e => e.target.style.color = '#333'}
        >Disclaimer</button>
      </div>

      {/* Header */}
      <header style={{
        position: 'fixed',
        top: '27px', left: 0, right: 0,
        zIndex: 100,
        padding: '16px 28px',
        borderBottom: '1px solid #111',
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: '11px', letterSpacing: '4px', color: '#555', textTransform: 'uppercase', marginBottom: '2px' }}>
            CATALYST INTELLIGENCE · 2026
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '2px', color: '#fff' }}>
            TSLA_QUANT
          </div>
        </div>
        <div style={{
          display: 'flex', gap: '32px', alignItems: 'center',
          fontSize: '13px',
        }}>
          <button
            onClick={() => setShowHowTo(true)}
            style={{
              background: 'none',
              border: '1px solid #333',
              color: '#666',
              fontSize: '10px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              padding: '5px 12px',
              cursor: 'pointer',
              fontFamily: "'Space Grotesk', sans-serif",
              transition: 'border-color 0.2s, color 0.2s',
            }}
            onMouseEnter={e => { e.target.style.borderColor = '#555'; e.target.style.color = '#aaa'; }}
            onMouseLeave={e => { e.target.style.borderColor = '#333'; e.target.style.color = '#666'; }}
          >How to Use</button>
          <button
            onClick={() => setShowAbout(true)}
            style={{
              background: 'none',
              border: '1px solid #333',
              color: '#666',
              fontSize: '10px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              padding: '5px 12px',
              cursor: 'pointer',
              fontFamily: "'Space Grotesk', sans-serif",
              transition: 'border-color 0.2s, color 0.2s',
            }}
            onMouseEnter={e => { e.target.style.borderColor = '#555'; e.target.style.color = '#aaa'; }}
            onMouseLeave={e => { e.target.style.borderColor = '#333'; e.target.style.color = '#666'; }}
          >About</button>
          <div style={{ width: '1px', height: '32px', background: '#222' }} />
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#555', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '2px' }}>Quant Model</div>
            <div style={{ color: '#00ff88', fontWeight: 700, fontSize: '18px' }}>${PREDICTED.toFixed(0)}</div>
          </div>
          <div style={{ width: '1px', height: '32px', background: '#222' }} />
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#555', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '2px' }}>TSLA Live</div>
            <div style={{ color: marketOpen ? '#00aaff' : '#444', fontWeight: 700, fontSize: '18px' }}>
              {tslaPrice ? `$${tslaPrice.toFixed(2)}` : '—'}
            </div>
            <div style={{ color: '#555', fontSize: '9px', marginTop: '2px' }}>
              {marketOpen ? (lastUpdated ? formatTime(lastUpdated) : '—') : 'Market Closed'}
            </div>
          </div>
          <div style={{ width: '1px', height: '32px', background: '#222' }} />
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#555', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '2px' }}>Catalyst Data</div>
            <div style={{ color: '#666', fontWeight: 500, fontSize: '13px' }}>Daily</div>
            <div style={{ color: '#333', fontSize: '9px', marginTop: '2px' }}>Updated 10am ET</div>
          </div>
        </div>
      </header>

      {/* Graph canvas area — always full width, panel overlays on top */}
      <div style={{
        position: 'absolute',
        inset: 0,
        paddingTop: '99px',
        paddingBottom: '56px',
        zIndex: 1,
      }}>
        <Graph
          nodes={catalysts}
          links={links}
          onNodeClick={setSelected}
        />
      </div>

      {/* Detail Panel */}
      <Panel node={selected} onClose={() => setSelected(null)} />

      {/* How to Use Modal */}
      {showHowTo && (
        <div
          onClick={() => setShowHowTo(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 500,
            background: 'rgba(0,0,0,0.80)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#0a0a0a',
              border: '1px solid #1e1e1e',
              padding: '44px 48px',
              maxWidth: '560px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ fontSize: '9px', letterSpacing: '4px', color: '#333', textTransform: 'uppercase', marginBottom: '16px' }}>Guide</div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginBottom: '28px', letterSpacing: '-0.3px' }}>
              How to Use TSLA_QUANT
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {[
                {
                  icon: '⚪',
                  heading: 'Orb Brightness — Likelihood',
                  body: 'Each orb\'s brightness reflects the probability of that catalyst successfully occurring. A bright white orb means high confidence (90%+). A dim, dark orb means the outcome is uncertain or unlikely. The brighter the glow, the stronger the signal.',
                },
                {
                  icon: '🔵',
                  heading: 'Orb Size — Impact Score',
                  body: 'Larger orbs carry more weight in the quant price model. Size represents how much that catalyst contributes to Tesla\'s valuation if achieved. A large orb that\'s dim means high potential but low confidence — a key risk to watch.',
                },
                {
                  icon: '🖱️',
                  heading: 'Click Any Orb',
                  body: 'Click on any orb to open its detail panel. You\'ll see a full analysis with timestamped bullet points, likelihood score, expected timeline, and its estimated contribution to the model price target. Click a different orb at any time to switch — no need to close first.',
                },
                {
                  icon: '🔗',
                  heading: 'Connections — Dependencies',
                  body: 'The lines connecting orbs show causal relationships. If one catalyst depends on another to succeed, they are linked. Animated particles travel along these lines — follow them to understand how progress in one area accelerates another.',
                },
                {
                  icon: '💲',
                  heading: 'Quant Model Price',
                  body: 'The green price target in the header is a sum-of-parts valuation model. It is recalculated dynamically from the current likelihood scores of all 34 catalysts across 6 business units: Auto, Energy, Robotaxi, Optimus, FSD Software, and AI Infrastructure. Updated daily at 10am ET.',
                },
              ].map(({ icon, heading, body }) => (
                <div key={heading} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }}>{icon}</div>
                  <div>
                    <div style={{ fontSize: '11px', letterSpacing: '1.5px', color: '#888', textTransform: 'uppercase', marginBottom: '6px' }}>{heading}</div>
                    <p style={{ fontSize: '13px', color: '#666', lineHeight: '1.7', margin: 0 }}>{body}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowHowTo(false)}
              style={{
                marginTop: '36px',
                background: 'none',
                border: '1px solid #222',
                color: '#444',
                fontSize: '10px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                padding: '7px 18px',
                cursor: 'pointer',
                fontFamily: "'Space Grotesk', sans-serif",
              }}
              onMouseEnter={e => { e.target.style.borderColor = '#444'; e.target.style.color = '#888'; }}
              onMouseLeave={e => { e.target.style.borderColor = '#222'; e.target.style.color = '#444'; }}
            >Got It</button>
          </div>
        </div>
      )}

      {/* About Modal */}
      {showAbout && (
        <div
          onClick={() => setShowAbout(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 500,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#0a0a0a',
              border: '1px solid #222',
              padding: '40px 44px',
              maxWidth: '520px',
              width: '90%',
              position: 'relative',
            }}
          >
            <div style={{ fontSize: '9px', letterSpacing: '4px', color: '#444', textTransform: 'uppercase', marginBottom: '16px' }}>
              About
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '20px', letterSpacing: '2px' }}>
              TSLA_QUANT
            </div>
            <p style={{ fontSize: '14px', lineHeight: '1.75', color: '#aaa', margin: 0 }}>
              TeslaQuant is a real-time tracking terminal designed to quantify the progress of Tesla's most critical technical and financial catalysts.
            </p>
            <p style={{ fontSize: '14px', lineHeight: '1.75', color: '#aaa', margin: '16px 0 0' }}>
              While traditional analysts rely on quarterly reports and delayed data, TeslaQuant uses an agentic AI framework to synthesize real-time "on-the-ground" intelligence into a dynamic, interactive map of the Tesla ecosystem.
            </p>
            <button
              onClick={() => setShowAbout(false)}
              style={{
                marginTop: '32px',
                background: 'none',
                border: '1px solid #333',
                color: '#555',
                fontSize: '10px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                padding: '7px 18px',
                cursor: 'pointer',
                fontFamily: "'Space Grotesk', sans-serif",
                transition: 'border-color 0.2s, color 0.2s',
              }}
              onMouseEnter={e => { e.target.style.borderColor = '#555'; e.target.style.color = '#aaa'; }}
              onMouseLeave={e => { e.target.style.borderColor = '#333'; e.target.style.color = '#555'; }}
            >Close</button>
          </div>
        </div>
      )}

      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <div
          onClick={() => setShowDisclaimer(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 500,
            background: 'rgba(0,0,0,0.80)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#0a0a0a',
              border: '1px solid #1e1e1e',
              padding: '44px 48px',
              maxWidth: '560px',
              width: '90%',
            }}
          >
            <div style={{ fontSize: '9px', letterSpacing: '4px', color: '#333', textTransform: 'uppercase', marginBottom: '16px' }}>Legal</div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginBottom: '28px', letterSpacing: '-0.3px' }}>
              Disclaimer
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                {
                  heading: 'Not Investment Advice',
                  body: 'All content on this platform is provided for informational and recreational purposes only. Nothing on this site constitutes financial, investment, legal, or tax advice. Do not make any investment decisions based solely on information presented here.',
                },
                {
                  heading: 'No Affiliation',
                  body: 'This is an independent, community-built platform. It is not affiliated with, authorized by, endorsed by, or officially connected with Tesla, Inc. or any of its subsidiaries. "Tesla" and "TSLA" are referenced solely to identify the publicly traded company.',
                },
                {
                  heading: 'Forward-Looking Statements',
                  body: 'This platform contains speculative analysis, probability estimates, and forward-looking commentary. Actual outcomes may differ materially. Past catalyst performance is not indicative of future results.',
                },
                {
                  heading: 'No Liability',
                  body: 'The creators of this platform accept no liability for any loss or damage — direct or indirect — arising from use of, or reliance on, any information presented here. Use at your own risk.',
                },
              ].map(({ heading, body }) => (
                <div key={heading} style={{ borderLeft: '2px solid #1e1e1e', paddingLeft: '16px' }}>
                  <div style={{ fontSize: '10px', letterSpacing: '1.5px', color: '#555', textTransform: 'uppercase', marginBottom: '6px' }}>{heading}</div>
                  <p style={{ fontSize: '13px', color: '#666', lineHeight: '1.7', margin: 0 }}>{body}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowDisclaimer(false)}
              style={{
                marginTop: '36px',
                background: 'none',
                border: '1px solid #222',
                color: '#444',
                fontSize: '10px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                padding: '7px 18px',
                cursor: 'pointer',
                fontFamily: "'Space Grotesk', sans-serif",
              }}
              onMouseEnter={e => { e.target.style.borderColor = '#444'; e.target.style.color = '#888'; }}
              onMouseLeave={e => { e.target.style.borderColor = '#222'; e.target.style.color = '#444'; }}
            >Close</button>
          </div>
        </div>
      )}

      {/* Bottom Legend */}
      <footer style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        zIndex: 100,
        padding: '10px 28px',
        borderTop: '1px solid #111',
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        gap: '32px',
        alignItems: 'center',
        transition: 'right 0.3s ease',
      }}>
        {/* Category legend */}
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '9px', color: '#444', letterSpacing: '2px', textTransform: 'uppercase' }}>Category</span>
          {[
            { label: 'Autonomy',      color: 'hsl(210,100%,60%)' },
            { label: 'Robotics',      color: 'hsl(200,30%,65%)'  },
            { label: 'Financials',    color: 'hsl(142,70%,55%)'  },
            { label: 'Product',       color: 'hsl(270,80%,70%)'  },
            { label: 'Manufacturing', color: 'hsl(35,90%,60%)'   },
            { label: 'Energy',        color: 'hsl(15,100%,60%)'  },
            { label: 'Corporate',     color: 'hsl(55,80%,60%)'   },
          ].map(cat => (
            <div key={cat.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: cat.color,
                boxShadow: `0 0 5px ${cat.color}`,
              }} />
              <span style={{ fontSize: '10px', color: '#666' }}>{cat.label}</span>
            </div>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '20px', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', color: '#2a2a2a', letterSpacing: '1px' }}>
            Click nodes to explore · Bear $145 · Bull $1,030
          </span>
          <button
            onClick={() => setShowDisclaimer(true)}
            style={{
              background: 'none', border: 'none', padding: 0,
              color: '#2a2a2a', fontSize: '10px', letterSpacing: '1.5px',
              textTransform: 'uppercase', cursor: 'pointer',
              fontFamily: "'Space Grotesk', sans-serif",
              textDecoration: 'underline', textUnderlineOffset: '3px',
            }}
            onMouseEnter={e => e.target.style.color = '#555'}
            onMouseLeave={e => e.target.style.color = '#2a2a2a'}
          >Disclaimer</button>
        </div>
      </footer>
    </div>
  );
}
