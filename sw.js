/**
 * ╔══════════════════════════════════════════════╗
 *  Depo Bulucu — Service Worker v1.0
 *  Strateji: Cache-First (offline öncelikli)
 * ╚══════════════════════════════════════════════╝
 *
 * Cache stratejisi:
 *  - App shell (HTML, JS, CSS) → Cache-First
 *  - CDN kaynakları (SheetJS, Dexie, Google Fonts) → Cache-First
 *  - Bilinmeyen istekler → Network-First (güvenli fallback)
 */

const CACHE_NAME = 'depo-bulucu-v1.0.1';

// App shell ve CDN kaynaklarını önbelleğe al
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',

  // SheetJS (Excel parser)
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',

  // Dexie.js (IndexedDB wrapper)
  'https://cdnjs.cloudflare.com/ajax/libs/dexie/3.2.4/dexie.min.js',

  // Google Fonts CSS
  'https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800&family=JetBrains+Mono:wght@600;800&display=swap',
];

/* ─── INSTALL ──────────────────────────────────── */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing v1.0...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Cache each URL individually so one failure doesn't block all
      const results = await Promise.allSettled(
        PRECACHE_URLS.map(url =>
          cache.add(url).catch(err =>
            console.warn('[SW] Precache failed for:', url, err.message)
          )
        )
      );
      console.log('[SW] Precache complete');
      return results;
    })
  );
  // Immediately activate without waiting for old SW to die
  self.skipWaiting();
});

/* ─── ACTIVATE ─────────────────────────────────── */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(oldCache => {
            console.log('[SW] Deleting old cache:', oldCache);
            return caches.delete(oldCache);
          })
      )
    ).then(() => {
      console.log('[SW] Activated — claiming clients');
      return self.clients.claim();
    })
  );
});

/* ─── FETCH ────────────────────────────────────── */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and non-http(s) schemes
  if (!url.protocol.startsWith('http')) return;

  event.respondWith(cacheFirst(request));
});

/**
 * Cache-First strategy:
 * 1. Return cached response if available
 * 2. Fetch from network, cache it, then return
 * 3. If both fail, return a fallback
 */
async function cacheFirst(request) {
  try {
    const cached = await caches.match(request, { ignoreSearch: false });
    if (cached) {
      // Return cache hit; refresh in background for key assets
      if (isKeyAsset(request.url)) {
        refreshInBackground(request);
      }
      return cached;
    }

    // Cache miss — fetch from network
    const response = await fetch(request.clone());

    // Cache successful responses (2xx)
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone()).catch(() => {});
    }

    return response;
  } catch (err) {
    console.warn('[SW] Fetch failed:', request.url, err.message);

    // Return cached fallback if available
    const fallback = await caches.match('./index.html');
    if (fallback) return fallback;

    // Last resort: offline response
    return new Response(
      `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <title>Çevrimdışı</title>
      <style>
        body { background:#0f172a; color:#f1f5f9; font-family:sans-serif;
               display:flex; flex-direction:column; align-items:center;
               justify-content:center; min-height:100vh; text-align:center;
               padding:20px; gap:16px; }
        h1 { font-size:2rem; }
        p  { color:#94a3b8; }
        button { background:#3b82f6; color:#fff; border:none; padding:12px 24px;
                 border-radius:8px; font-size:1rem; cursor:pointer; }
      </style></head>
      <body>
        <h1>📶 Çevrimdışı</h1>
        <p>İnternet bağlantısı yok. Uygulama daha önce yüklendiyse çalışmaya devam eder.</p>
        <button onclick="location.reload()">Tekrar Dene</button>
      </body></html>`,
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}

/** Silently refresh a cached asset in the background */
async function refreshInBackground(request) {
  try {
    const response = await fetch(request.clone());
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response);
    }
  } catch (_) {
    // Silently fail — user already got cached version
  }
}

/** Key assets that should be refreshed in the background */
function isKeyAsset(url) {
  return url.includes('index.html') || url.endsWith('/') || url.endsWith('./');
}
