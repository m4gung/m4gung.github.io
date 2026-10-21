/* GeoLahan Pro — service worker (dibangkitkan saat build; jangan edit sw.js di dist/). */
const VERSION = '__VERSION__';
const SHELL_CACHE = 'geolahan-shell-' + VERSION;
const TILE_CACHE = 'geolahan-tiles-v1';
const MAX_TILES = 400;
const PRECACHE = __PRECACHE__;
const TILE_HOSTS = ['server.arcgisonline.com', 'tile.openstreetmap.org'];

const scopeUrl = (path) => new URL(path, self.registration.scope).href;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(PRECACHE.map((p) => new Request(scopeUrl(p), { cache: 'reload' })))),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k.startsWith('geolahan-shell-') && k !== SHELL_CACHE).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

// Pembaruan hanya diterapkan setelah pengguna memilih "Muat ulang".
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

async function trimTiles(cache) {
  const keys = await cache.keys();
  if (keys.length > MAX_TILES) await Promise.all(keys.slice(0, keys.length - MAX_TILES).map((k) => cache.delete(k)));
}

async function tileStrategy(request) {
  const cache = await caches.open(TILE_CACHE);
  const cached = await cache.match(request);
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone()).then(() => trimTiles(cache));
    }
    return response;
  } catch (err) {
    if (cached) return cached;
    throw err;
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (TILE_HOSTS.some((h) => url.hostname === h || url.hostname.endsWith('.' + h))) {
    event.respondWith(tileStrategy(request));
    return;
  }

  // Selain itu (mis. Nominatim) langsung ke jaringan, tidak pernah di-cache.
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => (await caches.match(scopeUrl('./index.html'), { ignoreVary: true })) || Response.error()),
    );
    return;
  }

  event.respondWith(
    // ignoreVary: server dev/preview memakai Vary: Origin sehingga request crossorigin tak cocok.
    caches.match(request, { ignoreVary: true }).then((hit) => hit || fetch(request)),
  );
});
