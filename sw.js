const CACHE_NAME = 'clock-cache-v1.4';
const urlsToCache = [
  '/clock/',
  '/clock/index.html',
  '/clock/manifest.json',
  '/clock/icon192x192.png',
  '/clock/icon512x512.png',
  '/clock/sw.js'
].map(url => new Request(url, { credentials: 'same-origin' }));

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  return cachedResponse || networkFirst(request);
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200 && response.type === 'basic') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return caches.match(request);
  }
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting()) // بلافاصله فعال شود
  );
});

self.addEventListener('fetch', event => {
  if (event.request.url.includes('index.html')) {
    event.respondWith(networkFirst(event.request));
  } else {
    event.respondWith(cacheFirst(event.request));
  }
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // اطمینان از اعمال نسخه‌ی جدید
  );
});
