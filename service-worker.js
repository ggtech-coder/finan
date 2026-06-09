const CACHE = 'financas-v1';
const ASSETS = [
  '/', '/index.html', '/css/main.css',
  '/js/config.js', '/js/db.js', '/js/utils.js', '/js/ui.js',
  '/js/transactions.js', '/js/goals.js', '/js/patrimony.js',
  '/js/reports.js', '/js/dashboard.js', '/js/calendar.js',
  '/js/insights.js', '/js/backup.js', '/js/app.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => {
    const rc = r.clone();
    caches.open(CACHE).then(c => c.put(e.request, rc));
    return r;
  }).catch(() => caches.match(e.request)));
});
