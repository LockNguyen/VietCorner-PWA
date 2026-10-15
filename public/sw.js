// Service worker: a background script the browser runs separately from the page.
// It keeps working when the app is closed, which is how push notifications arrive,
// and it keeps a copy of the app's code files so a launch does not download them again.

// CACHE: the app's code and style files (/_next/static/*). Measured on an iPhone (2026-10-14): after a
// restart iOS had thrown away 9 of 10 of them, and downloading them again took 21 of the 22.5 s launch.
// What this worker saves, iOS keeps. Pages are never saved: they always come from the server, so nobody
// sees stale data or a signed-out screen.
// Change the name only if this file's caching itself changes; activate then deletes the old cache.
const STATIC_CACHE = "static-v1";
// Each deploy adds new files under new names and the old ones are never asked for again.
// Keeping the newest 150 (one build has about 35) bounds the space; a file trimmed too early is just downloaded again.
const MAX_STATIC_FILES = 150;

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => name !== STATIC_CACHE).map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  );
});

// CACHE: answer code files from the saved copy; download and save the ones not saved yet.
// Safe because Next.js puts a hash of the content in each file's name: the same name is always the same file.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith("/_next/static/")) return; // everything else: the browser's normal way
  event.respondWith(fromCacheOrNetwork(event));
});

async function fromCacheOrNetwork(event) {
  let cache;
  try {
    cache = await caches.open(STATIC_CACHE);
    const saved = await cache.match(event.request);
    if (saved) return saved;
  } catch {
    // The saved copy is only a shortcut: if storage fails (full, or cleared by iOS), use the network.
    return fetch(event.request);
  }
  const response = await fetch(event.request);
  // Save only what the server promises never changes. A production build marks its hashed files
  // "immutable"; `next dev` serves changing files under the same names and does not, so they are never saved.
  const immutable = (response.headers.get("cache-control") || "").includes("immutable");
  if (response.ok && immutable) {
    event.waitUntil(cache.put(event.request, response.clone()).then(() => trim(cache)).catch(() => {}));
  }
  return response;
}

// Deletes the oldest saved files beyond MAX_STATIC_FILES (keys() lists them oldest first).
async function trim(cache) {
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_STATIC_FILES)).map((key) => cache.delete(key)));
}

// PUSH: show a notification when the server sends a push (payload: features/push/types.ts).
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    // The fallback is the app's name, kept the same as APP_NAME in src/lib/appName.ts (this file cannot import it).
    self.registration.showNotification(data.title || "Viet Corners", {
      body: data.body,
      icon: "/icons/icon-192.png",
      // Same topic = same tag: the new notification replaces the old one in the tray instead of stacking.
      // `renotify` keeps the sound, which a replacement would otherwise lose (it needs a tag to be legal).
      tag: data.topic,
      renotify: Boolean(data.topic),
      data: { url: data.url || "/" },
    }),
  );
});

// PUSH: tapping the notification opens the app at the page the sender chose.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(event.notification.data.url));
});
