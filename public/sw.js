// Version number - increment this to force cache refresh
const VERSION = 'v5.8';
const CACHE_NAME = `aboelo-hilfsmittel-static-${VERSION}`;
const API_CACHE_NAME = `aboelo-hilfsmittel-api-${VERSION}`;
const API_PROXY_PATH = '/api/proxy';

// Minimal static assets - app shell only
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  console.log(`[SW ${VERSION}] Installing new service worker`);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => {
        console.log(`[SW ${VERSION}] Installation complete`);
        // Force immediate activation
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log(`[SW ${VERSION}] Activating new service worker`);
  event.waitUntil(
    caches.keys()
      .then((keys) => {
        // Delete all old caches
        const oldCaches = keys.filter((key) => 
          key.startsWith('aboelo-hilfsmittel') && 
          !key.includes(VERSION)
        );
        console.log(`[SW ${VERSION}] Deleting ${oldCaches.length} old caches`);
        return Promise.all(oldCaches.map((key) => caches.delete(key)));
      })
      .then(() => {
        console.log(`[SW ${VERSION}] Taking control of all clients`);
        // Take control immediately
        return self.clients.claim();
      })
  );
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
    // Network-first for HTML, JavaScript, and CSS to ensure fresh content
    if (
      request.destination === 'document' || 
      request.destination === 'script' || 
      request.destination === 'style' ||
      url.pathname.endsWith('.html') ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css')
    ) {
      event.respondWith(
        fetch(request, { cache: 'no-cache' })  // Force revalidation
          .then((response) => {
            // Clone BEFORE using the response to avoid "body already used" error
            if (response && response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            // Fallback to cache only if offline
            console.log(`[SW ${VERSION}] Network failed, using cache for:`, request.url);
            return caches.match(request);
          })
      );
      return;
    }
    
    // Stale-while-revalidate for other assets (images, fonts)
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          // Clone BEFORE using the response to avoid "body already used" error
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
        // Return cached immediately, but update cache in background
        return cached || fetchPromise;
      })
    );
    return;
  }
});

// Listen for skip waiting message from app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log(`[SW ${VERSION}] SKIP_WAITING message received, activating now...`);
    self.skipWaiting();
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
      console.log(`[SW ${VERSION}] Serving API response from cache (offline)`);
      return cached;
    }
    throw error;
  }
}
