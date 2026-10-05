// The pause between two taps of "Pray" on the same request, on this device.
//
// Only timestamps are stored: "may I pray again?" is always worked out from the clock, never counted down
// by a timer. A timer stops when the app is closed or the phone sleeps and then has to be repaired; a
// timestamp is simply still correct when the app comes back. Pure functions, so they are tested without a DOM.

// why: long enough that the number an author sees means people, not taps; short enough that someone who
// prays for the same request morning and evening is counted both times.
export const COOLDOWN_MS = 60 * 60 * 1000;

// Request id → when this device last prayed for it (milliseconds since 1970).
export type PrayedAt = Record<string, number>;

export function canPray(prayedAt: PrayedAt, requestId: string, now: number): boolean {
  const at = prayedAt[requestId];
  if (at === undefined) return true;
  // A time in the future means the device's clock was moved back. Waiting for it would lock the button for
  // as long as the clock was wrong, so the entry is treated as finished instead.
  return at > now || now - at >= COOLDOWN_MS;
}

// Drops every entry whose pause is over, so the stored map cannot grow for ever.
export function withoutExpired(prayedAt: PrayedAt, now: number): PrayedAt {
  return Object.fromEntries(Object.entries(prayedAt).filter(([requestId]) => !canPray(prayedAt, requestId, now)));
}
