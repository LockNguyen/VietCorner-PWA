import { describe, expect, it } from "vitest";
import { formatMeeting } from "./meeting";

describe("when a group meets, in words", () => {
  it("is the weekday, plural in English, and the time in each language's own style", () => {
    expect(formatMeeting(2, "19:30:00", "en")).toBe("Tuesdays @ 7:30 PM");
    expect(formatMeeting(2, "19:30:00", "vi")).toBe("Thứ 3 @ 7:30 Tối");
  });

  it("covers both ends of the week", () => {
    expect(formatMeeting(0, null, "en")).toBe("Sundays");
    expect(formatMeeting(6, null, "en")).toBe("Saturdays");
    expect(formatMeeting(0, null, "vi")).toBe("Chúa Nhật");
  });

  it("says what it has, and nothing when it has neither", () => {
    expect(formatMeeting(null, "09:00:00", "en")).toBe("9:00 AM");
    expect(formatMeeting(null, null, "vi")).toBeNull();
  });
});
