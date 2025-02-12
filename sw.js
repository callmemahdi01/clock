const CACHE_NAME = "flip-clock-cache-v1";
const urlsToCache = [
  "/clock/",
  "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/flipclock/0.7.8/flipclock.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/flipclock/0.7.8/flipclock.css",
  "/styles.css"
];

// نصب Service Worker و کش کردن منابع
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// فعال‌سازی و پاک‌سازی کش‌های قدیمی
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// هندل کردن درخواست‌ها
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // اگر درخواست در کش موجود است، آن را برمی‌گرداند
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // در غیر این صورت، تلاش می‌کند از سرور درخواست کند
      return fetch(event.request).catch(() => {
        // در صورت عدم دسترسی به اینترنت، صفحه کش‌شده آخر را نمایش می‌دهد
        return caches.match(event.request);
      });
    })
  );
});
