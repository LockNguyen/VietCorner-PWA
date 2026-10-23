import { describe, expect, it } from "vitest";
import { clockTime, weekdayName, withChurchWeekdays } from "./clock";

describe("a time of day, as the members say it", () => {
  it("is a 12-hour clock with AM/PM in English", () => {
    expect(clockTime("19:00", "en")).toBe("7:00 PM");
    expect(clockTime("09:30", "en")).toBe("9:30 AM");
    expect(clockTime("00:05", "en")).toBe("12:05 AM");
    expect(clockTime("12:00", "en")).toBe("12:00 PM");
  });

  it("takes a database time with seconds too", () => {
    expect(clockTime("19:30:00", "vi")).toBe("7:30 Tối");
  });

  it("names the part of the day in Vietnamese", () => {
    expect(clockTime("19:00", "vi")).toBe("7:00 Tối");
    expect(clockTime("09:30", "vi")).toBe("9:30 Sáng");
    expect(clockTime("12:00", "vi")).toBe("12:00 Trưa");
    expect(clockTime("15:45", "vi")).toBe("3:45 Chiều");
    expect(clockTime("18:00", "vi")).toBe("6:00 Tối");
  });
});

describe("the weekdays, as this church names them", () => {
  it("is Chúa Nhật, however the phone wrote Chủ Nhật", () => {
    expect(withChurchWeekdays("Chủ Nhật, 19 tháng 10")).toBe("Chúa Nhật, 19 tháng 10");
    expect(withChurchWeekdays("chủ nhật")).toBe("Chúa Nhật");
  });

  it("numbers the other days, Thứ 2 to Thứ 7", () => {
    const names = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
    expect(names.map(withChurchWeekdays)).toEqual(["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"]);
    expect(withChurchWeekdays("Thứ Hai, 20 tháng 10")).toBe("Thứ 2, 20 tháng 10");
  });

  it("leaves a day already written as a number, English, and words that only start like a weekday", () => {
    expect(withChurchWeekdays("Thứ 2")).toBe("Thứ 2");
    expect(withChurchWeekdays("Monday, October 20")).toBe("Monday, October 20");
    expect(withChurchWeekdays("thứ bao nhiêu")).toBe("thứ bao nhiêu");
  });
});

describe("a weekday by its number", () => {
  it("counts from Sunday, in both languages", () => {
    expect(weekdayName(0, "vi")).toBe("Chúa Nhật");
    expect(weekdayName(2, "vi")).toBe("Thứ 3");
    expect(weekdayName(6, "vi")).toBe("Thứ 7");
    expect(weekdayName(0, "en")).toBe("Sunday");
    expect(weekdayName(6, "en")).toBe("Saturday");
  });
});
