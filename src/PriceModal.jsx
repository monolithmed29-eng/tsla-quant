import { useEffect, useRef } from 'react';

const UNIT_DESCRIPTIONS = {
  spacex: {
    icon: '🚀',
    summary: (v, score) =>
      `The wildcard. In March 2026, Tesla's $2B xAI investment was converted into SpaceX shares following SpaceX's acquisition of xAI — giving Tesla its first direct equity stake in SpaceX. At ${score}% confidence, contributing $${v}/share. The thesis: Musk's "system-of-systems" vision converges Tesla (energy/transport/robotics) with SpaceX (launch/Starlink/interplanetary). Even without a full merger, Starlink integration in Tesla vehicles and shared AI/robotics R&D represent compounding synergies. A formal merger would collapse the valuation gap between public Tesla and private SpaceX (~$350B latest round) — the bull case is unlike anything currently modeled by Wall Street.`,
    drivers: ['Cross-equity stake deepens (Mar 2026 inflection)', 'Starlink standard in Tesla vehicles', 'Formal merger or JV announced', 'Shared Optimus/SpaceX actuator R&D', 'SpaceX IPO or public listing pathway'],
  },
  auto: {
    icon: '🚗',
    summary: (v, score) =>
      `At ${score}% catalyst confidence, the core auto business contributes $${v}/share. Built on ${score >= 60 ? 'a recovering delivery trajectory, improving gross margins, and Cybercab volume adding a new revenue category' : 'cautious assumptions around continued delivery headwinds and BYD competitive pressure'}. Unboxed manufacturing and the refreshed Model Y are the key swing factors.`,
    drivers: ['Cybercab production ramp', 'Delivery volume rebound', 'Gross margin recovery', 'Model Y Juniper global rollout', '$25K affordable model'],
  },
  energy: {
    icon: '⚡',
    summary: (v, score) =>
      `Energy was Tesla's fastest-growing segment — $12.8B revenue in 2025, up 30% YoY. Q1 2026 delivered 8.8 GWh, down 15% vs Q1 2025 (10.4 GWh) and sharply below Q4 2025's record 14.2 GWh. The backlog remains 2–3 years deep, suggesting supply/timing rather than demand is the issue — but Q2 2026 is a critical proof point. At ${score}% confidence, contributing $${v}/share.`,
    drivers: ['Q2 2026 deployment recovery', 'Megapack utility deployments', 'Powerwall 3 residential ramp', 'Virtual Power Plant scale', 'Energy gross margin expansion'],
  },
  robotaxi: {
    icon: '🤖',
    summary: (v, score) =>
      `The highest-optionality unit. Cern Basher models a 10M-vehicle fleet by 2030 at $90/day net = $329B/yr net income at scale. BofA values the robotaxi business at ~$750B alone. At ${score}% confidence, contributing $${v}/share. Austin is live and expanding — the Colorado River geofence crossing on Mar 31 was a major signal. 7-city expansion imminent.`,
    drivers: ['Unsupervised geofence expansion (Austin)', 'Multi-city launch: Vegas, Dallas, Miami…', 'FSD v14.3 wide release', 'Cybercab production start', 'Federal AV regulatory approval'],
  },
  optimus: {
    icon: '🦾',
    summary: (v, score) =>
      `Musk's long-term thesis: Optimus becomes 80% of Tesla's total value. Highly speculative near-term — contributing $${v}/share at ${score}% confidence. Model S/X production ending Q2 2026 frees factory floor for Optimus ramp. Internal factory deployment is the proof-of-concept gate before external sales unlock the $6T TAM.`,
    drivers: ['Gen 3 reveal (delayed — April expected)', 'Internal factory deployment at Giga Texas', 'Pilot production ramp Q3 2026', 'External customer sales Q4 2026+'],
  },
  fsd_sw: {
    icon: '🧠',
    summary: (v, score) =>
      `1.1M FSD subscribers at $99–199/mo = $1.3–2.6B ARR at near 100% gross margin. At ${score}% confidence, contributing $${v}/share. The big unlock is OEM licensing — even one deal transforms this into a high-multiple software business. Netherlands RDW approval (April 10) opens the European subscriber market.`,
    drivers: ['FSD v14.3 wide release', 'European approval (Netherlands April 10)', 'OEM licensing deal', 'Subscriber growth to 3M+ by 2027'],
  },
  ai_infra: {
    icon: '💻',
    summary: (v, score) =>
      `Early stage. Dojo supercomputer reduces Tesla's $1B+/yr Nvidia dependency and could become an external AI training service. HW5 chip targets on-device inference without cloud dependency. At ${score}% confidence, contributing $${v}/share — high optionality, low near-term certainty.`,
    drivers: ['Dojo v2 exaFLOP expansion', 'HW5 in-vehicle AI chip', 'AI inference revenue (external)'],
  },
};

const CATEGORY_COLOR = {
  auto:     '#a78bfa',
  energy:   '#fb923c',
  robotaxi: '#38bdf8',
  optimus:  '#34d399',
  fsd_sw:   '#60a5fa',
  ai_infra: '#f472b6',
  spacex:   '#e2e8f0',
};

export default function PriceModal({ breakdown, total, livePrice, quantChange, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const maxVal = Math.max(...breakdown.map(u => u.bull));

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 600,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <div ref={ref} style={{
        background: '#080808',
        border: '1px solid #1e1e1e',
        width: '100%',
        maxWidth: '860px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '40px 44px',
        position: 'relative',
      }}>

        {/* Close */}
        <button onClick={onClose} style={{
          position: 'absolute', top: '16px', right: '20px',
          background: 'none', border: 'none', color: '#888', fontSize: '20px',
          cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1,
        }}
          onMouseEnter={e => e.target.style.color = '#aaa'}
          onMouseLeave={e => e.target.style.color = '#888'}
        >✕</button>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '9px', letterSpacing: '4px', color: '#aaa', textTransform: 'uppercase', marginBottom: '10px' }}>
            Sum-of-Parts Valuation · Cern Basher / InvestAnswers Framework
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '20px', flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontSize: '11px', color: '#bbb', letterSpacing: '2px', textTransform: 'uppercase' }}>Quant Model</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                <div style={{ fontSize: '48px', fontWeight: 700, color: '#00ff88', letterSpacing: '-1px', lineHeight: 1.1 }}>
                  ${total}
                </div>
                {quantChange !== null && (
                  <div style={{
                    fontSize: '18px', fontWeight: 600,
                    color: quantChange >= 0 ? '#00ff88' : '#ff4444',
                    lineHeight: 1.1,
                  }}>
                    ({quantChange >= 0 ? '+' : ''}{quantChange.toFixed(0)})
                  </div>
                )}
              </div>
              {quantChange !== null && (
                <div style={{ fontSize: '11px', color: '#999', lineHeight: 1.6, marginTop: '6px', maxWidth: '520px' }}>
                  <span style={{ color: quantChange >= 0 ? '#00ff8899' : '#ff444499', fontWeight: 600 }}>
                    {quantChange >= 0 ? '+' : ''}{quantChange} pts
                  </span>
                  {' '}since last update —{' '}
                  {quantChange < 0
                    ? `Apr 12, 2026 update: Morgan Stanley calls robotaxi pickup/dropoff challenges 'solvable' and projects more unsupervised miles in 2026; Tesla Robotaxi app receives major update, signaling imminent multi-city expansion.`
                    : `Apr 12, 2026 update: Morgan Stanley calls robotaxi pickup/dropoff challenges 'solvable' and projects more unsupervised miles in 2026; Tesla Robotaxi app receives major update, signaling imminent multi-city expansion.`
                  }
                </div>
              )}
            </div>
            {livePrice && (
              <>
                <div style={{ color: '#666', fontSize: '28px', alignSelf: 'center' }}>vs</div>
                <div>
                  <span style={{ fontSize: '11px', color: '#bbb', letterSpacing: '2px', textTransform: 'uppercase' }}>TSLA Live</span>
                  <div style={{ fontSize: '48px', fontWeight: 700, color: '#00aaff', letterSpacing: '-1px', lineHeight: 1.1 }}>
                    ${livePrice.toFixed(0)}
                  </div>
                </div>
                <div style={{ alignSelf: 'center', marginLeft: '4px' }}>
                  <div style={{ fontSize: '11px', color: '#bbb', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>Implied Upside</div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: total > livePrice ? '#00ff88' : '#ff4444' }}>
                    {total > livePrice ? '+' : ''}{(((total - livePrice) / livePrice) * 100).toFixed(0)}%
                  </div>
                </div>
              </>
            )}
          </div>
          <p style={{ fontSize: '13px', color: '#aaa', lineHeight: 1.7, marginTop: '14px', maxWidth: '640px' }}>
            Each business unit is valued independently using bear / base / bull scenarios. The current model price is dynamically interpolated from live catalyst confidence scores — as milestones are achieved, the price target updates in real time.
          </p>
        </div>

        <div style={{ width: '100%', height: '1px', background: '#111', marginBottom: '32px' }} />

        {/* Unit breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {breakdown.map(unit => {
            const color = CATEGORY_COLOR[unit.id] || '#aaa';
            const desc = UNIT_DESCRIPTIONS[unit.id];
            const range = unit.bull - unit.bear;
            // Normalize to unit's own bear→bull range so fill aligns with Bear/Base/Bull labels
            const barPct  = Math.min(100, Math.max(0, ((unit.value - unit.bear) / range) * 100));
            const basePct = ((unit.base  - unit.bear) / range) * 100;

            return (
              <div key={unit.id} style={{
                background: '#0d0d0d',
                border: '1px solid #161616',
                padding: '20px 24px',
              }}>
                {/* Unit header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '18px' }}>{desc?.icon}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff', letterSpacing: '0.5px' }}>{unit.label}</span>
                    <span style={{
                      fontSize: '9px', letterSpacing: '1.5px', color: color,
                      textTransform: 'uppercase', border: `1px solid ${color}44`,
                      padding: '2px 7px',
                    }}>
                      {unit.score}% confidence
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '26px', fontWeight: 700, color: color }}>${unit.value}</span>
                    <span style={{ fontSize: '11px', color: '#999', marginLeft: '6px' }}>/share</span>
                  </div>
                </div>

                {/* Bar chart — bear / current / base / bull */}
                <div style={{ marginBottom: '16px' }}>
                  {/* Track */}
                  <div style={{ position: 'relative', height: '6px', background: '#1a1a1a', borderRadius: '3px', marginBottom: '8px' }}>
                    {/* Base marker at 50% */}
                    <div style={{ position: 'absolute', left: `${basePct}%`, top: '-4px', width: '1px', height: '14px', background: '#333' }} />
                    {/* Fill — normalized to bear→bull range */}
                    <div style={{
                      position: 'absolute', left: 0, top: 0,
                      width: `${barPct}%`, height: '100%',
                      background: `linear-gradient(90deg, ${color}66, ${color})`,
                      borderRadius: '3px',
                      boxShadow: `0 0 8px ${color}66`,
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                  {/* Labels */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#555', letterSpacing: '1px' }}>
                    <span>Bear ${unit.bear}</span>
                    <span style={{ color: '#666' }}>Base ${unit.base}</span>
                    <span>Bull ${unit.bull}</span>
                  </div>
                </div>

                {/* Summary text */}
                {desc && (
                  <p style={{ fontSize: '12px', color: '#bbb', lineHeight: 1.7, margin: '0 0 14px 0' }}>
                    {desc.summary(unit.value, unit.score)}
                  </p>
                )}

                {/* Key drivers */}
                {desc?.drivers && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {desc.drivers.map(d => (
                      <span key={d} style={{
                        fontSize: '9px', letterSpacing: '1px', color: '#999',
                        border: '1px solid #333', padding: '3px 8px',
                        textTransform: 'uppercase',
                      }}>{d}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid #111', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontSize: '10px', color: '#999', letterSpacing: '1px', lineHeight: 1.7 }}>
            Model informed by Cern Basher (@CernBasher) · InvestAnswers (James Douma) · Morgan Stanley · BofA SOTP<br />
            Not investment advice. Probability-weighted scenarios — not predictions.
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: '1px solid #222', color: '#999',
            fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase',
            padding: '7px 18px', cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif",
          }}
            onMouseEnter={e => { e.target.style.borderColor = '#888'; e.target.style.color = '#fff'; }}
            onMouseLeave={e => { e.target.style.borderColor = '#555'; e.target.style.color = '#aaa'; }}
          >Close</button>
        </div>
      </div>
    </div>
  );
}
