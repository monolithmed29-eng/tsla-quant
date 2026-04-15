// Dark Pool / Whale Flow Data — updated by Roger 3x/day (9am, 12pm, 3pm ET)
// Formula: Score = 50 + ((dollar_volume / benchmark) * direction * 30) + (call_skew * 20), clamped 0–100
// Benchmark: $2B full day, $1B midday snapshot

export const darkPoolData = {
  gauge_value: 57,
  needle_status: "Vibrating",       // "Static" | "Vibrating" | "Aggressive"
  roger_insight: "Dark pool flow is heavily call-skewed with TSLA up strong — institutional participation is tilted bullish, though total whale volume remains below a full conviction signal.",
  updated: "Apr 15 · 3pm ET",
  calls: { count: 3521, value: 231280000 },
  puts:  { count: 1980, value: null },
};
