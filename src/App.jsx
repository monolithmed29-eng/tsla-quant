import { useState, useEffect, useRef } from 'react';
import Graph from './Graph';
import Panel from './Panel';
import { catalysts, links } from './data';
import { calcPredictedPrice } from './priceModel';
import { useTSLAPrice } from './useTSLAPrice';

const PREDICTED = calcPredictedPrice(catalysts);

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
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const { price: tslaPrice, lastUpdated } = useTSLAPrice();

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
            <div style={{ color: '#00aaff', fontWeight: 700, fontSize: '18px' }}>
              {tslaPrice ? `$${tslaPrice.toFixed(2)}` : '—'}
            </div>
            <div style={{ color: '#333', fontSize: '9px', marginTop: '2px' }}>
              {lastUpdated ? formatTime(lastUpdated) : '—'}
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

      {/* Graph canvas area */}
      <div style={{
        position: 'absolute',
        inset: 0,
        paddingTop: '99px',
        paddingBottom: '56px',
        paddingRight: selected ? '340px' : '0',
        transition: 'padding-right 0.3s ease',
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
        bottom: 0, left: 0, right: selected ? '340px' : '0',
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
        {/* Luminescence legend */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span style={{ fontSize: '9px', color: '#444', letterSpacing: '2px', textTransform: 'uppercase' }}>Likelihood</span>
          {luminescenceLevels.map(lv => (
            <div key={lv.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '9px', height: '9px',
                borderRadius: '50%',
                background: lv.color,
                boxShadow: `0 0 6px ${lv.glow}`,
              }} />
              <span style={{ fontSize: '10px', color: '#888' }}>{lv.label}</span>
            </div>
          ))}
          <span style={{ fontSize: '10px', color: '#555', marginLeft: '4px' }}>→ Bright (high likelihood)</span>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '20px', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', color: '#2a2a2a', letterSpacing: '1px' }}>
            Click nodes to explore · Bear $120 · Bull $450
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
