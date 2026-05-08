const CACHE = 'rcm-v2';
const STATIC = [
  './',
  './index.html',
  './manifest.json',
  './map-spiaggia.png',
  './map-spiaggia-en.png',
  './map-spiaggia-de.png',
  './map-spiaggia-ru.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // API e font: network-first, no cache
  if (
    url.hostname.includes('open-meteo.com') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('wixstatic.com')
  ) {
    e.respondWith(fetch(e.request).catch(() => new Response('', {status: 503})));
    return;
  }
  // Risorse statiche: cache-first, aggiorna in background
  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(resp => {
        if (resp && resp.status === 200) {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
