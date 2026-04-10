// ─────────────────────────────────────────────────────────────
// Attendo Service Worker  ·  cache-first, full offline support
// Bump CACHE_VER to force all clients to pick up a new build.
// ─────────────────────────────────────────────────────────────
const CACHE_VER = 'v3';
const SHELL     = 'attendo-shell-' + CACHE_VER;
const EXT       = 'attendo-ext-'   + CACHE_VER;

const APP_SHELL = [
  './index.html',
  './setup.html',
  './stats.html',
  './css/theme.css',
  './js/utils.js',
  './js/storage.js',
  './js/dashboard.js',
  './js/setup.js',
  './js/stats.js',
  './js/pwa.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

const EXT_HOSTS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdnjs.cloudflare.com',
  'cdn.jsdelivr.net'
];

// ── INSTALL ──────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL).then(cache =>
      // Cache each asset individually — one miss won't break the whole install
      Promise.allSettled(APP_SHELL.map(url =>
        cache.add(url).catch(() => {/* non-fatal */})
      ))
    ).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE ─────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== SHELL && k !== EXT).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
      .then(() =>
        // Tell every open tab a new version just activated
        self.clients.matchAll({ type: 'window', includeUncontrolled: true })
          .then(clients => clients.forEach(c => c.postMessage({ type: 'SW_UPDATED' })))
      )
  );
});

// ── FETCH ────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  if (EXT_HOSTS.some(h => url.hostname.includes(h))) {
    event.respondWith(fromCacheOrNetwork(req, EXT));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(fromCacheOrNetwork(req, SHELL));
    return;
  }
});

async function fromCacheOrNetwork(req, cacheName) {
  const cached = await caches.match(req);
  if (cached) return cached;

  try {
    const res = await fetch(req);
    if (res.ok) {
      const cache = await caches.open(cacheName);
      cache.put(req, res.clone());
    }
    return res;
  } catch {
    // Offline fallback: serve index.html for navigation requests
    if (req.mode === 'navigate') {
      const fallback = await caches.match('./index.html');
      if (fallback) return fallback;
    }
    return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  }
}

// ── MESSAGES ─────────────────────────────────────────────────
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
