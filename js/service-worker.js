/**
 * Service Worker for YOURLS Shortener Extension
 * Provides caching for static assets and improved offline experience
 */

// Cache version identifier
const CACHE_NAME = 'yourls-extension-cache-v1';

// Assets to pre-cache for offline support
const PRECACHE_ASSETS = [
  '/',
  '/popup.html',
  '/settings.html',
  '/css/popup.css',
  '/css/settings.css',
  '/js/i18n.js',
  '/popup.js',
  '/settings.js',
  '/images/icon48.png',
  '/images/icon128.png',
  '/data/changelog.json'
];

// Install event - precache critical assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
      .catch(error => console.error('Pre-caching failed:', error))
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  // Handle only GET requests and ignored extension API requests
  if (event.request.method !== 'GET' || 
      event.request.url.includes('chrome-extension://') ||
      event.request.url.includes('yourls-api.php')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return cached response if found
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Otherwise, fetch from network
        return fetch(event.request)
          .then(response => {
            // Don't cache if not valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone response to cache it and return it
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              })
              .catch(error => console.error('Cache update failed:', error));
              
            return response;
          })
          .catch(error => {
            console.error('Network fetch failed:', error);
            // Could add fallback content here for offline pages
          });
      })
  );
});

// Handle messages from the extension
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME)
      .then(() => {
        console.log('Cache cleared successfully');
        event.ports[0].postMessage({ success: true });
      })
      .catch(error => {
        console.error('Cache clearing failed:', error);
        event.ports[0].postMessage({ success: false, error: error.message });
      });
  }
});
