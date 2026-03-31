export const catalysts = [
  // AUTONOMY
  { id: "cybercab_production", label: "Cybercab Production Start", category: "autonomy", weight: 0.15, status: "in_progress", expected: "Q2 2026", likelihood: 0.75, description: "April 2026 production start confirmed by Musk. Ramp will be slow initially." },
  { id: "robotaxi_austin", label: "Robotaxi Launch Austin", category: "autonomy", weight: 0.12, status: "achieved", expected: "Q2 2025", likelihood: 0.95, description: "LIVE (robotaxitracker.com, Mar 31 2026): 94 vehicles total (cumulative). 9 active last 30d | 44 unsupervised-capable | 27 Cybercabs in test fleet. Unsupervised rides last 7 days: 3 of 27 (11.1%). ~999k total fleet miles, rate: 4,787 mi/day. 1,557 community-logged rides. Avg fare $4.92 | $1.66/mi | 60 riders. Coverage: 244 sq mi." },
  { id: "fsd_unsupervised", label: "FSD Unsupervised Rollout", category: "autonomy", weight: 0.10, status: "in_progress", expected: "Q3 2026", likelihood: 0.65, description: "Unsupervised pilot active in Austin (11.1% of rides unsupervised last 7 days). Bay Area fleet (438 vehicles) still supervised-only — awaiting CA regulatory approval. NHTSA: 28 all-time ADS incident reports, 10 in last 90 days." },
  { id: "robotaxi_expansion", label: "Robotaxi Multi-City", category: "autonomy", weight: 0.08, status: "upcoming", expected: "1H 2026", likelihood: 0.50, description: "LIVE (robotaxitracker.com): Bay Area fleet: 438 vehicles (human-driver pilot, 1,094 sq mi). Planned 1H 2026 cities: Dallas, Houston, Las Vegas, Miami, Orlando, Phoenix, Tampa. 36 Cybercabs spotted across 7 regions. Q4 2025 earnings: '25–50% of US with fully autonomous vehicles by end of 2026.'" },
  { id: "robotaxi_app", label: "Robotaxi Public App Launch", category: "autonomy", weight: 0.06, status: "upcoming", expected: "Q3 2026", likelihood: 0.55, description: "Consumer-facing Tesla Robotaxi app for booking rides." },
  { id: "fsd_v13", label: "FSD v13 Release", category: "autonomy", weight: 0.05, status: "achieved", expected: "Q1 2026", likelihood: 0.95, description: "FSD v13 released with major capability improvements." },
  { id: "fsd_licensing", label: "FSD Licensed to OEMs", category: "autonomy", weight: 0.07, status: "upcoming", expected: "Q4 2026", likelihood: 0.30, description: "Tesla licensing FSD software to other automakers — high-margin revenue stream." },
  { id: "regulatory_approval", label: "Federal AV Regulatory Approval", category: "autonomy", weight: 0.08, status: "upcoming", expected: "Q3 2026", likelihood: 0.40, description: "Federal/state regulatory frameworks enabling commercial autonomous operation." },

  // ROBOTICS / AI
  { id: "optimus_production", label: "Optimus Mass Production", category: "robotics", weight: 0.12, status: "in_progress", expected: "Q3 2026", likelihood: 0.55, description: "Musk: Optimus production ramp in 2026. Initial units for internal Tesla use." },
  { id: "optimus_external", label: "Optimus External Sales", category: "robotics", weight: 0.08, status: "upcoming", expected: "Q4 2026", likelihood: 0.35, description: "External customer deliveries of Optimus — long-term TAM unlock." },
  { id: "optimus_factory", label: "Optimus In-Factory Deployment", category: "robotics", weight: 0.05, status: "in_progress", expected: "Q2 2026", likelihood: 0.70, description: "Optimus units working inside Tesla Gigafactories. Proof of concept for scale." },
  { id: "dojo_v2", label: "Dojo Supercomputer Expansion", category: "robotics", weight: 0.05, status: "in_progress", expected: "Q2 2026", likelihood: 0.70, description: "Continued Dojo buildout for FSD training. Reduces reliance on Nvidia." },
  { id: "hw5_chip", label: "HW5 AI Chip Launch", category: "robotics", weight: 0.04, status: "upcoming", expected: "Q4 2026", likelihood: 0.45, description: "Next-gen inference chip for FSD and Optimus AI processing." },
  { id: "ai_inference", label: "AI Inference Revenue", category: "robotics", weight: 0.03, status: "upcoming", expected: "Q4 2026", likelihood: 0.30, description: "Tesla monetizing AI compute infrastructure as a service." },

  // FINANCIALS
  { id: "q1_earnings", label: "Q1 2026 Earnings Beat", category: "financials", weight: 0.08, status: "upcoming", expected: "Q2 2026", likelihood: 0.50, description: "Q1 2026 earnings report. Deliveries under pressure from BYD competition." },
  { id: "delivery_rebound", label: "Delivery Volume Rebound", category: "financials", weight: 0.07, status: "upcoming", expected: "Q2 2026", likelihood: 0.55, description: "2025 deliveries declined vs 2024. 2026 needs rebound for bull thesis." },
  { id: "margin_recovery", label: "Gross Margin >20%", category: "financials", weight: 0.05, status: "upcoming", expected: "Q3 2026", likelihood: 0.45, description: "Margins pressured by price cuts and competition. Recovery key for profitability." },
  { id: "energy_revenue", label: "Energy Revenue >$10B", category: "financials", weight: 0.04, status: "upcoming", expected: "Q4 2026", likelihood: 0.60, description: "Energy division (Megapack + Powerwall) hitting $10B annual run rate." },
  { id: "insurance_profit", label: "Tesla Insurance Profitable", category: "financials", weight: 0.03, status: "upcoming", expected: "Q3 2026", likelihood: 0.40, description: "Tesla Insurance reaching profitability — high-margin recurring revenue." },
  { id: "share_buyback", label: "Share Buyback Program", category: "financials", weight: 0.02, status: "upcoming", expected: "Q3 2026", likelihood: 0.35, description: "Tesla announcing significant share repurchase, signaling cash confidence." },

  // PRODUCT
  { id: "model_y_refresh", label: "New Model Y Global Ramp", category: "product", weight: 0.06, status: "achieved", expected: "Q1 2026", likelihood: 0.95, description: "Refreshed Model Y launched globally. Strong initial demand signals." },
  { id: "semi_production", label: "Tesla Semi Production Ramp", category: "product", weight: 0.04, status: "in_progress", expected: "Q3 2026", likelihood: 0.60, description: "Semi production ramping at Gigafactory Nevada." },
  { id: "affordable_model", label: "$25K Affordable Model", category: "product", weight: 0.05, status: "upcoming", expected: "Q4 2026", likelihood: 0.40, description: "Lower-cost Tesla model for mass market. Critical for volume growth." },
  { id: "cybertruck_profit", label: "Cybertruck Profitable", category: "product", weight: 0.03, status: "upcoming", expected: "Q2 2026", likelihood: 0.50, description: "Cybertruck reaching positive gross margin after initial production ramp losses." },
  { id: "roadster_reveal", label: "New Roadster Launch", category: "product", weight: 0.02, status: "upcoming", expected: "Q4 2026", likelihood: 0.25, description: "Long-delayed Tesla Roadster finally entering production." },

  // MANUFACTURING
  { id: "battery_4680", label: "4680 Cell Mass Production", category: "manufacturing", weight: 0.05, status: "in_progress", expected: "Q2 2026", likelihood: 0.65, description: "4680 structural battery cells reaching cost-competitive mass production volumes." },
  { id: "giga_mexico", label: "Gigafactory Mexico Groundbreak", category: "manufacturing", weight: 0.04, status: "upcoming", expected: "Q3 2026", likelihood: 0.40, description: "New Gigafactory in Mexico announced or breaking ground for North American supply chain." },
  { id: "unboxed_process", label: "Unboxed Manufacturing Live", category: "manufacturing", weight: 0.04, status: "in_progress", expected: "Q3 2026", likelihood: 0.55, description: "Tesla's revolutionary unboxed assembly process fully operational for Cybercab." },

  // ENERGY
  { id: "megapack_growth", label: "Megapack Revenue Growth", category: "energy", weight: 0.05, status: "in_progress", expected: "Q2 2026", likelihood: 0.80, description: "Energy storage business growing rapidly. High-margin revenue stream." },
  { id: "supercharger_network", label: "Supercharger Expansion", category: "energy", weight: 0.03, status: "in_progress", expected: "ongoing", likelihood: 0.90, description: "Continued expansion as other OEMs adopt NACS standard." },
  { id: "powerwall_ramp", label: "Powerwall 3 Ramp", category: "energy", weight: 0.02, status: "in_progress", expected: "Q2 2026", likelihood: 0.75, description: "Powerwall 3 scaling up to meet residential energy storage demand." },
  { id: "virtual_powerplant", label: "Virtual Power Plant Scale", category: "energy", weight: 0.02, status: "upcoming", expected: "Q4 2026", likelihood: 0.50, description: "Tesla's distributed energy grid network reaching meaningful scale." },

  // CORPORATE / BRAND
  { id: "brand_recovery", label: "Brand Sentiment Recovery", category: "corporate", weight: 0.04, status: "upcoming", expected: "Q3 2026", likelihood: 0.40, description: "Recovery from brand damage caused by Musk political activity. Key for demand." },
  { id: "elon_focus", label: "Elon Returns Full Focus", category: "corporate", weight: 0.05, status: "upcoming", expected: "Q2 2026", likelihood: 0.45, description: "Elon Musk reducing DOGE/gov involvement and refocusing on Tesla. Sentiment catalyst." },
];

export const links = [
  // Autonomy chain
  { source: "fsd_v13", target: "fsd_unsupervised" },
  { source: "dojo_v2", target: "fsd_unsupervised" },
  { source: "fsd_unsupervised", target: "robotaxi_austin" },
  { source: "fsd_unsupervised", target: "cybercab_production" },
  { source: "regulatory_approval", target: "cybercab_production" },
  { source: "cybercab_production", target: "robotaxi_expansion" },
  { source: "robotaxi_austin", target: "robotaxi_app" },
  { source: "robotaxi_austin", target: "robotaxi_expansion" },
  { source: "regulatory_approval", target: "robotaxi_expansion" },
  { source: "fsd_unsupervised", target: "fsd_licensing" },
  // Robotics chain
  { source: "dojo_v2", target: "optimus_production" },
  { source: "hw5_chip", target: "optimus_production" },
  { source: "optimus_factory", target: "optimus_production" },
  { source: "optimus_production", target: "optimus_external" },
  { source: "dojo_v2", target: "ai_inference" },
  { source: "hw5_chip", target: "ai_inference" },
  // Financial chain
  { source: "delivery_rebound", target: "q1_earnings" },
  { source: "cybercab_production", target: "q1_earnings" },
  { source: "optimus_external", target: "q1_earnings" },
  { source: "delivery_rebound", target: "margin_recovery" },
  { source: "megapack_growth", target: "margin_recovery" },
  { source: "semi_production", target: "margin_recovery" },
  { source: "robotaxi_expansion", target: "margin_recovery" },
  { source: "margin_recovery", target: "share_buyback" },
  { source: "energy_revenue", target: "margin_recovery" },
  { source: "megapack_growth", target: "energy_revenue" },
  { source: "powerwall_ramp", target: "energy_revenue" },
  // Product chain
  { source: "model_y_refresh", target: "delivery_rebound" },
  { source: "affordable_model", target: "delivery_rebound" },
  { source: "cybertruck_profit", target: "margin_recovery" },
  { source: "battery_4680", target: "affordable_model" },
  { source: "battery_4680", target: "cybertruck_profit" },
  { source: "unboxed_process", target: "cybercab_production" },
  { source: "giga_mexico", target: "delivery_rebound" },
  // Corporate chain
  { source: "elon_focus", target: "brand_recovery" },
  { source: "brand_recovery", target: "delivery_rebound" },
  { source: "elon_focus", target: "optimus_production" },
  { source: "fsd_licensing", target: "energy_revenue" },
  { source: "robotaxi_app", target: "robotaxi_expansion" },
  { source: "insurance_profit", target: "margin_recovery" },
  { source: "virtual_powerplant", target: "energy_revenue" },
];
