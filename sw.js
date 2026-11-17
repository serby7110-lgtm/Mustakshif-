// Mustakshif Offline-First Service Worker

try {
  importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');
} catch (error) {
  // Continue with native Cache API offline strategy when Workbox CDN is unavailable
}

const CACHE = "pwabuilder-page";
const RUNTIME_CACHE = "mustakshif-runtime-v1";
const offlineFallbackPage = "/offline.html";

const PRECACHE_URLS = [
  "/",
  offlineFallbackPage,
  "/manifest.json",
  "/icons/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.add(offlineFallbackPage);
      await Promise.allSettled(
        PRECACHE_URLS.filter((url) => url !== offlineFallbackPage).map(async (url) => {
          try {
            const response = await fetch(url, { cache: "no-cache" });
            if (response && response.ok) {
              await cache.put(url, response);
            }
          } catch {
            // Skip individual optional precache failure without aborting SW install
          }
        })
      );
    })()
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

if (typeof workbox !== "undefined" && workbox.navigationPreload && workbox.navigationPreload.isSupported()) {
  try {
    workbox.navigationPreload.enable();
  } catch {
    // Ignore navigation preload errors
  }
}

async function handleNavigationRequest(event) {
  try {
    const preloadResp = await event.preloadResponse;
    if (preloadResp && preloadResp.ok) {
      const runtimeCache = await caches.open(RUNTIME_CACHE);
      runtimeCache.put(event.request, preloadResp.clone()).catch(() => {});
      return preloadResp;
    }

    const networkResp = await fetch(event.request);
    if (networkResp && networkResp.ok) {
      const runtimeCache = await caches.open(RUNTIME_CACHE);
      runtimeCache.put(event.request, networkResp.clone()).catch(() => {});
      const reqUrl = new URL(event.request.url);
      if (reqUrl.pathname === "/") {
        runtimeCache.put("/", networkResp.clone()).catch(() => {});
      }
    }
    return networkResp;
  } catch {
    const runtimeCache = await caches.open(RUNTIME_CACHE);
    const cachedRoute = await runtimeCache.match(event.request);
    if (cachedRoute) return cachedRoute;

    const cachedAppShell =
      (await runtimeCache.match("/")) ||
      (await caches.match("/"));
    if (cachedAppShell) return cachedAppShell;

    const offlineCache = await caches.open(CACHE);
    const cachedResp = await offlineCache.match(offlineFallbackPage);
    return cachedResp || Response.error();
  }
}

async function handleStaticAssetRequest(request) {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request)
    .then(async (networkResp) => {
      if (networkResp && (networkResp.ok || networkResp.type === "opaque")) {
        const runtimeCache = await caches.open(RUNTIME_CACHE);
        runtimeCache.put(request, networkResp.clone()).catch(() => {});
      }
      return networkResp;
    })
    .catch(() => null);

  if (cached) {
    return cached;
  }

  const fresh = await fetchPromise;
  if (fresh) return fresh;
  return new Response("", { status: 503, statusText: "Offline" });
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigationRequest(event));
    return;
  }

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isGoogleFont =
    url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";

  if (isSameOrigin || isGoogleFont) {
    const dest = request.destination;
    const isStaticAsset =
      dest === "script" ||
      dest === "style" ||
      dest === "image" ||
      dest === "font" ||
      dest === "manifest" ||
      url.pathname.startsWith("/assets/") ||
      url.pathname.startsWith("/images/") ||
      url.pathname.startsWith("/icons/");

    if (isStaticAsset || isGoogleFont) {
      event.respondWith(handleStaticAssetRequest(request));
    }
  }
});
