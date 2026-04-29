// QuantAudit.jsx — Tesla Quant Audit section (shared desktop + mobile)
import { useState } from 'react';
import { getCredits, isPro, syncCredits } from './creditManager';
import { getFingerprint } from './fingerprint';

const F = "'Space Grotesk', sans-serif";
const scoreColor = (s) => Number(s) >= 99 ? '#00ff88' : Number(s) >= 95 ? '#00aaff' : '#f59e0b';

// Per-card AI analysis state
function useCardAnalysis() {
  const [state, setState] = useState({}); // { [index]: { status, text } }
  function setCard(i, patch) {
    setState(prev => ({ ...prev, [i]: { ...(prev[i] || {}), ...patch } }));
  }
  return [state, setCard];
}

export default function QuantAudit({ isMobile = false }) {
  const [status, setStatus] = useState('idle');
  const [results, setResults] = useState([]);
  const [shares, setShares] = useState('');
  const [cash, setCash] = useState('');
  const [risk, setRisk] = useState(5);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [cardState, setCard] = useCardAnalysis();

  async function runAudit() {
    setStatus('loading');
    setResults([]);
    try {
      const res = await fetch('/api/tsla-quant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shares: Number(shares), cash: Number(cash), risk: Number(risk) }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setResults(json.data);
        setStatus('done');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  async function explainTrade(r, i) {
    // Credit check (client-side fast path)
    if (!isPro() && getCredits() <= 0) {
      setShowUpgrade(true);
      return;
    }

    setCard(i, { status: 'loading', text: '' });

    const fp = await getFingerprint();
    try {
      const res = await fetch('/api/analyze-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fp,
          strategy: r.strategy,
          strike: r.strike,
          premium: r.premium,
          aroc_annualized: r.aroc_annualized,
          risk: Number(risk),
          current_price: r.current_price,
          contract_count: r.contract_count,
        }),
      });
      const json = await res.json();

      if (json.denied || res.status === 402) {
        setCard(i, { status: 'idle', text: '' });
        setShowUpgrade(true);
        return;
      }
      if (json.success && json.analysis) {
        if (typeof json.credits === 'number') syncCredits(json.credits);
        setCard(i, { status: 'done', text: json.analysis });
      } else {
        setCard(i, { status: 'error', text: '' });
      }
    } catch {
      setCard(i, { status: 'error', text: '' });
    }
  }

  const inputStyle = {
    background: '#0a0f1a', border: '1px solid #1e2a3a', color: '#fff',
    fontSize: isMobile ? '14px' : '13px',
    padding: isMobile ? '10px 12px' : '8px 12px',
    fontFamily: F, width: '100%',
    boxSizing: 'border-box', outline: 'none', borderRadius: '3px',
    transition: 'border-color 0.15s',
    WebkitAppearance: 'none',
  };

  const pad = isMobile ? '14px 16px' : '18px 28px';

  return (
    <div style={{ fontFamily: F, background: '#030608', borderTop: '1px solid #0d1117', width: '100%', boxSizing: 'border-box' }}>

      {/* Upgrade prompt */}
      {showUpgrade && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }} onClick={() => setShowUpgrade(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#0a0f1a', border: '1px solid #00aaff44', borderTop: '2px solid #00aaff',
            padding: '28px 24px', maxWidth: '360px', width: '100%', borderRadius: '4px',
            fontFamily: F,
          }}>
            <div style={{ fontSize: '10px', color: '#00aaff', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: '10px', fontWeight: 800 }}>Credits Required</div>
            <div style={{ fontSize: '14px', color: '#fff', marginBottom: '8px', fontWeight: 600 }}>No credits remaining</div>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '20px', lineHeight: 1.6 }}>
              AI trade analysis requires credits. Purchase a plan to continue using the Quant Analysis engine.
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <a href="https://buy.stripe.com/6oU3cw0qT5Oz19h8X29Ve00" target="_blank" rel="noopener noreferrer" style={{
                background: 'rgba(0,170,255,0.12)', border: '1px solid #00aaff44', color: '#00aaff',
                fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '8px 16px',
                textDecoration: 'none', fontFamily: F, fontWeight: 700, borderRadius: '3px',
              }}>Single Query $0.99</a>
              <a href="https://buy.stripe.com/6oUbJ2gpR2Cn05dgpu9Ve01" target="_blank" rel="noopener noreferrer" style={{
                background: 'rgba(0,255,136,0.1)', border: '1px solid #00ff8844', color: '#00ff88',
                fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '8px 16px',
                textDecoration: 'none', fontFamily: F, fontWeight: 700, borderRadius: '3px',
              }}>Trader $29/mo</a>
            </div>
            <button onClick={() => setShowUpgrade(false)} style={{
              marginTop: '16px', background: 'none', border: 'none', color: '#555',
              fontSize: '11px', cursor: 'pointer', fontFamily: F,
            }}>✕ Close</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{
        padding: isMobile ? '14px 16px 10px' : '16px 28px 12px',
        borderBottom: '1px solid #0d1117',
        background: 'linear-gradient(135deg, #040c18 0%, #060d1a 100%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '10px', letterSpacing: '2.5px', textTransform: 'uppercase', color: '#00aaff', fontWeight: 800 }}>⚙️ Tesla Quant Audit</span>
          <span style={{ fontSize: '8px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#f59e0b', border: '1px solid #f59e0b33', padding: '1px 6px', background: 'rgba(245,158,11,0.06)' }}>Live Engine</span>
        </div>
        <div style={{ fontSize: '11px', color: '#888' }}>Enter your position to simulate optimal strategies</div>
      </div>

      {/* Inputs */}
      <div style={{
        padding: pad,
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: isMobile ? '12px' : '16px',
        borderBottom: '1px solid #0d1117',
      }}>
        <div>
          <div style={{ fontSize: '9px', color: '#bbb', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 700 }}>Shares Owned</div>
          <input type="number" inputMode="numeric" placeholder="e.g. 200" value={shares}
            onChange={e => setShares(e.target.value)} style={inputStyle}
            onFocus={e => e.target.style.borderColor = '#00aaff'}
            onBlur={e => e.target.style.borderColor = '#1e2a3a'} />
        </div>
        <div>
          <div style={{ fontSize: '9px', color: '#bbb', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 700 }}>Available Cash ($)</div>
          <input type="number" inputMode="numeric" placeholder="e.g. 40000" value={cash}
            onChange={e => setCash(e.target.value)} style={inputStyle}
            onFocus={e => e.target.style.borderColor = '#00aaff'}
            onBlur={e => e.target.style.borderColor = '#1e2a3a'} />
        </div>
        <div>
          <div style={{ fontSize: '9px', color: '#bbb', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 700 }}>Risk Level (1–10)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input type="range" min="1" max="10" value={risk}
              onChange={e => setRisk(e.target.value)}
              style={{ flex: 1, accentColor: '#00aaff', cursor: 'pointer' }} />
            <span style={{ fontSize: '16px', fontWeight: 700, color: risk <= 3 ? '#00ff88' : risk <= 7 ? '#f59e0b' : '#ff4444', minWidth: '20px', textAlign: 'right' }}>{risk}</span>
          </div>
          <div style={{ fontSize: '9px', color: '#777', marginTop: '4px' }}>{risk <= 3 ? 'Conservative' : risk <= 6 ? 'Moderate' : risk <= 8 ? 'Aggressive' : 'Max Risk'}</div>
        </div>
      </div>

      {/* Run button */}
      <div style={{ padding: pad, borderBottom: '1px solid #0d1117' }}>
        <button onClick={runAudit} disabled={status === 'loading'} style={{
          background: status === 'loading' ? 'rgba(0,170,255,0.05)' : 'rgba(0,170,255,0.12)',
          border: '1px solid #00aaff44', color: status === 'loading' ? '#555' : '#00aaff',
          fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase',
          padding: isMobile ? '12px 0' : '10px 24px',
          cursor: status === 'loading' ? 'default' : 'pointer',
          fontFamily: F, fontWeight: 700, borderRadius: '3px', transition: 'all 0.15s',
          width: isMobile ? '100%' : 'auto',
          display: 'block',
        }}>
          {status === 'loading' ? '⟳ Running Simulation…' : '▶ Run Quant Audit'}
        </button>
        {status === 'error' && (
          <div style={{ marginTop: '10px', fontSize: '11px', color: '#ff4444' }}>
            Simulation failed — check inputs and retry.
          </div>
        )}
      </div>

      {/* Results */}
      {status === 'done' && (
        <div style={{ padding: pad, boxSizing: 'border-box', width: '100%', overflow: 'hidden', display: 'block' }}>
          {results.length > 0 ? (
            <>
              <div style={{ fontSize: '9px', color: '#bbb', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '14px', fontWeight: 700 }}>Simulation Results</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                {results.map((r, i) => {
                  const cs = cardState[i] || {};
                  return (
                    <div key={i} style={{
                      background: '#060a10', border: '1px solid #1e2a3a',
                      borderTop: `2px solid ${scoreColor(r.match_score)}`,
                      padding: isMobile ? '14px 16px' : '18px 20px',
                      borderRadius: '3px', width: '100%', boxSizing: 'border-box',
                    }}>
                      {/* Strategy + score */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '6px' }}>
                        <span style={{ fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: '#00aaff', fontWeight: 800 }}>{r.strategy}</span>
                        <span style={{
                          fontSize: '11px', fontWeight: 800, color: scoreColor(r.match_score),
                          border: `1px solid ${scoreColor(r.match_score)}33`,
                          background: `${scoreColor(r.match_score)}0d`,
                          padding: '2px 8px', letterSpacing: '1px',
                        }}>Score {r.match_score}</span>
                      </div>

                      {/* AROC + Strike */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '12px' }}>
                        <div>
                          <div style={{ fontSize: '9px', color: '#aaa', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '3px' }}>AROC</div>
                          <div style={{ fontSize: isMobile ? '20px' : '22px', fontWeight: 800, color: '#00ff88', letterSpacing: '-0.5px' }}>{r.aroc_annualized}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '9px', color: '#aaa', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '3px' }}>Strike</div>
                          <div style={{ fontSize: isMobile ? '20px' : '22px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>${r.strike}</div>
                        </div>
                      </div>

                      {/* Expiry / Premium / Contracts / Total Credit */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', paddingTop: '12px', borderTop: '1px solid #0d1117', marginBottom: '14px' }}>
                        <div>
                          <div style={{ fontSize: '9px', color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '2px' }}>Expiry</div>
                          <div style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: 600 }}>{r.exp}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '9px', color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '2px' }}>Premium</div>
                          <div style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: 600 }}>${r.premium}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '9px', color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '2px' }}>Contracts</div>
                          <div style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: 600 }}>{r.contract_count}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '9px', color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '2px' }}>Total Credit</div>
                          <div style={{ fontSize: '12px', color: '#00ff88', fontWeight: 700 }}>${r.total_credit}</div>
                        </div>
                      </div>

                      {/* Explain This Trade button */}
                      {cs.status !== 'done' && (
                        <button
                          onClick={() => explainTrade(r, i)}
                          disabled={cs.status === 'loading'}
                          style={{
                            background: cs.status === 'loading' ? 'transparent' : 'rgba(0,255,136,0.06)',
                            border: '1px solid #00ff8833', color: cs.status === 'loading' ? '#444' : '#00ff88',
                            fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase',
                            padding: '7px 14px', cursor: cs.status === 'loading' ? 'default' : 'pointer',
                            fontFamily: F, fontWeight: 700, borderRadius: '3px', transition: 'all 0.15s',
                            width: isMobile ? '100%' : 'auto',
                          }}
                          onMouseEnter={e => { if (cs.status !== 'loading') e.currentTarget.style.background = 'rgba(0,255,136,0.12)'; }}
                          onMouseLeave={e => { if (cs.status !== 'loading') e.currentTarget.style.background = 'rgba(0,255,136,0.06)'; }}
                        >
                          {cs.status === 'loading' ? '⟳ Generating Analysis…' : '🧠 Explain This Trade'}
                        </button>
                      )}
                      {cs.status === 'error' && (
                        <div style={{ fontSize: '11px', color: '#ff4444', marginTop: '8px' }}>Analysis failed — retry.</div>
                      )}

                      {/* AI Analysis output */}
                      {cs.status === 'done' && cs.text && (
                        <div style={{
                          marginTop: '14px',
                          background: 'rgba(0,255,136,0.04)',
                          border: '1px solid #00ff8822',
                          borderLeft: '3px solid #00ff88',
                          padding: '12px 14px',
                        }}>
                          <div style={{ fontSize: '9px', color: '#00ff88', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700 }}>Quant Analysis</div>
                          <div style={{
                            fontFamily: 'monospace',
                            fontSize: isMobile ? '11px' : '12px',
                            color: '#00ff88',
                            lineHeight: 1.75,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                          }}>{cs.text}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Disclaimer */}
              <div style={{ fontSize: '9px', color: '#444', marginTop: '16px', lineHeight: 1.7, wordBreak: 'break-word', width: '100%', boxSizing: 'border-box' }}>
                This report is a mathematical simulation generated by the TSLA_QUANT engine based on user-provided constraints and current market data. It is intended for educational and simulation purposes only and does not constitute personalized financial advice, a solicitation to buy/sell securities, or a guarantee of future performance. Options trading involves significant risk. Consult with a registered financial professional before making investment decisions.
              </div>
            </>
          ) : (
            <div style={{ fontSize: '12px', color: '#888' }}>
              No strategies matched your parameters. Try adjusting shares, cash, or risk level.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
