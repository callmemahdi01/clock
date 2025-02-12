const CACHE_NAME = 'clock-cache-v1.3';
const urlsToCache = [
  '/clock/',
  '/clock/index.html',
  '/clock/manifest.json',
  '/clock/icon192×192.png',
  '/clock/icon512×512.png',
  '/clock/sw.js'
].map(url => new Request(url, { credentials: 'same-origin' }));

// استراتژی cacheFirst: ابتدا از کش می‌خوانیم، در صورت عدم وجود، به شبکه مراجعه می‌کنیم
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  return cachedResponse || networkFirst(request);
}

// استراتژی networkFirst: ابتدا تلاش می‌کنیم از شبکه بخوانیم، اگر موفق بود، نتیجه در کش ذخیره شده و بازگردانده می‌شود؛ در غیر این صورت، از کش استفاده می‌کنیم
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    // بررسی می‌کنیم که پاسخ معتبر است
    if (response && response.status === 200 && response.type === 'basic') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return caches.match(request);
  }
}

// رویداد نصب (install): در زمان نصب، فایل‌های مورد نظر را کش می‌کنیم
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// رویداد fetch: درخواست‌ها را مدیریت می‌کنیم و ابتدا استراتژی cacheFirst را اعمال می‌کنیم
self.addEventListener('fetch', event => {
  event.respondWith(cacheFirst(event.request));
});

// رویداد activate: در زمان فعال شدن سرویس ورکر، کش‌های قدیمی پاک می‌شوند
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
    })
  );
});
