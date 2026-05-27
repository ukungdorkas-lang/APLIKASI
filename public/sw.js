// Simple Service Worker for Offline Caching
const CACHE_NAME = 'damkar-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return Promise.allSettled(
          urlsToCache.map(url => {
            return cache.add(url).catch(err => {
              console.warn(`Failed to cache ${url} during install:`, err);
            });
          })
        );
      })
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests and only HTTP/HTTPS protocols (avoid chrome-extensions, etc.)
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).catch((err) => {
          // Gracefully log fetch failure without throwing unhandled rejection to the top-level
          console.debug('Service worker fetch failed:', err);
          return new Response('Network error occurred', {
            status: 480,
            statusText: 'Network Error',
            headers: { 'Content-Type': 'text/plain' }
          });
        });
      })
  );
});
