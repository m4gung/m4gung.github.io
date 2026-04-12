const CACHE_NAME = 'tani-v2-cache-v1';
const assets = [
    './',
    './index.html',
    './app.js',
    './manifest.json',
    './icon.svg',
    'https://cdn.tailwindcss.com',
    'https://unpkg.com/dexie/dist/dexie.js',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

// Install: Simpan aset ke cache
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Caching assets...');
            return cache.addAll(assets);
        })
    );
    self.skipWaiting();
});

// Activate: Bersihkan cache lama
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
        })
    );
});

// Fetch: Stale-While-Revalidate
self.addEventListener('fetch', e => {
    e.respondWith(
        caches.match(e.request).then(cachedResponse => {
            const fetchPromise = fetch(e.request).then(networkResponse => {
                // Update cache dengan versi terbaru jika request berhasil
                if (networkResponse && networkResponse.status === 200) {
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(e.request, networkResponse.clone());
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Jika offline dan fetch gagal, tidak masalah karena kita sudah punya cachedResponse
            });

            // Kembalikan cache segera jika ada, fallback ke network
            return cachedResponse || fetchPromise;
        })
    );
});