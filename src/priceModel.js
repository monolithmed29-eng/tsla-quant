/**
 * TSLA_QUANT — Sum-of-Parts Valuation Model
 *
 * Methodology informed by:
 * - Cern Basher (@CernBasher): Probabilistic SOTP framework, robotaxi fleet economics
 * - InvestAnswers (James): Probability-weighted scenario modeling
 * - TradingKey 2026 Deep Dive, Morgan Stanley AI platform thesis
 * - BofA SOTP: Robotaxi = ~52% of Tesla market cap at scale
 *
 * Model structure: Each business unit has an independent bear/base/bull value
 * and a probability weight. Final price = sum of probability-weighted unit values,
 * scaled by current catalyst progress (0→1).
 *
 * Business Units:
 *   1. AUTO      — Core vehicle business (Cern: 1.7M→7.5M units, 20% net margin = $900B)
 *   2. ENERGY    — Megapack + Powerwall ($12.8B revenue 2025, 30% YoY growth)
 *   3. ROBOTAXI  — Cybercab fleet (Cern: 10M vehicles by 2030, $90/day net profit each)
 *   4. OPTIMUS   — Humanoid robotics (Musk: 80% of long-term value; James/Cern: massive optionality)
 *   5. FSD_SW    — FSD subscriptions + licensing (1.1M subs @ $99-199/mo = $1.3-2.6B ARR)
 *   6. AI_INFRA  — Dojo + inference compute (early stage, high optionality)
 */

// ─── Business Unit Definitions ───────────────────────────────────────────────

const UNITS = [
  {
    id: 'auto',
    label: 'Auto Business',
    // Cern: 7.5M units/yr by 2030, 20% net margins → $900B
    // Bear: delivery declines persist, margin stays ~15%, BYD competition
    // Base: gradual recovery, Cybercab adds volume, margins hit 18%
    // Bull: full ramp, unboxed process cuts costs, 20%+ margins
    bear:  80,   // per-share contribution
    base:  140,
    bull:  220,
    // Probability of bull scenario playing out (informed by current catalyst scores)
    catalystIds: ['cybercab_production', 'delivery_rebound', 'margin_recovery', 'model_y_refresh', 'affordable_model'],
  },
  {
    id: 'energy',
    label: 'Energy',
    // $12.8B revenue 2025, 30% YoY → $10B+ run rate
    // Bear: growth slows, margins stay thin
    // Base: $16B revenue 2026, 20% gross margin
    // Bull: $20B+ revenue, utility-scale virtual power plant
    bear:  20,
    base:  45,
    bull:  80,
    catalystIds: ['megapack_growth', 'energy_revenue', 'powerwall_ramp', 'virtual_powerplant'],
  },
  {
    id: 'robotaxi',
    label: 'Robotaxi / FSD',
    // Cern: 10M fleet by 2030, $90/day net → $329B/yr net income at scale
    // BofA: ~$750B TAM, 52% of Tesla market cap
    // Bear: regulatory blocks, stays in Austin only, <1M fleet by 2030
    // Base: 7-city launch 2026, 1M fleet by 2028, gradual ramp
    // Bull: Cern's 10M fleet, $90/day, dominant market position
    bear:  30,
    base:  120,
    bull:  380,
    catalystIds: ['robotaxi_austin', 'fsd_unsupervised', 'robotaxi_expansion', 'cybercab_production', 'regulatory_approval', 'robotaxi_app'],
  },
  {
    id: 'optimus',
    label: 'Optimus',
    // Musk: 80% of long-term value. James/Cern: enormous optionality but speculative
    // Bear: stays internal, minimal external revenue by 2030
    // Base: 100K external units by 2027 @ $20K margin each = $2B/yr, growing fast
    // Bull: 1M+ units/yr, $20K margin, $20B/yr — transforms Tesla into robotics co
    bear:  5,
    base:  50,
    bull:  200,
    catalystIds: ['optimus_production', 'optimus_external', 'optimus_factory', 'cortex2', 'digital_optimus'],
  },
  {
    id: 'fsd_sw',
    label: 'FSD Software',
    // 1.1M subs @ $99-199/mo = $1.3-2.6B ARR, near 100% margin
    // Licensing to OEMs is the big unlock
    // Bear: subscriber growth stalls, no OEM deals
    // Base: 3M subs by 2027, 1 OEM deal
    // Bull: 10M+ subs, multiple OEM licenses, $10B+ ARR
    bear:  10,
    base:  30,
    bull:  90,
    catalystIds: ['fsd_v13', 'fsd_unsupervised', 'fsd_licensing', 'fsd_europe_china'],
  },
  {
    id: 'ai_infra',
    label: 'AI / Dojo',
    // Early stage — Dojo + inference compute as a service
    // Bear: Dojo underperforms, Tesla buys Nvidia forever
    // Base: Dojo reduces training costs, minor external monetization
    // Bull: AI inference revenue stream, Tesla = top-5 AI compute company
    bear:  0,
    base:  15,
    bull:  60,
    catalystIds: ['dojo_v2', 'hw5_chip', 'ai_inference', 'terafab'],
  },
];

// ─── Catalyst Score Lookup ────────────────────────────────────────────────────

function getCatalystScore(catalysts, ids) {
  const relevant = catalysts.filter(c => ids.includes(c.id));
  if (!relevant.length) return 0.5;
  // Weighted average likelihood across relevant catalysts
  const totalWeight = relevant.reduce((s, c) => s + c.weight, 0);
  const weightedLikelihood = relevant.reduce((s, c) => s + c.likelihood * c.weight, 0);
  return totalWeight > 0 ? weightedLikelihood / totalWeight : 0.5;
}

// ─── Main Model ───────────────────────────────────────────────────────────────

export function calcPredictedPrice(catalysts) {
  let total = 0;
  for (const unit of UNITS) {
    const score = getCatalystScore(catalysts, unit.catalystIds);
    // Interpolate: score 0 = bear, 0.5 = base, 1.0 = bull
    let unitValue;
    if (score <= 0.5) {
      unitValue = unit.bear + (unit.base - unit.bear) * (score / 0.5);
    } else {
      unitValue = unit.base + (unit.bull - unit.base) * ((score - 0.5) / 0.5);
    }
    total += unitValue;
  }
  return Math.round(total);
}

// ─── Per-Unit Breakdown (for future "Why this price?" panel) ─────────────────

export function calcPriceBreakdown(catalysts) {
  return UNITS.map(unit => {
    const score = getCatalystScore(catalysts, unit.catalystIds);
    let unitValue;
    if (score <= 0.5) {
      unitValue = unit.bear + (unit.base - unit.bear) * (score / 0.5);
    } else {
      unitValue = unit.base + (unit.bull - unit.base) * ((score - 0.5) / 0.5);
    }
    return {
      id: unit.id,
      label: unit.label,
      value: Math.round(unitValue),
      score: Math.round(score * 100),
      bear: unit.bear,
      base: unit.base,
      bull: unit.bull,
    };
  });
}

// ─── Legacy compat ───────────────────────────────────────────────────────────

export function calcPriceImpact(catalyst) {
  // Approximate per-node impact for panel display
  return catalyst.weight * catalyst.likelihood * 330; // ~330 = bull-bear spread
}
