import { useState, useEffect } from 'react';
import { ANALYSIS } from './rogerAnalysis';

const FONT = "'Space Grotesk', sans-serif";

const LEAN_COLOR = { bullish: '#00ff88', bearish: '#ff4444', neutral: '#ffaa00' };
const LEAN_ICON  = { bullish: '▲', bearish: '▼', neutral: '◆' };
const LEAN_LABEL = { bullish: 'BULLISH', bearish: 'BEARISH', neutral: 'NEUTRAL' };

// ── Signal Row ────────────────────────────────────────────────────────────────
function SignalRow({ label, reading, lean }) {
  const color = LEAN_COLOR[lean] || '#aaa';
  const icon  = LEAN_ICON[lean]  || '◆';
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '180px 1fr 110px',
      alignItems: 'center',
      padding: '11px 0',
      borderBottom: '1px solid #0d1117',
      gap: '12px',
    }}>
      <div style={{ fontSize: '13px', color: '#aaa', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontSize: '14px', color: '#fff', fontWeight: 500, lineHeight: 1.4 }}>{reading}</div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end',
      }}>
        <span style={{ fontSize: '10px', color, fontWeight: 700, letterSpacing: '1.5px' }}>{icon} {LEAN_LABEL[lean]}</span>
      </div>
    </div>
  );
}

// ── Target Card ───────────────────────────────────────────────────────────────
function TargetCard({ label, price, description, primary }) {
  return (
    <div style={{
      flex: 1,
      background: primary ? 'rgba(0,255,136,0.04)' : 'rgba(255,170,0,0.04)',
      border: `1px solid ${primary ? '#00ff8822' : '#ffaa0022'}`,
      borderTop: `2px solid ${primary ? '#00ff88' : '#ffaa00'}`,
      padding: '18px 20px',
      borderRadius: '2px',
    }}>
      <div style={{ fontSize: '11px', letterSpacing: '2px', color: primary ? '#00ff88' : '#ffaa00', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ fontSize: '32px', fontWeight: 700, color: '#fff', letterSpacing: '-1px', marginBottom: '10px' }}>
        ${price}
      </div>
      <div style={{ fontSize: '13px', color: '#bbb', lineHeight: 1.7 }}>{description}</div>
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
    <div style={{ padding: '28px', borderTop: '1px solid #0d1117' }}>
      <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '2px', color: '#fff', textTransform: 'uppercase', marginBottom: '20px' }}>
        Community Discussion
      </div>

      {/* Submit form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '28px', background: '#080b10', border: '1px solid #1a1a2a', padding: '20px', borderRadius: '4px' }}>
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
            }}
          />
          <div style={{ fontSize: '11px', color: '#555', alignSelf: 'center', letterSpacing: '0.5px' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '10px' }}>
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
          <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#444' }}>{text.length}/500</span>
        </div>
      </form>

      {/* Comments list */}
      {loading ? (
        <div style={{ color: '#555', fontSize: '13px', textAlign: 'center', padding: '20px' }}>Loading comments...</div>
      ) : comments.length === 0 ? (
        <div style={{ color: '#555', fontSize: '14px', textAlign: 'center', padding: '28px', border: '1px dashed #1a1a2a', borderRadius: '4px' }}>
          No comments yet. Be the first.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {comments.map((c, i) => (
            <div key={i} style={{ background: '#080b10', border: '1px solid #0d1117', padding: '16px 20px', borderRadius: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#00aaff' }}>{c.name}</span>
                <span style={{ fontSize: '11px', color: '#444' }}>{c.timeAgo || new Date(c.ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div style={{ fontSize: '14px', color: '#ddd', lineHeight: 1.7 }}>{c.text}</div>
            </div>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <div style={{ marginTop: '24px', padding: '14px 18px', background: '#06080c', border: '1px solid #111', borderRadius: '3px' }}>
        <p style={{ fontSize: '11px', color: '#555', lineHeight: 1.7, margin: 0 }}>
          <strong style={{ color: '#444' }}>NOT FINANCIAL ADVICE.</strong> All analysis on this page is for informational and educational purposes only. Roger's commentary reflects personal technical analysis and does not constitute investment advice, a solicitation, or a recommendation to buy or sell any security. Past signal accuracy is not a guarantee of future results. Always do your own research and consult a licensed financial professional before making investment decisions. Chart courtesy of{' '}
          <a href="https://www.tradingview.com" target="_blank" rel="noopener noreferrer" style={{ color: '#666', textDecoration: 'underline' }}>TradingView</a>.
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
    <div style={{ fontFamily: FONT, background: '#030608', WebkitFontSmoothing: 'antialiased' }}>

      {/* Section header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 28px', borderBottom: '1px solid #0d1117',
        background: '#040710',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '2px', color: '#fff', textTransform: 'uppercase' }}>
            Chart Analysis
          </span>
          <span style={{ fontSize: '10px', letterSpacing: '1.5px', color: '#555', textTransform: 'uppercase' }}>
            {a.timeframe} · Updated {a.updatedAt}
          </span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: `${overallColor}11`,
          border: `1px solid ${overallColor}33`,
          padding: '5px 14px', borderRadius: '20px',
        }}>
          <span style={{ fontSize: '10px', color: overallColor, fontWeight: 700, letterSpacing: '2px' }}>
            {LEAN_ICON[a.overallLean]} {LEAN_LABEL[a.overallLean]}
          </span>
        </div>
      </div>

      {/* Chart image */}
      <div style={{ padding: '24px 28px 0', position: 'relative' }}>
        {a.chartImage ? (
          <div style={{ position: 'relative', border: '1px solid #1a1a2a', borderRadius: '4px', overflow: 'hidden', lineHeight: 0 }}>
            <img
              src={a.chartImage}
              alt="TSLA Technical Analysis Chart"
              style={{ width: '100%', display: 'block' }}
            />
            <div style={{
              position: 'absolute', bottom: '10px', right: '12px',
              fontSize: '10px', color: '#555', letterSpacing: '0.5px',
              background: 'rgba(0,0,0,0.6)', padding: '3px 8px', borderRadius: '2px',
            }}>
              Chart courtesy of TradingView
            </div>
          </div>
        ) : (
          // Fallback: live TradingView widget
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
      <div style={{ padding: '24px 28px 0' }}>
        <div style={{ fontSize: '11px', letterSpacing: '2px', color: '#555', textTransform: 'uppercase', marginBottom: '4px' }}>
          Signal Scorecard
        </div>
        {a.signals.map((s, i) => (
          <SignalRow key={i} {...s} />
        ))}
      </div>

      {/* Price targets */}
      <div style={{ padding: '24px 28px 0' }}>
        <div style={{ fontSize: '11px', letterSpacing: '2px', color: '#555', textTransform: 'uppercase', marginBottom: '14px' }}>
          Price Targets
        </div>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          {a.targets.map((t, i) => (
            <TargetCard key={i} {...t} primary={i === 0} />
          ))}
        </div>
      </div>

      {/* Roger's Commentary */}
      <div style={{ padding: '24px 28px 0' }}>
        <div style={{ fontSize: '11px', letterSpacing: '2px', color: '#555', textTransform: 'uppercase', marginBottom: '14px' }}>
          Roger's Read
        </div>
        <div style={{
          background: '#060a0f',
          border: '1px solid #1a1a2a',
          borderLeft: `3px solid ${overallColor}`,
          padding: '22px 24px',
          borderRadius: '2px',
        }}>
          {a.commentary.split('\n\n').map((para, i) => (
            <p key={i} style={{
              fontSize: '15px',
              color: '#ddd',
              lineHeight: 1.85,
              margin: i === 0 ? '0 0 16px' : '0 0 16px',
              marginBottom: i === a.commentary.split('\n\n').length - 1 ? 0 : '16px',
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
