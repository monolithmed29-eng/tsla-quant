/**
 * QueryEngine.jsx
 * The unified command bar for TSLA_QUANT.
 * - Free tier: Oracle AI analysis (standard)
 * - Pro tier: Oracle Deep — fuzzy node search → graph explosion → RAG-injected AI
 *
 * Props:
 *   catalysts       — full catalyst array from data.js
 *   onGraphSearch   — fn(matchedNodeIds: string[], matchedCategories: string[]) → graph reacts
 *   onClearSearch   — fn() → reset graph to normal
 *   isMobile        — boolean
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { searchCatalysts, getMatchedCategories, buildNodeContext, smartRank, buildSmartBadge } from './useNodeSearch';
import { getCredits, decrementCredit, isPro, isInstitutional, addCredits, setProStatus, getCreditSig } from './creditManager';
import { logQuery } from './queryLogger';
import { getFingerprint } from './fingerprint';
import UpgradeModal from './UpgradeModal';
import { darkPoolData as fallbackDarkPool } from './darkPoolData';
import { fetchRemoteData } from './useRemoteData';

// ── Constants ────────────────────────────────────────────────────────────────

const CHIPS = [
  { id: 'all',           label: 'All' },
  { id: 'autonomy',      label: 'Autonomy' },
  { id: 'robotics',      label: 'Robotics / AI' },
  { id: 'product',       label: 'Product' },
  { id: 'financials',    label: 'Financials' },
  { id: 'manufacturing', label: 'Manufacturing' },
  { id: 'energy',        label: 'Energy' },
  { id: 'corporate',     label: 'Corporate' },
  { id: 'bull',          label: '🟢 Bull' },
  { id: 'bear',          label: '🔴 Bear' },
];

const LOADING_MESSAGES_FREE = [
  'Consulting TSLAquant Oracle...',
  'Processing Milestone Correlations...',
  'Scanning Neural Catalyst Network...',
  'Cross-referencing Quant Layers...',
  'Synthesizing Real-Time Intelligence...',
  'Running Probability Matrix...',
];

const LOADING_MESSAGES_DEEP = [
  'Oracle Deep: Indexing Catalyst Network...',
  'Semantic Search: Mapping Query to Live Nodes...',
  'RAG Injection: Loading Retrieved Context...',
  'Cross-referencing 34 Live Catalysts...',
  'Building Hyper-Precise Analysis...',
  'Deep Mode: Signal Extraction Complete...',
];

// ── Animations ────────────────────────────────────────────────────────────────

const CSS_ANIMATIONS = `
  textarea::-webkit-resizer {
    background: linear-gradient(135deg, transparent 50%, #fff 50%);
    border: none;
    opacity: 0.7;
  }
  textarea { scrollbar-width: thin; scrollbar-color: #333 transparent; }
  @keyframes qeCursor {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0; }
  }
  @keyframes qePulse {
    0%,100% { box-shadow: 0 0 8px 2px rgba(229,57,53,0.5), 0 0 20px 6px rgba(229,57,53,0.2); }
    50%     { box-shadow: 0 0 16px 5px rgba(229,57,53,0.8), 0 0 36px 12px rgba(229,57,53,0.35); }
  }
  @keyframes qeDeepPulse {
    0%,100% { box-shadow: 0 0 8px 2px rgba(0,170,255,0.5), 0 0 20px 6px rgba(0,170,255,0.2); }
    50%     { box-shadow: 0 0 16px 5px rgba(0,170,255,0.8), 0 0 36px 12px rgba(0,170,255,0.35); }
  }
  @keyframes qeFadeInUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes qeScanline {
    0%   { transform: translateY(-100%); }
    100% { transform: translateY(100%); }
  }
  @keyframes qeChipIn {
    from { opacity: 0; transform: scale(0.92); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes qeNodePop {
    0%   { transform: scale(0.8); opacity: 0; }
    60%  { transform: scale(1.08); opacity: 1; }
    100% { transform: scale(1); }
  }
  @keyframes qeCreditPulse {
    0%,100% { opacity: 1; }
    50%      { opacity: 0.6; }
  }
  @keyframes qeUpselFadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

// ── Main Component ────────────────────────────────────────────────────────────

export default function QueryEngine({ catalysts, onGraphSearch, onClearSearch, onSmartResult, isMobile = false }) {
  const [query, setQuery] = useState('');
  const [chip, setChip] = useState('all');
  const [phase, setPhase] = useState('idle'); // idle | searching | loading | result
  const [loadingText, setLoadingText] = useState('');
  const [result, setResult] = useState('');
  const [lastQuery, setLastQuery] = useState('');
  const [isDeep, setIsDeep] = useState(false);
  const [matchedNodes, setMatchedNodes] = useState([]);
  const [credits, setCredits] = useState(getCredits);
  const [proTier, setProTier] = useState(() => isPro() || null);
  const [fp, setFp] = useState(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState('no_credits');
  const [upsellNodes, setUpsellNodes] = useState([]);
  const [showDeepUpsell, setShowDeepUpsell] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [attachError, setAttachError] = useState('');
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const loadingIntervalRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  // Refs that mirror state for safe reading inside async closures
  const matchedNodesRef = useRef([]);
  const proTierRef = useRef(isPro() || null);

  // ── Init fingerprint + server credits ───────────────────────────────────────
  useEffect(() => {
    getFingerprint().then(async fingerprint => {
      setFp(fingerprint);
      try {
        const res = await fetch(`/api/credits?fp=${encodeURIComponent(fingerprint)}`);
        const data = await res.json();
        if (typeof data.credits === 'number') setCredits(data.credits);
        if (data.pro) { setProStatus(data.pro); setProTier(data.pro); proTierRef.current = data.pro; }
      } catch { /* localStorage fallback */ }
    });
  }, []);

  // ── Handle Stripe redirect params ───────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const upgradeParam = params.get('upgrade');
    const tokenParam = params.get('oracle_token');
    const pendingQ = params.get('q');

    if (upgradeParam === 'active_trader' || upgradeParam === 'institutional') {
      setProStatus(upgradeParam); setProTier(upgradeParam); proTierRef.current = upgradeParam;
      window.history.replaceState({}, '', window.location.pathname);
      getFingerprint().then(fingerprint => {
        fetch('/api/credits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fp: fingerprint, action: 'set_pro', tier: upgradeParam }),
        }).catch(() => {});
      });
      // If there was a pending deep query, restore and auto-fire it
      if (pendingQ) {
        const decoded = decodeURIComponent(pendingQ);
        setQuery(decoded);
        setTimeout(() => handleSubmit(decoded, true), 600);
      }
    } else if (upgradeParam === 'single') {
      window.history.replaceState({}, '', window.location.pathname);
      getFingerprint().then(fingerprint => {
        fetch('/api/credits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fp: fingerprint, action: 'add_credits' }),
        }).then(r => r.json()).then(data => {
          if (typeof data.credits === 'number') setCredits(data.credits);
        }).catch(() => { setCredits(c => c + 1); });
      });
    } else if (tokenParam) {
      sessionStorage.setItem('oracle_token', tokenParam);
      const next = addCredits(1);
      setCredits(next);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Keep refs in sync with state for safe async closure reads
  useEffect(() => { matchedNodesRef.current = matchedNodes; }, [matchedNodes]);
  useEffect(() => { proTierRef.current = proTier; }, [proTier]);

  // ── Real-time fuzzy search preview (debounced 120ms) ─────────────────────
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!query.trim() && chip === 'all') {
      setMatchedNodes([]);
      onClearSearch?.();
      return;
    }
    searchTimeoutRef.current = setTimeout(() => {
      const matches = searchCatalysts(query, catalysts, chip);
      setMatchedNodes(matches);
      if (matches.length > 0) {
        const cats = getMatchedCategories(matches);
        const ids = matches.map(n => n.id);
        onGraphSearch?.(ids, cats);
      } else {
        onClearSearch?.();
      }
    }, 120);
    return () => clearTimeout(searchTimeoutRef.current);
  }, [query, chip, catalysts]);

  // ── Loading message cycle ──────────────────────────────────────────────────
  function cycleLoading(deep = false) {
    const msgs = deep ? LOADING_MESSAGES_DEEP : LOADING_MESSAGES_FREE;
    let i = 0;
    setLoadingText(msgs[0]);
    loadingIntervalRef.current = setInterval(() => {
      i = (i + 1) % msgs.length;
      setLoadingText(msgs[i]);
    }, 900);
  }

  function stopLoading() {
    if (loadingIntervalRef.current) {
      clearInterval(loadingIntervalRef.current);
      loadingIntervalRef.current = null;
    }
  }

  useEffect(() => () => stopLoading(), []);

  // ── File attachment (Institutional only) ──────────────────────────────────
  function handleFileChange(e) {
    setAttachError('');
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) { setAttachError('Only PDF, PNG, JPG, GIF, WEBP supported.'); return; }
    if (file.size > 10 * 1024 * 1024) { setAttachError('File must be under 10MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      setAttachment({ name: file.name, base64, mediaType: file.type });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  // ── Deep Mode upsell detection ─────────────────────────────────────────────
  // Fire upsell if: free user, matches 2+ nodes that could benefit from deep analysis
  function shouldUpsellDeep(matches) {
    if (proTier) return false;
    return matches.length >= 2;
  }

  // ── Submit handler ─────────────────────────────────────────────────────────
  async function handleSubmit(q, forceDeep = false) {
    const finalQuery = (q || query).trim();
    if (!finalQuery) return;

    const pro = !!proTierRef.current;
    const currentCredits = getCredits();

    if (!pro && currentCredits <= 0 && !sessionStorage.getItem('oracle_token')) {
      setUpgradeReason('no_credits');
      setShowUpgrade(true);
      return;
    }

    const liveMatchedNodes = matchedNodesRef.current;
    const deepMode = forceDeep || (pro && liveMatchedNodes.length > 0);

    // Fire-and-forget: log query for future smartRank tuning
    logQuery({ query: finalQuery, matchedIds: liveMatchedNodes.map(n => n.id), deepMode, pro });
    setIsDeep(deepMode);
    setLastQuery(finalQuery);
    setPhase('loading');
    setShowDeepUpsell(false);
    cycleLoading(deepMode);

    // On Deep Mode: explode the matched nodes on the graph
    if (deepMode && liveMatchedNodes.length > 0) {
      const cats = getMatchedCategories(liveMatchedNodes);
      onGraphSearch?.(liveMatchedNodes.map(n => n.id), cats);
    }

    try {
      const token = sessionStorage.getItem('oracle_token') || '';
      const fingerprint = fp || await getFingerprint();

      let liveWhale = fallbackDarkPool;
      try { liveWhale = await fetchRemoteData('darkpool.json'); } catch (_) {}

      // Build node context for Deep Mode (RAG injection)
      const nodeCtx = deepMode ? buildNodeContext(liveMatchedNodes) : '';
      const queryText = nodeCtx ? `${nodeCtx} ${finalQuery}` : finalQuery;

      // Build content array — text + optional attachment (Institutional)
      const userContent = [];
      if (attachment) {
        if (attachment.mediaType === 'application/pdf') {
          userContent.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: attachment.base64 } });
        } else {
          userContent.push({ type: 'image', source: { type: 'base64', media_type: attachment.mediaType, data: attachment.base64 } });
        }
      }
      userContent.push({ type: 'text', text: queryText });

      const res = await fetch('/api/oracle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryText,
          fp: fingerprint,
          token,
          content: userContent,
          whaleScale: {
            gauge_value: liveWhale.gauge_value,
            needle_status: liveWhale.needle_status,
            roger_insight: liveWhale.roger_insight,
            updated: liveWhale.updated,
            flowLean: liveWhale.calls && liveWhale.puts
              ? liveWhale.calls.count > liveWhale.puts.count ? 'CALL HEAVY'
              : liveWhale.calls.count < liveWhale.puts.count ? 'PUT HEAVY' : 'NEUTRAL'
              : 'UNKNOWN',
          },
          deepMode,
          freeTier: !pro,
        }),
      });

      stopLoading();

      if (res.status === 402) {
        setUpgradeReason('no_credits');
        setShowUpgrade(true);
        setPhase('idle');
        return;
      }

      const data = await res.json();
      if (data.unlocked && data.result) {
        sessionStorage.removeItem('oracle_token');
        sessionStorage.removeItem('oracle_pending_query');
        if (typeof data.credits === 'number') setCredits(data.credits);
        else { const next = decrementCredit(); setCredits(next); }
        setResult(data.result);
        setPhase('result');
        setAttachment(null);

        // ── Smart Mode: fire after Pro Oracle result ──────────────────────
        if (pro && liveMatchedNodes.length > 0 && onSmartResult) {
          const cap = isMobile ? 1 : 3;
          const smartNodes = smartRank(liveMatchedNodes, finalQuery, cap);
          const smartCats = getMatchedCategories(smartNodes);
          const badge = buildSmartBadge(smartNodes);
          onSmartResult(smartNodes.map(n => n.id), smartCats, badge, finalQuery);
        }

        // After result: show deep upsell if free + good matches
        if (!pro && shouldUpsellDeep(liveMatchedNodes)) {
          setUpsellNodes(liveMatchedNodes.slice(0, 3));
          setShowDeepUpsell(true);
        }
      } else {
        setUpgradeReason('no_credits');
        setShowUpgrade(true);
        setPhase('idle');
      }
    } catch {
      stopLoading();
      setUpgradeReason('no_credits');
      setShowUpgrade(true);
      setPhase('idle');
    }
  }

  function handleReset() {
    setPhase('idle');
    setQuery('');
    setResult('');
    setLastQuery('');
    setMatchedNodes([]);
    setShowDeepUpsell(false);
    onClearSearch?.();
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  const pro = !!proTier; // reactive — updates immediately when server/Stripe sets tier
  const depleted = !pro && credits <= 0 && !sessionStorage.getItem('oracle_token');
  const accentColor = '#00aaff'; // Tesla blue for QueryEngine
  const deepAvailable = pro && matchedNodes.length > 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
      fontFamily: "'Space Grotesk', sans-serif",
      gap: 0,
    }}>
      <style>{CSS_ANIMATIONS}</style>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '14px',
        animation: 'qeFadeInUp 0.4s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: accentColor,
            display: 'inline-block',
            animation: 'qeDeepPulse 2s infinite',
          }} />
          <span style={{ fontSize: '9px', letterSpacing: '3px', color: accentColor, textTransform: 'uppercase', fontWeight: 700 }}>
            Query Engine
          </span>
          {pro && (
            <span style={{
              fontSize: '8px', letterSpacing: '2px', textTransform: 'uppercase',
              color: '#00aaff', padding: '2px 8px',
              border: '1px solid #00aaff44', background: '#00aaff11',
            }}>
              Oracle Deep Enabled
            </span>
          )}
        </div>
        {/* Credits badge */}
        {pro ? (
          <span style={{ fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: '#00ff88', padding: '2px 8px', border: '1px solid #00ff8844', background: '#00ff8811' }}>
            ✓ Pro — Unlimited
          </span>
        ) : (
          <span
            onClick={() => depleted && (setUpgradeReason('no_credits'), setShowUpgrade(true))}
            style={{
              fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase',
              color: depleted ? '#e53935' : '#ccc',
              padding: '2px 10px',
              border: `1px solid ${depleted ? '#e5393566' : '#2a2a2a'}`,
              background: depleted ? '#e5393511' : 'transparent',
              cursor: depleted ? 'pointer' : 'default',
              animation: depleted ? 'qeCreditPulse 1.5s ease-in-out infinite' : 'none',
            }}
          >
            Credits: {credits}{depleted && ' — Refill ↗'}
          </span>
        )}
      </div>

      {/* ── Command Bar ────────────────────────────────────────────────────── */}
      <div style={{
        background: '#060a10',
        border: `1px solid ${depleted ? '#e5393566' : deepAvailable ? `${accentColor}66` : '#1e2a3a'}`,
        boxShadow: deepAvailable ? `0 0 0 1px ${accentColor}22, 0 0 24px 4px ${accentColor}11` : 'none',
        transition: 'border-color 0.3s, box-shadow 0.3s',
        animation: 'qeFadeInUp 0.5s ease',
      }}
        onFocusCapture={e => {
          if (!depleted) {
            e.currentTarget.style.borderColor = deepAvailable ? accentColor : '#e53935';
            e.currentTarget.style.boxShadow = deepAvailable
              ? `0 0 0 1px ${accentColor}33, 0 0 28px 6px ${accentColor}18`
              : '0 0 0 1px #e5393533, 0 0 20px 4px #e5393518';
          }
        }}
        onBlurCapture={e => {
          e.currentTarget.style.borderColor = depleted ? '#e5393566' : deepAvailable ? `${accentColor}66` : '#1e2a3a';
          e.currentTarget.style.boxShadow = deepAvailable ? `0 0 0 1px ${accentColor}22, 0 0 24px 4px ${accentColor}11` : 'none';
        }}
      >
        {/* Prompt row */}
        <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #111820', padding: '0 4px' }}>
          <span style={{
            padding: '10px 8px 10px 16px',
            fontSize: '12px',
            color: deepAvailable ? accentColor : (depleted ? '#e5393566' : '#e53935'),
            letterSpacing: '1px',
            whiteSpace: 'nowrap',
            userSelect: 'none',
            flexShrink: 0,
            transition: 'color 0.3s',
          }}>ROGER@TSLAQUANT:~$</span>

          {/* Inline search preview chips (matched node count) */}
          {matchedNodes.length > 0 && phase === 'idle' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: '0 8px', flexShrink: 0,
              animation: 'qeChipIn 0.2s ease',
            }}>
              <span style={{
                fontSize: '9px', letterSpacing: '1.5px', textTransform: 'uppercase',
                color: deepAvailable ? accentColor : '#e53935',
                border: `1px solid ${deepAvailable ? accentColor + '44' : '#e5393544'}`,
                background: deepAvailable ? `${accentColor}11` : '#e5393511',
                padding: '2px 8px',
              }}>
                {matchedNodes.length} node{matchedNodes.length !== 1 ? 's' : ''} matched
                {deepAvailable ? ' · Deep Mode' : ''}
              </span>
            </div>
          )}

          {/* Right side: help icon */}
          <div style={{ marginLeft: 'auto', padding: '0 12px', flexShrink: 0 }}>
            <span style={{ fontSize: '10px', color: pro ? accentColor : '#888', letterSpacing: '1px', fontWeight: 600 }}>
              {pro ? '⚡ Deep' : '△ Free'}
            </span>
          </div>
        </div>

        {/* Textarea */}
        <textarea
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (phase !== 'loading' && query.trim() && !depleted) handleSubmit();
            }
          }}
          placeholder={
            depleted
              ? 'No credits remaining — upgrade to continue'
              : pro
              ? 'Query any Tesla catalyst... Oracle Deep will explode the graph →'
              : 'Ask anything about Tesla catalysts, FSD, robotaxi, earnings...'
          }
          disabled={phase === 'loading' || depleted}
          rows={isMobile ? 3 : 4}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: depleted ? '#555' : '#e8eef6',
            fontSize: '13px',
            padding: '14px 16px',
            fontFamily: 'monospace',
            letterSpacing: '0.3px',
            cursor: depleted ? 'not-allowed' : 'text',
            resize: isMobile ? 'none' : 'vertical',
            minHeight: isMobile ? '70px' : '90px',
            lineHeight: 1.6,
            boxSizing: 'border-box',
            caretColor: deepAvailable ? accentColor : '#e53935',
          }}
        />

        {/* Bottom action bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          borderTop: '1px solid #111820',
          padding: '8px 12px',
          gap: '10px',
        }}>
          {/* Paperclip — Institutional only */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            {proTier === 'institutional' ? (
              <>
                <button
                  title="Attach PDF or image"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={phase === 'loading'}
                  style={{
                    background: 'none', border: `1px solid ${attachment ? '#00ff8844' : '#1e2a3a'}`,
                    color: attachment ? '#00ff88' : '#445', padding: '4px 10px', cursor: 'pointer',
                    fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px',
                    transition: 'border-color 0.2s, color 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.color = accentColor; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = attachment ? '#00ff8844' : '#1e2a3a'; e.currentTarget.style.color = attachment ? '#00ff88' : '#445'; }}
                >
                  📎
                  <span style={{ fontSize: '8px', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: "'Space Grotesk', sans-serif", color: 'inherit' }}>
                    {attachment ? 'Attached' : 'Attach'}
                  </span>
                </button>
                <input ref={fileInputRef} type="file" accept=".pdf,image/png,image/jpeg,image/gif,image/webp" onChange={handleFileChange} style={{ display: 'none' }} />
                {attachment && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '9px', color: '#00ff88', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{attachment.name}</span>
                    <button onClick={() => setAttachment(null)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '11px', padding: '0 2px' }}>✕</button>
                  </div>
                )}
                {attachError && <span style={{ fontSize: '9px', color: '#e53935' }}>{attachError}</span>}
              </>
            ) : (
              <button
                title="Document upload — Institutional tier only"
                onClick={() => { setUpgradeReason('pdf_upload'); setShowUpgrade(true); }}
                style={{
                  background: 'none', border: '1px solid #111820',
                  color: '#2a2a2a', padding: '4px 10px', cursor: 'pointer',
                  fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px',
                  transition: 'border-color 0.2s, color 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#e5393544'; e.currentTarget.style.color = '#444'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#111820'; e.currentTarget.style.color = '#2a2a2a'; }}
              >
                📎
                <span style={{ fontSize: '8px', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: "'Space Grotesk', sans-serif", color: 'inherit' }}>Inst.</span>
              </button>
            )}
          </div>

          {/* Deep Mode indicator */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
            {deepAvailable && (
              <div style={{
                fontSize: '9px', letterSpacing: '1.5px', textTransform: 'uppercase',
                color: accentColor, display: 'flex', alignItems: 'center', gap: '6px',
                animation: 'qeChipIn 0.3s ease',
              }}>
                <span style={{
                  width: '5px', height: '5px', borderRadius: '50%',
                  background: accentColor, display: 'inline-block',
                  animation: 'qeDeepPulse 1.5s infinite',
                }} />
                Oracle Deep: {matchedNodes.length} catalyst{matchedNodes.length !== 1 ? 's' : ''} loaded as context
              </div>
            )}
            {!deepAvailable && !depleted && (
              <span style={{ fontSize: '9px', color: '#666', letterSpacing: '1px' }}>
                {pro ? 'Type to search nodes...' : 'AI analysis · Powered by Roger'}
              </span>
            )}
          </div>

          {/* Submit / Refill button */}
          {depleted ? (
            <button
              onClick={() => { setUpgradeReason('no_credits'); setShowUpgrade(true); }}
              style={{
                background: '#e53935', border: 'none', color: '#fff',
                fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase',
                padding: '8px 20px', cursor: 'pointer',
                fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600,
                animation: 'qePulse 2s infinite', whiteSpace: 'nowrap',
              }}
            >Refill Credits</button>
          ) : (
            <button
              onClick={() => handleSubmit()}
              disabled={phase === 'loading' || !query.trim()}
              style={{
                background: phase === 'loading'
                  ? (isDeep ? '#00aaff22' : '#1a0a0a')
                  : deepAvailable ? accentColor : '#e53935',
                border: 'none',
                color: '#fff',
                fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase',
                padding: '8px 20px', cursor: (phase === 'loading' || !query.trim()) ? 'not-allowed' : 'pointer',
                fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600,
                opacity: !query.trim() && phase !== 'loading' ? 0.4 : 1,
                transition: 'background 0.3s, opacity 0.2s',
                whiteSpace: 'nowrap',
                boxShadow: deepAvailable ? `0 0 16px 4px ${accentColor}44` : 'none',
              }}
            >
              {phase === 'loading' ? '⠋ Running...' : deepAvailable ? '⚡ Deep Analyze ↵' : 'Analyze ↵'}
            </button>
          )}
        </div>
      </div>

      {/* ── Category Chips ─────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: '6px', marginTop: '10px',
        flexWrap: 'wrap', animation: 'qeFadeInUp 0.6s ease',
      }}>
        {CHIPS.map(c => {
          const active = chip === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setChip(c.id)}
              style={{
                background: active ? (c.id === 'bull' ? '#00ff8818' : c.id === 'bear' ? '#e5393518' : `${accentColor}18`) : 'transparent',
                border: `1px solid ${active ? (c.id === 'bull' ? '#00ff8866' : c.id === 'bear' ? '#e5393566' : `${accentColor}88`) : '#2a3545'}`,
                color: active ? (c.id === 'bull' ? '#00ff88' : c.id === 'bear' ? '#e53935' : accentColor) : '#aab',
                fontSize: '9px', letterSpacing: '1.5px', textTransform: 'uppercase',
                padding: '4px 12px', cursor: 'pointer',
                fontFamily: "'Space Grotesk', sans-serif",
                transition: 'all 0.18s ease',
                fontWeight: active ? 700 : 400,
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = `${accentColor}88`; e.currentTarget.style.color = '#fff'; }}}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = '#1e2a3a'; e.currentTarget.style.color = '#aab'; }}}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {/* ── Matched Nodes Preview (idle state) ─────────────────────────────── */}
      {phase === 'idle' && matchedNodes.length > 0 && (
        <div style={{
          marginTop: '12px',
          display: 'flex', flexWrap: 'wrap', gap: '6px',
          animation: 'qeChipIn 0.25s ease',
        }}>
          {matchedNodes.slice(0, 6).map((n, i) => (
            <div key={n.id} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase',
              color: '#66a',
              border: '1px solid #1e2a3a',
              background: '#060a10',
              padding: '3px 10px',
              animation: `qeNodePop 0.3s ease ${i * 0.05}s both`,
            }}>
              <span style={{
                width: '5px', height: '5px', borderRadius: '50%',
                background: n.likelihood > 0.75 ? '#00ff88' : n.likelihood > 0.4 ? '#00aaff' : '#e53935',
                display: 'inline-block', flexShrink: 0,
              }} />
              {n.label}
            </div>
          ))}
          {matchedNodes.length > 6 && (
            <div style={{
              fontSize: '9px', color: '#334', letterSpacing: '1px', textTransform: 'uppercase',
              padding: '3px 10px', border: '1px solid #111820', background: 'transparent',
            }}>
              +{matchedNodes.length - 6} more
            </div>
          )}
        </div>
      )}

      {/* ── Loading ─────────────────────────────────────────────────────────── */}
      {phase === 'loading' && (
        <div style={{
          marginTop: '14px',
          background: '#060a10',
          border: `1px solid ${isDeep ? `${accentColor}44` : '#1a1a1a'}`,
          padding: '18px 20px',
          animation: 'qeFadeInUp 0.3s ease',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
            background: `linear-gradient(90deg, transparent, ${isDeep ? accentColor : '#e53935'}33, transparent)`,
            animation: 'qeScanline 2s linear infinite',
            pointerEvents: 'none',
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: isDeep ? accentColor : '#e53935', fontSize: '11px', letterSpacing: '1px' }}>
              ROGER@TSLAQUANT:~$
            </span>
            <span style={{ color: '#e8eef6', fontSize: '12px', letterSpacing: '0.5px' }}>{loadingText}</span>
            <span style={{
              display: 'inline-block', width: '8px', height: '14px',
              background: isDeep ? accentColor : '#e53935', opacity: 0.9,
              animation: 'qeCursor 0.8s step-end infinite',
            }} />
          </div>
          {isDeep && matchedNodes.length > 0 && (
            <div style={{ marginTop: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {matchedNodes.slice(0, 5).map(n => (
                <span key={n.id} style={{
                  fontSize: '8px', letterSpacing: '1px', textTransform: 'uppercase',
                  color: accentColor, border: `1px solid ${accentColor}33`,
                  background: `${accentColor}0a`, padding: '2px 8px',
                }}>
                  ◈ {n.label}
                </span>
              ))}
              {matchedNodes.length > 5 && <span style={{ fontSize: '8px', color: '#334', padding: '2px 6px' }}>+{matchedNodes.length - 5}</span>}
            </div>
          )}
        </div>
      )}

      {/* ── Result ─────────────────────────────────────────────────────────── */}
      {phase === 'result' && (
        <div style={{
          marginTop: '14px',
          background: '#060a10',
          border: `1px solid ${isDeep ? `${accentColor}55` : '#00ff8833'}`,
          animation: 'qeFadeInUp 0.4s ease',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* macOS title bar */}
          <div style={{
            padding: '7px 14px',
            background: isDeep ? '#060f18' : '#0a0f0a',
            borderBottom: `1px solid ${isDeep ? `${accentColor}22` : '#00ff8822'}`,
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff5f57', display: 'inline-block' }} />
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#febc2e', display: 'inline-block' }} />
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#28c840', display: 'inline-block' }} />
            <span style={{ fontSize: '10px', color: '#445', letterSpacing: '2px', marginLeft: '8px', textTransform: 'uppercase' }}>
              {isDeep ? '⚡ Oracle Deep — Output' : 'Oracle — Output'}
            </span>
            {isDeep && matchedNodes.length > 0 && (
              <span style={{ fontSize: '8px', color: accentColor, letterSpacing: '1px', marginLeft: 'auto' }}>
                {matchedNodes.length} nodes sourced
              </span>
            )}
          </div>

          {/* Result body */}
          <div style={{ padding: '18px 22px' }}>
            <div style={{ fontSize: '10px', color: isDeep ? accentColor : '#e53935', letterSpacing: '1px', marginBottom: '8px' }}>
              ROGER@TSLAQUANT:~$ analyze "{lastQuery}"
            </div>
            <pre style={{
              fontFamily: 'monospace',
              fontSize: '12px',
              color: isDeep ? '#c8e0ff' : '#00ff88',
              lineHeight: 1.85,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              margin: 0,
            }}>{result}</pre>
          </div>

          {/* Oracle Deep Upsell — injected inside result for free users */}
          {showDeepUpsell && !pro && (
            <div style={{
              margin: '0 22px 18px',
              background: '#060f18',
              border: `1px solid ${accentColor}44`,
              padding: '16px 18px',
              animation: 'qeUpselFadeIn 0.5s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: accentColor, display: 'inline-block',
                  animation: 'qeDeepPulse 1.5s infinite',
                }} />
                <span style={{ fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: accentColor, fontWeight: 700 }}>
                  ⚡ Oracle Deep available for this query
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#aab', lineHeight: 1.65, margin: '0 0 10px' }}>
                Roger identified{' '}
                <strong style={{ color: accentColor }}>{upsellNodes.length} live catalyst node{upsellNodes.length !== 1 ? 's' : ''}</strong>
                {' '}directly linked to your question
                {upsellNodes.length > 0 ? ` (${upsellNodes.map(n => n.label).join(', ')})` : ''}.
                {' '}Oracle Deep would explode those nodes on the graph, pull their live data as context, and deliver a sourced, hyper-precise breakdown.
              </p>
              <p style={{ fontSize: '11px', color: '#556', fontStyle: 'italic', margin: '0 0 14px' }}>
                Traders get the edge the institutions wish they had.
              </p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    const TRADER_LINK = import.meta.env.VITE_STRIPE_LINK_TRADER || '#';
                    const encoded = encodeURIComponent(lastQuery);
                    window.open(`${TRADER_LINK}?success_url=${encodeURIComponent(`${window.location.origin}/?upgrade=active_trader&q=${encoded}`)}`, '_blank');
                  }}
                  style={{
                    background: accentColor,
                    border: 'none', color: '#fff',
                    fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase',
                    padding: '9px 20px', cursor: 'pointer',
                    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
                    boxShadow: `0 0 16px 4px ${accentColor}44`,
                    transition: 'box-shadow 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 0 24px 8px ${accentColor}66`; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 0 16px 4px ${accentColor}44`; }}
                >
                  ⚡ Upgrade & Run — $29/mo
                </button>
                <button
                  onClick={() => {
                    const INST_LINK = import.meta.env.VITE_STRIPE_LINK_INST || '#';
                    const encoded = encodeURIComponent(lastQuery);
                    window.open(`${INST_LINK}?success_url=${encodeURIComponent(`${window.location.origin}/?upgrade=institutional&q=${encoded}`)}`, '_blank');
                  }}
                  style={{
                    background: 'transparent',
                    border: `1px solid ${accentColor}44`, color: accentColor,
                    fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase',
                    padding: '9px 16px', cursor: 'pointer',
                    fontFamily: "'Space Grotesk', sans-serif",
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = accentColor; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = `${accentColor}44`; }}
                >
                  Institutional — $129/mo
                </button>
              </div>
            </div>
          )}

          {/* Follow-up bar */}
          <div style={{
            borderTop: `1px solid ${isDeep ? '#0a1520' : '#0a1a0a'}`,
            padding: '12px 22px',
            background: isDeep ? '#040c14' : '#080d08',
          }}>
            <div style={{ fontSize: '10px', color: isDeep ? '#334455' : '#3a6a3a', letterSpacing: '1px', marginBottom: '8px' }}>
              — Analysis complete. Run a follow-up or new query.
            </div>
            <div
              onClick={handleReset}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: '#060a10', border: '1px solid #111820',
                padding: '9px 14px', cursor: 'text',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = isDeep ? accentColor : '#e53935'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#111820'; }}
            >
              <span style={{ color: isDeep ? accentColor : '#e53935', fontSize: '11px', letterSpacing: '1px', userSelect: 'none', whiteSpace: 'nowrap' }}>
                ROGER@TSLAQUANT:~$
              </span>
              <span style={{ color: '#223', fontSize: '12px', fontFamily: 'monospace', flex: 1 }}>New query...</span>
              <span style={{
                display: 'inline-block', width: '7px', height: '13px',
                background: isDeep ? accentColor : '#e53935', opacity: 0.7,
                animation: 'qeCursor 0.8s step-end infinite',
              }} />
            </div>
          </div>
        </div>
      )}

      {/* ── Upgrade Modal ──────────────────────────────────────────────────── */}
      {showUpgrade && (
        <UpgradeModal reason={upgradeReason} onClose={() => setShowUpgrade(false)} />
      )}
    </div>
  );
}
