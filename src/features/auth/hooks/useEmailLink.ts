"use client";

import { useEffect, useRef, useState } from "react";
import { accountExists, collectSignIn, sendSignInLink, signInWithLink } from "../api";
import { hashOf } from "../handoff";
import { GO_BACK, GO_FORWARD, slide } from "@/lib/slide";
import { clearPendingSignIn, readPendingSignIn, savePendingSignIn, todaysClaimKey, type PendingSignIn } from "../storage";

// why: each check is one small read of our own table, so it may be quick: the app moves on within seconds
// of the tap in Safari. It also checks the moment the person returns to the app.
const CHECK_EVERY_MS = 3_000;

// Signing in, or creating an account, by email link: ask for the link, then wait for its sign-in to be
// handed back to this device (the README, "Hand-off"). `onFailed` hears why a link that came back did not work.
export function useEmailLink(onFailed: (error: unknown) => void) {
  const [waiting, setWaiting] = useState<PendingSignIn | null>(null);
  const latestOnFailed = useRef(onFailed);
  useEffect(() => {
    latestOnFailed.current = onFailed;
  });

  // An iPhone often reloads the app when the person returns from their email: pick the wait up again.
  useEffect(() => {
    setWaiting(readPendingSignIn());
  }, []);

  // `name` only for a new account. A sign-in first checks that the address has one, so it can say so.
  async function sendLink(email: string, name?: string) {
    if (name === undefined && !(await accountExists(email))) throw { code: "no_account" };
    const claimKey = todaysClaimKey(); // the same for every link today: an older email still signs in here
    await sendSignInLink(email, await hashOf(claimKey), name);
    const pending = { claimKey, email, sentAt: Date.now() };
    savePendingSignIn(pending);
    slide(GO_FORWARD, () => setWaiting(pending)); // "check your email" slides in like the steps before it
  }

  // The back arrow while waiting: forget the wait and slide back to the screen that asked. Today's key stays,
  // so a link from before still works once the person asks again.
  function startOver() {
    clearPendingSignIn();
    slide(GO_BACK, () => setWaiting(null));
  }

  useEffect(() => {
    if (!waiting) return;
    const { claimKey } = waiting;
    let busy = false; // one check at a time: a slow answer must not overlap the next one

    async function checkNow() {
      if (busy || document.visibilityState !== "visible") return;
      // Gone while we waited: the link was opened in this same browser (Android, a computer) and signed in there.
      if (!readPendingSignIn()) return window.location.assign("/");
      busy = true;
      try {
        const tokenHash = await collectSignIn(claimKey);
        if (tokenHash) {
          clearPendingSignIn(); // collected: it cannot be collected again, whatever happens next
          await signInWithLink(tokenHash).then(
            () => window.location.assign("/"), // a full page load, so the proxy sees the new login cookie
            (error) => {
              setWaiting(null);
              latestOnFailed.current(error);
            },
          );
        }
      } catch {
        // Offline, or a hiccup: the next check tries again.
      }
      busy = false;
    }

    const timer = setInterval(checkNow, CHECK_EVERY_MS);
    document.addEventListener("visibilitychange", checkNow);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", checkNow);
    };
  }, [waiting]);

  return {
    sentTo: waiting?.email ?? null,
    signIn: (email: string) => sendLink(email),
    createAccount: (name: string, email: string) => sendLink(email, name),
    startOver,
  };
}
