import { clockTime, weekdayName } from "@/features/i18n/clock"; // I18N
import type { Language } from "@/features/i18n/types"; // I18N

// When a group meets, written the same way in both languages: "Tuesdays @ 7:30 PM", "Thứ 3 @ 7:30 Tối".
// Pure, so it is tested without a screen. The day and time are stored separately (schema.sql, section 7).

// The day a group meets on: "Tuesdays", "Thứ 3".
// why: in English a weekly meeting is "Tuesdays"; Vietnamese has no plural ("Thứ 3" either way).
export function meetingDay(weekday: number, language: Language): string {
  const name = weekdayName(weekday, language);
  return language === "en" ? `${name}s` : name;
}

// Either part may be missing; with neither there is nothing to say.
export function formatMeeting(weekday: number | null, time: string | null, language: Language): string | null {
  const parts = [weekday !== null && meetingDay(weekday, language), time && clockTime(time, language)];
  const said = parts.filter(Boolean);
  return said.length > 0 ? said.join(" @ ") : null;
}
