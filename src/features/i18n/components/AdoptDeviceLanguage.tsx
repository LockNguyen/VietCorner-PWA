"use client";

import { useEffect } from "react";
import { saveLanguage } from "../api";
import { languageOnDevice } from "./LanguageProvider";
import type { Language } from "../types";

type Props = { storedLanguage: Language | null };

// Carries the language chosen on the login screen into the new account.
//
// Why this exists: the choice is made before an account exists, so nothing can be written then. On the first
// signed-in page load, if the account has no language yet, the device's choice becomes the account's.
// Rendered once in the root layout; it draws nothing.
//
// Why not do it in the auth feature: that would make auth import i18n. The account creation flow stays
// unaware, and this feature picks the choice up afterwards.
export default function AdoptDeviceLanguage({ storedLanguage }: Props) {
  useEffect(() => {
    if (storedLanguage) return; // the account already has one; the device does not override it
    const chosen = languageOnDevice();
    if (chosen) void saveLanguage(chosen).catch(() => {});
  }, [storedLanguage]);

  return null;
}
