// Service worker: a background script the browser runs separately from the page.
// Step 0 only activates it. Step 2 (chat) adds "push" and "notificationclick" handlers.

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
