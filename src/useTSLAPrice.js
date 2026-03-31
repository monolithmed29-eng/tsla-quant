import { useState, useEffect } from 'react';

function isMarketOpen() {
  const now = new Date();
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day = et.getDay();
  if (day === 0 || day === 6) return false;
  const mins = et.getHours() * 60 + et.getMinutes();
  return mins >= 570 && mins < 960; // 9:30am–4:00pm ET
}

export function useTSLAPrice() {
  const [price, setPrice] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [marketOpen, setMarketOpen] = useState(isMarketOpen());

  const fetchPrice = async () => {
    const open = isMarketOpen();
    setMarketOpen(open);
    if (!open) return; // don't fetch outside market hours

    try {
      const res = await fetch('/api/tsla-price');
      const data = await res.json();
      if (data?.price) {
        setPrice(data.price);
        setLastUpdated(new Date());
      }
      return;
    } catch (_) {}

    // Fallback: direct fetch (local dev)
    try {
      const res = await fetch(
        'https://query1.finance.yahoo.com/v8/finance/chart/TSLA?interval=1d&range=1d',
        { headers: { 'Accept': 'application/json' } }
      );
      const data = await res.json();
      const p = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (p) { setPrice(p); setLastUpdated(new Date()); }
    } catch (e) {
      console.warn('TSLA price fetch failed:', e.message);
    }
  };

  useEffect(() => {
    fetchPrice();
    const interval = setInterval(fetchPrice, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { price, lastUpdated, marketOpen };
}
