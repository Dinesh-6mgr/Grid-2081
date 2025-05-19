const CACHE_NAME = 'grid-2081-cache-v2';
const urlsToCache = [
    '/style.css',
    '/image/logo.png',
    '/image/Image.png',
    '/image/school.png',
    '/js/html.js',
    '/articles.json',
    '/offline.html', // Fallback page
    // Add PDF paths if needed
];

// Install and cache essential files
self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
    );
});

// Clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event handler
self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);

    // Always fetch PDFs from network and cache them
    if (requestUrl.pathname.endsWith('.pdf')) {
        event.respondWith(
            fetch(event.request).then(response => {
                return caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, response.clone());
                    return response;
                });
            }).catch(() => caches.match(event.request))
        );
        return;
    }

    // Cache-first strategy with fallback
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request).then(fetchResponse => {
                return caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, fetchResponse.clone());
                    return fetchResponse;
                });
            });
        }).catch(() => {
            // Fallback for HTML pages when offline
            if (event.request.headers.get('accept')?.includes('text/html')) {
                return caches.match('/offline.html');
            }
        })
    );
});