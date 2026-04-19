// ── Infinity Tech Service Worker — Web Push ────────────────────────────────────

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// ── Push event ────────────────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  let data = { title: "Infinity Tech", body: "New Message Received." };

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    console.error("[SW] Failed to parse push payload", e);
  }

  const options = {
    body:     data.body  || "",
    icon:     data.icon  || "/favicon.svg",
    badge:    data.badge || "/favicon.svg",
    tag:      data.tag   || "infinity-tech",
    renotify: true,
    vibrate:  [200, 100, 200],
    data:     { url: data.url || "/admin-infinity" },
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ── Notification click ────────────────────────────────────────────────────────
// Focuses an existing PWA/app window if found; opens in standalone mode otherwise.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/admin-infinity";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // 1. Try to find and focus any existing window that already shows the app
        for (const client of clientList) {
          if ("focus" in client) {
            return client.focus();
          }
        }
        // 2. No existing window — open in standalone/PWA mode
        // The displayMode hint is respected by supporting browsers
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
