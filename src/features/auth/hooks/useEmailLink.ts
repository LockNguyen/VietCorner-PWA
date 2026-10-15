"use client";

import { useEffect, useRef, useState } from "react";
import { collectSignIn, sendPasswordReset, signIn, signInWithResetLink, signUp } from "../api";
import { problemWith } from "../errors";
import { rememberPassword } from "../passwordManager";
import { attemptOf, newClaimKey } from "../handoff";
import {
  clearPendingSignIn,
  NEW_PASSWORD_PATH,
  readPendingSignIn,
  savePendingSignIn,
  type PendingSignIn,
} from "../storage";

// How often each wait checks while the app is on screen; it also checks the moment the person returns.
// why 15 s for a new account: each check is a sign-in, and Supabase allows about 30 sign-ins per 5 minutes.
// why 3 s for a reset: each check is one small read of our own table, so it may be quick.
const CHECK_EVERY_MS: Record<PendingSignIn["purpose"], number> = { signup: 15_000, recovery: 3_000 };

// The two emails with a link, and the wait for each (the README, "Flow"):
//   new account  the link confirms the address; this device then signs in with the password it was given
//   reset        the link's sign-in is handed back to this device (the README, "Hand-off")
// `onFailed` hears why a reset link that came back did not work.
export function useEmailLink(onFailed: (error: unknown) => void) {
  const [waiting, setWaiting] = useState<PendingSignIn | null>(null);
  // Only in memory, never stored: lost if the phone reloads the app, which then asks to sign in instead.
  const password = useRef<string | null>(null);
  const latestOnFailed = useRef(onFailed);
  useEffect(() => {
    latestOnFailed.current = onFailed;
  });

  // An iPhone often reloads the app when the person returns from their email: pick the wait up again.
  useEffect(() => {
    setWaiting(readPendingSignIn());
  }, []);

  function wait(pending: PendingSignIn) {
    savePendingSignIn(pending);
    setWaiting(pending);
  }

  async function createAccount(name: string, email: string, newPassword: string) {
    await signUp(name, email, newPassword);
    rememberPassword(email, newPassword); // Chrome's save sheet; Safari offers by itself (passwordManager.ts)
    password.current = newPassword;
    wait({ purpose: "signup", email, sentAt: Date.now() });
  }

  async function resetPassword(email: string) {
    const claimKey = newClaimKey();
    await sendPasswordReset(email, await attemptOf(claimKey));
    wait({ purpose: "recovery", claimKey, email, sentAt: Date.now() });
  }

  function startOver() {
    clearPendingSignIn();
    setWaiting(null);
  }

  // One look at whether the link has been used. Leaves the page when it has.
  async function check(pending: PendingSignIn) {
    if (pending.purpose === "signup") {
      try {
        await signIn(pending.email, password.current!);
      } catch (error) {
        if (problemWith(error) === "notConfirmed") return; // the link is not tapped yet
        throw error;
      }
      clearPendingSignIn();
      window.location.assign("/"); // a full page load, so the proxy sees the new login cookie
      return;
    }

    const tokenHash = await collectSignIn(pending.claimKey);
    if (!tokenHash) return;
    clearPendingSignIn(); // collected: it cannot be collected again, whatever happens next
    try {
      await signInWithResetLink(tokenHash);
      window.location.assign(NEW_PASSWORD_PATH);
    } catch (error) {
      setWaiting(null);
      latestOnFailed.current(error);
    }
  }

  const canCheck = waiting !== null && (waiting.purpose === "recovery" || password.current !== null);

  useEffect(() => {
    if (!waiting || !canCheck) return;
    let busy = false; // one check at a time: a slow answer must not overlap the next one

    async function checkNow() {
      if (busy || document.visibilityState !== "visible") return;
      // Gone while we waited: a reset link opened in this same browser (Android) and signed in there.
      if (!readPendingSignIn()) return window.location.assign("/");
      busy = true;
      // A failed check (offline, too many tries) just waits for the next one.
      await check(waiting!).catch(() => {});
      busy = false;
    }

    const timer = setInterval(checkNow, CHECK_EVERY_MS[waiting.purpose]);
    document.addEventListener("visibilitychange", checkNow);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", checkNow);
    };
    // `check` reads refs only, so the wait restarts only when what is awaited changes.
  }, [waiting, canCheck]);

  return {
    sentTo: waiting?.email ?? null,
    // A new account whose password was lost in a reload: the person signs in, and the phone fills it in.
    needsSignIn: waiting !== null && !canCheck,
    waitingFor: waiting?.purpose ?? null,
    createAccount,
    resetPassword,
    startOver,
  };
}
