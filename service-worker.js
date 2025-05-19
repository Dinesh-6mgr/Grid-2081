const CACHE_NAME = 'grid-2081-cache-v2'; // Changed cache version

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
  // Add other static files if needed
];

// Install event - cache static files
self.addEventListener('install', event => {
  self.skipWaiting(); // Activate immediately
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Activate event - clear old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache); // Delete old version
          }
        })
      );
    })
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Save fresh version to cache
        const clonedResponse = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, clonedResponse);
        });
        return response;
      })
      .catch(() => {
        // If offline or fetch fails, use cache
        return caches.match(event.request);
      })
  );
});