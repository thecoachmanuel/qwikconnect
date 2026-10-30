// QwikConnect Mobile PWA Service Worker
const CACHE_NAME = 'qwikconnect-pwa-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/assets/frontend/img/static/mobile_app_icon_192.png',
  '/assets/frontend/img/static/mobile_app_icon_512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Skip API, Next.js hot reload, and auth routes from cache
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/_next') || url.pathname.includes('chrome-extension')) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request).then((res) => {
        if (res) return res;
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/');
        }
      });
    })
  );
});

// Native Web Push Notification Event (MongoDB Native, No Firebase)
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'QwikConnect Alert', body: event.data.text() };
    }
  }

  const title = data.title || 'QwikConnect Service Update';
  const options = {
    body: data.body || 'You have an update on your service order.',
    icon: data.icon || '/assets/frontend/img/static/mobile_app_icon_192.png',
    badge: '/assets/frontend/img/static/mobile_app_icon_192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/buyer/orders',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

