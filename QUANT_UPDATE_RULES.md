# TSLA Quant Model — Update Rules

## Cadence
- **Twice daily**: 10am ET and 6pm ET
- **Never** update outside of these windows unless a catalyst is definitively confirmed/failed

## Update Philosophy
- Changes should be **incremental** — max ±0.05 per catalyst per session
- A single news item rarely warrants more than ±0.03–0.05
- Only move scores when there is **concrete new information** (confirmed production, regulatory decision, earnings data)
- Speculation, rumors, and analyst opinions = no score change
- Reserve large moves (>0.05) for binary events: confirmed production start, regulatory approval/denial, earnings miss/beat

## What Triggers a Score Change
| Event Type | Max Delta |
|---|---|
| Rumor / analyst opinion | 0 (no change) |
| Official company statement | ±0.03 |
| Regulatory filing / approval | ±0.05 |
| Production confirmed | ±0.05 |
| Earnings reported (miss/beat) | ±0.05 |
| Catalyst fully achieved | set to 0.95–0.99 |
| Catalyst definitively failed | set to 0.05–0.10 |

## The +61 Problem (Apr 6, 2026 lesson)
Too many catalysts were updated at once on the same day, causing a large single-session jump.
Going forward: spread updates across sessions, and be conservative with each individual delta.

## Update Process
1. Check breaking news since last update
2. Identify only catalysts with **direct new evidence**
3. Apply incremental score changes (max ±0.05 each)
4. Update `updated:` date in data.js
5. Set `PREV_PREDICTED` to the current model price before changes
6. Build + deploy
7. Log changes in `updates/YYYY-MM-DD.md`
