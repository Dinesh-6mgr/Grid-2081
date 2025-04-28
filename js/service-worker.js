const CACHE_NAME = 'grid-2081-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/image/logo.png',
  // Add more files if needed like '/html/class1.html', '/html/class2.html', etc.
];

// Install the service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch assets
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});
