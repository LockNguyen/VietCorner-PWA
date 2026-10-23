import type { PrayedAt } from "./cooldown";
import type { Playlist } from "./playlist";

// When this device last prayed for each request. Kept on the device only: the server stores how many times
// a request was prayed for, never by whom.
//
// Keyed by user id, because families here share phones: one person praying must not pause the button for
// the next person who signs in.

function keyFor(userId: string): string {
  return `vietcorner.prayer.prayedAt.${userId}`;
}

// Never throws: storage can be unavailable (private mode) and old data can have another shape.
// A reader that fails simply starts with no pauses, which costs one extra prayer at worst.
export function loadPrayedAt(userId: string): PrayedAt {
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(keyFor(userId)) ?? "{}");
    if (typeof stored !== "object" || stored === null || Array.isArray(stored)) return {};
    return Object.fromEntries(Object.entries(stored).filter(([, at]) => typeof at === "number"));
  } catch {
    return {};
  }
}

export function savePrayedAt(userId: string, prayedAt: PrayedAt): void {
  try {
    window.localStorage.setItem(keyFor(userId), JSON.stringify(prayedAt));
  } catch {
    // Storage full or blocked. The pause still holds for this visit; it just won't survive closing the app.
  }
}

// Where the worship songs' order is kept (playlist.ts). In localStorage, which stays when the app is swiped away
// or the phone restarts, so the order and the place in it go on from one visit to the next. One per phone, not
// per person: it is music, not a record.
const PLAYLIST_KEY = "vietcorner.prayer.playlist";

// Null when there is none, or what is kept has another shape: a new order is made (`keptOrNew` checks the rest).
export function loadPlaylist(): Playlist | null {
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(PLAYLIST_KEY) ?? "null");
    const playlist = stored as Playlist | null;
    return Array.isArray(playlist?.order) && typeof playlist.position === "number" ? playlist : null;
  } catch {
    return null;
  }
}

export function savePlaylist(playlist: Playlist): void {
  try {
    window.localStorage.setItem(PLAYLIST_KEY, JSON.stringify(playlist));
  } catch {
    // Storage full or blocked: the order holds for this visit only.
  }
}
