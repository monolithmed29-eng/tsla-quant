// Dark Pool / Whale Flow Data — updated by Roger 3x/day (9am, 12pm, 3pm ET)
// Formula: Score = 50 + ((dollar_volume / benchmark) * direction * 30) + (call_skew * 20), clamped 0–100
// Benchmark: $2B full day, $1B midday snapshot

export const darkPoolData = {
  gauge_value: 58,
  needle_status: "Vibrating",       // "Static" | "Vibrating" | "Aggressive"
  roger_insight: "Flow has flipped call-heavy into the afternoon — institutions rotating back toward upside exposure. Morning put pressure has faded; smart money appears to be positioning for a relief move heading into earnings.",
  updated: "Apr 16 · 1pm ET",
  calls: { count: 2, value: 2 },
  puts:  { count: 1, value: 1 },
};
