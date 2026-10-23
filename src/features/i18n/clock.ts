import { LOCALES, type Language } from "./types";

// How this congregation says a time and names the weekdays, in either language. Pure, so it is tested without a
// screen. Here, in the language foundation, because any feature that shows a time or a weekday needs it.

// A time of day, from "19:00" or "19:00:00" (a wall clock, already in church time): "7:00 PM" in English,
// "7:00 Tối" in Vietnamese (the user's word, 2026-10-17). Every time the app shows goes through here. A 12-hour
// clock, because that is how the members say it; the word for the part of the day replaces AM/PM.
export function clockTime(wallClock: string, language: Language): string {
  const [hours, minutes] = wallClock.split(":").map(Number);
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  const time = `${hour12}:${String(minutes).padStart(2, "0")}`;
  return `${time} ${language === "en" ? (hours < 12 ? "AM" : "PM") : partOfDay(hours)}`;
}

// why these hours: Sáng until 11, Trưa over midday, Chiều in the afternoon, Tối from six in the evening,
// as the words are used in everyday speech.
function partOfDay(hours: number): string {
  if (hours < 11) return "Sáng";
  if (hours < 13) return "Trưa";
  if (hours < 18) return "Chiều";
  return "Tối";
}

// The weekdays as this church writes them, in place of the phone calendar's names: "Chúa Nhật" (the Lord's day)
// for "Chủ Nhật", and the other days by number, "Thứ 2" for "Thứ Hai" (the user, 2026-10-23: clearer).
const CHURCH_WEEKDAYS: Record<string, string> = {
  "chủ nhật": "Chúa Nhật",
  "thứ hai": "Thứ 2",
  "thứ ba": "Thứ 3",
  "thứ tư": "Thứ 4",
  "thứ năm": "Thứ 5",
  "thứ sáu": "Thứ 6",
  "thứ bảy": "Thứ 7",
};

// Applied to any Vietnamese text the phone wrote with a weekday in it ("Thứ Hai, 5 tháng 1" → "Thứ 2, 5 tháng 1").
// English text has none of these words, so it passes through unchanged.
// The lookahead keeps it to whole words: "thứ bao nhiêu" is not "Thứ 3 o nhiêu".
export function withChurchWeekdays(text: string): string {
  return text.replace(/(chủ nhật|thứ (hai|ba|tư|năm|sáu|bảy))(?!\p{L})/giu, (day) => CHURCH_WEEKDAYS[day.toLowerCase()]);
}

// A weekday by its number, 0 = Sunday, as every list and card of weekdays names it: "Thứ 3" / "Tuesday".
// why: 4 January 2026 was a Sunday, so day 4 + n is weekday n; read in UTC, so no time zone can move it.
export function weekdayName(weekday: number, language: Language): string {
  const day = new Date(Date.UTC(2026, 0, 4 + weekday));
  return withChurchWeekdays(day.toLocaleDateString(LOCALES[language], { weekday: "long", timeZone: "UTC" }));
}
