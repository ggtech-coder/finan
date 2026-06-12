const CACHE = 'financas-v4';
const BASE = '/finan';
const ASSETS = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/css/main.css',
  BASE + '/js/config.js',
  BASE + '/js/db.js',
  BASE + '/js/utils.js',
  BASE + '/js/ui.js',
  BASE + '/js/transactions.js',
  BASE + '/js/goals.js',
  BASE + '/js/patrimony.js',
  BASE + '/js/reports.js',
  BASE + '/js/dashboard.js',
  BASE + '/js/calendar.js',
  BASE + '/js/insights.js',
  BASE + '/js/backup.js',
  BASE + '/js/app.js',
  BASE + '/manifest.json',
  BASE + '/icons/icon-192.png',
  BASE + '/icons/icon-512.png'
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

  // Para navegações (abertura do PWA, refresh), serve sempre o index.html
  if (e.request.mode === 'navigate') {
    e.respondWith(
      caches.match(BASE + '/index.html').then(r => r || fetch(BASE + '/index.html'))
    );
    return;
  }

  // Network-first para Firebase/CDN/fontes externas
  const url = new URL(e.request.url);
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('cdn.jsdelivr') ||
    url.hostname.includes('fonts.')
  ) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first para assets locais
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response && response.status === 200) {
          const rc = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, rc));
        }
        return response;
      }).catch(() => caches.match(BASE + '/index.html'));
    })
  );
});
