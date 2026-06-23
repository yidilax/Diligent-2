// Diligent Developers — Service Worker
// IMPORTANT: bump CACHE_VERSION every time you deploy a new version
const CACHE_VERSION = 'v95';
const CACHE_NAME = 'dd-platform-' + CACHE_VERSION;

// Install — activate immediately
self.addEventListener('install', function(event) {
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

// Fetch — network-first for the app, so users always get the latest when online
self.addEventListener('fetch', function(event) {
  var req = event.request;
  // Only handle GET requests
  if (req.method !== 'GET') return;
  // Skip Firebase / external API calls — let them go straight to network
  var url = req.url;
  if (url.indexOf('firebase') !== -1 || url.indexOf('googleapis') !== -1 || url.indexOf('gstatic') !== -1 || url.indexOf('google.com') !== -1) {
    return;
  }

  event.respondWith(
    fetch(req).then(function(res) {
      // Cache the fresh copy
      var resClone = res.clone();
      caches.open(CACHE_NAME).then(function(cache) {
        cache.put(req, resClone);
      });
      return res;
    }).catch(function() {
      // Offline — serve from cache
      return caches.match(req);
    })
  );
});

// Listen for skip-waiting message from the page (update button)
self.addEventListener('message', function(event) {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
