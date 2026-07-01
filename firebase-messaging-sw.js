/**
 * Diligent Developers — FCM Background Messaging Service Worker
 * ============================================================
 * FCM requires its OWN service worker at this exact filename, served from the
 * root of your site (same folder as index.html). This is separate from your
 * existing sw.js (which handles caching/offline). Both can coexist.
 *
 * DEPLOY: upload this file to the repo root, next to index.html and sw.js.
 * (GitHub Pages will serve it at https://diligentdevelopers.app/firebase-messaging-sw.js)
 */

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBYbHJXNZ0gBd6pks7k0A_FRjEJzmYYHKg",
  authDomain: "dd-platform-9f715.firebaseapp.com",
  projectId: "dd-platform-9f715",
  storageBucket: "dd-platform-9f715.firebasestorage.app",
  messagingSenderId: "40545814103",
  appId: "1:40545814103:web:f0b2c336ec594484f2c512",
});

const messaging = firebase.messaging();

// Background messages (app closed / tab not focused).
messaging.onBackgroundMessage(function (payload) {
  const n = payload.notification || {};
  const d = payload.data || {};
  const title = n.title || "Diligent Developers";
  const options = {
    body: n.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: d.url || (payload.fcmOptions && payload.fcmOptions.link) || "/" },
    vibrate: [100, 50, 100],
  };
  return self.registration.showNotification(title, options);
});

// Tap a notification -> focus or open the app.
self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (list) {
        for (let i = 0; i < list.length; i++) {
          if ("focus" in list[i]) return list[i].focus();
        }
        if (self.clients.openWindow) return self.clients.openWindow(target);
      })
  );
});
