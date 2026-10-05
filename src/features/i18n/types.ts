// The two languages the app ships.
export type Language = "en" | "vi";

// One piece of user-facing text in both languages. Every feature's `strings.ts` is a map of these.
//
// Fixed UI labels live in code because they only change when a developer changes a screen. Text that an
// admin writes (an event title) is data and gets `_en` / `_vi` columns in that feature's table instead.
export type Text = { en: string; vi: string };

// why: the congregation is Vietnamese. A user who has never chosen sees Vietnamese, not English.
export const DEFAULT_LANGUAGE: Language = "vi";

// The locale each language formats dates and times in. Here because every feature that shows a date needs
// it, and two features must not disagree about how Vietnamese dates look.
export const LOCALES: Record<Language, string> = { en: "en-US", vi: "vi-VN" };

export function isLanguage(value: unknown): value is Language {
  return value === "en" || value === "vi";
}
