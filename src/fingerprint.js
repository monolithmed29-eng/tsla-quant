// ─── Browser Fingerprint ─────────────────────────────────────────────────────
// Generates a stable ~64-bit hash from passive browser signals.
// Not 100% unique, but resilient to localStorage/cookie clears and VPN changes.
// Combined with IP on the server side for a composite identity.

async function canvasHash() {
  try {
    const c = document.createElement('canvas');
    c.width = 200; c.height = 50;
    const ctx = c.getContext('2d');
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.font = '11pt Arial';
    ctx.fillText('TSLAquant🚀', 2, 15);
    ctx.fillStyle = 'rgba(102,204,0,0.7)';
    ctx.font = '18pt Georgia';
    ctx.fillText('TSLAquant🚀', 4, 45);
    return c.toDataURL().slice(-64);
  } catch { return 'no-canvas'; }
}

function screenSig() {
  return `${screen.width}x${screen.height}x${screen.colorDepth}x${window.devicePixelRatio || 1}`;
}

function tzSig() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone; }
  catch { return 'unknown'; }
}

function langSig() {
  return (navigator.languages || [navigator.language]).join(',');
}

function platformSig() {
  return navigator.platform || navigator.userAgentData?.platform || 'unknown';
}

function hardwareSig() {
  return `${navigator.hardwareConcurrency || 0}c-${navigator.deviceMemory || 0}gb`;
}

// Simple djb2-style hash
function hashStr(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
    h = h >>> 0; // keep unsigned 32-bit
  }
  return h.toString(36);
}

let _cached = null;

export async function getFingerprint() {
  if (_cached) return _cached;

  const parts = [
    await canvasHash(),
    screenSig(),
    tzSig(),
    langSig(),
    platformSig(),
    hardwareSig(),
  ];

  const raw = parts.join('|');
  _cached = hashStr(raw) + '-' + hashStr(raw.split('').reverse().join(''));
  return _cached;
}
