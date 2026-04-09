// ─── RestoreAccess ────────────────────────────────────────────────────────────
// Modal that lets subscribers reclaim their tier on a new device
// by entering the email they used at checkout.

import { useState } from 'react';
import { setProStatus, addCredits } from './creditManager';

export default function RestoreAccess({ onClose, onRestored }) {
  const [email, setEmail]   = useState('');
  const [state, setState]   = useState('idle'); // idle | loading | success | notfound | error
  const [result, setResult] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setState('loading');
    try {
      const res = await fetch('/api/customer-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (!data.found || data.status !== 'active') {
        setState('notfound');
        return;
      }

      // Apply tier locally
      if (data.tier && data.tier !== 'single_query') {
        setProStatus(data.tier);
      }
      if (data.single_credits > 0) {
        addCredits(data.single_credits);
      }

      setResult(data);
      setState('success');
      if (onRestored) onRestored(data);
    } catch {
      setState('error');
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 11000,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
        fontFamily: "'Space Grotesk', sans-serif",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#09090b',
          border: '1px solid #1e1e1e',
          padding: '36px 32px',
          maxWidth: '420px',
          width: '100%',
          position: 'relative',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', color: '#555', fontSize: '18px', cursor: 'pointer' }}
        >✕</button>

        <div style={{ fontSize: '9px', letterSpacing: '3px', color: '#444', textTransform: 'uppercase', marginBottom: '12px' }}>
          Restore Access
        </div>
        <div style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>
          Already a subscriber?
        </div>
        <p style={{ fontSize: '13px', color: '#888', lineHeight: 1.6, marginBottom: '24px' }}>
          Enter the email you used at checkout to restore your access on this device.
        </p>

        {state === 'success' ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>✅</div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#00ff88', marginBottom: '8px' }}>
              Access Restored
            </div>
            <div style={{ fontSize: '12px', color: '#888' }}>
              {result?.tier === 'active_trader' && 'Active Trader — unlimited queries unlocked'}
              {result?.tier === 'institutional' && 'Institutional — full access unlocked'}
              {result?.single_credits > 0 && !result?.tier && `${result.single_credits} query credit${result.single_credits > 1 ? 's' : ''} added`}
            </div>
            <button
              onClick={onClose}
              style={{
                marginTop: '20px', background: '#00ff8820', border: '1px solid #00ff88',
                color: '#00ff88', fontSize: '11px', letterSpacing: '2px',
                textTransform: 'uppercase', padding: '8px 20px', cursor: 'pointer',
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              Let's Go
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{
                width: '100%', boxSizing: 'border-box',
                background: '#111', border: '1px solid #2a2a2a',
                color: '#fff', fontSize: '14px', padding: '10px 14px',
                fontFamily: "'Space Grotesk', sans-serif",
                outline: 'none', marginBottom: '12px',
              }}
              autoFocus
            />

            {state === 'notfound' && (
              <div style={{ fontSize: '12px', color: '#ff6666', marginBottom: '10px' }}>
                No active subscription found for that email. Check for typos or contact support.
              </div>
            )}
            {state === 'error' && (
              <div style={{ fontSize: '12px', color: '#ff6666', marginBottom: '10px' }}>
                Something went wrong. Try again.
              </div>
            )}

            <button
              type="submit"
              disabled={state === 'loading' || !email.trim()}
              style={{
                width: '100%', background: state === 'loading' ? '#111' : '#00ff8820',
                border: '1px solid #00ff88', color: '#00ff88',
                fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase',
                padding: '10px', cursor: state === 'loading' ? 'not-allowed' : 'pointer',
                fontFamily: "'Space Grotesk', sans-serif",
                opacity: (!email.trim() || state === 'loading') ? 0.5 : 1,
              }}
            >
              {state === 'loading' ? 'Checking...' : 'Restore Access'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
