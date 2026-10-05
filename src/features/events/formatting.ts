import { LOCALES, type Language } from "@/features/i18n/types"; // I18N

// Dates and times as this congregation reads them. One place, because the list, the day headings and the
// details panel must agree on what a date looks like.

export function formatTime(date: Date, language: Language): string {
  return date.toLocaleTimeString(LOCALES[language], { hour: "numeric", minute: "2-digit" });
}

export function formatLongDate(date: Date, language: Language): string {
  return date.toLocaleDateString(LOCALES[language], { weekday: "long", day: "numeric", month: "long" });
}
