self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open('my-school-cache').then((cache) => {
            return cache.addAll([
                '/',
                'index.html',
                'style.css',
                'image/logo.png',
                'script.js',
            ]);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request);
        })
    );
});
