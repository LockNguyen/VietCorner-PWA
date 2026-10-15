"use client";

import { useEffect, useState } from "react";

const KEY = "vietcorner.typed-email";

// The email typed on the signed-out screens, kept for this visit. Why: signing in is a real form post
// (the README, "Saving the password"), so a failed try comes back as a fresh page; without this the person
// would type their email again. Only the email: a password is never written anywhere.
export function useTypedEmail() {
  const [email, setEmail] = useState("");

  useEffect(() => {
    try {
      setEmail(window.sessionStorage.getItem(KEY) ?? "");
    } catch {
      // Blocked storage: the field starts empty, as it would anyway.
    }
  }, []);

  function change(next: string) {
    setEmail(next);
    try {
      window.sessionStorage.setItem(KEY, next);
    } catch {
      // Blocked storage: kept only while this screen is open.
    }
  }

  return [email, change] as const;
}
