// Dark Pool / Whale Flow Data — updated by Roger 3x/day (9am, 12pm, 3pm ET)
// Formula: Score = 50 + ((dollar_volume / benchmark) * direction * 30), clamped 0–100
// Benchmark: $2B full day, $1B midday snapshot

export const darkPoolData = {
  gauge_value: 53,
  needle_status: "Vibrating",       // "Static" | "Vibrating" | "Aggressive"
  roger_insight: "Dark pool call flow of $231.28M (11.6% of daily benchmark) with TSLA +$27.83 confirms modest institutional accumulation — whales are buying the move, not fading it.",
  updated: "Apr 15 · 3pm ET",
  calls: { count: 3521, value: 231280000 },
  puts:  { count: 3447, value: null },
};
