/* Bunyan werkt zonder internet. De app is één bestand — de Python die erin
   draait zit er gewoon in — dus die bewaren we, en bij het openen halen we hem
   opnieuw op zodat een nieuwe versie meteen binnenkomt; lukt dat niet, dan
   draait de bewaarde versie door. */
const CACHE = 'bunyan-v3';
const BESTANDEN = ['./', './index.html', './manifest.webmanifest',
                   '../iconen/code.svg', '../iconen/code-180.png'];

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
  if (url.origin !== location.origin) return;      // fonts en de centrale opslag laten we met rust
  e.respondWith(
    fetch(e.request)
      .then(r => { const kopie = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, kopie)).catch(() => {});
        return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
