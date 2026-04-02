import { useState, useRef, useEffect, useCallback } from 'react';

const QUICK_QUERIES = [
  'FSD v14 Impact',
  'Cortex 2.0 Status',
  'Q2 Delivery Quant',
];

const STRIPE_LINK = 'https://buy.stripe.com/PLACEHOLDER'; // Rooz: replace with your Stripe payment link

const glowAnim = `
  @keyframes terminalCursor {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0; }
  }
  @keyframes oraclePulse {
    0%,100% { box-shadow: 0 0 8px 2px rgba(229,57,53,0.5), 0 0 20px 6px rgba(229,57,53,0.2); }
    50%     { box-shadow: 0 0 16px 5px rgba(229,57,53,0.8), 0 0 36px 12px rgba(229,57,53,0.35); }
  }
  @keyframes scanline {
    0%   { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes typewriter {
    from { width: 0; }
    to   { width: 100%; }
  }
`;

export default function OracleSearch() {
  const [query, setQuery] = useState('');
  const [phase, setPhase] = useState('idle'); // idle | loading | paywall | result
  const [loadingText, setLoadingText] = useState('');
  const [result, setResult] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);
  const inputRef = useRef(null);
  const loadingIntervalRef = useRef(null);

  // Check for token in URL (returned from Stripe redirect)
  const urlToken = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('oracle_token')
    : null;

  const LOADING_MESSAGES = [
    'Consulting TSLAquant Oracle...',
    'Processing Milestone Correlations...',
    'Scanning Neural Catalyst Network...',
    'Cross-referencing Quant Layers...',
    'Synthesizing Real-Time Intelligence...',
    'Running Probability Matrix...',
  ];

  function cycleLoadingText() {
    let i = 0;
    setLoadingText(LOADING_MESSAGES[0]);
    loadingIntervalRef.current = setInterval(() => {
      i = (i + 1) % LOADING_MESSAGES.length;
      setLoadingText(LOADING_MESSAGES[i]);
    }, 900);
  }

  function stopLoading() {
    if (loadingIntervalRef.current) {
      clearInterval(loadingIntervalRef.current);
      loadingIntervalRef.current = null;
    }
  }

  async function handleAnalyze(q) {
    const finalQuery = q || query;
    if (!finalQuery.trim()) return;
    setQuery(finalQuery);
    setPhase('loading');
    cycleLoadingText();

    // Store query in sessionStorage so we can resume after Stripe redirect
    sessionStorage.setItem('oracle_pending_query', finalQuery);

    try {
      const token = urlToken || sessionStorage.getItem('oracle_token') || '';
      const res = await fetch('/api/oracle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: finalQuery, token }),
      });
      stopLoading();

      if (res.status === 402) {
        setPhase('paywall');
        return;
      }

      const data = await res.json();
      if (data.unlocked && data.result) {
        setResult(data.result);
        setPhase('result');
        // Cache token for session
        if (token) sessionStorage.setItem('oracle_token', token);
      } else {
        setPhase('paywall');
      }
    } catch {
      stopLoading();
      setPhase('paywall');
    }
  }

  // Auto-resume query if returning from Stripe with token
  useEffect(() => {
    if (urlToken) {
      sessionStorage.setItem('oracle_token', urlToken);
      const pending = sessionStorage.getItem('oracle_pending_query');
      if (pending) {
        setQuery(pending);
        handleAnalyze(pending);
      }
    }
  }, []);

  function handleReset() {
    setPhase('idle');
    setQuery('');
    setResult('');
    stopLoading();
  }

  useEffect(() => () => stopLoading(), []);

  return (
    <div style={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0',
      fontFamily: "'Space Grotesk', sans-serif",
    }}>
      <style>{glowAnim}</style>

      {/* Section Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '18px',
        animation: 'fadeInUp 0.6s ease',
      }}>
        <div style={{
          fontSize: '9px',
          letterSpacing: '4px',
          color: '#e53935',
          textTransform: 'uppercase',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}>
          <span style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: '#e53935',
            display: 'inline-block',
            animation: 'oraclePulse 2s infinite',
          }} />
          Command Center
          <span style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: '#e53935',
            display: 'inline-block',
            animation: 'oraclePulse 2s infinite',
          }} />
        </div>
        <div style={{
          fontSize: '15px',
          fontWeight: 600,
          color: '#fff',
          letterSpacing: '0.5px',
        }}>
          Ask the Agent: Deep-Dive Quant Analysis on any Tesla Milestone.
        </div>
      </div>

      {/* Search Bar */}
      <div style={{
        width: '100%',
        maxWidth: '720px',
        position: 'relative',
        animation: 'fadeInUp 0.7s ease',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: '#0d1117',
          border: '1px solid #2a2a2a',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
          onFocusCapture={e => {
            e.currentTarget.style.borderColor = '#e53935';
            e.currentTarget.style.boxShadow = '0 0 0 1px #e5393544, 0 0 20px 4px #e5393522';
          }}
          onBlurCapture={e => {
            e.currentTarget.style.borderColor = '#2a2a2a';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {/* Prompt prefix */}
          <span style={{
            padding: '0 0 0 16px',
            fontSize: '12px',
            color: '#e53935',
            letterSpacing: '1px',
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}>ROGER@TSLAQUANT:~$</span>

          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
            placeholder="Enter your Tesla quant query..."
            disabled={phase === 'loading'}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#e8e8e8',
              fontSize: '13px',
              padding: '14px 12px',
              fontFamily: "'Space Grotesk', sans-serif",
              letterSpacing: '0.3px',
            }}
          />

          {/* Tooltip trigger */}
          <div style={{ position: 'relative', padding: '0 8px' }}>
            <button
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              style={{
                background: 'none', border: '1px solid #333',
                color: '#555', width: '20px', height: '20px',
                borderRadius: '50%', fontSize: '11px',
                cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif",
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >?</button>
            {showTooltip && (
              <div style={{
                position: 'absolute',
                bottom: '28px',
                right: 0,
                width: '240px',
                background: '#111',
                border: '1px solid #222',
                padding: '12px 14px',
                fontSize: '11px',
                color: '#888',
                lineHeight: 1.6,
                zIndex: 999,
                animation: 'fadeInUp 0.2s ease',
              }}>
                The Agent uses real-time milestone data from a local GPU cluster running on a Mac Mini to generate deep-dive quant analysis on Tesla catalysts.
                <div style={{ marginTop: '6px', color: '#555', fontSize: '10px' }}>
                  Powered by live neural catalyst data · Updated daily
                </div>
              </div>
            )}
          </div>

          {/* Analyze button */}
          <button
            onClick={() => handleAnalyze()}
            disabled={phase === 'loading' || !query.trim()}
            style={{
              background: phase === 'loading' ? '#1a0a0a' : '#e53935',
              border: 'none',
              color: '#fff',
              fontSize: '10px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              padding: '0 20px',
              height: '100%',
              cursor: phase === 'loading' || !query.trim() ? 'not-allowed' : 'pointer',
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 600,
              opacity: !query.trim() && phase !== 'loading' ? 0.4 : 1,
              transition: 'background 0.2s, opacity 0.2s',
              whiteSpace: 'nowrap',
              minWidth: '90px',
              alignSelf: 'stretch',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={e => { if (phase !== 'loading' && query.trim()) e.target.style.background = '#c62828'; }}
            onMouseLeave={e => { if (phase !== 'loading') e.target.style.background = '#e53935'; }}
          >
            {phase === 'loading' ? '...' : 'Analyze ↵'}
          </button>
        </div>

        {/* Quick Query chips */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginTop: '10px',
          flexWrap: 'wrap',
        }}>
          {QUICK_QUERIES.map(q => (
            <button
              key={q}
              onClick={() => handleAnalyze(q)}
              disabled={phase === 'loading'}
              style={{
                background: 'transparent',
                border: '1px solid #2a2a2a',
                color: '#666',
                fontSize: '10px',
                letterSpacing: '1px',
                padding: '4px 12px',
                cursor: 'pointer',
                fontFamily: "'Space Grotesk', sans-serif",
                transition: 'border-color 0.2s, color 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#e53935'; e.currentTarget.style.color = '#e53935'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#666'; }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {phase === 'loading' && (
        <div style={{
          marginTop: '16px',
          width: '100%',
          maxWidth: '720px',
          background: '#0d1117',
          border: '1px solid #1a1a1a',
          padding: '20px 20px',
          animation: 'fadeInUp 0.3s ease',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* scanline */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #e5393533, transparent)',
            animation: 'scanline 2s linear infinite',
            pointerEvents: 'none',
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#e53935', fontSize: '11px', letterSpacing: '1px' }}>ROGER@TSLAQUANT:~$</span>
            <span style={{ color: '#ccc', fontSize: '12px', letterSpacing: '0.5px' }}>{loadingText}</span>
            <span style={{
              display: 'inline-block', width: '8px', height: '14px',
              background: '#e53935', opacity: 0.9,
              animation: 'terminalCursor 0.8s step-end infinite',
            }} />
          </div>
        </div>
      )}

      {/* Paywall Modal */}
      {phase === 'paywall' && (
        <div style={{
          marginTop: '16px',
          width: '100%',
          maxWidth: '720px',
          background: '#0d1117',
          border: '1px solid #e5393522',
          padding: '28px 28px',
          animation: 'fadeInUp 0.3s ease',
          textAlign: 'center',
          position: 'relative',
        }}>
          <div style={{ fontSize: '9px', letterSpacing: '4px', color: '#e53935', textTransform: 'uppercase', marginBottom: '12px' }}>
            Analysis Ready
          </div>

          {/* Blurred preview */}
          <div style={{
            background: '#111',
            border: '1px solid #1a1a1a',
            padding: '16px',
            marginBottom: '20px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              filter: 'blur(4px)',
              userSelect: 'none',
              pointerEvents: 'none',
              fontSize: '11px',
              color: '#00ff88',
              fontFamily: 'monospace',
              lineHeight: 1.7,
              textAlign: 'left',
            }}>
              {`> QUERY: "${query}"\n> LOADING CATALYST MATRIX...\n> CROSS-REFERENCING 34 NODES...\n> PROBABILITY SCORE: 0.██ | IMPACT: $███\n> RISK FACTOR: ████████\n> RECOMMENDATION: ██████████████████`}
            </div>
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, transparent 20%, #0d1117 80%)',
            }} />
          </div>

          <div style={{ fontSize: '13px', color: '#888', marginBottom: '20px', lineHeight: 1.6 }}>
            Unlock the full deep-dive analysis for this query.
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <a
              href={STRIPE_LINK}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: '#e53935',
                color: '#fff',
                textDecoration: 'none',
                fontSize: '11px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                padding: '12px 28px',
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 600,
                display: 'inline-block',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#c62828'}
              onMouseLeave={e => e.currentTarget.style.background = '#e53935'}
            >
              🔓 Unlock Analysis — $5
            </a>
            <button
              onClick={handleReset}
              style={{
                background: 'none',
                border: '1px solid #333',
                color: '#555',
                fontSize: '10px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                padding: '12px 20px',
                cursor: 'pointer',
                fontFamily: "'Space Grotesk', sans-serif",
              }}
              onMouseEnter={e => { e.target.style.borderColor = '#555'; e.target.style.color = '#aaa'; }}
              onMouseLeave={e => { e.target.style.borderColor = '#333'; e.target.style.color = '#555'; }}
            >
              ← New Query
            </button>
          </div>
        </div>
      )}

      {/* Result Terminal */}
      {phase === 'result' && (
        <div style={{
          marginTop: '16px',
          width: '100%',
          maxWidth: '720px',
          background: '#0d1117',
          border: '1px solid #00ff8833',
          padding: '24px',
          animation: 'fadeInUp 0.4s ease',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            padding: '7px 14px',
            background: '#0a0f0a',
            borderBottom: '1px solid #00ff8822',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff5f57', display: 'inline-block' }} />
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#febc2e', display: 'inline-block' }} />
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#28c840', display: 'inline-block' }} />
            <span style={{ fontSize: '10px', color: '#555', letterSpacing: '2px', marginLeft: '8px' }}>TSLAQUANT — ORACLE OUTPUT</span>
          </div>
          <div style={{ marginTop: '28px' }}>
            <div style={{ fontSize: '10px', color: '#e53935', letterSpacing: '1px', marginBottom: '6px' }}>
              ROGER@TSLAQUANT:~$ analyze "{query}"
            </div>
            <pre style={{
              fontFamily: 'monospace',
              fontSize: '12px',
              color: '#00ff88',
              lineHeight: 1.8,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              margin: 0,
            }}>{result}</pre>
          </div>
          <button
            onClick={handleReset}
            style={{
              marginTop: '20px',
              background: 'none',
              border: '1px solid #1a2a1a',
              color: '#3a6a3a',
              fontSize: '10px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              padding: '7px 16px',
              cursor: 'pointer',
              fontFamily: "'Space Grotesk', sans-serif",
            }}
            onMouseEnter={e => { e.target.style.borderColor = '#2a5a2a'; e.target.style.color = '#00ff88'; }}
            onMouseLeave={e => { e.target.style.borderColor = '#1a2a1a'; e.target.style.color = '#3a6a3a'; }}
          >
            ← New Query
          </button>
        </div>
      )}
    </div>
  );
}
