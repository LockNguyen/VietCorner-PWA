// The order the worship songs play in (the user, 2026-10-22): their positions in WORSHIP_SONGS, shuffled once on
// this phone and kept (storage.ts), so every song plays once before any plays again. Next and Back walk the order,
// from the last song round to the first and back. Pure, so it is tested without a phone.

// Where this phone is in the order: `position` is the place in `order` of the song playing or last played.
export type Playlist = { order: number[]; position: number };

// 0 … count-1 in a random order (Fisher–Yates: every order equally likely). `random` is a parameter for the tests.
export function shuffledOrder(count: number, random: () => number = Math.random): number[] {
  const order = Array.from({ length: count }, (_, index) => index);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

// The place `by` steps from `position` (1 = next, -1 = back), wrapping at both ends.
export function stepped(position: number, by: number, length: number): number {
  return (((position + by) % length) + length) % length;
}

// A kept playlist, if it still fits the songs: every position exactly once. A song added or removed since then
// makes it a stranger, and a new shuffle is made instead.
export function keptOrNew(kept: Playlist | null, count: number): Playlist {
  const fits = kept !== null && kept.order.length === count && [...kept.order].sort((a, b) => a - b).every((song, index) => song === index);
  return fits ? kept : { order: shuffledOrder(count), position: -1 }; // -1: the first step lands on the first song
}
