import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';

// Returns true if the node's updated date matches today (local time)
function isUpdatedToday(updated) {
  if (!updated) return false;
  const d = new Date(updated);
  const t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
}

// ─── Constants ────────────────────────────────────────────────────────────────
const MIN_R = 8;
const MAX_R = 32;
const MASTER_R = 44;

const CATEGORY_LABELS = {
  autonomy:      'Autonomy',
  robotics:      'Robotics / AI',
  financials:    'Financials',
  product:       'Product',
  manufacturing: 'Manufacturing',
  energy:        'Energy',
  corporate:     'Corporate',
  spacex:        'SpaceX Merger',
};

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getR(node) {
  if (node.isMaster) return MASTER_R;
  const minW = 0.02, maxW = 0.15;
  const t = Math.max(0, Math.min(1, (node.weight - minW) / (maxW - minW)));
  return MIN_R + t * (MAX_R - MIN_R);
}

function getLum(likelihood) {
  if (likelihood >= 0.9) return { core: 'rgba(255,255,255,1.0)',   outerGlow: 'rgba(255,255,255,0.30)' };
  if (likelihood >= 0.7) return { core: 'rgba(220,235,255,0.95)', outerGlow: 'rgba(200,220,255,0.22)' };
  if (likelihood >= 0.5) return { core: 'rgba(180,200,230,0.85)', outerGlow: 'rgba(160,185,220,0.16)' };
  if (likelihood >= 0.3) return { core: 'rgba(130,150,190,0.70)', outerGlow: 'rgba(120,140,180,0.11)' };
  return                        { core: 'rgba(80,100,140,0.55)',  outerGlow: 'rgba(70,90,130,0.07)'  };
}

function buildMasterNode(catId, catalysts) {
  const children = catalysts.filter(c => c.category === catId);
  const avg = children.length
    ? children.reduce((s, c) => s + c.likelihood, 0) / children.length
    : 0.5;
  return {
    id: `__master_${catId}`,
    label: CATEGORY_LABELS[catId] || catId,
    isMaster: true,
    category: catId,
    likelihood: avg,
    weight: 0.15,
    childCount: children.length,
    description: [`${children.length} catalysts · ${Math.round(avg * 100)}% avg confidence`, 'Click to expand →'],
  };
}

function buildVisibleNodes(expandedSet, catalysts) {
  const result = [];
  for (const cat of ALL_CATEGORIES) {
    if (expandedSet.has(cat)) {
      result.push(...catalysts.filter(c => c.category === cat));
    } else {
      result.push(buildMasterNode(cat, catalysts));
    }
  }
  return result;
}

function resolveId(x) {
  return typeof x === 'object' && x !== null ? x.id : x;
}

function buildVisibleLinks(expandedSet, catalysts, links) {
  const seenMasterPairs = new Set();
  const seenLinks = new Set();
  const result = [];

  for (const link of links) {
    const srcId = resolveId(link.source);
    const tgtId = resolveId(link.target);
    const srcCat = catalysts.find(c => c.id === srcId)?.category;
    const tgtCat = catalysts.find(c => c.id === tgtId)?.category;
    if (!srcCat || !tgtCat) continue;

    const srcExp = expandedSet.has(srcCat);
    const tgtExp = expandedSet.has(tgtCat);

    let s, t;
    if (!srcExp && !tgtExp) {
      if (srcCat === tgtCat) continue;
      const key = [srcCat, tgtCat].sort().join('__');
      if (seenMasterPairs.has(key)) continue;
      seenMasterPairs.add(key);
      s = `__master_${srcCat}`;
      t = `__master_${tgtCat}`;
    } else if (srcExp && !tgtExp) {
      s = srcId;
      t = `__master_${tgtCat}`;
    } else if (!srcExp && tgtExp) {
      s = `__master_${srcCat}`;
      t = tgtId;
    } else {
      s = srcId;
      t = tgtId;
    }

    const key = `${s}→${t}`;
    if (seenLinks.has(key) || s === t) continue;
    seenLinks.add(key);
    result.push({ source: s, target: t });
  }

  return result;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ProgressiveGraph({ catalysts, links, onNodeClick, expandAll, onAllExpanded }) {
  const canvasRef   = useRef(null);
  const simRef      = useRef(null);
  const rafRef      = useRef(null);
  const nodesRef    = useRef([]);
  const linksRef    = useRef([]);
  const pulseRef    = useRef(0);
  const expandedRef = useRef(new Set());
  const hoveredNodeRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [allExpanded, setAllExpanded] = useState(false);
  const [anyExpanded, setAnyExpanded] = useState(false);

  // ── Build + (re)start simulation ──────────────────────────────────────────
  const rebuild = useCallback((expandedSet, prevMap) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.width  || canvas.clientWidth  || 800;
    const H = canvas.height || canvas.clientHeight || 600;

    const visNodes = buildVisibleNodes(expandedSet, catalysts);
    const visLinks = buildVisibleLinks(expandedSet, catalysts, links);

    // Carry positions; new nodes born at their master's last position
    const nodesCopy = visNodes.map(n => {
      const prev = prevMap?.get(n.id);
      if (prev) return { ...n, x: prev.x, y: prev.y, vx: prev.vx || 0, vy: prev.vy || 0 };
      const masterPrev = prevMap?.get(`__master_${n.category}`);
      const jitter = () => (Math.random() - 0.5) * 12;
      if (masterPrev) return { ...n, x: masterPrev.x + jitter(), y: masterPrev.y + jitter() };
      return { ...n, x: W / 2 + (Math.random() - 0.5) * 120, y: H / 2 + (Math.random() - 0.5) * 120 };
    });

    // Deduplicate links + filter out dangling references
    const nodeIds = new Set(nodesCopy.map(n => n.id));
    const seen = new Set();
    const linksCopy = [];
    for (const l of visLinks) {
      const s = resolveId(l.source), t = resolveId(l.target);
      const key = `${s}→${t}`;
      if (!seen.has(key) && s !== t && nodeIds.has(s) && nodeIds.has(t)) {
        seen.add(key);
        linksCopy.push({ source: s, target: t });
      }
    }

    nodesRef.current = nodesCopy;
    linksRef.current = linksCopy;

    if (simRef.current) simRef.current.stop();

    simRef.current = d3.forceSimulation(nodesCopy)
      .force('link', d3.forceLink(linksCopy).id(d => d.id)
        .distance(d => {
          const s = typeof d.source === 'object' ? d.source : nodesCopy.find(n => n.id === d.source);
          const t = typeof d.target === 'object' ? d.target : nodesCopy.find(n => n.id === d.target);
          return (s?.isMaster || t?.isMaster) ? 220 : 155;
        })
        .strength(0.35))
      .force('charge',    d3.forceManyBody().strength(n => n.isMaster ? -1100 : -550))
      .force('center',    d3.forceCenter(W / 2, H / 2).strength(0.06))
      .force('collision', d3.forceCollide(n => getR(n) + (n.isMaster ? 70 : 48)))
      .force('boundX',    d3.forceX(W / 2).strength(0.06))
      .force('boundY',    d3.forceY((H - 60) / 2).strength(0.08))
      .alpha(0.4)
      .alphaDecay(0.001)
      .velocityDecay(0.88);
  }, [catalysts, links]);

  // ── Initial mount ─────────────────────────────────────────────────────────
  useEffect(() => {
    expandedRef.current = new Set();
    rebuild(new Set(), null);
  }, [rebuild]);

  // ── Expand-all trigger from parent ────────────────────────────────────────
  useEffect(() => {
    if (!expandAll) return;
    const prevMap = new Map(nodesRef.current.map(n => [n.id, n]));
    expandedRef.current = new Set(ALL_CATEGORIES);
    rebuild(expandedRef.current, prevMap);
  }, [expandAll, rebuild]);

  // ── Draw loop ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function draw() {
      pulseRef.current += 0.025;
      const now = Date.now();
      const pulse = pulseRef.current;
      const W = canvas.width, H = canvas.height;

      ctx.clearRect(0, 0, W, H);

      // Clamp — extra bottom padding to keep nodes above the hint text
      nodesRef.current.forEach(node => {
        const r = getR(node), pad = r + 50;
        if (node.x !== undefined) node.x = Math.max(pad, Math.min(W - pad, node.x));
        if (node.y !== undefined) node.y = Math.max(pad, Math.min(H - pad - 60, node.y));
      });

      // Links
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth   = 1.2;
      linksRef.current.forEach((link, li) => {
        const src = typeof link.source === 'object' ? link.source : nodesRef.current.find(n => n.id === link.source);
        const tgt = typeof link.target === 'object' ? link.target : nodesRef.current.find(n => n.id === link.target);
        if (!src?.x || !tgt?.x) return;

        const dx = tgt.x - src.x, dy = tgt.y - src.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const mx = (src.x + tgt.x) / 2, my = (src.y + tgt.y) / 2;
        const perpX = -dy / dist, perpY = dx / dist;
        const curveOffset = dist * 0.22 * (li % 2 === 0 ? 1 : -1);
        const cpx = mx + perpX * curveOffset, cpy = my + perpY * curveOffset;

        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.quadraticCurveTo(cpx, cpy, tgt.x, tgt.y);
        ctx.stroke();

        // Electron
        const te = (pulse * 0.3 + (src.index || 0) * 0.2) % 1;
        const ex = (1-te)*(1-te)*src.x + 2*(1-te)*te*cpx + te*te*tgt.x;
        const ey = (1-te)*(1-te)*src.y + 2*(1-te)*te*cpy + te*te*tgt.y;
        ctx.beginPath();
        ctx.arc(ex, ey, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.65)';
        ctx.fill();
      });

      // Nodes
      const hoveredId = hoveredNodeRef.current?.id ?? null;
      const anyHovered = hoveredId !== null;
      nodesRef.current.forEach((node, ni) => {
        if (!node.x) return;
        const r = getR(node);
        const isHovered = node.id === hoveredId;
        const scaleFactor = isHovered ? 1.08 : 1.0;
        const { core, outerGlow } = getLum(node.likelihood);
        const firePulse = Math.sin(now * 0.002 + ni * 0.7) * 0.3 + 0.7;
        const masterMult = node.isMaster ? 1.4 : 1.0;

        // Apply scale transform for hovered node
        if (scaleFactor !== 1.0) {
          ctx.save();
          ctx.translate(node.x, node.y);
          ctx.scale(scaleFactor, scaleFactor);
          ctx.translate(-node.x, -node.y);
        }

        // Outer halo
        const outerR = r * 3.5 * firePulse * masterMult;
        const gOuter = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, outerR);
        gOuter.addColorStop(0, outerGlow);
        gOuter.addColorStop(1, 'transparent');
        ctx.beginPath(); ctx.arc(node.x, node.y, outerR, 0, Math.PI*2);
        ctx.fillStyle = gOuter; ctx.fill();

        // Mid glow
        const midR = r * 2.2 * masterMult;
        const gMid = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, midR);
        gMid.addColorStop(0, outerGlow.replace(/[\d.]+\)$/, m => `${Math.min(1, parseFloat(m)*1.6)})`) );
        gMid.addColorStop(1, 'transparent');
        ctx.beginPath(); ctx.arc(node.x, node.y, midR, 0, Math.PI*2);
        ctx.fillStyle = gMid; ctx.fill();

        // Inner glow
        const innerR = r * 1.3;
        const gInner = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, innerR);
        gInner.addColorStop(0, outerGlow.replace(/[\d.]+\)$/, m => `${Math.min(1, parseFloat(m)*3.5)})`));
        gInner.addColorStop(1, 'transparent');
        ctx.beginPath(); ctx.arc(node.x, node.y, innerR, 0, Math.PI*2);
        ctx.fillStyle = gInner; ctx.fill();

        // Core
        ctx.beginPath(); ctx.arc(node.x, node.y, r, 0, Math.PI*2);
        ctx.fillStyle = core; ctx.fill();

        // Bright center
        ctx.beginPath(); ctx.arc(node.x, node.y, r * 0.4, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.fill();

        // ── Red "updated today" pulse dot ──────────────────────────────────
        if (isUpdatedToday(node.updated)) {
          const dotX = node.x + r * 0.78;
          const dotY = node.y - r * 0.78;
          const dotR = Math.max(4, r * 0.22);
          // Fast pulse: ~0.8s cycle, opacity 0.55 → 1.0
          const dp = Math.sin(now * 0.009) * 0.225 + 0.775;
          // Soft outer glow
          const dg = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, dotR * 3);
          dg.addColorStop(0, `rgba(255,50,50,${(dp * 0.55).toFixed(2)})`);
          dg.addColorStop(1, 'transparent');
          ctx.beginPath(); ctx.arc(dotX, dotY, dotR * 3, 0, Math.PI * 2);
          ctx.fillStyle = dg; ctx.fill();
          // Solid red core
          ctx.beginPath(); ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,50,50,${dp.toFixed(2)})`;
          ctx.fill();
        }

        // ── SpaceX special: orbiting rocket ────────────────────────────────
        if (node.category === 'spacex' && !node.isMaster) {
          const orbitR = r * 2.2;
          const angle = now * 0.0012 + ni * 1.3;

          // Orbit ring
          ctx.save();
          ctx.beginPath();
          ctx.arc(node.x, node.y, orbitR, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255,255,255,0.12)';
          ctx.lineWidth = 0.8;
          ctx.setLineDash([3, 5]);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();

          // Rocket position on orbit
          const rx = node.x + Math.cos(angle) * orbitR;
          const ry = node.y + Math.sin(angle) * orbitR;

          // Rocket trail
          ctx.save();
          const trailLen = 5;
          for (let t = 0; t < trailLen; t++) {
            const ta = angle - (t + 1) * 0.18;
            const tx = node.x + Math.cos(ta) * orbitR;
            const ty = node.y + Math.sin(ta) * orbitR;
            ctx.beginPath();
            ctx.arc(tx, ty, 1.2 - t * 0.18, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${0.35 - t * 0.06})`;
            ctx.fill();
          }
          ctx.restore();

          // Rocket emoji drawn on canvas
          ctx.save();
          ctx.translate(rx, ry);
          ctx.rotate(angle + Math.PI / 2);
          ctx.font = `${Math.max(9, r * 0.55)}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🚀', 0, 0);
          ctx.restore();
        }

        // Restore scale transform after orb drawing, before label
        if (scaleFactor !== 1.0) {
          ctx.restore();
        }

        // ── Label ──────────────────────────────────────────────────────────
        // Label brightness: pure white on hovered, dimmed on others when something is hovered
        const labelAlpha = isHovered ? 1.0 : anyHovered ? 0.35 : 1.0;
        const labelColor = `rgba(255,255,255,${labelAlpha})`;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.shadowColor = 'rgba(0,0,0,0.95)';
        ctx.shadowBlur = isHovered ? 14 : 10;

        const labelY = node.y + r + (node.isMaster ? 13 : 9);

        if (node.isMaster) {
          ctx.font = "700 13px 'Space Grotesk', sans-serif";
          ctx.fillStyle = labelColor;
          ctx.fillText(node.label, node.x, labelY);

          ctx.font = "500 11px 'Space Grotesk', sans-serif";
          ctx.fillStyle = isHovered ? 'rgba(180,210,255,1)' : `rgba(180,210,255,${labelAlpha})`;
          ctx.fillText(`${Math.round(node.likelihood * 100)}%  ·  ${node.childCount} catalysts`, node.x, labelY + 17);
        } else {
          ctx.font = "600 11px 'Space Grotesk', sans-serif";
          ctx.fillStyle = labelColor;
          const lbl = node.label;
          if (lbl.length > 18) {
            const words = lbl.split(' ');
            const mid = Math.ceil(words.length / 2);
            ctx.fillText(words.slice(0, mid).join(' '), node.x, labelY);
            ctx.fillText(words.slice(mid).join(' '),    node.x, labelY + 14);
          } else {
            ctx.fillText(lbl, node.x, labelY);
          }
        }
        ctx.restore();
      });

      rafRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  // ── Resize ────────────────────────────────────────────────────────────────
  useEffect(() => {
    function onResize() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width  = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
      if (simRef.current) {
        const W = canvas.width, H = canvas.height;
        simRef.current
          .force('center', d3.forceCenter(W/2, H/2).strength(0.08))
          .force('boundX', d3.forceX(W/2).strength(0.08))
          .force('boundY', d3.forceY(H/2).strength(0.08))
          .alpha(0.5).restart();
      }
    }
    window.addEventListener('resize', onResize);
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ── Mouse ─────────────────────────────────────────────────────────────────
  function getNodeAt(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    for (const node of nodesRef.current) {
      const r = getR(node);
      const dx = (node.x||0) - mx, dy = (node.y||0) - my;
      if (Math.sqrt(dx*dx + dy*dy) < r + 8) return { node, mx: e.clientX, my: e.clientY };
    }
    return null;
  }

  function handleMouseMove(e) {
    const hit = getNodeAt(e);
    if (hit) {
      hoveredNodeRef.current = hit.node;
      setTooltip({ node: hit.node, x: hit.mx, y: hit.my });
      canvasRef.current.style.cursor = 'crosshair';
    } else {
      hoveredNodeRef.current = null;
      setTooltip(null);
      canvasRef.current.style.cursor = 'crosshair';
    }
  }

  function handleClick(e) {
    const hit = getNodeAt(e);
    if (!hit) return;
    const { node } = hit;

    if (node.isMaster) {
      const prevMap = new Map(nodesRef.current.map(n => [n.id, { ...n }]));
      expandedRef.current.add(node.category);
      setAnyExpanded(true);
      rebuild(expandedRef.current, prevMap);
      // If all categories are now expanded, notify parent
      if (expandedRef.current.size >= ALL_CATEGORIES.length) {
        setAllExpanded(true);
        onAllExpanded?.();
      }
    } else {
      onNodeClick(node);
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%', cursor: 'crosshair' }}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
      />

      {/* Hint — hidden once all nodes expanded */}
      {!allExpanded && !expandAll && !anyExpanded && (
        <div style={{
          position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          fontSize: '10px', color: 'rgba(255,255,255,0.9)',
          letterSpacing: '2.5px', textTransform: 'uppercase',
          fontFamily: "'Space Grotesk', sans-serif", pointerEvents: 'none', whiteSpace: 'nowrap',
          textShadow: '0 0 12px rgba(255,255,255,0.8), 0 0 28px rgba(255,255,255,0.4)',
        }}>
          Click any node to expand · Click Full Network to reveal all
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.x + 16,
          top: tooltip.y - 10,
          background: 'rgba(0,0,0,0.92)',
          border: '1px solid rgba(200,220,255,0.35)',
          padding: '9px 14px',
          pointerEvents: 'none',
          zIndex: 2000,
          fontFamily: "'Space Grotesk', sans-serif",
          maxWidth: '220px',
          boxShadow: '0 0 20px rgba(200,220,255,0.15)',
        }}>
          <div style={{ fontWeight: 700, fontSize: '13px', color: '#fff', marginBottom: '5px' }}>
            {tooltip.node.label}
          </div>
          {tooltip.node.isMaster ? (
            <>
              <div style={{ fontSize: '11px', color: 'rgba(180,210,255,0.8)', marginBottom: '4px' }}>
                {tooltip.node.childCount} catalysts · {Math.round(tooltip.node.likelihood * 100)}% avg confidence
              </div>
              <div style={{ fontSize: '10px', color: '#555', letterSpacing: '1px' }}>
                CLICK TO EXPAND →
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: '11px', color: 'rgba(200,220,255,0.8)', marginBottom: '3px' }}>
                {Math.round(tooltip.node.likelihood * 100)}% likelihood
              </div>
              <div style={{ fontSize: '10px', color: '#555', letterSpacing: '1px' }}>
                CLICK FOR ANALYSIS →
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
