const CACHE = 'financas-v2';
const ASSETS = [
  './', './index.html', './css/main.css',
  './js/config.js', './js/db.js', './js/utils.js', './js/ui.js',
  './js/transactions.js', './js/goals.js', './js/patrimony.js',
  './js/reports.js', './js/dashboard.js', './js/calendar.js',
  './js/insights.js', './js/backup.js', './js/app.js',
  './manifest.json', './icons/icon-192.png', './icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => {
      return Promise.allSettled(ASSETS.map(url => c.add(url)));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  // For navigation requests, serve index.html (fixes 404 on mobile PWA)
  if (e.request.mode === 'navigate') {
    e.respondWith(
      caches.match('./index.html').then(r => r || fetch('./index.html'))
    );
    return;
  }

  // Network-first for Firebase/CDN resources
  const url = new URL(e.request.url);
  if (url.hostname.includes('firebase') || url.hostname.includes('googleapis') ||
      url.hostname.includes('cdn.jsdelivr') || url.hostname.includes('fonts.')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first for local assets
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response && response.status === 200) {
          const rc = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, rc));
        }
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
