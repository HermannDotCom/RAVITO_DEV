const CACHE_NAME = 'ravito-v2';
const OFFLINE_URL = '/offline.html';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/site.webmanifest',
  '/web-app-manifest-192x192.png',
  '/web-app-manifest-512x512.png',
  '/logo_sans_slogan.png',
  '/Logo_Ravito_avec_slogan.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first for API, cache first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip Supabase API requests (always network)
  if (url.hostname.endsWith('.supabase.co') || url.hostname.includes('supabase')) return;

  // For navigation requests, try network first
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // For static assets, cache first
  if (request.destination === 'image' || 
      request.destination === 'style' || 
      request.destination === 'script' ||
      request.destination === 'font') {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request).then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Default: network first
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// Push notification event - handle incoming push notifications
self.addEventListener('push', function(event) {
  console.log('Push notification received:', event);
  
  const data = event.data?.json() || {};
  
  const options = {
    body: data.body || 'Nouvelle notification',
    icon: data.icon || '/web-app-manifest-192x192.png',
    badge: data.badge || '/favicon-96x96.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      notificationId: data.id
    },
    tag: data.tag || 'ravito-notification',
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || []
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'RAVITO', options)
  );
});

// Notification click event - handle user interaction with notifications
self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  const notificationUrl = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Parse URLs for proper comparison
      const targetUrl = new URL(notificationUrl, self.location.origin);
      
      // Check if there is already a window open with the target URL
      for (const client of windowClients) {
        const clientUrl = new URL(client.url);
        // Compare pathname to handle absolute vs relative URLs
        if (clientUrl.pathname === targetUrl.pathname && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl.href);
      }
    })
  );
});

// Notification close event - handle notification dismissal (optional)
self.addEventListener('notificationclose', function(event) {
  console.log('Notification closed:', event);
  // Optional: Track notification dismissal analytics
});
