"use client";

import { useEffect, useState } from "react";
import { signInWithConfirmLink } from "../api";
import { clearPendingSignIn } from "../storage";

// Where a sign-up link stands, once Supabase has sent the browser here:
//   checking   reading the address, or signing in
//   confirmed  the email is confirmed, but this is not the browser that signed up: go back to that one
//   failed     Supabase reported the link too old or already used (`error` after `?` or `#`)
// In the browser that signed up (usually Safari on the same phone) it signs in here and goes on to the
// next setup step, so nobody has to switch back to another tab.
export type ConfirmedState = "checking" | "confirmed" | "failed";

export function useConfirmedLink(): ConfirmedState {
  const [state, setState] = useState<ConfirmedState>("checking");

  useEffect(() => {
    const { search, hash } = window.location;
    const query = new URLSearchParams(search);
    if (query.has("error") || new URLSearchParams(hash.slice(1)).has("error")) return setState("failed");

    const code = query.get("code");
    if (!code) return setState("confirmed");
    signInWithConfirmLink(code)
      .then(() => {
        clearPendingSignIn(); // the tab that was waiting sees this and moves on too
        window.location.assign("/"); // a full page load, so the proxy sees the new login cookie
      })
      .catch(() => setState("confirmed"));
  }, []);

  return state;
}
