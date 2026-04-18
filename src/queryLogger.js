// queryLogger.js — fire-and-forget client-side event logger
// Never throws, never blocks — best-effort only

export function logQuery({ query, matchedIds = [], deepMode = false, pro = false }) {
  try {
    fetch('/api/query-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'query_submit', query, matchedIds, deepMode, pro, ts: Date.now() }),
    }).catch(() => {});
  } catch (_) {}
}

export function logNodeClick({ query, clickedId, pro = false }) {
  try {
    fetch('/api/query-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'node_click', query, clickedId, pro, ts: Date.now() }),
    }).catch(() => {});
  } catch (_) {}
}
