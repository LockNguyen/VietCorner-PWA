import { describe, expect, it } from "vitest";
import { clockTime, withChurchSunday } from "./clock";

describe("a time of day, as the members say it", () => {
  it("is a 12-hour clock with AM/PM in English", () => {
    expect(clockTime(19, 0, "en")).toBe("7:00 PM");
    expect(clockTime(9, 30, "en")).toBe("9:30 AM");
    expect(clockTime(0, 5, "en")).toBe("12:05 AM");
    expect(clockTime(12, 0, "en")).toBe("12:00 PM");
  });

  it("names the part of the day in Vietnamese", () => {
    expect(clockTime(19, 0, "vi")).toBe("7:00 Tối");
    expect(clockTime(9, 30, "vi")).toBe("9:30 Sáng");
    expect(clockTime(12, 0, "vi")).toBe("12:00 Trưa");
    expect(clockTime(15, 45, "vi")).toBe("3:45 Chiều");
    expect(clockTime(18, 0, "vi")).toBe("6:00 Tối");
  });
});

describe("Sunday, as a church names it", () => {
  it("is Chúa Nhật, however the phone wrote Chủ Nhật", () => {
    expect(withChurchSunday("Chủ Nhật, 19 tháng 10")).toBe("Chúa Nhật, 19 tháng 10");
    expect(withChurchSunday("chủ nhật")).toBe("Chúa Nhật");
    expect(withChurchSunday("Thứ Hai")).toBe("Thứ Hai");
  });
});
