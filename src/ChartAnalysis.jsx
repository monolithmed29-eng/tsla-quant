import { useState, useEffect } from 'react';
import { ANALYSIS } from './rogerAnalysis';

const FONT = "'Space Grotesk', sans-serif";

const LEAN_COLOR = { bullish: '#00ff88', bearish: '#ff4444', neutral: '#ffaa00' };
const LEAN_ICON  = { bullish: '▲', bearish: '▼', neutral: '◆' };
const LEAN_LABEL = { bullish: 'BULLISH', bearish: 'BEARISH', neutral: 'NEUTRAL' };

// ── Section Title ─────────────────────────────────────────────────────────────
function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: '13px',
      letterSpacing: '2.5px',
      color: '#ffffff',
      textTransform: 'uppercase',
      fontWeight: 700,
      marginBottom: '14px',
      borderBottom: '1px solid #1a1a2a',
      paddingBottom: '8px',
    }}>
      {children}
    </div>
  );
}

// ── Signal Row ────────────────────────────────────────────────────────────────
function SignalRow({ label, reading, lean }) {
  const color = LEAN_COLOR[lean] || '#aaa';
  const icon  = LEAN_ICON[lean]  || '◆';
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      padding: '11px 0',
      borderBottom: '1px solid #0d1117',
      gap: '12px',
      flexWrap: 'nowrap',
      minWidth: 0,
    }}>
      <div style={{ fontSize: '13px', color: '#ccc', letterSpacing: '0.5px', flexShrink: 0, width: '160px' }}>{label}</div>
      <div style={{ fontSize: '14px', color: '#fff', fontWeight: 500, lineHeight: 1.5, flex: 1, minWidth: 0, wordBreak: 'break-word' }}>{reading}</div>
      <div style={{ flexShrink: 0, marginLeft: '12px' }}>
        <span style={{ fontSize: '10px', color, fontWeight: 700, letterSpacing: '1.5px', whiteSpace: 'nowrap' }}>{icon} {LEAN_LABEL[lean]}</span>
      </div>
    </div>
  );
}

// ── Target Card ───────────────────────────────────────────────────────────────
function TargetCard({ label, price, description, primary }) {
  return (
    <div style={{
      flex: '1 1 200px',
      minWidth: 0,
      background: primary ? 'rgba(0,255,136,0.04)' : 'rgba(255,170,0,0.04)',
      border: `1px solid ${primary ? '#00ff8833' : '#ffaa0033'}`,
      borderTop: `2px solid ${primary ? '#00ff88' : '#ffaa00'}`,
      padding: '18px 20px',
      borderRadius: '2px',
      boxSizing: 'border-box',
    }}>
      <div style={{ fontSize: '11px', letterSpacing: '2px', color: primary ? '#00ff88' : '#ffaa00', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ fontSize: '32px', fontWeight: 700, color: '#fff', letterSpacing: '-1px', marginBottom: '10px' }}>
        ${price}
      </div>
      <div style={{ fontSize: '13px', color: '#ccc', lineHeight: 1.75, wordBreak: 'break-word' }}>{description}</div>
    </div>
  );
}

// ── Comments Section ──────────────────────────────────────────────────────────
function CommentsSection() {
  const [comments, setComments] = useState([]);
  const [name, setName]         = useState('');
  const [text, setText]         = useState('');
  const [loading, setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState(null);
  const [success, setSuccess]   = useState(false);

  useEffect(() => {
    fetch('/api/comments?section=chart')
      .then(r => r.json())
      .then(d => { setComments(d.comments || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'chart', name: name.trim(), text: text.trim() }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setComments(prev => [data.comment, ...prev]);
      setText('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Could not post comment. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ padding: '28px', borderTop: '1px solid #0d1117', boxSizing: 'border-box', minWidth: 0 }}>
      <SectionTitle>Community Discussion</SectionTitle>

      {/* Submit form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '28px', background: '#080b10', border: '1px solid #1a1a2a', padding: '20px', borderRadius: '4px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name / handle"
            maxLength={40}
            style={{
              flex: '0 0 200px',
              background: '#030608',
              border: '1px solid #1e2a3a',
              color: '#fff',
              fontSize: '14px',
              padding: '10px 14px',
              fontFamily: FONT,
              outline: 'none',
              borderRadius: '3px',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ fontSize: '12px', color: '#888', alignSelf: 'center', letterSpacing: '0.3px' }}>
            No account needed. Just drop your thoughts.
          </div>
        </div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Share your analysis, agree, disagree, add levels..."
          maxLength={500}
          rows={3}
          style={{
            width: '100%',
            background: '#030608',
            border: '1px solid #1e2a3a',
            color: '#fff',
            fontSize: '14px',
            padding: '10px 14px',
            fontFamily: FONT,
            outline: 'none',
            resize: 'vertical',
            lineHeight: 1.6,
            borderRadius: '3px',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '10px', flexWrap: 'wrap' }}>
          <button
            type="submit"
            disabled={submitting || !name.trim() || !text.trim()}
            style={{
              background: submitting ? '#0a1a10' : 'rgba(0,255,136,0.12)',
              border: '1px solid #00ff8844',
              color: submitting ? '#555' : '#00ff88',
              fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase',
              padding: '8px 20px', cursor: submitting ? 'not-allowed' : 'pointer',
              fontFamily: FONT, fontWeight: 700, transition: 'all 0.15s', borderRadius: '3px',
            }}
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
          {success && <span style={{ color: '#00ff88', fontSize: '12px' }}>✓ Posted!</span>}
          {error   && <span style={{ color: '#ff4444', fontSize: '12px' }}>{error}</span>}
          <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#666' }}>{text.length}/500</span>
        </div>
      </form>

      {/* Comments list */}
      {loading ? (
        <div style={{ color: '#777', fontSize: '13px', textAlign: 'center', padding: '20px' }}>Loading comments...</div>
      ) : comments.length === 0 ? (
        <div style={{ color: '#777', fontSize: '14px', textAlign: 'center', padding: '28px', border: '1px dashed #1a1a2a', borderRadius: '4px' }}>
          No comments yet. Be the first.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {comments.map((c, i) => (
            <div key={i} style={{ background: '#080b10', border: '1px solid #0d1117', padding: '16px 20px', borderRadius: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#00aaff' }}>{c.name}</span>
                <span style={{ fontSize: '11px', color: '#666' }}>{c.timeAgo || new Date(c.ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div style={{ fontSize: '14px', color: '#ddd', lineHeight: 1.7, wordBreak: 'break-word' }}>{c.text}</div>
            </div>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <div style={{ marginTop: '24px', padding: '16px 20px', background: '#06080c', border: '1px solid #222', borderLeft: '3px solid #333', borderRadius: '3px', boxSizing: 'border-box' }}>
        <p style={{ fontSize: '12px', color: '#aaa', lineHeight: 1.8, margin: 0, wordBreak: 'break-word' }}>
          <strong style={{ color: '#fff', letterSpacing: '0.5px' }}>⚠ NOT FINANCIAL ADVICE.</strong>{' '}
          All analysis on this page is for informational and educational purposes only. Roger's commentary reflects personal technical analysis and does not constitute investment advice, a solicitation, or a recommendation to buy or sell any security. Past signal accuracy is not a guarantee of future results. Always do your own research and consult a licensed financial professional before making investment decisions.{' '}
          Chart courtesy of{' '}
          <a href="https://www.tradingview.com" target="_blank" rel="noopener noreferrer" style={{ color: '#aaa', textDecoration: 'underline' }}>TradingView</a>.
        </p>
      </div>
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function ChartAnalysis() {
  const a = ANALYSIS;
  const overallColor = LEAN_COLOR[a.overallLean] || '#aaa';

  return (
    <div style={{ fontFamily: FONT, background: '#030608', WebkitFontSmoothing: 'antialiased', minWidth: 0, overflowX: 'hidden' }}>

      {/* Section header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 28px', borderBottom: '1px solid #0d1117',
        background: '#040710', flexWrap: 'wrap', gap: '10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '2px', color: '#fff', textTransform: 'uppercase' }}>
            Chart Analysis
          </span>
          <span style={{ fontSize: '11px', letterSpacing: '1.5px', color: '#888', textTransform: 'uppercase' }}>
            {a.timeframe} · Updated {a.updatedAt}
          </span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: `${overallColor}18`,
          border: `1px solid ${overallColor}44`,
          padding: '5px 14px', borderRadius: '20px', flexShrink: 0,
        }}>
          <span style={{ fontSize: '11px', color: overallColor, fontWeight: 700, letterSpacing: '2px' }}>
            {LEAN_ICON[a.overallLean]} {LEAN_LABEL[a.overallLean]}
          </span>
        </div>
      </div>

      {/* Chart image */}
      <div style={{ padding: '24px 28px 0', boxSizing: 'border-box', minWidth: 0 }}>
        {a.chartImage ? (
          <div style={{ position: 'relative', border: '1px solid #1a1a2a', borderRadius: '4px', overflow: 'hidden', lineHeight: 0 }}>
            <img
              src={a.chartImage}
              alt="TSLA Technical Analysis Chart"
              style={{ width: '100%', display: 'block', maxWidth: '100%' }}
            />
            <div style={{
              position: 'absolute', bottom: '10px', right: '12px',
              fontSize: '10px', color: '#ccc', letterSpacing: '0.5px',
              background: 'rgba(0,0,0,0.7)', padding: '3px 8px', borderRadius: '2px',
            }}>
              Chart courtesy of TradingView
            </div>
          </div>
        ) : (
          <div style={{ border: '1px solid #1a1a2a', borderRadius: '4px', overflow: 'hidden', height: '460px' }}>
            <iframe
              title="TSLA Chart"
              src="https://s.tradingview.com/widgetembed/?frameElementId=tradingview_tsla&symbol=NASDAQ%3ATSLA&interval=D&hidesidetoolbar=1&hideTopBar=0&theme=dark&style=1&timezone=America%2FNew_York&withdateranges=1&hide_side_toolbar=0&allow_symbol_change=0&save_image=0&toolbarbg=030608&studies=[]&hidevolume=0"
              style={{ width: '100%', height: '100%', border: 'none' }}
              allowTransparency="true"
              scrolling="no"
            />
          </div>
        )}
      </div>

      {/* Signal scorecard */}
      <div style={{ padding: '24px 28px 0', boxSizing: 'border-box', minWidth: 0 }}>
        <SectionTitle>Signal Scorecard</SectionTitle>
        {a.signals.map((s, i) => (
          <SignalRow key={i} {...s} />
        ))}
      </div>

      {/* Price targets */}
      <div style={{ padding: '24px 28px 0', boxSizing: 'border-box', minWidth: 0 }}>
        <SectionTitle>Price Targets</SectionTitle>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          {a.targets.map((t, i) => (
            <TargetCard key={i} {...t} primary={i === 0} />
          ))}
        </div>
      </div>

      {/* Roger's Read */}
      <div style={{ padding: '24px 28px 0', boxSizing: 'border-box', minWidth: 0 }}>
        <SectionTitle>Roger's Read</SectionTitle>
        <div style={{
          background: '#060a0f',
          border: '1px solid #1a1a2a',
          borderLeft: `3px solid ${overallColor}`,
          padding: '22px 24px',
          borderRadius: '2px',
          boxSizing: 'border-box',
        }}>
          {a.commentary.split('\n\n').map((para, i, arr) => (
            <p key={i} style={{
              fontSize: '15px',
              color: '#ddd',
              lineHeight: 1.85,
              margin: 0,
              marginBottom: i < arr.length - 1 ? '16px' : 0,
              wordBreak: 'break-word',
            }}>
              {para}
            </p>
          ))}
        </div>
      </div>

      {/* Comments + Disclaimer */}
      <CommentsSection />

    </div>
  );
}
