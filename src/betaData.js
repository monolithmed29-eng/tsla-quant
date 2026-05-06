// betaData.js — Historical daily close data for Beta Dashboard scatter plot
// Updated by daily cron — each entry: { date, tsla, spy, qqq }
// tsla/spy/qqq = daily % change (e.g. 2.1 = +2.1%)
// DO NOT manually edit — cron-managed

export const BETA_SPY = 2.3;   // TSLA β vs S&P 500
export const BETA_QQQ = 1.5;   // TSLA β vs Nasdaq-100

export const betaHistory = [
  // Rolling 10-day window — cron appends daily, drops oldest when >10 entries
  { date: "2026-04-22", tsla: 0.28, spy: 1.01, qqq: 1.67 },
  { date: "2026-04-23", tsla: -3.59, spy: -0.39, qqq: -0.56 },
  { date: "2026-04-24", tsla: 0.69, spy: 0.77, qqq: 1.95 },
  { date: "2026-04-27", tsla: 0.63, spy: 0.17, qqq: 0.05 },
  { date: "2026-04-28", tsla: -0.70, spy: -0.49, qqq: -1.01 },
  { date: "2026-04-29", tsla: -0.86, spy: -0.04, qqq: 0.58 },
  { date: "2026-04-30", tsla: 2.37, spy: 0.99, qqq: 0.93 },
  { date: "2026-05-01", tsla: 2.41, spy: 0.28, qqq: 0.96 },
  { date: "2026-05-04", tsla: 0.43, spy: -0.41, qqq: -0.21 },
  { date: "2026-05-05", tsla: -0.83, spy: 0.81, qqq: 1.31 },
];
