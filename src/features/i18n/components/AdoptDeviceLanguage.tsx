"use client";

import { useEffect } from "react";
import { saveLanguage } from "../api";
import { languageOnDevice } from "./LanguageProvider";
import type { Language } from "../types";

type Props = { storedLanguage: Language | null };

// Carries the language chosen on the login screen into the new account, on its first signed-in page load.
// Rendered once in the root layout; it draws nothing. Why it lives here and not in auth: the i18n README.
export default function AdoptDeviceLanguage({ storedLanguage }: Props) {
  useEffect(() => {
    if (storedLanguage) return; // the account already has one; the device does not override it
    const chosen = languageOnDevice();
    if (chosen) void saveLanguage(chosen).catch(() => {});
  }, [storedLanguage]);

  return null;
}
