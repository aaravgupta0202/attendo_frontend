// ============================================================
// Attendo Service Worker v2.2
// Cache strategy:
//   App shell  → cache-first (instant loads, full offline)
//   Fonts/CDN  → cache-first with network fallback
//   Updates    → posts message to client so app can show banner
// ============================================================

const CACHE_VER  = 'v2.2';
const SHELL_KEY  = 'attendo-shell-' + CACHE_VER;
const EXT_KEY    = 'attendo-ext-'   + CACHE_VER;

const APP_SHELL = [
  './',
  './index.html',
  './setup.html',
  './stats.html',
  './css/theme.css',
  './js/utils.js',
  './js/storage.js',
  './js/dashboard.js',
  './js/setup.js',
  './js/stats.js',
  './manifest.json'
];

// ── INSTALL ──────────────────────────────────────────────────
self.addEventListener('install', event => {
  console.log('[SW] Installing', CACHE_VER);
  event.waitUntil(
    caches.open(SHELL_KEY).then(cache =>
      Promise.allSettled(
        APP_SHELL.map(url =>
          cache.add(url).catch(err =>
            console.warn('[SW] Failed to cache:', url, err.message)
          )
        )
      )
    ).then(() => {
      console.log('[SW] Shell cached — skip waiting');
      return self.skipWaiting();
    })
  );
});

// ── ACTIVATE ─────────────────────────────────────────────────
self.addEventListener('activate', event => {
  console.log('[SW] Activating', CACHE_VER);
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== SHELL_KEY && k !== EXT_KEY)
          .map(k => {
            console.log('[SW] Removing stale cache:', k);
            return caches.delete(k);
          })
      ))
      .then(() => self.clients.claim())
      .then(() => {
        // Notify all open tabs that a new version is active
        return self.clients.matchAll({ type: 'window' }).then(clients => {
          clients.forEach(client => client.postMessage({ type: 'SW_UPDATED' }));
        });
      })
  );
});

// ── FETCH ────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Only intercept GET; ignore extensions
  if (req.method !== 'GET') return;
  if (!['http:', 'https:'].includes(url.protocol)) return;

  const isExternal = [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'cdnjs.cloudflare.com',
    'cdn.jsdelivr.net'
  ].some(host => url.hostname.includes(host));

  if (isExternal) {
    event.respondWith(cacheFirstExt(req));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirstShell(req));
    return;
  }
});

// Cache-first for app shell
async function cacheFirstShell(req) {
  const cached = await caches.match(req);
  if (cached) return cached;

  try {
    const res = await fetch(req);
    if (res.ok) {
      const cache = await caches.open(SHELL_KEY);
      cache.put(req, res.clone());
    }
    return res;
  } catch {
    // Offline fallback → serve index.html for navigation
    if (req.mode === 'navigate') {
      const fallback = await caches.match('./index.html');
      if (fallback) return fallback;
    }
    return new Response('Offline — no cached version available', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Cache-first for external assets (fonts, libs)
async function cacheFirstExt(req) {
  const cached = await caches.match(req);
  if (cached) return cached;

  try {
    const res = await fetch(req);
    if (res.ok) {
      const cache = await caches.open(EXT_KEY);
      cache.put(req, res.clone());
    }
    return res;
  } catch {
    console.warn('[SW] External resource unavailable offline:', req.url);
    return new Response('', { status: 503 });
  }
}

// ── MESSAGES ─────────────────────────────────────────────────
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    console.log('[SW] SKIP_WAITING received');
    self.skipWaiting();
  }
});
