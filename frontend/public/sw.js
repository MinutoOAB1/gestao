const CACHE_NAME = 'advus-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/Advus.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // For navigation requests (like F5), try the network first.
  // This prevents the "blank page" issue when the cached HTML points to old assets.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/');
      })
    );
    return;
  }

  // For other requests, use cache-first but fallback to network
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

