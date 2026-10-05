import type { PrayedAt } from "./cooldown";

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
