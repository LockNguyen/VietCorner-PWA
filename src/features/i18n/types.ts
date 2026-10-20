// The two languages the app ships.
export type Language = "en" | "vi";

// The same two, as a list, for code that does something once per language (a form column, a push per language).
export const LANGUAGES: Language[] = ["en", "vi"];

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

// Each language's own name, written in that language, so it is readable to the person who needs it.
export const LANGUAGE_NAMES: Record<Language, string> = { en: "English", vi: "Tiếng Việt" };

// The device's choice before an account exists, also kept as a cookie (2026-10-20): the server then draws the
// first screen in it, and iOS copies Safari's cookies (not its localStorage) into the app when it is added to
// the Home Screen, so the language chosen on the website is the installed app's too.
export const LANGUAGE_COOKIE = "language";

export function isLanguage(value: unknown): value is Language {
  return value === "en" || value === "vi";
}
