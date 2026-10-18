"use client";

import { useEffect, useState } from "react";
import { leaveSignIn, signInWithLink } from "../api";
import { attemptOf } from "../handoff";
import { clearPendingSignIn, readPendingSignIn } from "../storage";

// Where the opened link stands:
//   checking  working out which browser this is
//   ask       another browser asked: wait for a tap before handing the sign-in over
//   left      handed over; the person goes back to the app
//   failed    the link is incomplete, too old or already used
export type ConfirmState = "checking" | "ask" | "left" | "failed";

// What an opened sign-in link does. In the browser that asked (it holds the key the link names) it signs in
// right here. In any other browser, which is every iPhone, where links open in Safari and not in the
// installed app, it asks for one tap, then hands the sign-in to the one that asked.
export function useConfirmLink(attempt: string | undefined, tokenHash: string | undefined) {
  const [state, setState] = useState<ConfirmState>("checking");

  useEffect(() => {
    async function decide() {
      if (!attempt || !tokenHash) return setState("failed");

      const pending = readPendingSignIn();
      const askedHere = pending !== null && (await attemptOf(pending.claimKey)) === attempt;
      if (!askedHere) return setState("ask");

      try {
        await signInWithLink(tokenHash);
        clearPendingSignIn();
        window.location.assign("/"); // a full page load, so the proxy sees the new login cookie
      } catch {
        setState("failed");
      }
    }
    decide();
  }, [attempt, tokenHash]);

  // Runs on a tap, never by itself: a mail scanner that opens links must not be able to confirm anything.
  async function confirm() {
    try {
      await leaveSignIn(attempt!, tokenHash!);
      setState("left");
    } catch {
      setState("failed");
    }
  }

  return { state, confirm };
}
