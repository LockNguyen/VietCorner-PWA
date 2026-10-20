// Once a day per request, on this device: "Pray" on a request is spent until the phone's next midnight.
//
// Only timestamps are stored: "may I pray again?" is always worked out from the clock, never counted down
// by a timer. A timer stops when the app is closed or the phone sleeps and then has to be repaired; a
// timestamp is simply still correct when the app comes back. Pure functions, so they are tested without a DOM.
//
// why once a day (the user, 2026-10-20, replacing a one-hour pause): members use the green tick to keep track
// of what they have prayed for today. It resets when they open the app the next morning.

// Request id → when this device last prayed for it (milliseconds since 1970).
export type PrayedAt = Record<string, number>;

export function canPray(prayedAt: PrayedAt, requestId: string, now: number): boolean {
  const at = prayedAt[requestId];
  if (at === undefined) return true;
  // A time in the future means the device's clock was moved back. Waiting for it would lock the button for
  // as long as the clock was wrong, so the entry is treated as finished instead.
  return at > now || !sameDay(at, now);
}

// Drops every entry from an earlier day, so the stored map cannot grow for ever.
export function withoutExpired(prayedAt: PrayedAt, now: number): PrayedAt {
  return Object.fromEntries(Object.entries(prayedAt).filter(([requestId]) => !canPray(prayedAt, requestId, now)));
}

// The phone's own calendar day, not church time: "tomorrow morning" is where the member is.
function sameDay(a: number, b: number): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}
