// betaData.js — Historical daily close data for Beta Dashboard scatter plot
// Updated by daily cron — each entry: { date, tsla, spy, qqq }
// tsla/spy/qqq = daily % change (e.g. 2.1 = +2.1%)
// DO NOT manually edit — cron-managed

export const BETA_SPY = 2.3;   // TSLA β vs S&P 500
export const BETA_QQQ = 1.5;   // TSLA β vs Nasdaq-100

export const betaHistory = [
  // Seeded with recent data — cron appends daily
  { date: "2026-04-14", tsla: -2.8, spy: -1.5, qqq: -1.9 },
  { date: "2026-04-15", tsla:  4.1, spy:  1.8, qqq:  2.3 },
  { date: "2026-04-16", tsla: -1.2, spy: -0.4, qqq: -0.6 },
  { date: "2026-04-17", tsla:  0.9, spy:  0.3, qqq:  0.5 },
];
