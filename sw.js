const CACHE = 'roastlog-shell-v1-2';
const SHELL = ['./', './index.html', './styles.css', './app.js', './db.js', './archive.js', './vendor/jszip.min.js', './manifest.webmanifest', './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(Promise.all([caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))), self.clients.claim()])); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => { if (res.ok) { const copy=res.clone(); caches.open(CACHE).then(cache=>cache.put(e.request,copy)); } return res; })));
});
