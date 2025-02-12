const CACHE_NAME = "flip-clock-cache-v1";
const urlsToCache = [
  "/clock/",
"/clock/index.html",  // مسیر صفحه اصلی
  "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/flipclock/0.7.8/flipclock.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/flipclock/0.7.8/flipclock.css"
];

// هنگام نصب، منابع را کش می‌کنیم
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const url of urlsToCache) {
        try {
          await cache.add(url);
        } catch (err) {
          console.error(`خطا در کش کردن ${url}:`, err);
        }
      }
    })
  );
});

// حذف کش‌های قدیمی هنگام فعال‌سازی سرویس ورکر جدید
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("حذف کش قدیمی:", cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// مدیریت درخواست‌ها: اولویت با اینترنت، در صورت مشکل از کش
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // اگر درخواست موفق بود، نتیجه را در کش ذخیره می‌کنیم
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
      .catch(() => {
        // اگر اینترنت قطع بود، از کش استفاده می‌کنیم
        return caches.match(event.request);
      })
  );
});
