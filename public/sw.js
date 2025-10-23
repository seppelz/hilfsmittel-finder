const CACHE_NAME = 'aboelo-hilfsmittel-static-v3';
const API_CACHE_NAME = 'aboelo-hilfsmittel-api-v3';
const API_PROXY_PATH = '/api/proxy';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== API_CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API proxy requests with network-first strategy
  if (url.pathname.startsWith(API_PROXY_PATH)) {
    event.respondWith(apiNetworkFirst(request));
    return;
  }

  // Handle same-origin requests
  if (url.origin === self.location.origin) {
    // Network-first for HTML and JavaScript to avoid stale app
    if (request.destination === 'document' || request.destination === 'script') {
      event.respondWith(
        fetch(request)
          .then((response) => {
            const cache = caches.open(CACHE_NAME);
            cache.then((c) => c.put(request, response.clone()));
            return response;
          })
          .catch(() => caches.match(request))
      );
      return;
    }
    
    // Cache-first for other assets (CSS, images, fonts)
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request)),
    );
    return;
  }
});

async function apiNetworkFirst(request) {
  try {
    const response = await fetch(request);
    // Only cache successful responses
    if (response.ok) {
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      console.log('[SW] Serving API response from cache (offline)');
      return cached;
    }
    throw error;
  }
}
