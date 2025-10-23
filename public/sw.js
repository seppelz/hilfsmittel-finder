const CACHE_NAME = 'aboelo-hilfsmittel-static-v1';
const API_CACHE_NAME = 'aboelo-hilfsmittel-api-v1';
const API_BASE = 'https://hilfsmittel-api.gkv-spitzenverband.de';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
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
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request)),
    );
    return;
  }

  if (url.origin.startsWith(API_BASE)) {
    event.respondWith(apiNetworkFirst(request));
  }
});

async function apiNetworkFirst(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(API_CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}
