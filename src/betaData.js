// betaData.js — Historical daily close data for Beta Dashboard scatter plot
// Updated by daily cron — each entry: { date, tsla, spy, qqq }
// tsla/spy/qqq = daily % change (e.g. 2.1 = +2.1%)
// DO NOT manually edit — cron-managed

export const BETA_SPY = 2.3;   // TSLA β vs S&P 500
export const BETA_QQQ = 1.5;   // TSLA β vs Nasdaq-100

export const betaHistory = [
  // Rolling 10-day window — cron appends daily, drops oldest when >10 entries

  { date: "2026-05-01", tsla: 2.41, spy: 0.28, qqq: 0.96 },
  { date: "2026-05-04", tsla: 0.43, spy: -0.41, qqq: -0.21 },
  { date: "2026-05-05", tsla: -0.83, spy: 0.81, qqq: 1.31 },
  { date: "2026-05-06", tsla: 2.37, spy: 1.46, qqq: 2.08 },
  { date: "2026-05-07", tsla: 3.33, spy: -0.38, qqq: -0.12 },
  { date: "2026-05-08", tsla: 4.02, spy: 0.83, qqq: 2.34 },
  { date: "2026-05-11", tsla: 3.89, spy: 0.19, qqq: 0.29 },
  { date: "2026-05-12", tsla: -2.60, spy: -0.15, qqq: -0.85 },
  { date: "2026-07-01", tsla: 1.12, spy: -0.14, qqq: -1.14 },
  { date: "2026-07-02", tsla: -7.49, spy: -0.13, qqq: -1.73 },
];
