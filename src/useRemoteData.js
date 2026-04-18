// useRemoteData.js
// Fetches JSON data from GitHub raw URLs at runtime.
// Data updates = git push JSON only — zero Netlify rebuilds needed.

const REPO_RAW = 'https://raw.githubusercontent.com/monolithmed29-eng/tsla-quant/main/data';

// Cache in module scope so multiple components share one fetch per session
const cache = {};

export async function fetchRemoteData(file) {
  if (cache[file]) return cache[file];
  const res = await fetch(`${REPO_RAW}/${file}?t=${Date.now()}`);
  if (!res.ok) throw new Error(`Failed to fetch ${file}: ${res.status}`);
  const data = await res.json();
  cache[file] = data;
  return data;
}

import { useState, useEffect } from 'react';

export function useRemoteData(file, fallback) {
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchRemoteData(file)
      .then(d => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [file]);

  return { data, loading };
}
