/* De schil wordt gecachet zodat de app vanaf het beginscherm opent, ook op een
   slechte verbinding in een vergaderzaal. De opnames zelf gaan altijd live
   naar Supabase en komen nooit langs deze cache: daar staat geen enkele
   regel over, want alles van een andere oorsprong laat hij met rust. */
const CACHE = 'notities-v1';
const SCHIL = ['./', './index.html', './manifest.webmanifest', './icoon.svg', './icoon-180.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE)
  .then(c => Promise.allSettled(SCHIL.map(f => c.add(f)))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys()
  .then(k => Promise.all(k.filter(n => n.startsWith('notities-') && n !== CACHE).map(n => caches.delete(n)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  if (u.origin !== location.origin) return;
  e.respondWith(fetch(e.request)
    .then(r => { const k = r.clone(); caches.open(CACHE).then(c => c.put(e.request, k)).catch(()=>{}); return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
});
