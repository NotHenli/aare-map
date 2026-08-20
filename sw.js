const CACHE_NAME = 'aare-map-v2';

// Essential structural files that must be cached immediately to guarantee offline loading
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/data/site.js',
  '/data/messages.js',
  '/data/river.js',
  '/data/pois.js',
  '/vendor/leaflet/leaflet.css',
  '/vendor/leaflet/leaflet.js',
  '/manifest.json'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // Force the waiting service worker to become the active service worker
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_ASSETS).catch(err => {
        console.warn('PWA: Failed to precache some assets during install:', err);
      });
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name.startsWith('aare-map-') && name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  // Only handle http/https requests (chrome-extension:// etc. cannot be cached)
  const url = new URL(event.request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  // Ignore requests to external APIs that shouldn't be cached (e.g. live temperature data)
  if (event.request.url.includes('aarebootsvermietung.ch/api/')) return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const networkFetch = fetch(event.request).then(response => {
        // Only cache valid basic/cors responses (avoid opaque error responses)
        if (response && response.ok && (response.type === 'basic' || response.type === 'cors')) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        }
        return response;
      }).catch(err => {
        // Network failed (offline), we rely entirely on the cache fallback
        if (cachedResponse) return cachedResponse;
        throw err;
      });
      
      // Stale-while-revalidate: Serve from cache instantly if available, but fetch in background to keep cache fresh
      return cachedResponse || networkFetch;
    })
  );
});
