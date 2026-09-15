// Service worker: a background script the browser runs separately from the page.
// It keeps working when the app is closed, which is how push notifications arrive.

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

// CHAT: show a notification when the server sends a push (payload built in features/chat/server/notifyGroup.ts).
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || "VietCorner", {
      body: data.body,
      icon: "/icons/icon-192.png",
      data: { url: data.url || "/" },
    }),
  );
});

// CHAT: tapping the notification opens the app on that group.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(event.notification.data.url));
});
