const CACHE_VERSION = 'v3';
const PRECACHE = `grid-2081-precache-${CACHE_VERSION}`;
const RUNTIME = `grid-2081-runtime-${CACHE_VERSION}`;
const PDF_CACHE = `grid-2081-pdfs-${CACHE_VERSION}`;
const FONT_CACHE = `grid-2081-fonts-${CACHE_VERSION}`;
const IMAGE_CACHE = `grid-2081-images-${CACHE_VERSION}`;
const OFFLINE_PAGE = '/offline.html';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  OFFLINE_PAGE,
  '/style.css',
  '/css/class-page.css',
  '/js/html.js',
  '/manifest.json',
  '/articles.json',
  '/image/logo.png',
  '/image/Image.png',
  '/image/school.png',
  '/image/icon.png'
];

const MAX_RUNTIME_ENTRIES = 60;
const MAX_PDF_ENTRIES = 25;
const allowedCaches = [PRECACHE, RUNTIME, PDF_CACHE, FONT_CACHE, IMAGE_CACHE];

async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    await trimCache(cacheName, maxItems);
  }
}

async function cacheFirst(request, cacheName = RUNTIME, maxItems = MAX_RUNTIME_ENTRIES) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  const networkResponse = await fetch(request);
  if (networkResponse && networkResponse.ok) {
    cache.put(request, networkResponse.clone());
    if (cacheName === RUNTIME) {
      trimCache(RUNTIME, MAX_RUNTIME_ENTRIES);
    }
  }
  return networkResponse;
}

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME);

  try {
    const preloadResponse = await self.registration.navigationPreload?.getResponse();
    if (preloadResponse) {
      cache.put(request, preloadResponse.clone());
      trimCache(RUNTIME, MAX_RUNTIME_ENTRIES);
      return preloadResponse;
    }

    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
      trimCache(RUNTIME, MAX_RUNTIME_ENTRIES);
      return response;
    }
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    const offlineFallback = await caches.match(OFFLINE_PAGE);
    if (offlineFallback) return offlineFallback;
  }

  const cached = await cache.match(request);
  return cached || caches.match(OFFLINE_PAGE);
}

async function handlePdfRequest(request) {
  const cache = await caches.open(PDF_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
      trimCache(PDF_CACHE, MAX_PDF_ENTRIES);
      return response;
    }
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
  }
  return caches.match(OFFLINE_PAGE);
}

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(PRECACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.registration.navigationPreload?.enable())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => !allowedCaches.includes(key)).map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  const acceptHeader = event.request.headers.get('accept') || '';

  if (requestUrl.pathname.endsWith('.pdf')) {
    event.respondWith(handlePdfRequest(event.request));
    return;
  }

  if (acceptHeader.includes('text/html') || event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request));
    return;
  }

  if (requestUrl.pathname.startsWith('/image/') || requestUrl.pathname.match(/\.(png|jpg|jpeg|svg|webp|gif)$/i)) {
    event.respondWith(cacheFirst(event.request, IMAGE_CACHE, 80));
    return;
  }

  if (event.request.destination === 'font' || requestUrl.hostname.includes('fonts.googleapis.com') || requestUrl.hostname.includes('gstatic.com') || requestUrl.hostname.includes('fontawesome')) {
    event.respondWith(cacheFirst(event.request, FONT_CACHE, 40));
    return;
  }

  if (event.request.destination === 'style' || event.request.destination === 'script' || event.request.destination === 'worker') {
    event.respondWith(cacheFirst(event.request, PRECACHE, MAX_RUNTIME_ENTRIES));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then(networkResponse => {
        return caches.open(RUNTIME).then(cache => {
          if (networkResponse && networkResponse.ok) {
            cache.put(event.request, networkResponse.clone());
            trimCache(RUNTIME, MAX_RUNTIME_ENTRIES);
          }
          return networkResponse;
        });
      }).catch(() => {
        if (acceptHeader.includes('text/html')) {
          return caches.match(OFFLINE_PAGE);
        }
      });
    })
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});