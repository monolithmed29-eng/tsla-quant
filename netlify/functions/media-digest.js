import { getStore } from '@netlify/blobs';

const STORE_KEY = 'latest';
const SECRET    = process.env.DIGEST_API_SECRET || 'rtc-tsla-digest-2026';

export default async (req) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') return new Response('', { status: 204, headers });

  const store = getStore({ name: 'media-digest', consistency: 'strong' });

  // ── GET — serve latest digest to frontend ──────────────────────────────────
  if (req.method === 'GET') {
    try {
      const data = await store.get(STORE_KEY, { type: 'json' });
      if (!data) return new Response(JSON.stringify({ videos: [], generatedAt: null }), { status: 200, headers });
      return new Response(JSON.stringify(data), { status: 200, headers });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
    }
  }

  // ── POST — receive digest from Python script ───────────────────────────────
  if (req.method === 'POST') {
    const auth = req.headers.get('Authorization') || '';
    if (auth !== `Bearer ${SECRET}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
    }
    try {
      const body = await req.json();
      if (!body.videos || !Array.isArray(body.videos)) {
        return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400, headers });
      }
      const payload = {
        generatedAt: body.generatedAt || new Date().toISOString(),
        totalVideos: body.videos.length,
        videos: body.videos,
      };
      await store.setJSON(STORE_KEY, payload);
      console.log(`[media-digest] Stored ${payload.totalVideos} videos at ${payload.generatedAt}`);
      return new Response(JSON.stringify({ ok: true, totalVideos: payload.totalVideos }), { status: 200, headers });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
};

export const config = { path: '/api/media/daily-digest' };
