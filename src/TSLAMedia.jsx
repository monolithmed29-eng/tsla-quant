import { useState, useEffect } from 'react';
import { MEDIA_DIGEST as PLACEHOLDER, MODEL_MOVERS, TOP_CREATORS } from './tslaMediaData';

const FONT = "'Space Grotesk', sans-serif";
const F = FONT;

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return `${Math.floor(diff / 60000)}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtViews(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return n;
}

function lastUpdatedText(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'just now';
  return `${h} hour${h !== 1 ? 's' : ''} ago`;
}

// ── Category pill ─────────────────────────────────────────────────────────────
function CatPill({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: active ? 'rgba(0,255,136,0.12)' : 'transparent',
      border: `1px solid ${active ? '#00ff88' : '#222'}`,
      borderRadius: '20px',
      color: active ? '#00ff88' : '#666',
      fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase',
      padding: '4px 12px', cursor: 'pointer', fontFamily: F,
      transition: 'all 0.15s', whiteSpace: 'nowrap',
    }}>{label}</button>
  );
}

// ── Hero Card (top video) ─────────────────────────────────────────────────────
function HeroCard({ video, onAskRoger }) {
  const isModelMover = MODEL_MOVERS.includes(video.videoId);
  return (
    <div style={{
      background: '#060a10',
      border: '1px solid #1e2a3a',
      borderTop: `3px solid ${video.curatedByRoger ? '#00ff88' : '#00aaff'}`,
      borderRadius: '4px',
      overflow: 'hidden',
      marginBottom: '24px',
    }}>
      <div style={{ display: 'flex', gap: '0', flexWrap: 'wrap' }}>
        {/* Thumbnail */}
        <a href={video.videoUrl} target="_blank" rel="noopener noreferrer"
          style={{ display: 'block', flex: '0 0 380px', maxWidth: '100%', position: 'relative', lineHeight: 0, background: '#000' }}>
          <img
            src={`https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`}
            alt={video.title}
            onError={e => { e.target.style.display='none'; }}
            style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }}
          />
          {/* Play overlay */}
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.35)', transition: 'background 0.2s',
          }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '50%',
              background: 'rgba(255,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(255,0,0,0.4)',
            }}>
              <span style={{ color: '#fff', fontSize: '20px', marginLeft: '4px' }}>▶</span>
            </div>
          </div>
          {video.curatedByRoger && (
            <div style={{
              position: 'absolute', top: '10px', left: '10px',
              background: 'rgba(0,255,136,0.9)', color: '#000',
              fontSize: '9px', fontWeight: 800, letterSpacing: '1.5px',
              padding: '3px 8px', borderRadius: '3px',
            }}>★ ROGER'S PICK</div>
          )}
          {isModelMover && (
            <div style={{
              position: 'absolute', bottom: '10px', left: '10px',
              background: 'rgba(0,170,255,0.9)', color: '#fff',
              fontSize: '9px', fontWeight: 700, letterSpacing: '1px',
              padding: '3px 8px', borderRadius: '3px',
            }}>⚡ MODEL MOVER</div>
          )}
        </a>

        {/* Content */}
        <div style={{ flex: '1 1 300px', padding: '22px 24px', minWidth: 0 }}>
          {/* Meta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '10px', letterSpacing: '1.5px', color: '#00aaff', textTransform: 'uppercase', fontWeight: 700 }}>{video.category}</span>
            <span style={{ color: '#333', fontSize: '10px' }}>·</span>
            <span style={{ fontSize: '11px', color: '#888' }}>{fmtViews(video.viewCount)} views</span>
            <span style={{ color: '#333', fontSize: '10px' }}>·</span>
            <span style={{ fontSize: '11px', color: '#666' }}>{timeAgo(video.publishedAt)}</span>
          </div>
          {/* Title */}
          <div style={{ fontSize: '17px', fontWeight: 700, color: '#fff', lineHeight: 1.4, marginBottom: '8px' }}>
            {video.title}
          </div>
          {/* Channel */}
          <a href={`https://www.youtube.com/channel/${video.channelId}`} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: '12px', color: '#888', textDecoration: 'none', display: 'block', marginBottom: '16px' }}
            onMouseEnter={e => e.target.style.color='#aaa'} onMouseLeave={e => e.target.style.color='#888'}>
            {video.channelTitle} ↗
          </a>
          {/* Bullets */}
          <div style={{ marginBottom: '20px' }}>
            {video.summaryBullets.map((b, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '7px', alignItems: 'flex-start' }}>
                <span style={{ color: '#00ff88', flexShrink: 0, marginTop: '2px', fontSize: '10px' }}>▸</span>
                <span style={{ fontSize: '13px', color: '#ccc', lineHeight: 1.6 }}>{b}</span>
              </div>
            ))}
          </div>
          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <a href={video.videoUrl} target="_blank" rel="noopener noreferrer" style={{
              background: 'rgba(0,255,136,0.12)', border: '1px solid #00ff8844',
              color: '#00ff88', fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase',
              padding: '8px 18px', borderRadius: '3px', textDecoration: 'none', fontFamily: F, fontWeight: 700,
              transition: 'all 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(0,255,136,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(0,255,136,0.12)'}
            >▶ Watch Full Video</a>
            <button onClick={() => onAskRoger(video)} style={{
              background: 'rgba(0,170,255,0.1)', border: '1px solid #00aaff44',
              color: '#00aaff', fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase',
              padding: '8px 18px', borderRadius: '3px', cursor: 'pointer', fontFamily: F, fontWeight: 700,
              transition: 'all 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(0,170,255,0.18)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(0,170,255,0.1)'}
            >Ask Roger ↗</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Grid Card ─────────────────────────────────────────────────────────────────
function VideoCard({ video, onAskRoger }) {
  const isModelMover = MODEL_MOVERS.includes(video.videoId);
  return (
    <div style={{
      background: '#060a10',
      border: '1px solid #111',
      borderTop: isModelMover ? '2px solid #00aaff' : video.curatedByRoger ? '2px solid #00ff88' : '1px solid #111',
      borderRadius: '4px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor='#1e2a3a'}
      onMouseLeave={e => e.currentTarget.style.borderColor= isModelMover ? '#00aaff' : video.curatedByRoger ? '#00ff88' : '#111'}
    >
      {/* Thumbnail */}
      <a href={video.videoUrl} target="_blank" rel="noopener noreferrer"
        style={{ display: 'block', position: 'relative', lineHeight: 0, background: '#000' }}>
        <img
          src={`https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`}
          alt={video.title}
          onError={e => { e.target.style.display='none'; }}
          style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }}
        />
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0)', transition: 'background 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(0,0,0,0.4)'}
          onMouseLeave={e => e.currentTarget.style.background='rgba(0,0,0,0)'}
        >
          <div style={{
            width: '38px', height: '38px', borderRadius: '50%',
            background: 'rgba(255,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0, transition: 'opacity 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity='1'}
          >
            <span style={{ color: '#fff', fontSize: '14px', marginLeft: '3px' }}>▶</span>
          </div>
        </div>
        {video.curatedByRoger && (
          <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(0,255,136,0.9)', color: '#000', fontSize: '8px', fontWeight: 800, letterSpacing: '1px', padding: '2px 6px', borderRadius: '2px' }}>★ PICK</div>
        )}
        {isModelMover && (
          <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(0,170,255,0.9)', color: '#fff', fontSize: '8px', fontWeight: 700, letterSpacing: '1px', padding: '2px 6px', borderRadius: '2px' }}>⚡ MODEL</div>
        )}
      </a>

      {/* Body */}
      <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '9px', color: '#00aaff', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 700 }}>{video.category}</span>
          <span style={{ color: '#333' }}>·</span>
          <span style={{ fontSize: '10px', color: '#777' }}>{fmtViews(video.viewCount)} views</span>
          <span style={{ color: '#333' }}>·</span>
          <span style={{ fontSize: '10px', color: '#555' }}>{timeAgo(video.publishedAt)}</span>
        </div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', lineHeight: 1.4, marginBottom: '6px' }}>{video.title}</div>
        <a href={`https://www.youtube.com/channel/${video.channelId}`} target="_blank" rel="noopener noreferrer"
          style={{ fontSize: '11px', color: '#666', textDecoration: 'none', marginBottom: '12px', display: 'block' }}
          onMouseEnter={e => e.target.style.color='#aaa'} onMouseLeave={e => e.target.style.color='#666'}>
          {video.channelTitle}
        </a>
        {/* Bullets */}
        <div style={{ flex: 1, marginBottom: '14px' }}>
          {video.summaryBullets.slice(0, 4).map((b, i) => (
            <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '5px', alignItems: 'flex-start' }}>
              <span style={{ color: '#00ff88', flexShrink: 0, fontSize: '9px', marginTop: '3px' }}>▸</span>
              <span style={{ fontSize: '12px', color: '#bbb', lineHeight: 1.55 }}>{b}</span>
            </div>
          ))}
        </div>
        {/* Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <a href={video.videoUrl} target="_blank" rel="noopener noreferrer" style={{
            flex: 1, textAlign: 'center',
            background: 'rgba(0,255,136,0.1)', border: '1px solid #00ff8833',
            color: '#00ff88', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase',
            padding: '7px 10px', borderRadius: '3px', textDecoration: 'none', fontFamily: F, fontWeight: 700,
          }}>▶ Watch</a>
          <button onClick={() => onAskRoger(video)} style={{
            flex: 1,
            background: 'rgba(0,170,255,0.08)', border: '1px solid #00aaff33',
            color: '#00aaff', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase',
            padding: '7px 10px', borderRadius: '3px', cursor: 'pointer', fontFamily: F, fontWeight: 700,
          }}>Ask Roger</button>
        </div>
      </div>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ filter, setFilter }) {
  return (
    <div style={{ width: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Top Creators */}
      <div style={{ background: '#060a10', border: '1px solid #111', borderRadius: '4px', padding: '16px' }}>
        <div style={{ fontSize: '10px', letterSpacing: '2px', color: '#fff', textTransform: 'uppercase', fontWeight: 700, marginBottom: '12px', borderBottom: '1px solid #111', paddingBottom: '8px' }}>
          Top Creators This Week
        </div>
        {TOP_CREATORS.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #1a2a3a, #0a1520)',
              border: '1px solid #1e2a3a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', color: '#00aaff', fontWeight: 700,
            }}>{c.name.charAt(0)}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '11px', color: '#ccc', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
              <div style={{ fontSize: '10px', color: '#555' }}>{c.views} · {c.category}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Model Movers */}
      <div style={{ background: '#060a10', border: '1px solid #00aaff22', borderTop: '2px solid #00aaff', borderRadius: '4px', padding: '16px' }}>
        <div style={{ fontSize: '10px', letterSpacing: '2px', color: '#00aaff', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
          ⚡ Moved the Model
        </div>
        <div style={{ fontSize: '10px', color: '#555', marginBottom: '12px' }}>Videos that updated our quant price</div>
        {PLACEHOLDER.videos.filter(v => MODEL_MOVERS.includes(v.videoId)).map((v, i) => (
          <a key={i} href={v.videoUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginBottom: '10px', textDecoration: 'none' }}>
            <div style={{ fontSize: '11px', color: '#ccc', lineHeight: 1.4, marginBottom: '2px' }}>{v.title.slice(0, 55)}{v.title.length > 55 ? '…' : ''}</div>
            <div style={{ fontSize: '10px', color: '#555' }}>{v.channelTitle}</div>
          </a>
        ))}
      </div>

      {/* Filter */}
      <div style={{ background: '#060a10', border: '1px solid #111', borderRadius: '4px', padding: '16px' }}>
        <div style={{ fontSize: '10px', letterSpacing: '2px', color: '#fff', textTransform: 'uppercase', fontWeight: 700, marginBottom: '12px' }}>
          Filter by Topic
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {["All", "FSD", "Optimus", "Robotaxi", "Earnings", "Cybertruck"].map(cat => (
            <button key={cat} onClick={() => setFilter(cat)} style={{
              textAlign: 'left',
              background: filter === cat ? 'rgba(0,255,136,0.08)' : 'transparent',
              border: `1px solid ${filter === cat ? '#00ff8844' : '#0d1117'}`,
              borderRadius: '3px',
              color: filter === cat ? '#00ff88' : '#666',
              fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase',
              padding: '6px 10px', cursor: 'pointer', fontFamily: F,
              transition: 'all 0.15s',
            }}>{cat}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function TSLAMedia({ onAskRogerVideo }) {
  const [filter, setFilter] = useState('All');
  const [digest, setDigest] = useState(PLACEHOLDER);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/media/daily-digest')
      .then(r => r.json())
      .then(data => {
        if (data.videos && data.videos.length > 0) setDigest(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filter === 'All'
    ? digest.videos
    : digest.videos.filter(v => v.category === filter);

  const hero = filtered[0];
  const grid = filtered.slice(1);

  const videoCount = filtered.length;
  const updatedAgo = lastUpdatedText(digest.generatedAt);

  function handleAskRoger(video) {
    // Pre-fill the Query Engine with context about this video
    if (onAskRogerVideo) onAskRogerVideo(video);
  }

  return (
    <div style={{ fontFamily: F, background: '#030608', minHeight: '100%', padding: '24px 28px 40px', boxSizing: 'border-box' }}>

      {/* Page header */}
      <div style={{ marginBottom: '24px', borderBottom: '1px solid #0d1117', paddingBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', flexWrap: 'wrap', marginBottom: '6px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '2px', color: '#fff', textTransform: 'uppercase', margin: 0 }}>
            🎬 TSLA TUBE
          </h1>
          <span style={{ fontSize: '11px', color: '#555', letterSpacing: '1px' }}>
            Today's YouTube Digest · {new Date(digest.generatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: '#888' }}>{loading ? '...' : `${videoCount} video${videoCount !== 1 ? 's' : ''}`}</span>
          <span style={{ color: '#333', fontSize: '10px' }}>·</span>
          <span style={{ fontSize: '12px', color: loading ? '#444' : '#888' }}>{loading ? 'Loading...' : `Last updated ${updatedAgo}`}</span>
          <span style={{ color: '#333', fontSize: '10px' }}>·</span>
          <span style={{ fontSize: '12px', color: '#666' }}>Curated for TSLA investors</span>
          {/* Category pills */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginLeft: '4px' }}>
            {["All", "FSD", "Optimus", "Robotaxi", "Earnings", "Cybertruck"].map(cat => (
              <CatPill key={cat} label={cat} active={filter === cat} onClick={() => setFilter(cat)} />
            ))}
          </div>
        </div>
      </div>

      {/* Body: content + sidebar */}
      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Hero */}
          {hero && <HeroCard video={hero} onAskRoger={handleAskRoger} />}

          {/* Grid */}
          {grid.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '16px',
            }}>
              {grid.map(v => (
                <VideoCard key={v.videoId} video={v} onAskRoger={handleAskRoger} />
              ))}
            </div>
          )}

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#444', fontSize: '14px' }}>
              No videos in this category today.
            </div>
          )}
        </div>

        {/* Sidebar */}
        <Sidebar filter={filter} setFilter={setFilter} />
      </div>

      {/* Footer */}
      <div style={{ marginTop: '32px', paddingTop: '16px', borderTop: '1px solid #0d1117', textAlign: 'center' }}>
        <p style={{ fontSize: '11px', color: '#444', lineHeight: 1.7, margin: 0 }}>
          AI summaries powered by Gemini · Fair-use analysis for informational purposes · Original videos on YouTube · Not affiliated with content creators
        </p>
      </div>
    </div>
  );
}
