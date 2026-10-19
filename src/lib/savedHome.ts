// The Home page the service worker saves for a fast launch (public/sw.js, HOME).
// Same name as HOME_CACHE there (that file cannot import this).
const HOME_CACHE = "home-v1";

// A page made longer ago than this did not come from the server just now: the service worker showed the
// Home saved at the last launch. A fresh load takes seconds, a saved one is hours old; a minute leaves room
// for a phone clock that is a little off.
const SAVED_AFTER_MS = 60_000;

// Whether a page the server made at `renderedAt` (ms) is the saved Home.
export function isSavedCopy(renderedAt: number, now = Date.now()) {
  return now - renderedAt > SAVED_AFTER_MS;
}

// Deletes the saved Home, so the next launch waits for the server instead of showing it.
// For changes the saved copy would show wrongly for a moment, such as the language.
export function forgetSavedHome() {
  if ("caches" in window) void caches.delete(HOME_CACHE).catch(() => {});
}
