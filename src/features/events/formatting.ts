import type { Language } from "@/features/i18n/types"; // I18N

// Dates and times as this congregation reads them. One place, because the list, the day headings and the
// details panel must agree, and because `toLocaleDateString` takes a locale that only this file should know.

function localeFor(language: Language): string {
  return language === "vi" ? "vi-VN" : "en-US";
}

export function formatTime(date: Date, language: Language): string {
  return date.toLocaleTimeString(localeFor(language), { hour: "numeric", minute: "2-digit" });
}

export function formatLongDate(date: Date, language: Language): string {
  return date.toLocaleDateString(localeFor(language), { weekday: "long", day: "numeric", month: "long" });
}
