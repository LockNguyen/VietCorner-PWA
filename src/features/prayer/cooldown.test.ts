import { describe, expect, it } from "vitest";
import { canPray, withoutExpired } from "./cooldown";

// Times on the phone's own clock (local time), as the app reads them.
const MORNING = new Date(2026, 9, 20, 8, 0).getTime();
const LATE_EVENING = new Date(2026, 9, 20, 23, 59).getTime();
const NEXT_MIDNIGHT = new Date(2026, 9, 21, 0, 0).getTime();
const HOUR = 60 * 60 * 1000;

describe("praying once a day for the same request", () => {
  it("does not apply to a request never prayed for", () => {
    expect(canPray({}, "a", MORNING)).toBe(true);
  });

  it("holds for the rest of the day, however many hours pass", () => {
    expect(canPray({ a: MORNING }, "a", MORNING + 1)).toBe(false);
    expect(canPray({ a: MORNING }, "a", LATE_EVENING)).toBe(false);
  });

  it("ends at the phone's midnight", () => {
    expect(canPray({ a: LATE_EVENING }, "a", NEXT_MIDNIGHT)).toBe(true);
  });

  it("is per request: praying for one does not pause another", () => {
    expect(canPray({ a: MORNING }, "b", MORNING + 1)).toBe(true);
  });

  it("cannot get stuck when the device's clock is moved back", () => {
    expect(canPray({ a: MORNING + HOUR }, "a", MORNING)).toBe(true);
  });
});

describe("cleaning up", () => {
  it("keeps today's prayers and drops earlier days'", () => {
    const prayedAt = { today: MORNING, yesterday: MORNING - 24 * HOUR, fromTheFuture: MORNING + HOUR };

    expect(withoutExpired(prayedAt, MORNING + 1)).toEqual({ today: MORNING });
  });
});
