const CACHE_NAME = 'careerpath-ai-cache-v2';
const OFFLINE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg'
];

// Install Event: pre-cache minimal essentials
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Pre-caching static app shell');
        return cache.addAll(OFFLINE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event: clean up older versions of caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Evicting stale cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: network-first strategy for app resources, fallback to cache
self.addEventListener('fetch', (event) => {
  // Only intercept same-origin GET requests
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Bypass API routes so that server-side auth/Gemini calls do not get cached
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If we got a valid response, cache a copy of it
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch((error) => {
        // Network fetch failed (Offline status)
        console.log('[Service Worker] Offline event. Fetch failed for:', event.request.url);
        
        // Try matching in the local caches
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // If a navigation request was made, return the root app shell index.html
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          
          // Return nothing otherwise
          return null;
        });
      })
  );
});
