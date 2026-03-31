/**
 * TSLA_QUANT Price Model — Sum of Parts (SOTP)
 *
 * Methodology informed by Cern Basher's probabilistic valuation framework
 * and InvestAnswers' segment-based DCF approach.
 *
 * Tesla is valued as 5 distinct businesses. Each segment has:
 *   - A base value per share (probability-weighted)
 *   - A multiplier driven by catalyst likelihood from the graph
 *
 * Segment weights sourced from:
 *   - Cern Basher (X/Twitter, Mar 2026): Autos+Robotaxi $522–$1,000; Optimus dominant long-term
 *   - Bank of America SOTP (Dec 2025): Robotaxi ~52% of total value
 *   - Morgan Stanley AI Platform re-rating (Mar 2026)
 *   - TradingKey 2026 Deep Dive (Mar 2026)
 *   - InvestAnswers segment DCF framework
 */

// ── Segment base values (bear / base / bull) per share ──────────────────────
const SEGMENTS = {
  // Auto business: 1.7M → 7.5M units by 2030, 20% net margin
  // Cern: $900B auto business alone at full ramp = ~$285/share base
  autos: { bear: 80, base: 180, bull: 320 },

  // Robotaxi / FSD: BofA values at $750B (~$237/share). Cern: $522–$1,000 Autos+Robotaxi combined
  // We isolate robotaxi here — highly catalyst-dependent
  robotaxi: { bear: 0, base: 120, bull: 400 },

  // Energy (Megapack + Powerwall): $12.8B revenue 2025, 30% YoY growth
  // InvestAnswers: 15x revenue multiple = ~$60/share base
  energy: { bear: 30, base: 65, bull: 110 },

  // Optimus: Musk says 80% of long-term value. Currently speculative.
  // Cern: enormous optionality, currently small probability weight
  optimus: { bear: 0, base: 40, bull: 300 },

  // Services / FSD subscriptions / Insurance: 1.1M subscribers @ $99–199/mo
  // High margin, growing. Base ~$25/share
  services: { bear: 10, base: 28, bull: 55 },
};

// ── Catalyst IDs that drive each segment ────────────────────────────────────
const SEGMENT_DRIVERS = {
  autos: ['cybercab_production', 'model_y_refresh', 'delivery_rebound', 'affordable_model', 'semi_production', 'battery_4680', 'unboxed_process', 'brand_recovery'],
  robotaxi: ['robotaxi_austin', 'fsd_unsupervised', 'robotaxi_expansion', 'robotaxi_app', 'regulatory_approval', 'fsd_licensing', 'cybercab_production'],
  energy: ['megapack_growth', 'energy_revenue', 'powerwall_ramp', 'virtual_powerplant', 'supercharger_network'],
  optimus: ['optimus_production', 'optimus_external', 'optimus_factory', 'dojo_v2', 'hw5_chip'],
  services: ['fsd_v13', 'fsd_unsupervised', 'insurance_profit', 'robotaxi_app', 'fsd_licensing'],
};

// ── Segment confidence: weighted avg likelihood from catalyst graph ──────────
function segmentConfidence(segmentKey, catalysts) {
  const ids = SEGMENT_DRIVERS[segmentKey];
  const relevant = catalysts.filter(c => ids.includes(c.id));
  if (!relevant.length) return 0.5;
  const totalWeight = relevant.reduce((s, c) => s + c.weight, 0);
  return relevant.reduce((s, c) => s + (c.likelihood * c.weight), 0) / totalWeight;
}

// ── Main model ───────────────────────────────────────────────────────────────
export function calcPredictedPrice(catalysts) {
  let total = 0;

  for (const [key, { bear, base, bull }] of Object.entries(SEGMENTS)) {
    const confidence = segmentConfidence(key, catalysts);

    // Blend bear→base→bull based on confidence
    // Below 0.4 = bear zone, 0.4–0.7 = base zone, above 0.7 = bull zone
    let segmentValue;
    if (confidence <= 0.4) {
      const t = confidence / 0.4;
      segmentValue = bear + (base - bear) * t;
    } else {
      const t = (confidence - 0.4) / 0.6;
      segmentValue = base + (bull - base) * t;
    }

    total += segmentValue;
  }

  return Math.round(total);
}

// ── Per-catalyst price impact (used in Panel) ────────────────────────────────
export function calcPriceImpact(catalyst, catalysts) {
  // Find which segments this catalyst influences
  let totalImpact = 0;

  for (const [key, { bear, base, bull }] of Object.entries(SEGMENTS)) {
    const ids = SEGMENT_DRIVERS[key];
    if (!ids.includes(catalyst.id)) continue;

    const relevant = catalysts ? catalysts.filter(c => ids.includes(c.id)) : [];
    const totalWeight = relevant.reduce((s, c) => s + c.weight, 0) || 1;
    const share = catalyst.weight / totalWeight;
    const range = bull - bear;
    totalImpact += range * share * catalyst.likelihood;
  }

  return Math.round(totalImpact);
}

// ── Segment breakdown (for future "show your work" panel) ────────────────────
export function calcSegmentBreakdown(catalysts) {
  return Object.entries(SEGMENTS).map(([key, { bear, base, bull }]) => {
    const confidence = segmentConfidence(key, catalysts);
    let value;
    if (confidence <= 0.4) {
      value = bear + (base - bear) * (confidence / 0.4);
    } else {
      value = base + (bull - base) * ((confidence - 0.4) / 0.6);
    }
    return {
      segment: key,
      value: Math.round(value),
      confidence: Math.round(confidence * 100),
      bear, base, bull,
    };
  });
}
