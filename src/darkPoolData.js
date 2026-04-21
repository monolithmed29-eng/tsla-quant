// Dark Pool / Whale Flow Data — updated by Roger 3x/day (9am, 12pm, 3pm ET)
// Formula: Score = 50 + ((dollar_volume / benchmark) * direction * 30) + (call_skew * 20), clamped 0–100
// Benchmark: $2B full day, $1B midday snapshot

export const darkPoolData = {
  gauge_value: 62,
  needle_status: "Leaning Call",
  roger_insight: "Dollar-weighted flow flips call-heavy day-of — institutions are putting more capital behind upside despite slightly more put contracts. Positioning shift ahead of earnings suggests some smart money expecting a beat or bullish guidance.",
  updated: "Apr 21 · 10am ET",
  calls: { count: 6, value: 1940000 },
  puts:  { count: 7, value: 1210000 },
};
