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
  if (cachedResponse) {
    return cachedResponse;
  }
  return networkFirst(request);
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
    return caches.match(request); // استفاده از کش در صورت عدم دسترسی به اینترنت
  }
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.url.includes('index.html')) {
    event.respondWith(networkFirst(event.request)); // درخواست برای صفحه اصلی همیشه از سرور انجام شود
  } else {
    event.respondWith(cacheFirst(event.request)); // درخواست‌های استاتیک از کش استفاده کنند
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
    }).then(() => self.clients.claim())
  );
});
