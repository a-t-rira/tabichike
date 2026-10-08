const CACHE_NAME = "tabichike-v0.1.0";
const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./sw.js",
  "./css/base.css",
  "./css/components.css",
  "./css/home.css",
  "./css/print.css",
  "./js/app.js",
  "./js/analytics.js",
  "./js/store.js",
  "./js/models.js",
  "./js/ui/common.js",
  "./js/ui/home.js",
  "./js/ui/trip-form.js",
  "./js/ui/trip-detail.js",
  "./js/ui/tab-itinerary.js",
  "./js/ui/tab-packing.js",
  "./js/ui/tab-expenses.js",
  "./js/ui/shiori.js",
  "./js/ui/settings.js",
  "./js/ui/share-sheet.js",
  "./js/ui/shared-trip.js",
  "./js/utils/date.js",
  "./js/utils/dialog.js",
  "./js/utils/dom.js",
  "./js/utils/toast.js",
  "./js/utils/share.js",
  "./assets/icons/icon-180.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const hadPreviousVersion = Boolean(self.registration.active);
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_FILES);
    if (hadPreviousVersion) {
      const clients = await self.clients.matchAll({ includeUncontrolled: true, type: "window" });
      clients.forEach((client) => client.postMessage({ type: "UPDATE_AVAILABLE" }));
    }
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("tabichike-") && key !== CACHE_NAME).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const requestURL = new URL(event.request.url);
  if (requestURL.hostname === "static.cloudflareinsights.com" || requestURL.hostname === "cloudflareinsights.com" || requestURL.hostname.endsWith(".cloudflareinsights.com")) return;
  if (event.request.method !== "GET" || requestURL.origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(event.request);
    if (cached) return cached;
    try {
      const response = await fetch(event.request);
      if (response.ok) await cache.put(event.request, response.clone());
      return response;
    } catch {
      if (event.request.mode === "navigate") return cache.match("./index.html");
      throw new Error("Offline resource is not available in the app cache");
    }
  })());
});
