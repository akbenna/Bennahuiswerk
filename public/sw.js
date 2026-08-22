/* BennaHub — opruimende service worker.

   Hier stond tot augustus 2026 de service worker van de oefenapp, met de root
   als bereik. Die app woont nu in /huiswerk/ en heeft daar zijn eigen worker.
   Een eenmaal geregistreerde worker blijft echter actief tot hij zichzelf
   afmeldt — en omdat de oude cache-eerst deed, zou hij op de startpagina de
   oude oefenapp blijven serveren in plaats van de hub.

   Deze worker doet daarom maar één ding: zichzelf opruimen. Zodra de browser
   deze gewijzigde sw.js ophaalt, wist hij de oude caches, meldt hij de
   registratie af en herlaadt hij de open tabbladen. Daarna is de root weer een
   gewone pagina zonder worker. Dit bestand mag over een jaar weg. */
self.addEventListener('install', (e) => { self.skipWaiting(); });

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const namen = await caches.keys();
    await Promise.all(namen.map((n) => caches.delete(n)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((c) => c.navigate(c.url));
  })());
});

/* Geen fetch-handler: alles gaat rechtstreeks naar het netwerk. */
