const CACHE_NAME = 'clock-cache-v1.4';
const urlsToCache = [
  '/clock/',
  '/clock/index.html',
  '/clock/manifest.json',
  '/clock/icon192x192.png',
  '/clock/icon512x512.png',
  '/clock/sw.js'
].map(url => new Request(url, { credentials: 'same-origin' }));

// تابع کمکی برای ایجاد تایم‌اوت
function timeoutPromise(delay) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Network timeout')), delay);
  });
}

// استراتژی network-first با تایم‌اوت
async function networkFirst(request) {
  try {
    // درخواست شبکه و تایم‌اوت در قالب Promise.race
    const response = await Promise.race([
      fetch(request),
      timeoutPromise(3000) // اگر پس از 3000 میلی‌ثانیه پاسخی دریافت نشود، تایم‌اوت می‌شود
    ]);
    
    // اگر پاسخ معتبر بود، در کش ذخیره می‌شود
    if (response && response.status === 200 && response.type === 'basic') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // در صورت بروز خطا یا تایم‌اوت، نسخه کش شده استفاده می‌شود
    const cachedResponse = await caches.match(request);
    return cachedResponse || Promise.reject('No cached response and network failed.');
  }
}

// استراتژی cache-first برای منابع استاتیک
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  return networkFirst(request);
}

// رویداد install: ذخیره منابع اولیه در کش
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// رویداد fetch: استفاده از استراتژی مناسب برای هر درخواست
self.addEventListener('fetch', event => {
  // فقط برای درخواست‌های GET
  if (event.request.method !== 'GET') {
    return;
  }
  
  // بررسی نوع درخواست؛ اگر درخواست انتظار HTML دارد (برای صفحات وب)
  const acceptHeader = event.request.headers.get('Accept') || '';
  if (acceptHeader.includes('text/html')) {
    // استفاده از network-first (با تایم‌اوت) برای صفحات HTML
    event.respondWith(networkFirst(event.request));
  } else {
    // بقیه منابع از کش استفاده می‌کنند (در صورت عدم وجود در کش از شبکه دریافت می‌شود)
    event.respondWith(cacheFirst(event.request));
  }
});

// رویداد activate: حذف کش‌های قدیمی و کنترل نسخه‌ها
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
