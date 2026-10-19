import { clockTime, withChurchSunday } from "@/features/i18n/clock"; // I18N
import { LOCALES, type Language } from "@/features/i18n/types"; // I18N

// When a group meets, written the same way in both languages: "Tuesdays @ 7:30 PM", "Thứ Ba @ 7:30 Tối".
// Pure, so it is tested without a screen. The day and time are stored separately (schema.sql, section 7).

// A Sunday, so that adding the weekday number lands on that weekday. Read in UTC: no time zone can move it.
const A_SUNDAY = Date.UTC(2026, 0, 4);

export function weekdayName(weekday: number, language: Language): string {
  const name = new Date(A_SUNDAY + weekday * 86_400_000).toLocaleDateString(LOCALES[language], {
    weekday: "long",
    timeZone: "UTC",
  });
  // why: in English a weekly meeting is "Tuesdays"; Vietnamese has no plural ("Thứ Ba" either way).
  return language === "en" ? `${name}s` : withChurchSunday(name);
}

// Either part may be missing; with neither there is nothing to say.
export function formatMeeting(weekday: number | null, time: string | null, language: Language): string | null {
  const parts = [weekday !== null && weekdayName(weekday, language), time && clockTime(time, language)];
  const said = parts.filter(Boolean);
  return said.length > 0 ? said.join(" @ ") : null;
}
