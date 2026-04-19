import { useState, useEffect } from 'react';
import { ANALYSIS } from './rogerAnalysis';

// Inject once — forces all children to stay within the modal width
const CA_STYLE = `
  .ca-root, .ca-root * {
    max-width: 100%;
    box-sizing: border-box;
  }
  .ca-root p, .ca-root div, .ca-root span {
    word-break: break-word;
    overflow-wrap: break-word;
  }
`;

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
      padding: '12px 0',
      borderBottom: '1px solid #0d1117',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <div style={{ fontSize: '12px', color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase' }}>{label}</div>
        <div style={{ flexShrink: 0 }}>
          <span style={{ fontSize: '11px', color, fontWeight: 700, letterSpacing: '1.5px', whiteSpace: 'nowrap' }}>{icon} {LEAN_LABEL[lean]}</span>
        </div>
      </div>
      <div style={{ fontSize: '14px', color: '#fff', fontWeight: 500, lineHeight: 1.6 }}>{reading}</div>
    </div>
  );
}

// ── Target Card ───────────────────────────────────────────────────────────────
function TargetCard({ label, price, description, primary }) {
  return (
    <div style={{
      width: '100%',
      boxSizing: 'border-box',
      background: primary ? 'rgba(0,255,136,0.04)' : 'rgba(255,170,0,0.04)',
      border: `1px solid ${primary ? '#00ff8833' : '#ffaa0033'}`,
      borderTop: `2px solid ${primary ? '#00ff88' : '#ffaa00'}`,
      padding: '18px 20px',
      borderRadius: '2px',
    }}>
      <div style={{ fontSize: '11px', letterSpacing: '2px', color: primary ? '#00ff88' : '#ffaa00', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ fontSize: '30px', fontWeight: 700, color: '#fff', letterSpacing: '-1px', marginBottom: '10px' }}>
        ${price}
      </div>
      <div style={{ fontSize: '13px', color: '#ccc', lineHeight: 1.75, wordBreak: 'break-word', overflowWrap: 'break-word' }}>{description}</div>
    </div>
  );
}

// ── Chart Lightbox ────────────────────────────────────────────────────────────
function ChartLightbox({ src, onClose }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
        cursor: 'zoom-out',
      }}
    >
      <div style={{ position: 'relative', maxWidth: '100%', maxHeight: '100%' }} onClick={e => e.stopPropagation()}>
        <img
          src={src}
          alt="TSLA Chart — expanded"
          style={{ maxWidth: '90vw', maxHeight: '90vh', display: 'block', borderRadius: '4px', border: '1px solid #2a2a3a' }}
        />
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '-14px', right: '-14px',
            background: '#111', border: '1px solid #444', color: '#fff',
            borderRadius: '50%', width: '32px', height: '32px',
            fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: FONT,
          }}
        >✕</button>
      </div>
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
    <div style={{ padding: '28px 24px', borderTop: '1px solid #0d1117', width: '100%', boxSizing: 'border-box' }}>
      <SectionTitle>Community Discussion</SectionTitle>

      {/* Submit form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '28px', background: '#080b10', border: '1px solid #1a1a2a', padding: '18px', borderRadius: '4px', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name / handle"
            maxLength={40}
            style={{
              flex: '0 0 180px',
              background: '#030608',
              border: '1px solid #1e2a3a',
              color: '#fff',
              fontSize: '14px',
              padding: '10px 12px',
              fontFamily: FONT,
              outline: 'none',
              borderRadius: '3px',
            }}
          />
          <div style={{ fontSize: '12px', color: '#888', alignSelf: 'center' }}>
            No account needed.
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
            padding: '10px 12px',
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
            <div key={i} style={{ background: '#080b10', border: '1px solid #0d1117', padding: '16px 18px', borderRadius: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#00aaff' }}>{c.name}</span>
                <span style={{ fontSize: '11px', color: '#666' }}>{c.timeAgo || new Date(c.ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
              <div style={{ fontSize: '14px', color: '#ddd', lineHeight: 1.7 }}>{c.text}</div>
            </div>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <div style={{ marginTop: '24px', padding: '16px 18px', background: '#06080c', border: '1px solid #222', borderLeft: '3px solid #444', borderRadius: '3px' }}>
        <p style={{ fontSize: '12px', color: '#aaa', lineHeight: 1.8, margin: 0, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
          <strong style={{ color: '#fff' }}>⚠ NOT FINANCIAL ADVICE.</strong>{' '}
          All analysis is for informational and educational purposes only. Roger's commentary reflects personal technical analysis and does not constitute investment advice, a solicitation, or a recommendation to buy or sell any security. Past signal accuracy is not a guarantee of future results. Always do your own research and consult a licensed financial professional before making investment decisions.{' '}
          Chart courtesy of <a href="https://www.tradingview.com" target="_blank" rel="noopener noreferrer" style={{ color: '#aaa', textDecoration: 'underline' }}>TradingView</a>.
        </p>
      </div>
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function ChartAnalysis() {
  const a = ANALYSIS;
  const overallColor = LEAN_COLOR[a.overallLean] || '#aaa';
  const [lightbox, setLightbox] = useState(false);

  return (
    <div className="ca-root" style={{ fontFamily: FONT, background: '#030608', WebkitFontSmoothing: 'antialiased' }}>
      <style>{CA_STYLE}</style>

      {/* Lightbox */}
      {lightbox && a.chartImage && <ChartLightbox src={a.chartImage} onClose={() => setLightbox(false)} />}

      {/* Section header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px', borderBottom: '1px solid #0d1117',
        background: '#040710', gap: '10px', flexWrap: 'wrap',
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
      <div style={{ padding: '20px 24px 0', width: '100%', boxSizing: 'border-box' }}>
        {a.chartImage ? (
          <div
            onClick={() => setLightbox(true)}
            style={{
              position: 'relative', border: '1px solid #1a1a2a', borderRadius: '4px',
              overflow: 'hidden', lineHeight: 0, cursor: 'zoom-in',
            }}
          >
            <img
              src={a.chartImage}
              alt="TSLA Technical Analysis Chart"
              style={{ width: '100%', display: 'block' }}
            />
            {/* Zoom hint */}
            <div style={{
              position: 'absolute', top: '10px', right: '12px',
              fontSize: '11px', color: '#ccc', letterSpacing: '0.5px',
              background: 'rgba(0,0,0,0.65)', padding: '4px 10px', borderRadius: '12px',
              display: 'flex', alignItems: 'center', gap: '5px',
            }}>
              🔍 Click to expand
            </div>
            <div style={{
              position: 'absolute', bottom: '10px', right: '12px',
              fontSize: '10px', color: '#bbb',
              background: 'rgba(0,0,0,0.65)', padding: '3px 8px', borderRadius: '2px',
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
      <div style={{ padding: '20px 24px 0', width: '100%', boxSizing: 'border-box' }}>
        <SectionTitle>Signal Scorecard</SectionTitle>
        {a.signals.map((s, i) => (
          <SignalRow key={i} {...s} />
        ))}
      </div>

      {/* Price targets */}
      <div style={{ padding: '20px 24px 0', width: '100%', boxSizing: 'border-box' }}>
        <SectionTitle>Price Targets</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {a.targets.map((t, i) => (
            <TargetCard key={i} {...t} primary={i === 0} />
          ))}
        </div>
      </div>

      {/* Roger's Read */}
      <div style={{ padding: '20px 24px 0', width: '100%', boxSizing: 'border-box' }}>
        <SectionTitle>Roger's Read</SectionTitle>
        <div style={{
          background: '#060a0f',
          border: '1px solid #1a1a2a',
          borderLeft: `3px solid ${overallColor}`,
          padding: '20px 22px',
          borderRadius: '2px',
          width: '100%',
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
              overflowWrap: 'break-word',
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
