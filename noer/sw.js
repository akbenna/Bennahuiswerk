/* Noer Islam werkt zonder internet. De app is één bestand, dus die bewaren we —
   en bij het openen halen we hem opnieuw op zodat een nieuwe versie meteen
   binnenkomt; lukt dat niet, dan draait de bewaarde versie gewoon door. */
const CACHE = 'noer-v1';
const BESTANDEN = ['./', './index.html', './manifest.webmanifest', '../favicon.svg', '../apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BESTANDEN)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(k => Promise.all(k.filter(n => n !== CACHE).map(n => caches.delete(n))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.origin !== location.origin) return;          // fonts en de centrale opslag laten we met rust

  /* Geluid verandert niet meer zodra het er staat: dat pakken we uit de kast als
     het er is, en halen we alleen op wanneer het ontbreekt. Scheelt data en het
     speelt meteen af. */
  if (/\.mp3$/.test(url.pathname)) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      const kopie = res.clone(); caches.open(CACHE).then(c => c.put(e.request, kopie)); return res;
    })));
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then(r => { const kopie = r.clone(); caches.open(CACHE).then(c => c.put(e.request, kopie)); return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
