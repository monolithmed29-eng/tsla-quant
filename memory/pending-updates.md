# Pending Deploy Queue

Items below are queued for the next scheduled deploy window.
The cron should process all items, then clear this file.

---

## Queued for 6:00 PM ET — May 6, 2026

### 1. Terafab — SpaceX $55B Construction Proposal
- **Node:** `terafab`
- **Action:** Add 🆕 bullet + stamp `updated: "May 6, 2026"`
- **Content:** SpaceX proposes $55 billion to begin construction of Tesla "Terafab" chip factory — joint Tesla/SpaceX venture; marks transition from announcement to active funding/construction phase. Significant capital commitment signals project is moving from concept to execution.
- **Score change:** Review current likelihood and consider nudge up if warranted by the funding commitment.

### 2. Terafab — SpaceXAI / Anthropic Colossus Compute Deal (indirect signal)
- **Node:** `terafab`
- **Action:** Add 🆕 bullet (same node, same updated stamp)
- **Content:** SpaceXAI signs compute access agreement with Anthropic for Colossus 1 (220,000 NVIDIA GPUs — H100/H200/GB200). Anthropic also expressed interest in partnering for orbital AI compute capacity. Validates frontier demand for the Musk compute ecosystem — Colossus monetization to external AI labs strengthens the Terafab thesis. Tesla energy infrastructure underpins Colossus; xAI paid Tesla $430M in related-party revenue (Q1 10-K). Compute demand signal is real and growing.
- **Score change:** None on its own — but in combination with the $55B construction proposal, supports a nudge if cron deems appropriate.

### 3. Robotaxi Fleet Count — 38 Unsupervised Vehicles
- **Node:** `robotaxi_austin`
- **Action:** Add 🆕 bullet + stamp `updated: "May 6, 2026"`
- **Content:** Unsupervised robotaxi fleet hits 38 vehicles — Austin 27 (71%), Houston 6, Dallas 5. Austin dominance signals Tesla's operational confidence in the primary market. Ramp accelerating.
- **Score change:** None — already near ceiling.

### 4. Beta Scatter — May 6 Close
- **Action:** Append to `src/betaData.js`, drop oldest if >10 entries, rebuild + deploy
- **Data:** `{ date: "2026-05-06", tsla: 2.37, spy: 1.46, qqq: 2.08 }`
