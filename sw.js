// Diligent Developers — Service Worker
// IMPORTANT: bump CACHE_VERSION every time you deploy a new version
const CACHE_VERSION = 'v188';
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

// Fetch — network-first for the app, so users always get the latest when online.
self.addEventListener('fetch', function(event) {
  var req = event.request;
  if (req.method !== 'GET') return;

  var url = req.url;
  // Let Firebase / Google calls go straight to the network.
  if (url.indexOf('firebase') !== -1 || url.indexOf('googleapis') !== -1 || url.indexOf('gstatic') !== -1 || url.indexOf('google.com') !== -1) {
    return;
  }

  var isHTML = req.mode === 'navigate' ||
               (req.headers.get('accept') || '').indexOf('text/html') !== -1 ||
               url.endsWith('/') || url.indexOf('index.html') !== -1;

  event.respondWith(
    fetch(req).then(function(res) {
      // For the main HTML, only cache it if it's a COMPLETE document.
      // This prevents a broken/truncated upload from ever getting cached and
      // trapping the user on a blank screen.
      if (isHTML) {
        var clone = res.clone();
        return clone.text().then(function(body) {
          var looksComplete = body && body.length > 5000 &&
                              body.toLowerCase().lastIndexOf('</html>') !== -1;
          if (looksComplete) {
            caches.open(CACHE_NAME).then(function(cache) { cache.put(req, res.clone()); });
            return res;
          }
          // Broken/incomplete HTML from the network: don't cache it.
          // Try a known-good cached copy instead; if none, return what we got.
          return caches.match(req).then(function(cached) { return cached || res; });
        }).catch(function() { return res; });
      }
      // Non-HTML assets: cache normally.
      var resClone = res.clone();
      caches.open(CACHE_NAME).then(function(cache) { cache.put(req, resClone); });
      return res;
    }).catch(function() {
      // Offline — serve from cache.
      return caches.match(req);
    })
  );
});

// Allow the page to trigger an immediate update.
self.addEventListener('message', function(event) {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
