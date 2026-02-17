const CACHE_NAME = 'ravito-v3';
const OFFLINE_URL = '/offline.html';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/site.webmanifest',
  '/web-app-manifest-192x192.png',
  '/web-app-manifest-512x512.png',
  '/logo_sans_slogan.png',
  '/Logo_Ravito_avec_slogan.png',
];

// Install — precache static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache partial failure:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate — remove old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// ─── Helpers ───────────────────────────────────────────────────────────────────

const isSupabaseRequest = (url) =>
  url.hostname.endsWith('.supabase.co') || url.hostname.includes('supabase');

const isStaticAsset = (req) =>
  req.destination === 'image' ||
  req.destination === 'style' ||
  req.destination === 'font' ||
  /\.(png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|eot)$/i.test(new URL(req.url).pathname);

const isAppChunk = (req) => {
  const path = new URL(req.url).pathname;
  return (
    req.destination === 'script' ||
    req.destination === 'style' ||
    path.startsWith('/assets/') ||
    /\.(js|css)$/.test(path)
  );
};

// Cache-first with network fallback (for static/binary assets)
const cacheFirst = async (request) => {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Asset unavailable offline', { status: 503 });
  }
};

// Stale-while-revalidate (for app JS/CSS chunks)
const staleWhileRevalidate = async (request) => {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const networkFetch = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);

  return cached || (await networkFetch) || new Response('Chunk unavailable', { status: 503 });
};

// Network-first with cache fallback (for navigation / HTML)
const networkFirst = async (request) => {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || caches.match(OFFLINE_URL);
  }
};

// ─── Fetch Strategy ────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET and Supabase API calls (always live)
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (isSupabaseRequest(url)) return;

  // External CDN (Leaflet tiles, Mapbox, etc.) — cache-first
  if (url.hostname !== self.location.hostname) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Navigation requests — network-first, fallback to cached index or offline page
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  // Vite app chunks (JS/CSS) — stale-while-revalidate for instant load
  if (isAppChunk(request)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Static assets (images, fonts) — cache-first
  if (isStaticAsset(request)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Default — network-first
  event.respondWith(networkFirst(request));
});

// ─── Background Sync ───────────────────────────────────────────────────────────

self.addEventListener('sync', (event) => {
  if (event.tag === 'ravito-sync-queue') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'TRIGGER_SYNC' });
        });
      })
    );
  }
});

// ─── Push Notifications ────────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const options = {
    body: data.body || 'Nouvelle notification',
    icon: data.icon || '/web-app-manifest-192x192.png',
    badge: data.badge || '/favicon-96x96.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/', notificationId: data.id },
    tag: data.tag || 'ravito-notification',
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
  };
  event.waitUntil(
    self.registration.showNotification(data.title || 'RAVITO', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const notificationUrl = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const targetUrl = new URL(notificationUrl, self.location.origin);
      for (const client of windowClients) {
        const clientUrl = new URL(client.url);
        if (clientUrl.pathname === targetUrl.pathname && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl.href);
      }
    })
  );
});

self.addEventListener('notificationclose', () => {});

// ─── Message Handler (SW <-> App) ──────────────────────────────────────────────

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data?.type === 'CACHE_URLS') {
    const urls = event.data.urls || [];
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => cache.addAll(urls))
    );
  }
});
