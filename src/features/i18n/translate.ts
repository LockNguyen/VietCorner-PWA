import type { Language, Text } from "./types";

// Picking one language out of a `Text`. A plain function, not a hook, because both sides need it:
// Server Components translate page titles, client components translate through `useLanguage`.
//
// Falls back to the other language rather than showing nothing: a missing Vietnamese string should read
// English, not an empty button.
export function translate(text: Text, language: Language): string {
  return text[language] || text[language === "vi" ? "en" : "vi"] || "";
}
