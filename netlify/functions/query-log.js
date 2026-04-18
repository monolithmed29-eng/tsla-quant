// query-log.js — fire-and-forget query + click event logger
// Stores events in Netlify Blobs under store "query-logs"
// Each entry: key = `{YYYY-MM-DD}/{timestamp}-{random}`, value = JSON event

import { getStore } from '@netlify/blobs';

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const body = await req.json();
    const { event, query, matchedIds, clickedId, deepMode, pro, ts } = body;

    if (!event || !query) {
      return new Response('Bad Request', { status: 400 });
    }

    const store = getStore({ name: 'query-logs', consistency: 'eventual' });

    const now = ts || Date.now();
    const date = new Date(now).toISOString().slice(0, 10); // YYYY-MM-DD
    const key = `${date}/${now}-${Math.random().toString(36).slice(2, 7)}`;

    const entry = {
      event,       // 'query_submit' | 'node_click'
      query,
      matchedIds:  matchedIds || [],
      clickedId:   clickedId || null,
      deepMode:    deepMode || false,
      pro:         pro || false,
      ts:          now,
    };

    await store.setJSON(key, entry);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    // Silent — never block the user
    return new Response(JSON.stringify({ ok: false }), { status: 200 });
  }
}

export const config = { path: '/api/query-log' };
