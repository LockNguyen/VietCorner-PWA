import { describe, expect, it } from "vitest";
import { isDue } from "./reminders";
import type { PrayerReminder } from "./types";

// Wednesdays at 7 PM church time. 14 October 2026 is a Wednesday; 7 PM there is 23:00 UTC (summer time).
const reminder: PrayerReminder = { id: "r", group_id: "g", weekday: 3, send_at: "19:00:00" };
const at = (iso: string) => new Date(iso);

describe("a weekly prayer reminder", () => {
  it("is due from its time, for an hour", () => {
    expect(isDue(reminder, at("2026-10-14T22:59:00Z"))).toBe(false);
    expect(isDue(reminder, at("2026-10-14T23:00:00Z"))).toBe(true);
    expect(isDue(reminder, at("2026-10-14T23:59:00Z"))).toBe(true);
    expect(isDue(reminder, at("2026-10-15T00:00:00Z"))).toBe(false);
  });

  it("is not due on another day of the week", () => {
    expect(isDue(reminder, at("2026-10-13T23:10:00Z"))).toBe(false);
  });

  it("goes by the church's weekday, not UTC's: Sunday 8 PM there is already Monday in UTC", () => {
    const sundayEvening: PrayerReminder = { ...reminder, weekday: 0, send_at: "20:00:00" };

    expect(isDue(sundayEvening, at("2026-10-19T00:10:00Z"))).toBe(true);
  });

  it("keeps its hour on the wall after the clocks change", () => {
    // 4 November is winter time: 7 PM is 00:00 UTC the next day.
    expect(isDue(reminder, at("2026-11-04T23:10:00Z"))).toBe(false);
    expect(isDue(reminder, at("2026-11-05T00:10:00Z"))).toBe(true);
  });
});
