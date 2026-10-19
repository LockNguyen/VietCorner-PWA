// Service worker: a background script the browser runs separately from the page.
// It keeps working when the app is closed, which is how push notifications arrive,
// and it keeps a copy of the app's code files and of Home so a launch shows something at once.

// CACHE: the app's code and style files (/_next/static/*). Measured on an iPhone (2026-10-14): after a
// restart iOS had thrown away 9 of 10 of them, and downloading them again took 21 of the 22.5 s launch.
// What this worker saves, iOS keeps.
// Change the name only if this file's caching itself changes; activate then deletes the old cache.
const STATIC_CACHE = "static-v1";
// Each deploy adds new files under new names and the old ones are never asked for again.
// Keeping the newest 150 (one build has about 35) bounds the space; a file trimmed too early is just downloaded again.
const MAX_STATIC_FILES = 150;

// HOME: the page the app opens on ("/"), saved at each launch and shown at the next one before the server
// answers. Measured 2026-10-17: after a few hours away the server's answer took about 10 s (the phone's network
// waking, the sign-in renewed, the database read). The saved copy is replaced as soon as the fresh one arrives
// (RefreshSavedPage in the root layout), and deleted when the person signs out or changes language.
// Only Home: the other tabs are loaded ahead by the tab bar once the app is open.
// Same name as HOME_CACHE in src/lib/savedHome.ts (this file cannot import it).
const HOME_CACHE = "home-v1";
let homeUpdate = null; // the fresh Home on its way, while the saved one is on screen

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  const kept = [STATIC_CACHE, HOME_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => !kept.includes(name)).map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;
  const isPageLoad = event.request.mode === "navigate";
  if (isPageLoad && url.pathname === "/") return event.respondWith(savedHomeFirst(event));
  // HOME: every way out of the account (Sign out, an ended session) lands on /login with a full page load.
  // Waiting for a save still on its way keeps it from bringing the old Home back after the delete.
  if (isPageLoad && url.pathname.startsWith("/login")) {
    event.waitUntil(Promise.resolve(homeUpdate).then(() => caches.delete(HOME_CACHE)));
  }
  // CACHE: answer code files from the saved copy; download and save the ones not saved yet.
  // Safe because Next.js puts a hash of the content in each file's name: the same name is always the same file.
  if (url.pathname.startsWith("/_next/static/")) event.respondWith(fromCacheOrNetwork(event));
  // Everything else: the browser's normal way.
});

// HOME: show the saved Home at once, and fetch the fresh one to save for next time.
async function savedHomeFirst(event) {
  // Next.js reloads the page when a new deploy is out. A reload while the fresh Home is still on its way
  // must wait for it, or it would show the old saved copy (from the old deploy) again.
  const reloadRightAfter = homeUpdate !== null;
  const fresh = fetch(event.request);
  homeUpdate = fresh
    .then((response) => saveOrForgetHome(response.clone()))
    .catch(() => {}) // offline or storage full: the saved copy (if any) stays as it was
    .finally(() => (homeUpdate = null));
  event.waitUntil(homeUpdate);
  if (reloadRightAfter) return fresh;
  const saved = await caches.match("/", { cacheName: HOME_CACHE, ignoreVary: true }).catch(() => undefined);
  return saved || fresh;
}

// Only a real page is saved. A redirect means signed out (the server sends /login): the saved copy goes.
// A server error keeps the last good copy.
async function saveOrForgetHome(response) {
  const cache = await caches.open(HOME_CACHE);
  if (response.type === "opaqueredirect" || response.redirected) return cache.delete("/");
  if (response.ok) return cache.put("/", response);
}

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
