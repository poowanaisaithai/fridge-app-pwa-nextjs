// ==============================================================================
// Service Worker for FreshFridge PWA
// Handles Web Push notifications and PWA caching
// ==============================================================================

const CACHE_NAME = 'fresh-fridge-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg',
];

// Install event - cache core assets
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
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Push notification received
self.addEventListener('push', (event) => {
  let data = {
    title: 'FreshFridge แจ้งเตือนอาหารหมดอายุ',
    body: 'มีอาหารในตู้เย็นใกล้หมดอายุ ตรวจสอบเลย!',
    icon: '/icons/icon-192x192.svg',
    badge: '/icons/icon-192x192.svg',
    data: { url: '/' },
    tag: 'fridge-expiry-alert',
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.svg',
    badge: data.badge || '/icons/icon-192x192.svg',
    vibrate: [200, 100, 200],
    data: data.data || { url: '/' },
    tag: data.tag || 'fridge-alert',
    renotify: true,
    actions: [
      { action: 'open', title: '👀 เปิดดูตู้เย็น' },
      { action: 'dismiss', title: 'ปิด' },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window client is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
