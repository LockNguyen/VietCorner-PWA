import { describe, expect, it } from "vitest";
import { formatLongDate, formatTime } from "./formatting";

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
});
