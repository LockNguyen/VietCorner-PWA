import { describe, expect, it } from "vitest";
import { keptOrNew, shuffledOrder, stepped } from "./playlist";

describe("the worship songs' order", () => {
  it("holds every song exactly once", () => {
    expect([...shuffledOrder(6)].sort()).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it("is shuffled: a fixed random number gives a fixed order", () => {
    expect(shuffledOrder(3, () => 0)).toEqual([1, 2, 0]);
  });

  it("goes round from the last song to the first, and back", () => {
    expect(stepped(5, 1, 6)).toBe(0);
    expect(stepped(0, -1, 6)).toBe(5);
    expect(stepped(-1, 1, 6)).toBe(0); // the first play of a new order
  });

  it("keeps the phone's order while it fits the songs, and shuffles again when it does not", () => {
    const kept = { order: [2, 0, 1], position: 1 };

    expect(keptOrNew(kept, 3)).toBe(kept);
    expect(keptOrNew(kept, 4).order).toHaveLength(4); // a song was added
    expect(keptOrNew({ order: [0, 0, 1], position: 0 }, 3).position).toBe(-1); // not every song once
    expect(keptOrNew(null, 3).position).toBe(-1);
  });
});
