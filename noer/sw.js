/* Noer Islam werkt zonder internet. De app is één bestand, dus die bewaren we —
   en bij het openen halen we hem opnieuw op zodat een nieuwe versie meteen
   binnenkomt; lukt dat niet, dan draait de bewaarde versie gewoon door. */
const CACHE = 'noer-v3';
const BESTANDEN = ['./', './index.html', './manifest.webmanifest', '../iconen/islam.svg', '../iconen/islam-180.png',
                   '../fonts/amiri-400.woff2', '../fonts/amiri-700.woff2'];

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
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.origin !== location.origin) return;          // de Latijnse fonts en de centrale opslag laten we met rust

  /* Geluid en het Arabische lettertype veranderen niet meer zodra ze er staan:
     die pakken we uit de kast als het kan, en halen we alleen op wanneer ze
     ontbreken. Scheelt data, en het geluid speelt meteen af. Zonder Amiri
     vallen er gaten in het Arabisch, dus dat hoort in dezelfde groep. */
  if (/\.(mp3|woff2?)$/.test(url.pathname)) {
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
