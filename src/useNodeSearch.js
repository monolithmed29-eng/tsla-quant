// useNodeSearch.js — Fuzzy catalyst search engine for QueryEngine
// No external libraries. Pure JS, fast enough for 34 nodes.

export const CATEGORY_KEYWORDS = {
  autonomy:      ['fsd', 'autonomous', 'self-driving', 'cybercab', 'robotaxi', 'unsupervised', 'full self driving', 'driverless', 'autopilot', 'cybertaxi', 'austin', 'unsupervised driving'],
  robotics:      ['optimus', 'robot', 'humanoid', 'cortex', 'dojo', 'neural', 'grok', 'macrohard', 'digital optimus', 'ai training', 'humanoid robot'],
  financials:    ['earnings', 'revenue', 'delivery', 'deliveries', 'margin', 'profit', 'q1', 'q2', 'q3', 'q4', 'eps', 'cash', 'guidance', 'gross margin', 'fcf', 'buyback', 'income'],
  product:       ['model s', 'model 3', 'model x', 'model y', 'cybertruck', 'semi', 'affordable', 'refresh', 'vehicle', '$25k', 'compact', 'roadster'],
  manufacturing: ['giga', 'factory', 'production', 'unboxed', 'terafab', 'chip', 'capacity', 'texas', 'berlin', 'shanghai', 'ramp', 'output', 'gigafactory', '4680'],
  energy:        ['megapack', 'powerwall', 'solar', 'storage', 'vpp', 'virtual power', 'battery', 'grid', 'megapack 3', 'energy division', 'lithium', 'lft', 'lfp', 'ncm', 'cathode', 'anode', 'cell', 'charging', 'supercharger', 'ev battery', 'energy storage'],
  corporate:     ['musk', 'management', 'brand', 'sentiment', 'political', 'board', 'governance', 'executive', 'ceo', 'leadership', 'elon'],
  spacex:        ['spacex', 'starlink', 'xai', 'merger', 'synergy', 'space', 'elon', 'grok', 'crossover', 'satellite', 'rocket'],
};

// Stop words to ignore when scoring (don't penalize for missing these)
const STOP_WORDS = new Set([
  'the','a','an','is','are','was','were','be','been','being','have','has','had',
  'do','does','did','will','would','could','should','may','might','shall',
  'to','of','in','on','at','by','for','with','about','against','between','into',
  'through','during','before','after','above','below','from','up','down',
  'how','what','when','where','why','who','which','that','this','these','those',
  'and','or','but','if','then','so','yet','both','either','neither','whether',
  'i','you','he','she','it','we','they','me','him','her','us','them',
  'my','your','his','its','our','their','mine','yours','ours','theirs',
  'not','no','nor','than','as','such','like','very','just','also','too',
  'can','cannot','next','last','new','old','big','small','high','low',
  'go','get','make','take','come','see','know','think','look','way',
  'work','use','seem','help','mean','call','keep','try','need','feel',
]);

/**
 * Search catalysts by query text + optional chip filter.
 * Returns matched nodes, sorted by match score (most relevant first).
 */
export function searchCatalysts(rawQuery, catalysts, chipFilter = 'all') {
  if (!rawQuery.trim() && chipFilter === 'all') return [];

  const q = rawQuery.toLowerCase().trim();
  // Filter: remove very short tokens AND stop words to keep only signal words
  const allWords = q ? q.split(/\s+/).filter(w => w.length > 1) : [];
  const signalWords = allWords.filter(w => !STOP_WORDS.has(w));
  // Use signal words for scoring; fall back to all words if nothing survives (e.g. single word query)
  const words = signalWords.length > 0 ? signalWords : allWords.filter(w => w.length > 1);

  const scored = [];

  for (const node of catalysts) {
    // ── Chip filter ──────────────────────────────────────────────────────────
    if (chipFilter === 'bull' && node.likelihood < 0.75) continue;
    if (chipFilter === 'bear' && node.likelihood > 0.4) continue;
    if (!['all', 'bull', 'bear'].includes(chipFilter) && node.category !== chipFilter) continue;

    // Chip-only (no text) → include everything in that filter
    if (!words.length) {
      scored.push({ node, score: node.likelihood });
      continue;
    }

    // ── Build searchable corpus ──────────────────────────────────────────────
    const descText = Array.isArray(node.description)
      ? node.description.slice(0, 6).join(' ')
      : (node.description || '');
    const catKeywords = (CATEGORY_KEYWORDS[node.category] || []).join(' ');
    const nodeLabel = node.label.toLowerCase();
    const nodeId = node.id.replace(/_/g, ' ');

    const corpus = [
      nodeLabel,
      node.category,
      nodeId,
      (node.status || '').replace(/_/g, ' '),
      node.expected || '',
      descText,
      catKeywords,
    ].join(' ').toLowerCase();

    // ── Score: signal word matches, with label-word bonus ────────────────────
    let matchCount = 0;
    let labelBonus = 0;
    const labelWords = nodeLabel.split(/\s+/);

    for (const w of words) {
      if (corpus.includes(w)) {
        matchCount++;
        // Extra bonus if the word directly hits the node label (e.g. "lithium" → "battery" node)
        if (labelWords.some(lw => lw.startsWith(w) || w.startsWith(lw))) {
          labelBonus += 0.5;
        }
      }
    }

    // For short signal-word queries (1–2 words), threshold = 1 match
    // For longer queries, require 50% of signal words to match
    const threshold = words.length <= 2 ? 1 : Math.max(1, Math.ceil(words.length * 0.5));
    if (matchCount >= threshold) {
      scored.push({
        node,
        score: matchCount / words.length + labelBonus + node.likelihood * 0.1,
      });
    }
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .map(s => s.node);
}

/** Returns unique category IDs from a list of matched nodes. */
export function getMatchedCategories(matchedNodes) {
  return [...new Set(matchedNodes.map(n => n.category))];
}

/**
 * smartRank — scores each matched node on 3 axes and returns top N.
 *
 * Score = (matchStrength × 0.5) + (priceWeight × 0.3) + (recencyScore × 0.2)
 *
 * matchStrength: passed in from searchCatalysts (0–1, fraction of words matched)
 * priceWeight:   node.weight (already 0–1 range, represents model price contribution)
 * recencyScore:  1.0 if updated in last 7d, decays to 0 over 90d
 *
 * cap: max nodes to return (default 3 desktop, 1 mobile)
 */
// High-signal investment keywords — broad thesis queries
const BROAD_QUERY_SIGNALS = [
  'invest', 'bull', 'bear', 'buy', 'sell', 'thesis', 'valuation', 'upside',
  'potential', 'outlook', 'opinion', 'think', 'like', 'worth', 'future',
  'long', 'short', 'bet', 'case', 'view', 'growth', 'target', 'price',
  'overall', 'general', 'big picture', 'conviction',
];

export function smartRank(matchedNodes, rawQuery, cap = 3) {
  const q = rawQuery.toLowerCase().trim();
  const words = q.split(/\s+/).filter(w => w.length > 1);

  // Detect broad/thesis queries — many words but no specific catalyst keywords
  const isBroadQuery = words.length >= 4 &&
    BROAD_QUERY_SIGNALS.some(sig => q.includes(sig));

  const scored = matchedNodes.map(node => {
    // Match strength — how well query words hit node corpus
    const corpus = [node.label, node.id.replace(/_/g, ' '), node.category,
      ...(CATEGORY_KEYWORDS[node.category] || [])].join(' ').toLowerCase();
    const matchStrength = words.length
      ? words.reduce((acc, w) => acc + (corpus.includes(w) ? 1 : 0), 0) / words.length
      : 0.5;

    // Price weight (already 0–1)
    const priceWeight = Math.min(1, (node.weight || 0) * 3);

    // Recency score
    let recencyScore = 0.1;
    if (node.updated) {
      const days = (Date.now() - new Date(node.updated).getTime()) / 86400000;
      recencyScore = days <= 1 ? 1.0 : days <= 7 ? 0.8 : days <= 30 ? 0.5 : days <= 90 ? 0.2 : 0.05;
    }

    // Likelihood bonus
    const likelihoodBonus = (node.likelihood || 0.5) * 0.1;

    // Conviction score — pure thesis signal (likelihood × price impact)
    const convictionScore = (node.likelihood || 0.5) * Math.min(1, (node.weight || 0) * 4);

    // Broad query → conviction dominates; specific query → match strength dominates
    const total = isBroadQuery
      ? convictionScore * 0.55 + priceWeight * 0.25 + recencyScore * 0.15 + matchStrength * 0.05
      : matchStrength * 0.45 + priceWeight * 0.30 + recencyScore * 0.15 + likelihoodBonus;

    return { node, score: total };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, cap)
    .map(s => s.node);
}

/**
 * Build a human-readable smart mode badge description.
 * e.g. "3 catalysts · Autonomy + Robotics"
 */
export function buildSmartBadge(smartNodes) {
  const cats = [...new Set(smartNodes.map(n => n.category))];
  const catLabels = {
    autonomy: 'Autonomy', robotics: 'Robotics / AI', financials: 'Financials',
    product: 'Product', manufacturing: 'Manufacturing', energy: 'Energy',
    corporate: 'Corporate', spacex: 'SpaceX',
  };
  const catStr = cats.slice(0, 3).map(c => catLabels[c] || c).join(' + ');
  return `${smartNodes.length} catalyst${smartNodes.length !== 1 ? 's' : ''} · ${catStr}`;
}

/**
 * Builds a compact structured context block for Oracle Deep (RAG injection).
 * Fed into the oracle prompt as additional grounded context.
 */
export function buildNodeContext(matchedNodes) {
  if (!matchedNodes.length) return '';

  const blocks = matchedNodes.slice(0, 8).map(n => {
    const bullets = Array.isArray(n.description)
      ? n.description.slice(0, 3)
          .map(b => `  • ${b.replace(/^\s*[\u{1F195}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}⚡✅🎯📊⚠️🏁🔗💡]/u, '').trim()}`)
          .join('\n')
      : `  ${(n.description || '').slice(0, 300)}`;

    return `[${n.label.toUpperCase()}]
Likelihood: ${Math.round(n.likelihood * 100)}% | Status: ${(n.status || '').replace(/_/g, ' ')} | Expected: ${n.expected || 'TBD'} | Updated: ${n.updated || 'N/A'}
${bullets}`;
  });

  return `\n\n━━ ORACLE DEEP — RETRIEVED LIVE CATALYST DATA ━━\n${blocks.join('\n\n')}\n━━ END CATALYST CONTEXT ━━\n\nUsing the above live data as your primary source, answer:`;
}
