const CACHE_NAME = 'grid-2081-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/image/logo.png',
  '/image/Image.png',
  '/image/school.png',
  '/html/class1.html',
  '/html/class2.html',
  '/js/html.js',
  '/articles.json',
  // Add other html pages if needed
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});
