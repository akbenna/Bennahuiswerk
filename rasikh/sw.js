/* Rasikh moet zonder internet werken. Memoriseren doe je in de trein, op reis,
   in de moskee — precies daar waar geen verbinding is. Wat hier gebeurt:

   - de app zelf: eerst het net, dan de kast. Zo komt een nieuwe versie meteen
     binnen, en draait de bewaarde versie door als het net wegvalt;
   - de tekst van de Koran, de recitatie en de letters: eerst de kast. Die
     veranderen niet meer zodra ze er zijn, dus opnieuw ophalen is verspild;
   - het Arabische lettertype hoort bij die laatste groep, en staat sinds kort
     als bestand in fonts/ naast de app. Zonder Amiri vallen de tekens van de
     Warsh-druk terug op een systeemletter die ze niet kent, en dan staan er
     gaten in de tekst. Het wordt meteen bij het installeren opgehaald. */
const CACHE = 'rasikh-v2';
const BESTANDEN = ['./', './index.html', './manifest.webmanifest', './tekst/index.json',
                   '../fonts/amiri-400.woff2', '../fonts/amiri-700.woff2',
                   '../iconen/koran.svg', '../iconen/koran-180.png'];
const BLIJFT = /\.(mp3|woff2?)$|\/tekst\/.+\.json$/;
const LETTERS = /^https:\/\/fonts\.(googleapis|gstatic)\.com\//;

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

/* Uit de kast als het er is, anders halen en bewaren. */
const uitDeKast = e => caches.match(e.request).then(r => r || fetch(e.request).then(res => {
  const kopie = res.clone();
  caches.open(CACHE).then(c => c.put(e.request, kopie)).catch(() => {});
  return res;
}));

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  if (url.origin !== location.origin) {
    if (LETTERS.test(e.request.url)) e.respondWith(uitDeKast(e));
    return;                                   // de centrale opslag laten we met rust
  }
  if (BLIJFT.test(url.pathname)) { e.respondWith(uitDeKast(e)); return; }

  e.respondWith(
    fetch(e.request)
      .then(r => { const kopie = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, kopie)).catch(() => {});
        return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
