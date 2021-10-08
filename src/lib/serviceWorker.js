// https://github.com/mdn/pwa-examples

console.warn('pwa test');

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open('kmdhw-store')
    .then(function(cache) {
      return cache.addAll([
        'index.html',
      ]);
    })
  );
});

self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request)
    .then(function(response) {
      return response || fetch(e.request);
    })
  );
});