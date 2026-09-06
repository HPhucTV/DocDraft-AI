/**
 * ==============================================================================
 * SERVICE WORKER — DOCDRAFT AI PWA & OFFLINE MODE (TASK-505)
 * ==============================================================================
 */

const CACHE_NAME = "docdraft-ai-v1";
const STATIC_ASSETS = [
  "/",
  "/editor",
  "/manifest.json",
  "/globe.svg",
  "/file.svg",
];

// Install: Cache core assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: Clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network-First strategy with Cache Fallback for offline usage
self.addEventListener("fetch", (event) => {
  // Chỉ cache các request GET
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Không cache bất kỳ endpoint API nào (API xử lý động, xác thực phiên và lưu ngoại tuyến qua LocalStorage)
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Sao chép response vào cache nếu thành công
        if (response && response.status === 200 && response.type === "basic") {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Khi mất mạng, lấy từ cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback về trang chính nếu là navigation
          if (event.request.mode === "navigate") {
            return caches.match("/");
          }
        });
      })
  );
});
