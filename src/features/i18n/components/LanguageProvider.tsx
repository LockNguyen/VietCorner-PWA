"use client";

import { createContext, useEffect, useState } from "react";
import { forgetSavedHome } from "@/lib/savedHome";
import { saveLanguage } from "../api";
import { DEFAULT_LANGUAGE, isLanguage, LANGUAGE_COOKIE, type Language } from "../types";

// why: a visitor picks a language on the login screen, before an account exists to store it against.
// The device remembers it until the first sign-in writes it to the database.
const DEVICE_KEY = "vietcorner.language";
// why: the longest a browser keeps a cookie (400 days); choosing again renews it.
const KEEP_SECONDS = 400 * 24 * 60 * 60;

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

  // Signed out, the server cannot know the device's choice: adopt it once loaded. Without this an iPhone,
  // which often reloads the app on return from the email, would switch an English speaker to Vietnamese.
  useEffect(() => {
    const chosen = signedIn ? null : languageOnDevice();
    if (chosen) setCurrent(chosen);
  }, [signedIn]);

  function setLanguage(next: Language) {
    setCurrent(next);
    rememberOnDevice(next);
    // Signed out (the login screen), there is no row to write to: the device choice is saved above and
    // becomes the account's language on the first sign-in.
    if (signedIn) void saveLanguage(next).catch(() => {}); // a failed save costs a preference, never the screen
    forgetSavedHome(); // the Home saved for the next launch is in the old language
  }

  return <LanguageContext value={{ language: current, setLanguage }}>{children}</LanguageContext>;
}

function rememberOnDevice(language: Language) {
  document.cookie = `${LANGUAGE_COOKIE}=${language}; path=/; max-age=${KEEP_SECONDS}; samesite=lax`;
  try {
    window.localStorage.setItem(DEVICE_KEY, language);
  } catch {
    // Private mode or blocked storage: the choice simply does not survive a reload.
  }
}

// What this device chose before signing in. Used above for signed-out visitors, and by AdoptDeviceLanguage
// after the first sign-in to carry the choice into the account. The cookie as well: an app installed from
// Safari starts with Safari's cookies but an empty localStorage.
export function languageOnDevice(): Language | null {
  const fromCookie = new RegExp(`(?:^|; )${LANGUAGE_COOKIE}=([a-z]+)`).exec(document.cookie)?.[1];
  try {
    const stored = window.localStorage.getItem(DEVICE_KEY);
    if (isLanguage(stored)) return stored;
  } catch {
    // Blocked storage: the cookie may still say.
  }
  return isLanguage(fromCookie) ? fromCookie : null;
}
