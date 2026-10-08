"use client";

import { useContext } from "react";
import { LanguageContext } from "../components/LanguageProvider";
import { translate } from "../translate";
import type { Text } from "../types";

// What a client component needs: the current language, a way to change it, and `t` to read a string.
// `const { t } = useLanguage();` then `t(STRINGS.sendButton)`.
export function useLanguage() {
  const { language, setLanguage } = useContext(LanguageContext);
  return { language, setLanguage, t: (text: Text) => translate(text, language) };
}
