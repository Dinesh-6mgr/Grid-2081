const CACHE_VERSION = 'v4';
const CACHE_PREFIX = 'jananamuna';
const PRECACHE = `${CACHE_PREFIX}-precache-${CACHE_VERSION}`;
const PAGES_CACHE = `${CACHE_PREFIX}-pages-${CACHE_VERSION}`;
const ASSETS_CACHE = `${CACHE_PREFIX}-assets-${CACHE_VERSION}`;
const PDF_CACHE = `${CACHE_PREFIX}-pdfs-${CACHE_VERSION}`;
const IMAGE_CACHE = `${CACHE_PREFIX}-images-${CACHE_VERSION}`;
const FONT_CACHE = `${CACHE_PREFIX}-fonts-${CACHE_VERSION}`;
const OFFLINE_PAGE = new URL('offline.html', self.registration.scope).href;

const PRECACHE_URLS = [
  './',
  './index.html',
  './offline.html',
  './style.css',
  './css/class-page.css',
  './manifest.json',
  './articles.json',
  './image/logo.png',
  './image/Image.png',
  './image/school.png',
  './image/icon.png'
].map(url => new URL(url, self.registration.scope).href);

const MAX_PAGE_ENTRIES = 50;
const MAX_ASSET_ENTRIES = 80;
const MAX_IMAGE_ENTRIES = 100;
const MAX_FONT_ENTRIES = 40;
const MAX_PDF_ENTRIES = 20;
const ALLOWED_CACHES = [PRECACHE, PAGES_CACHE, ASSETS_CACHE, PDF_CACHE, IMAGE_CACHE, FONT_CACHE];

async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  while (keys.length > maxItems) {
    await cache.delete(keys.shift());
  }
}

function canCache(response) {
  return response && response.ok && (response.type === 'basic' || response.type === 'cors');
}

async function cacheFirst(request, cacheName, maxItems) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) return cachedResponse;

  const response = await fetch(request);
  if (canCache(response)) {
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
    await trimCache(cacheName, maxItems);
  }
  return response;
}

async function networkFirst(request, cacheName, fallbackUrl = null, maxItems = MAX_PAGE_ENTRIES) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (canCache(response)) {
      await cache.put(request, response.clone());
      await trimCache(cacheName, maxItems);
    }
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (fallbackUrl) return caches.match(fallbackUrl);
    throw err;
  }
}

async function staleWhileRevalidate(request, cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  const networkResponsePromise = fetch(request).then(response => {
    if (canCache(response)) {
      cache.put(request, response.clone());
      trimCache(cacheName, maxItems);
    }
    return response;
  }).catch(() => null);

  return cachedResponse || networkResponsePromise || caches.match(OFFLINE_PAGE);
}

async function handlePdfRequest(request) {
  const cache = await caches.open(PDF_CACHE);
  const cachedResponse = await cache.match(request);

  try {
    const response = await fetch(request);
    if (canCache(response)) {
      await cache.put(request, response.clone());
      await trimCache(PDF_CACHE, MAX_PDF_ENTRIES);
    }
    return response;
  } catch (err) {
    return cachedResponse || new Response('This PDF is not available offline yet. Open it once while online to save it.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(PRECACHE).then(cache => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key.startsWith(CACHE_PREFIX) && !ALLOWED_CACHES.includes(key)).map(key => caches.delete(key))
      ))
      .then(() => self.registration.navigationPreload?.enable())
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;

  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request, PAGES_CACHE, OFFLINE_PAGE));
    return;
  }

  if (requestUrl.pathname.toLowerCase().endsWith('.pdf')) {
    event.respondWith(handlePdfRequest(event.request));
    return;
  }

  if (event.request.destination === 'style' || event.request.destination === 'script' || event.request.destination === 'worker' || requestUrl.pathname.endsWith('.json')) {
    event.respondWith(staleWhileRevalidate(event.request, ASSETS_CACHE, MAX_ASSET_ENTRIES));
    return;
  }

  if (event.request.destination === 'image' || requestUrl.pathname.match(/\.(png|jpg|jpeg|svg|webp|gif|ico)$/i)) {
    event.respondWith(cacheFirst(event.request, IMAGE_CACHE, MAX_IMAGE_ENTRIES));
    return;
  }

  if (event.request.destination === 'font' || requestUrl.hostname.includes('fonts.googleapis.com') || requestUrl.hostname.includes('gstatic.com') || requestUrl.hostname.includes('fontawesome')) {
    event.respondWith(cacheFirst(event.request, FONT_CACHE, MAX_FONT_ENTRIES));
    return;
  }

  if (isSameOrigin) {
    event.respondWith(staleWhileRevalidate(event.request, ASSETS_CACHE, MAX_ASSET_ENTRIES));
  }
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
