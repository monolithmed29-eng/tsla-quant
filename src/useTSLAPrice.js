import { useState, useEffect } from 'react';

export function useTSLAPrice() {
  const [price, setPrice] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchPrice = async () => {
    try {
      // Try serverless proxy first (production)
      const res = await fetch('/api/tsla-price');
      const data = await res.json();
      if (data?.price) {
        setPrice(data.price);
        setLastUpdated(new Date());
        return;
      }
    } catch (_) {}

    // Fallback: direct fetch (works in local dev)
    try {
      const res = await fetch(
        'https://query1.finance.yahoo.com/v8/finance/chart/TSLA?interval=1d&range=1d',
        { headers: { 'Accept': 'application/json' } }
      );
      const data = await res.json();
      const p = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (p) {
        setPrice(p);
        setLastUpdated(new Date());
      }
    } catch (e) {
      console.warn('TSLA price fetch failed:', e.message);
    }
  };

  useEffect(() => {
    fetchPrice();
    const interval = setInterval(fetchPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  return { price, lastUpdated };
}
