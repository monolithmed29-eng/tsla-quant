// useNodeSearch.js — Fuzzy catalyst search engine for QueryEngine
// No external libraries. Pure JS, fast enough for 34 nodes.

export const CATEGORY_KEYWORDS = {
  autonomy:      ['fsd', 'autonomous', 'self-driving', 'cybercab', 'robotaxi', 'unsupervised', 'full self driving', 'driverless', 'autopilot'],
  robotics:      ['optimus', 'robot', 'humanoid', 'cortex', 'dojo', 'neural', 'grok', 'macrohard', 'digital optimus', 'ai training'],
  financials:    ['earnings', 'revenue', 'delivery', 'deliveries', 'margin', 'profit', 'q1', 'q2', 'q3', 'q4', 'eps', 'cash', 'guidance', 'gross margin', 'fcf'],
  product:       ['model s', 'model 3', 'model x', 'model y', 'cybertruck', 'semi', 'affordable', 'refresh', 'vehicle', '$25k', 'compact'],
  manufacturing: ['giga', 'factory', 'production', 'unboxed', 'terafab', 'chip', 'capacity', 'texas', 'berlin', 'shanghai', 'ramp', 'output'],
  energy:        ['megapack', 'powerwall', 'solar', 'storage', 'vpp', 'virtual power', 'battery', 'grid', 'megapack 3', 'energy division'],
  corporate:     ['musk', 'management', 'brand', 'sentiment', 'political', 'board', 'governance', 'executive', 'ceo', 'leadership'],
  spacex:        ['spacex', 'starlink', 'xai', 'merger', 'synergy', 'space', 'elon', 'grok', 'crossover'],
};

/**
 * Search catalysts by query text + optional chip filter.
 * Returns matched nodes, sorted by match score (most relevant first).
 */
export function searchCatalysts(rawQuery, catalysts, chipFilter = 'all') {
  if (!rawQuery.trim() && chipFilter === 'all') return [];

  const q = rawQuery.toLowerCase().trim();
  // Ignore very short tokens (articles etc)
  const words = q ? q.split(/\s+/).filter(w => w.length > 1) : [];

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

    const corpus = [
      node.label,
      node.category,
      node.id.replace(/_/g, ' '),
      (node.status || '').replace(/_/g, ' '),
      node.expected || '',
      descText,
      catKeywords,
    ].join(' ').toLowerCase();

    // ── Score: how many words match ──────────────────────────────────────────
    const matchCount = words.reduce((acc, w) => acc + (corpus.includes(w) ? 1 : 0), 0);
    const threshold = Math.max(1, Math.ceil(words.length * 0.6));
    if (matchCount >= threshold) {
      scored.push({ node, score: matchCount / words.length + node.likelihood * 0.1 });
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
