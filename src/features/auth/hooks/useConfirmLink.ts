"use client";

import { useEffect, useState } from "react";
import { collectSignIn, leaveSignIn, signInWithLink } from "../api";
import { hashOf } from "../handoff";
import { clearPendingSignIn, readTodaysClaimKey } from "../storage";

// Where the opened link stands:
//   checking  working out which browser this is
//   ask       another browser asked: wait for a tap before handing the sign-in over
//   left      handed over; the person goes back to the app
//   failed    the link is incomplete, from another day, or already used
export type ConfirmState = "checking" | "ask" | "left" | "failed";

// What an opened sign-in link does. In the browser that asked today (it holds the key the link names) it
// signs in right here. In any other browser, which is every iPhone, where links open in Safari and not in the
// installed app, it asks for one tap, then hands the sign-in to the one that asked.
export function useConfirmLink(attempt: string | undefined, linkKey: string | undefined) {
  const [state, setState] = useState<ConfirmState>("checking");

  useEffect(() => {
    async function decide() {
      if (!attempt || !linkKey) return setState("failed");

      const claimKey = readTodaysClaimKey();
      const askedHere = claimKey !== null && (await hashOf(claimKey)) === attempt;
      if (!askedHere) return setState("ask");

      try {
        await leaveSignIn(attempt, linkKey);
        const tokenHash = await collectSignIn(claimKey);
        // Null: the app's own tab in this browser, waiting on the same sign-in, collected it first (it asks every
        // few seconds). That tab is now signed in, and so is this browser: go in too, instead of "expired".
        if (tokenHash) await signInWithLink(tokenHash);
        clearPendingSignIn();
        window.location.assign("/"); // a full page load, so the proxy sees the new login cookie
      } catch {
        setState("failed");
      }
    }
    decide();
  }, [attempt, linkKey]);

  // Runs on a tap, never by itself: a mail scanner that opens links must not be able to confirm anything.
  async function confirm() {
    try {
      await leaveSignIn(attempt!, linkKey!);
      setState("left");
    } catch {
      setState("failed");
    }
  }

  return { state, confirm };
}
