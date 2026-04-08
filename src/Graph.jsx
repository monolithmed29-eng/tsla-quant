import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const MIN_R = 8;
const MAX_R = 32;

function getNodeRadius(weight) {
  const minW = 0.02, maxW = 0.15;
  const t = (weight - minW) / (maxW - minW);
  return MIN_R + t * (MAX_R - MIN_R);
}

// Returns { core, outerGlow } rgba strings based on likelihood
function getLuminescence(likelihood) {
  if (likelihood >= 0.9) {
    return { core: 'rgba(255,255,255,1.0)', outerGlow: 'rgba(255,255,255,0.25)' };
  } else if (likelihood >= 0.7) {
    return { core: 'rgba(220,235,255,0.95)', outerGlow: 'rgba(200,220,255,0.18)' };
  } else if (likelihood >= 0.5) {
    return { core: 'rgba(180,200,230,0.85)', outerGlow: 'rgba(160,185,220,0.13)' };
  } else if (likelihood >= 0.3) {
    return { core: 'rgba(130,150,190,0.70)', outerGlow: 'rgba(120,140,180,0.09)' };
  } else {
    return { core: 'rgba(80,100,140,0.55)', outerGlow: 'rgba(70,90,130,0.06)' };
  }
}

// Returns true if the node's updated date is today (local time)
function isUpdatedToday(updated) {
  if (!updated) return false;
  const nodeDate = new Date(updated);
  const today = new Date();
  return (
    nodeDate.getFullYear() === today.getFullYear() &&
    nodeDate.getMonth() === today.getMonth() &&
    nodeDate.getDate() === today.getDate()
  );
}

export default function Graph({ nodes, links, onNodeClick }) {
  const canvasRef = useRef(null);
  const simRef = useRef(null);
  const animFrameRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const nodesRef = useRef([]);
  const linksRef = useRef([]);
  const pulseRef = useRef(0);
  const hoveredNodeRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Build node/link copies for simulation
    const nodesCopy = nodes.map(n => ({ ...n }));
    const linksCopy = links.map(l => ({ ...l }));
    nodesRef.current = nodesCopy;
    linksRef.current = linksCopy;

    // Use live canvas dimensions — never stale
    const getW = () => canvas.width;
    const getH = () => canvas.height;

    const sim = d3.forceSimulation(nodesCopy)
      .force('link', d3.forceLink(linksCopy).id(d => d.id).distance(160).strength(0.4))
      .force('charge', d3.forceManyBody().strength(-600))
      .force('center', d3.forceCenter(getW() / 2, getH() / 2).strength(0.08))
      .force('collision', d3.forceCollide(d => getNodeRadius(d.weight) + 52))
      .force('boundX', d3.forceX(getW() / 2).strength(0.08))
      .force('boundY', d3.forceY(getH() / 2).strength(0.08));

    simRef.current = sim;

    function draw() {
      pulseRef.current += 0.025;
      const pulse = pulseRef.current;
      const now = Date.now();
      const W = getW();
      const H = getH();

      ctx.clearRect(0, 0, W, H);

      // Draw links (curvy, whitish)
      linksRef.current.forEach((link, linkIndex) => {
        const src = link.source;
        const tgt = link.target;
        if (!src.x || !tgt.x) return;

        const dx = tgt.x - src.x;
        const dy = tgt.y - src.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        // Perpendicular control point for quadratic bezier
        const mx = (src.x + tgt.x) / 2;
        const my = (src.y + tgt.y) / 2;
        const perpX = -dy / dist;
        const perpY = dx / dist;
        const curveOffset = dist * 0.22 * (linkIndex % 2 === 0 ? 1 : -1);
        const cpx = mx + perpX * curveOffset;
        const cpy = my + perpY * curveOffset;

        // Draw curved link
        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.quadraticCurveTo(cpx, cpy, tgt.x, tgt.y);
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Animated "electron" traveling along the bezier curve
        const t = (pulse * 0.3 + (src.index || 0) * 0.2) % 1;
        const ex = (1 - t) * (1 - t) * src.x + 2 * (1 - t) * t * cpx + t * t * tgt.x;
        const ey = (1 - t) * (1 - t) * src.y + 2 * (1 - t) * t * cpy + t * t * tgt.y;
        ctx.beginPath();
        ctx.arc(ex, ey, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fill();
      });

      // Clamp nodes to canvas bounds
      nodesRef.current.forEach(node => {
        const r = getNodeRadius(node.weight);
        const pad = r + 50;
        if (node.x !== undefined) node.x = Math.max(pad, Math.min(W - pad, node.x));
        if (node.y !== undefined) node.y = Math.max(pad, Math.min(H - pad, node.y));
      });

      // Draw nodes (white luminescent orbs)
      nodesRef.current.forEach((node, nodeIndex) => {
        if (!node.x) return;
        const r = getNodeRadius(node.weight);
        const { core, outerGlow } = getLuminescence(node.likelihood);

        // Per-node independent breathing pulse
        const firePulse = Math.sin(now * 0.002 + nodeIndex * 0.7) * 0.3 + 0.7;

        // Outer halo (breathes)
        const outerR = r * 3.5 * firePulse;
        const gradOuter = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, outerR);
        gradOuter.addColorStop(0, outerGlow);
        gradOuter.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(node.x, node.y, outerR, 0, Math.PI * 2);
        ctx.fillStyle = gradOuter;
        ctx.fill();

        // Mid glow (slightly brighter, smaller)
        const midR = r * 2.2;
        const gradMid = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, midR);
        gradMid.addColorStop(0, outerGlow.replace(/[\d.]+\)$/, m => `${Math.min(1, parseFloat(m) * 1.5)})`) );
        gradMid.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(node.x, node.y, midR, 0, Math.PI * 2);
        ctx.fillStyle = gradMid;
        ctx.fill();

        // Inner glow
        const innerR = r * 1.3;
        const gradInner = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, innerR);
        gradInner.addColorStop(0, outerGlow.replace(/[\d.]+\)$/, m => `${Math.min(1, parseFloat(m) * 3)})`));
        gradInner.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(node.x, node.y, innerR, 0, Math.PI * 2);
        ctx.fillStyle = gradInner;
        ctx.fill();

        // Core solid circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fillStyle = core;
        ctx.fill();

        // Bright white center highlight
        ctx.beginPath();
        ctx.arc(node.x, node.y, r * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fill();

        // Red "updated today" dot — pulsing, top-right of node
        if (isUpdatedToday(node.updated)) {
          const dotX = node.x + r * 0.75;
          const dotY = node.y - r * 0.75;
          const dotR = 4;
          // Pulse: fast 0.8s cycle, opacity 0.5 → 1.0
          const dotPulse = Math.sin(now * 0.008) * 0.25 + 0.75;
          // Outer glow
          const dotGrad = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, dotR * 2.5);
          dotGrad.addColorStop(0, `rgba(255,60,60,${(dotPulse * 0.5).toFixed(2)})`);
          dotGrad.addColorStop(1, 'transparent');
          ctx.beginPath();
          ctx.arc(dotX, dotY, dotR * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = dotGrad;
          ctx.fill();
          // Solid core dot
          ctx.beginPath();
          ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,60,60,${dotPulse.toFixed(2)})`;
          ctx.fill();
        }

        // Always-visible labels for ALL nodes
        ctx.save();
        ctx.font = "600 12px 'Space Grotesk', sans-serif";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.shadowColor = 'rgba(0,0,0,1)';
        ctx.shadowBlur = 8;
        ctx.fillStyle = 'rgba(255,255,255,1)';

        const labelY = node.y + r + 10;
        const label = node.label;

        // Wrap long labels (>18 chars) to 2 lines
        if (label.length > 18) {
          const words = label.split(' ');
          const mid = Math.ceil(words.length / 2);
          const line1 = words.slice(0, mid).join(' ');
          const line2 = words.slice(mid).join(' ');
          ctx.fillText(line1, node.x, labelY);
          ctx.fillText(line2, node.x, labelY + 15);
        } else {
          ctx.fillText(label, node.x, labelY);
        }

        ctx.restore();
      });

      animFrameRef.current = requestAnimationFrame(draw);
    }

    sim.on('tick', () => {});
    draw();

    return () => {
      sim.stop();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [nodes, links]);

  // Handle resize
  useEffect(() => {
    function handleResize() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      if (simRef.current) {
        const W2 = canvas.width;
        const H2 = canvas.height;
        simRef.current
          .force('center', d3.forceCenter(W2 / 2, H2 / 2).strength(0.1))
          .force('boundX', d3.forceX(W2 / 2).strength(0.1))
          .force('boundY', d3.forceY(H2 / 2).strength(0.1))
          .alpha(0.6)
          .restart();
        // Re-clamp all nodes immediately into new bounds
        const pad = MAX_R + 80;
        nodesRef.current.forEach(node => {
          if (node.x !== undefined) node.x = Math.max(pad, Math.min(W2 - pad, node.x));
          if (node.y !== undefined) node.y = Math.max(pad, Math.min(H2 - pad, node.y));
        });
      }
    }
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mouse events
  function getNodeAt(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    for (const node of nodesRef.current) {
      const r = getNodeRadius(node.weight);
      const dx = (node.x || 0) - mx;
      const dy = (node.y || 0) - my;
      if (Math.sqrt(dx * dx + dy * dy) < r + 6) return { node, mx: e.clientX, my: e.clientY };
    }
    return null;
  }

  function handleMouseMove(e) {
    const hit = getNodeAt(e);
    if (hit) {
      hoveredNodeRef.current = hit.node;
      setTooltip({ node: hit.node, x: hit.mx, y: hit.my });
      canvasRef.current.style.cursor = 'pointer';
    } else {
      hoveredNodeRef.current = null;
      setTooltip(null);
      canvasRef.current.style.cursor = 'default';
    }
  }

  function handleClick(e) {
    const hit = getNodeAt(e);
    if (hit) onNodeClick(hit.node);
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
      />
      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.x + 16,
          top: tooltip.y - 10,
          background: 'rgba(0,0,0,0.92)',
          border: '1px solid rgba(200,220,255,0.4)',
          padding: '8px 12px',
          pointerEvents: 'none',
          zIndex: 2000,
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '12px',
          color: '#fff',
          maxWidth: '200px',
          boxShadow: '0 0 16px rgba(200,220,255,0.2)',
        }}>
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>{tooltip.node.label}</div>
          <div style={{ color: 'rgba(200,220,255,0.85)' }}>
            {Math.round(tooltip.node.likelihood * 100)}% likelihood
          </div>
        </div>
      )}
    </div>
  );
}
