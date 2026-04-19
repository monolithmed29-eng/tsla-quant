// Roger's Chart Analysis — update this file after each analysis session
// chartImage: path to static annotated chart in public/ (null = show live TradingView widget)

export const ANALYSIS = {
  updatedAt: 'April 19, 2026',
  timeframe: '1D',
  chartImage: '/charts/tsla-1d-apr19.png', // set to null to use live TradingView widget

  signals: [
    { label: 'Trend Structure',   reading: 'Broke downtrend channel above ~$372',                         lean: 'bullish'  },
    { label: 'Buy Signal',        reading: 'Triggered ~$340 — stock fell further = deeper discount',      lean: 'bullish'  },
    { label: 'Mean Reversion',    reading: 'At −1.0 SD (oversold, 70% win rate)',                         lean: 'bullish'  },
    { label: 'Optimized Trend',   reading: 'Just turning blue, steep upward slope — strong confirmation', lean: 'bullish'  },
    { label: '200 SMA (~$400)',   reading: 'Price approaching major resistance zone',                     lean: 'neutral'  },
  ],

  targets: [
    { label: '61.8% Fib + POC', price: 435, description: 'Primary target — Fibonacci level aligns precisely with Volume Point of Control. Double confluence = natural institutional profit-taking zone.' },
    { label: '78–82% Fib',      price: 470, description: 'Greedy target — where institutions sell if momentum is strong. $460–$475 range.' },
  ],

  commentary: `TSLA broke out of a months-long downtrend channel above ~$372 — a technically significant level. The daily setup is strongly bullish across multiple signals.

Mean reversion sits at −1.0 standard deviations (oversold), a zone with a 70% historical win rate on reversal. The trend indicator just confirmed a bullish flip on the daily — a slower signal that carries more weight precisely because it's harder to trigger.

The buy signal fired at ~$340. When a buy triggers and price continues lower, that's not a failure — it means the stock got even more oversold, building a higher-conviction launch pad for the eventual reversal.

First major target: $435 — where the 61.8% Fibonacci retracement level aligns precisely with the volume Point of Control (the most-traded price level over the past year). That double confluence makes it the natural institutional base exit. If momentum holds, the 78–82% zone ($460–$470) opens up.

Near-term friction: the 200 SMA near $400. Watch for a clean break or rejection here — this is the first real test.`,

  overallLean: 'bullish', // 'bullish' | 'bearish' | 'neutral'
};
