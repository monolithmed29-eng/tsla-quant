# Pending Deploy Queue

Items below are queued for the next scheduled deploy window.
The cron should process all items, then clear this file.

---

## Queued for 9:00 AM ET — May 8, 2026

### 1. Beta Scatter — May 7 Close
- **Action:** Append to `src/betaData.js`, drop oldest if >10 entries, rebuild + deploy
- **Data:** `{ date: "2026-05-07", tsla: 3.33, spy: -0.38, qqq: -0.12 }`
- **Note:** TSLA strongly outperforming — green dot while both indexes red.
