import { useState, useRef, useEffect } from 'react';
import { getCredits, decrementCredit, addCredits, isPro, getCreditSig, setProStatus } from './creditManager';
import UpgradeModal from './UpgradeModal';

const QUICK_QUERIES = [
  'FSD v14 Impact',
  'Cortex 2.0 Status',
  'Q2 Delivery Quant',
];

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
  @keyframes creditPulse {
    0%,100% { opacity: 1; }
    50%      { opacity: 0.6; }
  }
`;

export default function OracleSearch() {
  const [query, setQuery] = useState('');
  const [phase, setPhase] = useState('idle'); // idle | loading | result
  const [loadingText, setLoadingText] = useState('');
  const [result, setResult] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);
  const [credits, setCredits] = useState(getCredits);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState('no_credits');
  const inputRef = useRef(null);
  const loadingIntervalRef = useRef(null);

  // Handle Stripe redirect params (?upgrade=active_trader or ?oracle_token=xxx)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const upgradeParam = params.get('upgrade');
    const tokenParam = params.get('oracle_token');

    if (upgradeParam === 'active_trader' || upgradeParam === 'institutional') {
      setProStatus(upgradeParam);
      window.history.replaceState({}, '', window.location.pathname);
    } else if (tokenParam) {
      sessionStorage.setItem('oracle_token', tokenParam);
      // Add 1 credit for single query purchase
      const next = addCredits(1);
      setCredits(next);
      window.history.replaceState({}, '', window.location.pathname);
      const pending = sessionStorage.getItem('oracle_pending_query');
      if (pending) {
        setQuery(pending);
        handleAnalyze(pending);
      }
    }
  }, []);

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

  function openUpgrade(reason = 'no_credits') {
    setUpgradeReason(reason);
    setShowUpgrade(true);
  }

  async function handleAnalyze(q) {
    const finalQuery = q || query;
    if (!finalQuery.trim()) return;

    // Credit gate
    const pro = isPro();
    const currentCredits = getCredits();
    if (!pro && currentCredits <= 0) {
      openUpgrade('no_credits');
      return;
    }

    setQuery(finalQuery);
    setPhase('loading');
    cycleLoadingText();
    sessionStorage.setItem('oracle_pending_query', finalQuery);

    try {
      const token = sessionStorage.getItem('oracle_token') || '';
      // Send credit payload for backend validation
      const res = await fetch('/api/oracle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: finalQuery,
          token,
          credits: currentCredits,
          sig: getCreditSig(),
          pro,
        }),
      });
      stopLoading();

      if (res.status === 402) {
        openUpgrade('no_credits');
        setPhase('idle');
        return;
      }

      const data = await res.json();
      if (data.unlocked && data.result) {
        // Deduct credit (unless pro)
        if (!pro) {
          const next = decrementCredit();
          setCredits(next);
        }
        setResult(data.result);
        setPhase('result');
      } else {
        openUpgrade('no_credits');
        setPhase('idle');
      }
    } catch {
      stopLoading();
      openUpgrade('no_credits');
      setPhase('idle');
    }
  }

  function handleReset() {
    setPhase('idle');
    setQuery('');
    setResult('');
    stopLoading();
  }

  useEffect(() => () => stopLoading(), []);

  const pro = isPro();
  const creditsLeft = getCredits();
  const depleted = !pro && creditsLeft <= 0;

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
          color: '#ffffff',
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
        {/* Credits badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          marginBottom: '6px',
          gap: '8px',
        }}>
          {pro ? (
            <span style={{
              fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase',
              color: '#00ff88', padding: '2px 8px',
              border: '1px solid #00ff8844', background: '#00ff8811',
            }}>
              ✓ Pro — Unlimited
            </span>
          ) : (
            <span
              onClick={() => depleted && openUpgrade('no_credits')}
              style={{
                fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase',
                color: depleted ? '#e53935' : '#aaa',
                padding: '2px 10px',
                border: `1px solid ${depleted ? '#e5393566' : '#2a2a2a'}`,
                background: depleted ? '#e5393511' : 'transparent',
                cursor: depleted ? 'pointer' : 'default',
                animation: depleted ? 'creditPulse 1.5s ease-in-out infinite' : 'none',
              }}
            >
              Credits Remaining: {creditsLeft}
              {depleted && ' — Refill ↗'}
            </span>
          )}
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: '#0d1117',
          border: `1px solid ${depleted ? '#e5393566' : '#2a2a2a'}`,
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
          onFocusCapture={e => {
            if (!depleted) {
              e.currentTarget.style.borderColor = '#e53935';
              e.currentTarget.style.boxShadow = '0 0 0 1px #e5393544, 0 0 20px 4px #e5393522';
            }
          }}
          onBlurCapture={e => {
            e.currentTarget.style.borderColor = depleted ? '#e5393566' : '#2a2a2a';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {/* Prompt prefix */}
          <span style={{
            padding: '0 0 0 16px',
            fontSize: '12px',
            color: depleted ? '#e5393566' : '#e53935',
            letterSpacing: '1px',
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}>ROGER@TSLAQUANT:~$</span>

          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
            placeholder={depleted ? 'No credits remaining — upgrade to continue' : 'Enter your Tesla quant query...'}
            disabled={phase === 'loading' || depleted}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: depleted ? '#555' : '#ffffff',
              fontSize: '13px',
              padding: '14px 12px',
              fontFamily: "'Space Grotesk', sans-serif",
              letterSpacing: '0.3px',
              cursor: depleted ? 'not-allowed' : 'text',
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

          {/* Analyze / Refill button */}
          {depleted ? (
            <button
              onClick={() => openUpgrade('no_credits')}
              style={{
                background: '#e53935',
                border: 'none',
                color: '#ffffff',
                fontSize: '10px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                padding: '0 20px',
                height: '100%',
                cursor: 'pointer',
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 600,
                whiteSpace: 'nowrap',
                minWidth: '110px',
                alignSelf: 'stretch',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'oraclePulse 2s infinite',
              }}
              onMouseEnter={e => { e.target.style.background = '#c62828'; }}
              onMouseLeave={e => { e.target.style.background = '#e53935'; }}
            >
              Refill Credits
            </button>
          ) : (
            <button
              onClick={() => handleAnalyze()}
              disabled={phase === 'loading' || !query.trim()}
              style={{
                background: phase === 'loading' ? '#1a0a0a' : '#e53935',
                border: 'none',
                color: '#ffffff',
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
          )}
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
              onClick={() => depleted ? openUpgrade('no_credits') : handleAnalyze(q)}
              disabled={phase === 'loading'}
              style={{
                background: 'transparent',
                border: '1px solid #2a2a2a',
                color: depleted ? '#333' : '#666',
                fontSize: '10px',
                letterSpacing: '1px',
                padding: '4px 12px',
                cursor: depleted ? 'pointer' : 'pointer',
                fontFamily: "'Space Grotesk', sans-serif",
                transition: 'border-color 0.2s, color 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#e53935'; e.currentTarget.style.color = '#e53935'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = depleted ? '#333' : '#666'; }}
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
            <span style={{ color: '#ffffff', fontSize: '12px', letterSpacing: '0.5px' }}>{loadingText}</span>
            <span style={{
              display: 'inline-block', width: '8px', height: '14px',
              background: '#e53935', opacity: 0.9,
              animation: 'terminalCursor 0.8s step-end infinite',
            }} />
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

      {/* Upgrade Modal */}
      {showUpgrade && (
        <UpgradeModal reason={upgradeReason} onClose={() => setShowUpgrade(false)} />
      )}
    </div>
  );
}
