import { getStore } from '@netlify/blobs';

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default async (req, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new Response('', { status: 204, headers });
  }

  const store = getStore({ name: 'comments', consistency: 'strong' });

  // ── GET — fetch comments for a section ──────────────────────────────────────
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const section = url.searchParams.get('section') || 'chart';
    try {
      const raw = await store.get(`section:${section}`, { type: 'json' });
      const comments = (raw?.comments || []).map(c => ({ ...c, timeAgo: timeAgo(c.ts) }));
      return new Response(JSON.stringify({ comments }), { status: 200, headers });
    } catch {
      return new Response(JSON.stringify({ comments: [] }), { status: 200, headers });
    }
  }

  // ── POST — add a comment ────────────────────────────────────────────────────
  if (req.method === 'POST') {
    let body;
    try { body = await req.json(); } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers });
    }

    const { section = 'chart', name, text } = body;

    if (!name || !text || typeof name !== 'string' || typeof text !== 'string') {
      return new Response(JSON.stringify({ error: 'name and text required' }), { status: 400, headers });
    }
    if (name.length > 40 || text.length > 500) {
      return new Response(JSON.stringify({ error: 'Too long' }), { status: 400, headers });
    }

    // Basic spam guard — strip tags
    const sanitize = s => s.replace(/<[^>]*>/g, '').replace(/https?:\/\/\S+/gi, '[link]').trim();
    const comment = {
      name: sanitize(name).slice(0, 40),
      text: sanitize(text).slice(0, 500),
      ts: Date.now(),
    };

    // Load existing, prepend, cap at 200
    let existing;
    try { existing = await store.get(`section:${section}`, { type: 'json' }); } catch { existing = null; }
    const comments = [comment, ...(existing?.comments || [])].slice(0, 200);
    await store.setJSON(`section:${section}`, { comments });

    return new Response(JSON.stringify({ comment: { ...comment, timeAgo: 'just now' } }), { status: 200, headers });
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
};

export const config = { path: '/api/comments' };
