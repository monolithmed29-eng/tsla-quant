// Dark Pool / Whale Flow Data — updated by Roger 3x/day (9am, 12pm, 3pm ET)
// Formula: Score = 50 + ((dollar_volume / benchmark) * direction * 30) + (call_skew * 20), clamped 0–100
// Benchmark: $2B full day, $1B midday snapshot

export const darkPoolData = {
  gauge_value: 35,
  needle_status: "Vibrating",
  roger_insight: "Dollar-weighted flow skews put-heavy heading into earnings — institutions are paying up for downside protection despite roughly even contract count. Smart money hedging, not conviction selling.",
  updated: "Apr 20 · 10am ET",
  calls: { count: 236, value: 8140000 },
  puts:  { count: 221, value: 15190000 },
};
