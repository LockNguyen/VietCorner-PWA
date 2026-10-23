import { describe, expect, it } from "vitest";
import { withNewest } from "./feed";
import { PAGE_SIZE, type PrayerRequest } from "./types";

const START = Date.parse("2026-10-01T00:00:00Z");

// Request number n was posted n minutes after the start, so a higher number is a newer request.
function request(n: number): PrayerRequest {
  return {
    id: String(n),
    body: `request ${n}`,
    is_anonymous: false,
    created_at: new Date(START + n * 60_000).toISOString(),
    is_mine: false,
    prayer_count: 0,
    author_name: "An",
    author_avatar: null,
    language: null,
    translation: null,
  };
}

// Requests from..to, newest first, as the feed returns a page.
const page = (from: number, to: number) => Array.from({ length: from - to + 1 }, (_, i) => request(from - i));
const ids = (requests: PrayerRequest[]) => requests.map((each) => Number(each.id));

describe("the prayer list after its newest page is read again", () => {
  it("puts new requests on top and keeps what they pushed off the first page", () => {
    const newest = page(PAGE_SIZE + 2, 3); // two new requests; numbers 2 and 1 no longer fit the first page

    expect(ids(withNewest(page(PAGE_SIZE, 1), newest))).toEqual(ids(page(PAGE_SIZE + 2, 1)));
  });

  it("keeps the older requests the reader had scrolled to", () => {
    const onScreen = page(2 * PAGE_SIZE, 1); // two pages loaded
    const newest = page(2 * PAGE_SIZE + 1, PAGE_SIZE + 2); // one new request since

    expect(ids(withNewest(onScreen, newest))).toEqual(ids(page(2 * PAGE_SIZE + 1, 1)));
  });

  it("shows nothing twice", () => {
    const merged = ids(withNewest(page(2 * PAGE_SIZE, 1), page(2 * PAGE_SIZE, PAGE_SIZE + 1)));

    expect(new Set(merged).size).toBe(merged.length);
  });

  it("drops a request from the newest page once it was answered or deleted", () => {
    const newest = page(PAGE_SIZE + 1, 1).filter((each) => each.id !== "5"); // number 5 is gone

    expect(ids(withNewest(page(PAGE_SIZE, 1), newest))).not.toContain(5);
  });

  it("is only the newest page when that page is short: it is the whole list", () => {
    expect(ids(withNewest(page(2 * PAGE_SIZE, 1), page(3, 1)))).toEqual([3, 2, 1]);
    expect(withNewest(page(PAGE_SIZE, 1), [])).toEqual([]);
  });
});
