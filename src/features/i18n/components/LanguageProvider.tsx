"use client";

import { createContext, useState } from "react";
import { saveLanguage } from "../api";
import { DEFAULT_LANGUAGE, isLanguage, type Language } from "../types";

// why: a visitor picks a language on the login screen, before an account exists to store it against.
// The device remembers it until the first sign-in writes it to the database.
const DEVICE_KEY = "vietcorner.language";

export type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
};

export const LanguageContext = createContext<LanguageContextValue>({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
});

type Props = {
  language: Language; // from the database when signed in, otherwise the default
  signedIn: boolean;
  children: React.ReactNode;
};

// Holds the language for the whole app. The root layout reads it on the server, so the first paint is
// already in the right language: no flash of English before Vietnamese appears.
export default function LanguageProvider({ language, signedIn, children }: Props) {
  const [current, setCurrent] = useState<Language>(language);

  function setLanguage(next: Language) {
    setCurrent(next);
    rememberOnDevice(next);
    // Signed out (the login screen), there is no row to write to: the device choice is saved above and
    // becomes the account's language on the first sign-in.
    if (signedIn) void saveLanguage(next).catch(() => {}); // a failed save costs a preference, never the screen
  }

  return <LanguageContext value={{ language: current, setLanguage }}>{children}</LanguageContext>;
}

function rememberOnDevice(language: Language) {
  try {
    window.localStorage.setItem(DEVICE_KEY, language);
  } catch {
    // Private mode or blocked storage: the choice simply does not survive a reload.
  }
}

// What this device chose before signing in. Used by the root layout for signed-out visitors, and once more
// after the first sign-in to carry the choice into the account.
export function languageOnDevice(): Language | null {
  try {
    const stored = window.localStorage.getItem(DEVICE_KEY);
    return isLanguage(stored) ? stored : null;
  } catch {
    return null;
  }
}
