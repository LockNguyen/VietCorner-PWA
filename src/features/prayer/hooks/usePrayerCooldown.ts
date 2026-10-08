"use client";

import { useEffect, useState } from "react";
import { canPray, withoutExpired, type PrayedAt } from "../cooldown";
import { loadPrayedAt, savePrayedAt } from "../storage";

// why: a button whose hour is over comes back within half a minute, and one clock serves every request
// on screen. A timer per request would be many timers to start, resume and cancel for the same result.
const CLOCK_TICK_MS = 30_000;

// Which requests this device may pray for right now. Nothing counts down: the device remembers WHEN it
// prayed, and this hook keeps a reading of the clock fresh (the prayer README, "a timestamp, not a timer").
export function usePrayerCooldown(userId: string) {
  const [prayedAt, setPrayedAt] = useState<PrayedAt>({});
  // null until this device's memory has been read: on the server and on the first paint nobody knows yet
  // whether a request was prayed for, and "not yet" is safer than offering the button twice.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const readClock = () => setNow(Date.now());

    // Finished pauses are dropped on the way in, so the stored map never grows past an hour of taps.
    const remembered = withoutExpired(loadPrayedAt(userId), Date.now());
    savePrayedAt(userId, remembered);
    setPrayedAt(remembered);
    readClock();

    const tick = setInterval(readClock, CLOCK_TICK_MS);
    // A phone pauses intervals while the app is in the background. Coming back reads the clock at once,
    // instead of leaving the button disabled until the next tick.
    document.addEventListener("visibilitychange", readClock);

    return () => {
      clearInterval(tick);
      document.removeEventListener("visibilitychange", readClock);
    };
  }, [userId]);

  // Every change goes through here and builds on the latest state, so two prayers answered out of order
  // both survive. Saving inside the updater is deliberate: React may run it twice, and that is harmless.
  function change(update: (current: PrayedAt) => PrayedAt) {
    setPrayedAt((current) => {
      const next = update(current);
      savePrayedAt(userId, next);
      return next;
    });
  }

  return {
    canPrayFor: (requestId: string) => now !== null && canPray(prayedAt, requestId, now),

    startPause(requestId: string) {
      const at = Date.now();
      setNow(at);
      change((current) => ({ ...withoutExpired(current, at), [requestId]: at }));
    },

    // For a prayer that never reached the server: the member should be able to try again.
    cancelPause(requestId: string) {
      change((current) => Object.fromEntries(Object.entries(current).filter(([id]) => id !== requestId)));
    },
  };
}
