self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open('school-cache').then(function (cache) {
            return cache.addAll([
                '/',
                '/index.html',
                '/style.css',
                '/image/logo.png',
                '/image/school.png',
                '/manifest.json',
            ]);
        })
    );
});

self.addEventListener('fetch', function (event) {
    event.respondWith(
        caches.match(event.request).then(function (response) {
            return response || fetch(event.request);
        })
    );
});
