import { LOCALES, type Language } from "@/features/i18n/types"; // I18N
import { CHURCH_TIME_ZONE } from "./churchTime";

// Dates and times as this congregation reads them. One place, because the list, the day headings and the
// details panel must agree on what a date looks like.
//
// Always in church time, never the device's: the server (UTC) and a phone then print the same words, and
// a member travelling abroad still reads the hour to be at church.

export function formatTime(date: Date, language: Language): string {
  return date.toLocaleTimeString(LOCALES[language], { hour: "numeric", minute: "2-digit", timeZone: CHURCH_TIME_ZONE });
}

export function formatLongDate(date: Date, language: Language): string {
  return date.toLocaleDateString(LOCALES[language], {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: CHURCH_TIME_ZONE,
  });
}
