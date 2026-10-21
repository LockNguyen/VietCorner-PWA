import { describe, expect, it } from "vitest";
import { formatLongDate, formatShortTime, formatTime, formatWeekday, weekdayName } from "./formatting";

// Sunday 18 October 2026, 7 PM at church (New York, summer time = UTC-4): 23:00 UTC.
const SUNDAY_EVENING = new Date("2026-10-18T23:00:00Z");

describe("an event's date and time, in church time", () => {
  it("says the time the members' way in each language, whatever the device's zone", () => {
    expect(formatTime(SUNDAY_EVENING, "en")).toBe("7:00 PM");
    expect(formatTime(SUNDAY_EVENING, "vi")).toBe("7:00 Tối");
  });

  it("calls Sunday Chúa Nhật in Vietnamese", () => {
    expect(formatLongDate(SUNDAY_EVENING, "vi")).toMatch(/^Chúa Nhật/);
    expect(formatLongDate(SUNDAY_EVENING, "en")).toMatch(/^Sunday/);
  });

  it("names the church's day for a card, in church time", () => {
    expect(formatWeekday(SUNDAY_EVENING, "vi")).toBe("Chúa Nhật");
    expect(formatWeekday(SUNDAY_EVENING, "en")).toBe("Sunday");
  });
});

describe("the Events tab's short clock and day names", () => {
  it("writes 1-12, the minutes, then a or p", () => {
    expect(formatShortTime("09:15")).toBe("9:15a");
    expect(formatShortTime("00:05")).toBe("12:05a");
    expect(formatShortTime("12:00:00")).toBe("12:00p");
    expect(formatShortTime("19:30:00")).toBe("7:30p");
  });

  it("names a weekday by its number, Sunday the church's way", () => {
    expect(weekdayName(0, "vi")).toBe("Chúa Nhật");
    expect(weekdayName(0, "en")).toBe("Sunday");
    expect(weekdayName(6, "en")).toBe("Saturday");
  });
});
