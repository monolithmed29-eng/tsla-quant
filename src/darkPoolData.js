// Dark Pool / Whale Flow Data — updated by Roger 3x/day (9am, 12pm, 3pm ET)
// Formula: Score = 50 + ((dollar_volume / benchmark) * direction * 30) + (call_skew * 20), clamped 0–100
// Benchmark: $2B full day, $1B midday snapshot

export const darkPoolData = {
  gauge_value: 38,
  needle_status: "Vibrating",       // "Static" | "Vibrating" | "Aggressive"
  roger_insight: "Unusual options flow flagged: put/call ratio heavily skewed — institutions loading downside protection ahead of Apr 22 earnings. Not noise; this is directional conviction from smart money.",
  updated: "Apr 16 · 10am ET",
  calls: { count: 1, value: 1 },
  puts:  { count: 3, value: 1 },
};
