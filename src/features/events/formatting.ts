import { clockTime, withChurchSunday } from "@/features/i18n/clock"; // I18N
import { LOCALES, type Language } from "@/features/i18n/types"; // I18N
import { CHURCH_TIME_ZONE, wallTime } from "@/lib/churchTime";

// Dates and times as this congregation reads them. One place, because the list, the day headings and the
// details panel must agree on what a date looks like.
//
// Always in church time, never the device's: the server (UTC) and a phone then print the same words, and
// a member travelling abroad still reads the hour to be at church.

// "7:00 PM" / "7:00 Tối" (i18n `clockTime`), read off the church's wall clock.
export function formatTime(date: Date, language: Language): string {
  return clockTime(wallTime(date).slice(11), language);
}

export function formatLongDate(date: Date, language: Language): string {
  return withChurchSunday(
    date.toLocaleDateString(LOCALES[language], { weekday: "long", day: "numeric", month: "long", timeZone: CHURCH_TIME_ZONE }),
  );
}

// "9:15a", "7:30p", from "09:15" or "19:30:00" (a church wall clock): the Events tab's short clock (the user,
// 2026-10-21), the same in both languages because it is read as numbers.
export function formatShortTime(wallClock: string): string {
  const [hours, minutes] = wallClock.split(":").map(Number);
  return `${hours % 12 === 0 ? 12 : hours % 12}:${String(minutes).padStart(2, "0")}${hours < 12 ? "a" : "p"}`;
}

// The weekday a card names, by its number (0 = Sunday): the weekly card's headings.
export function weekdayName(weekday: number, language: Language): string {
  // why: 4 January 2026 was a Sunday, and noon UTC is that same day in church time.
  return formatWeekday(new Date(Date.UTC(2026, 0, 4 + weekday, 12)), language);
}

// "Chúa Nhật" / "Sunday": the day a card names, its date being in the heading above it.
export function formatWeekday(date: Date, language: Language): string {
  return withChurchSunday(date.toLocaleDateString(LOCALES[language], { weekday: "long", timeZone: CHURCH_TIME_ZONE }));
}
