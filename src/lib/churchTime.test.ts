import { describe, expect, it } from "vitest";
import { addWeeks, isoDate, toInstant, wallTime } from "./churchTime";

// In 2026 the church's clocks go forward on 8 March and back on 1 November.
// Summer: wall time = UTC − 4 h. Winter: wall time = UTC − 5 h.

describe("the church's wall clock", () => {
  it("reads four hours behind UTC in summer and five in winter", () => {
    expect(wallTime(new Date("2026-07-01T23:00:00Z"))).toBe("2026-07-01T19:00");
    expect(wallTime(new Date("2026-12-01T23:00:00Z"))).toBe("2026-12-01T18:00");
  });

  it("gives the church's date, not UTC's: a 7 PM winter event is already tomorrow in UTC", () => {
    const sevenPmInDecember = new Date("2026-12-02T00:00:00Z");

    expect(isoDate(sevenPmInDecember)).toBe("2026-12-01");
  });

  it("turns a wall time back into the instant it came from, in both seasons", () => {
    expect(toInstant("2026-07-01T19:00").toISOString()).toBe("2026-07-01T23:00:00.000Z");
    expect(toInstant("2026-12-01T19:00").toISOString()).toBe("2026-12-02T00:00:00.000Z");
  });

  it("gets the hours right next to a clock change", () => {
    // 1 November: 1:59 AM summer time is followed by 1:00 AM winter time.
    expect(toInstant("2026-11-01T00:30").toISOString()).toBe("2026-11-01T04:30:00.000Z");
    expect(toInstant("2026-11-01T03:00").toISOString()).toBe("2026-11-01T08:00:00.000Z");
    // 8 March: 1:59 AM winter time is followed by 3:00 AM summer time.
    expect(toInstant("2026-03-08T01:30").toISOString()).toBe("2026-03-08T06:30:00.000Z");
    expect(toInstant("2026-03-08T03:30").toISOString()).toBe("2026-03-08T07:30:00.000Z");
  });
});

describe("one week later", () => {
  it("is 168 hours later in an ordinary week", () => {
    const start = new Date("2026-10-07T23:00:00Z"); // Wednesday 7 PM

    expect(addWeeks(start, 1).toISOString()).toBe("2026-10-14T23:00:00.000Z");
  });

  it("stays at 7 PM when the clocks go back, which is 169 hours later", () => {
    const start = new Date("2026-10-28T23:00:00Z"); // Wednesday 7 PM, the week before the change

    const next = addWeeks(start, 1);

    expect(wallTime(next)).toBe("2026-11-04T19:00");
    expect(next.toISOString()).toBe("2026-11-05T00:00:00.000Z");
  });

  it("stays at 7 PM when the clocks go forward, which is 167 hours later", () => {
    const start = toInstant("2026-03-04T19:00");

    expect(wallTime(addWeeks(start, 1))).toBe("2026-03-11T19:00");
    expect(addWeeks(start, 1).getTime() - start.getTime()).toBe(167 * 60 * 60 * 1000);
  });

  it("counts from the first date, so eight weeks is not eight rounding errors", () => {
    const start = toInstant("2026-10-07T19:00");

    expect(wallTime(addWeeks(start, 8))).toBe("2026-12-02T19:00");
  });
});
