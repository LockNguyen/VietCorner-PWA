import type { Text } from "./types";

// This feature's own user-facing text.
export const STRINGS: Record<string, Text> = {
  languageLabel: { en: "Language", vi: "Ngôn ngữ" },
  // The website's first screen, shown in both languages at once: nobody has chosen yet.
  chooseLanguage: { en: "Choose your language", vi: "Chọn ngôn ngữ" },
};
