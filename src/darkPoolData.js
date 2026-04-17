// Dark Pool / Whale Flow Data — updated by Roger 3x/day (9am, 12pm, 3pm ET)
// Formula: Score = 50 + ((dollar_volume / benchmark) * direction * 30) + (call_skew * 20), clamped 0–100
// Benchmark: $2B full day, $1B midday snapshot

export const darkPoolData = {
  gauge_value: 78,
  needle_status: "Aggressive",      // "Static" | "Vibrating" | "Aggressive"
  roger_insight: "Institutional flow running ~3:1 calls over puts by dollar value — a strongly skewed bullish print heading into Q1 earnings Apr 22. Smart money is leaning hard toward upside.",
  updated: "Apr 17 · 1pm ET",
  calls: { count: 3, value: 3 },
  puts:  { count: 1, value: 1 },
};
