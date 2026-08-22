/* De weging gebeurt in de badkamer en juist daar valt het bereik weg. Blijft de
   app dan hangen, dan mist de reeks een dag — en het model rekent met de reeks,
   niet met losse getallen. Het schil wordt gecachet; de gegevens gaan altijd
   live naar Supabase en komen nooit uit de cache. */
const CACHE = 'bennahealth-app-v1';
const SCHIL = ['./', './index.html', './manifest.webmanifest', './icoon.svg', './icoon-180.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE)
  .then(c => Promise.allSettled(SCHIL.map(f => c.add(f)))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys()
  .then(k => Promise.all(k.filter(n => n !== CACHE).map(n => caches.delete(n)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  if (u.origin !== location.origin) return;            /* Supabase gaat er nooit langs */
  e.respondWith(fetch(e.request)
    .then(r => { const k = r.clone(); caches.open(CACHE).then(c => c.put(e.request, k)).catch(()=>{}); return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
});
