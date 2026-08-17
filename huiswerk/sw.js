/* Bennaghmouch Oefenclub — service worker voor offline gebruik.
   Cachet de app-shell (huiswerk-app, spellen en de Academie-cursussen)
   zodat alles zonder netwerk blijft werken. Cloud-sync (Supabase) en
   fonts gaan naar het netwerk en falen offline stilletjes (de app werkt
   dan lokaal verder via localStorage). */
const CACHE = 'benna-offline-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.svg',
  './apple-touch-icon.png',
  './voxelsandbox.html',
  './verkeersschool.html',
  './vendor/three.min.js',
  './cursussen/communicatie.html',
  './cursussen/presenteren.html',
  './cursussen/kompas.html'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      // per-bestand toevoegen zodat één ontbrekend bestand de installatie niet afbreekt
      .then((c) => Promise.all(ASSETS.map((a) => c.add(a).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (err) { return; }
  // Alleen eigen bestanden afhandelen; cross-origin (fonts, Supabase) gaat
  // ongemoeid naar het netwerk en faalt offline vanzelf.
  if (url.origin !== self.location.origin) return;

  // Cache-first met stille netwerk-update (stale-while-revalidate).
  e.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
