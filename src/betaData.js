// betaData.js — Historical daily close data for Beta Dashboard scatter plot
// Updated by daily cron — each entry: { date, tsla, spy, qqq }
// tsla/spy/qqq = daily % change (e.g. 2.1 = +2.1%)
// DO NOT manually edit — cron-managed

export const BETA_SPY = 2.3;   // TSLA β vs S&P 500
export const BETA_QQQ = 1.5;   // TSLA β vs Nasdaq-100

export const betaHistory = [
  // Rolling 10-day window — cron appends daily, drops oldest when >10 entries

  { date: "2026-07-01", tsla: 1.12, spy: -0.14, qqq: -1.14 },
  { date: "2026-07-02", tsla: -7.49, spy: -0.13, qqq: -1.73 },
  { date: "2026-07-06", tsla: 6.69, spy: 0.87, qqq: 1.43 },
  { date: "2026-07-07", tsla: -4.02, spy: -0.45, qqq: -1.16 },
  { date: "2026-07-08", tsla: -2.19, spy: -0.28, qqq: -0.35 },
  { date: "2026-07-09", tsla: 3.39, spy: 0.85, qqq: 1.66 },
  { date: "2026-07-10", tsla: 0.30, spy: 0.43, qqq: 0.32 },
  { date: "2026-07-13", tsla: -3.19, spy: -0.77, qqq: -1.79 },
  { date: "2026-07-14", tsla: 0.40, spy: 0.36, qqq: 1.04 },
  { date: "2026-07-15", tsla: -0.43, spy: 0.38, qqq: 0.62 },
];
