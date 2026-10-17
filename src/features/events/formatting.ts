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
