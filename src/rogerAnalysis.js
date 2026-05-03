// Roger's Chart Analysis — update this file after each analysis session
// chartImage: path to static annotated chart in public/ (null = show live TradingView widget)

export const ANALYSIS = {
  updatedAt: 'May 3, 2026',
  timeframe: '1D',
  chartImage: null, // set to null to use live TradingView widget
  chartImageAnnotated: '/charts/tsla-1d-may3.png', // Rooz's annotated chart

  signals: [
    { label: 'Price Bottom',      reading: '~$340 confirmed bottom — 1.0 Fib retracement, ~100% discount from ATH. Institutional accumulation zone.',             lean: 'bullish'  },
    { label: 'Mean Reversion',    reading: 'Hit −1.0 SD ~Apr 13 (oversold, 70.37% win rate). Now trending upward — bullish retracement underway.',               lean: 'bullish'  },
    { label: 'Channel Breakout',  reading: 'Broke out of pink downward channel. Retested ~$370 (channel upper band + 0.7826 Fib) — held as support.',             lean: 'bullish'  },
    { label: 'Trend Structure',   reading: 'Making higher highs + higher lows on daily. Upward trend forming on both daily and weekly timeframes.',               lean: 'bullish'  },
    { label: 'BX Trender',        reading: 'Oscillator turned green on daily. Still red on monthly — laggiest of the three timeframes (daily, weekly, monthly), normal at this stage of recovery.',       lean: 'bullish'  },
    { label: 'Volume Resistance', reading: '$400 level is key resistance per volume profiler. Clean break above confirms next leg.',                                lean: 'neutral'  },
    { label: 'Dark Pool / Whale', reading: 'Recent institutional flow skewing bullish. Supports accumulation thesis.',                                             lean: 'bullish'  },
    { label: 'Beta vs Market',    reading: 'TSLA outperforming SPY + QQQ on the beta scatter over the past week — relative strength building.',                    lean: 'bullish'  },
  ],

  targets: [
    { label: '61.8% Fib + POC', price: 435, description: 'Primary target — Fibonacci level aligns precisely with Volume Point of Control (~$432). Double confluence = natural institutional profit-taking zone.' },
    { label: '78–82% Fib',      price: 470, description: 'Greedy target — where institutions sell if momentum is strong. $460–$475 range.' },
  ],

  commentary: `TSLA appears to have found its floor near $340 — a technically significant level where the 1.0 Fibonacci retracement intersects with roughly a 100% discount from the all-time high. That kind of extreme dislocation historically draws institutional accumulation, and the price action confirms it.

The mean reversion oscillator on the daily touched −1.0 standard deviations around April 13th — a zone with a 70.37% historical win rate on reversal — and has since turned upward. That upward retracement from oversold territory is the signal, not just the level itself.

Price has broken out of the pink descending channel and successfully retested ~$370, a level that doubles as both the channel's upper band and the 0.7826 Fibonacci retracement. Holding that retest as support is a constructive sign.

Structure on the daily and weekly is improving: higher highs and higher lows are printing. The BX Trender oscillator has flipped green on the daily. The monthly BX Trender is still red — but of the three timeframes (daily, weekly, monthly), the monthly is the laggiest and expected to lag at this stage of recovery.

Near-term: $400 is a resistance wall per the volume profiler. A clean break and hold there opens the door to the primary target.

Primary target remains $435 — where the 61.8% Fibonacci level aligns tightly with the Volume Point of Control (~$432). That double confluence is the natural institutional exit zone. If momentum extends, the 78–82% zone ($460–$475) is the greedy target.

Additional tailwinds: dark pool and whale activity has skewed bullish recently, and TSLA has been outperforming SPY and QQQ on the beta scatter over the past week — early signs of relative strength returning. Short-term consolidation is still possible, but the medium-to-long term thesis is intact.`,

  overallLean: 'bullish', // 'bullish' | 'bearish' | 'neutral'
};
