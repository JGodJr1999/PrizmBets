// PrizmBets Service Worker for Performance Optimization
const CACHE_NAME = 'prizmbets-v1';
const STATIC_CACHE = 'prizmbets-static-v1';
const DYNAMIC_CACHE = 'prizmbets-dynamic-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico'
];

// API endpoints to cache with different strategies
const API_CACHE_PATTERNS = [
  /\/api\/odds\//,
  /\/api\/all-games/,
  /\/api\/live-scores/
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch(err => console.log('Service Worker: Cache failed', err))
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Handle API requests with network-first strategy
  if (API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Handle static assets with cache-first strategy
  if (request.destination === 'script' || 
      request.destination === 'style' || 
      request.destination === 'image' ||
      url.pathname.startsWith('/static/')) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Handle navigation requests with network-first, fallback to cache
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Default: try cache first, fallback to network
  event.respondWith(cacheFirstStrategy(request));
});

// Network-first strategy (for API calls and dynamic content)
async function networkFirstStrategy(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // If successful, cache the response and return it
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      // Clone response before caching (response can only be consumed once)
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache', error);
    
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('Service Worker: Serving from cache');
      return cachedResponse;
    }
    
    // If it's an API request and we have no cache, return a meaningful error response
    if (API_CACHE_PATTERNS.some(pattern => pattern.test(new URL(request.url).pathname))) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Network unavailable and no cached data available',
        offline: true
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    throw error;
  }
}

// Cache-first strategy (for static assets)
async function cacheFirstStrategy(request) {
  // Try cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // Cache miss, go to network
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network and cache failed', error);
    
    // For navigation requests, return a basic offline page
    if (request.mode === 'navigate') {
      return new Response(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>PrizmBets - Offline</title>
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                min-height: 100vh; 
                margin: 0; 
                background: #1a1a1a; 
                color: #fff;
              }
              .container { 
                text-align: center; 
                padding: 2rem;
                max-width: 500px;
              }
              .icon { font-size: 4rem; margin-bottom: 1rem; }
              h1 { color: #00d4aa; margin-bottom: 1rem; }
              p { color: #ccc; line-height: 1.5; }
              button { 
                background: #00d4aa; 
                color: #000; 
                border: none; 
                padding: 12px 24px; 
                border-radius: 8px; 
                font-weight: 600; 
                cursor: pointer;
                margin-top: 1rem;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon">📶</div>
              <h1>You're Offline</h1>
              <p>PrizmBets is not available right now. Please check your internet connection and try again.</p>
              <button onclick="window.location.reload()">Try Again</button>
            </div>
          </body>
        </html>
      `, {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    throw error;
  }
}

// Background sync for failed API requests (if browser supports it)
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);
  
  if (event.tag === 'odds-sync') {
    event.waitUntil(
      // Retry failed API calls
      retryFailedApiCalls()
    );
  }
});

async function retryFailedApiCalls() {
  try {
    // Get all cached API requests that might be stale
    const cache = await caches.open(DYNAMIC_CACHE);
    const requests = await cache.keys();
    
    const apiRequests = requests.filter(request => 
      API_CACHE_PATTERNS.some(pattern => pattern.test(new URL(request.url).pathname))
    );
    
    // Try to refresh cached API data
    await Promise.allSettled(
      apiRequests.map(async (request) => {
        try {
          const fresh = await fetch(request);
          if (fresh && fresh.status === 200) {
            await cache.put(request, fresh.clone());
          }
        } catch (error) {
          console.log('Service Worker: Failed to refresh', request.url);
        }
      })
    );
    
    console.log('Service Worker: Background sync completed');
  } catch (error) {
    console.log('Service Worker: Background sync failed', error);
  }
}

// Message handling for cache updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      })
    );
  }
});