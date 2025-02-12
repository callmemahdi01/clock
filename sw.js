const CACHE_NAME = "flip-clock-cache-v1";
const urlsToCache = [
  "/clock/",
  "/clock/index.html",
  "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/flipclock/0.7.8/flipclock.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/flipclock/0.7.8/flipclock.css"
];

// کش کردن منابع هنگام نصب سرویس ورکر
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

// حذف کش‌های قدیمی هنگام فعال شدن سرویس ورکر جدید
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

// مدیریت درخواست‌ها
self.addEventListener("fetch", (event) => {
  const requestURL = new URL(event.request.url);

  // از پردازش درخواست‌هایی که از chrome-extension:// یا فایل‌های غیر HTTP هستند، صرف نظر کن
  if (!requestURL.protocol.startsWith("http")) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // فقط درخواست‌های GET را در کش ذخیره کن
        if (event.request.method !== "GET") {
          return response;
        }

        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || caches.match("/clock/index.html");
        });
      })
  );
});
