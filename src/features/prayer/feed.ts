import { PAGE_SIZE, type PrayerRequest } from "./types";

// The list on screen after its newest page has been read again. Pure, so the rule is tested without a screen.
//
// The rule (decided 2026-10-09): the newest page replaces whatever was newest, and older requests the
// reader had scrolled to stay where they are. So new requests appear at the top and nobody loses their
// place; one answered or deleted further down stays until the tab is opened afresh.
export function withNewest(onScreen: PrayerRequest[], newest: PrayerRequest[]): PrayerRequest[] {
  // A short page is the whole list: anything else on screen no longer exists.
  if (newest.length < PAGE_SIZE) return newest;

  const oldestOfNewest = newest[newest.length - 1].created_at;
  return [...newest, ...onScreen.filter((request) => request.created_at < oldestOfNewest)];
}
