/* Raha werkt zonder internet. Eén bestand, plus het Arabische lettertype voor
   de letterjacht en het geheugenspel. */
const CACHE = 'raha-v1';
const BESTANDEN = ['./', './index.html', './manifest.webmanifest',
                   '../fonts/amiri-400.woff2', '../favicon.svg', '../apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => Promise.allSettled(BESTANDEN.map(f => c.add(f))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(k => Promise.all(k.filter(n => n !== CACHE).map(n => caches.delete(n))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  if (/\.woff2?$/.test(url.pathname)) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      const kopie = res.clone(); caches.open(CACHE).then(c => c.put(e.request, kopie)); return res;
    })));
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then(r => { const kopie = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, kopie)).catch(() => {});
        return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
