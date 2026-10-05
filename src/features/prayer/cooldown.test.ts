import { describe, expect, it } from "vitest";
import { canPray, COOLDOWN_MS, withoutExpired } from "./cooldown";

const NOW = 1_800_000_000_000;

describe("the pause between two prayers for the same request", () => {
  it("does not apply to a request never prayed for", () => {
    expect(canPray({}, "a", NOW)).toBe(true);
  });

  it("holds right after praying", () => {
    expect(canPray({ a: NOW }, "a", NOW + 1)).toBe(false);
  });

  it("holds until the very last millisecond, then ends", () => {
    expect(canPray({ a: NOW }, "a", NOW + COOLDOWN_MS - 1)).toBe(false);
    expect(canPray({ a: NOW }, "a", NOW + COOLDOWN_MS)).toBe(true);
  });

  it("is per request: praying for one does not pause another", () => {
    expect(canPray({ a: NOW }, "b", NOW + 1)).toBe(true);
  });

  it("ends when the app was closed for hours, with no timer to resume", () => {
    expect(canPray({ a: NOW }, "a", NOW + 5 * COOLDOWN_MS)).toBe(true);
  });

  it("cannot get stuck when the device's clock is moved back", () => {
    expect(canPray({ a: NOW + 10 * COOLDOWN_MS }, "a", NOW)).toBe(true);
  });
});

describe("cleaning up", () => {
  it("keeps running pauses and drops finished ones", () => {
    const prayedAt = { running: NOW - 1000, finished: NOW - COOLDOWN_MS, fromTheFuture: NOW + COOLDOWN_MS };

    expect(withoutExpired(prayedAt, NOW)).toEqual({ running: NOW - 1000 });
  });
});
