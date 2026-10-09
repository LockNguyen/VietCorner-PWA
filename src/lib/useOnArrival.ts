"use client";

import { useEffect, useRef } from "react";

// Runs `act` when the screen is arrived at, and again each time the app returns to the foreground:
// the two moments at which what is on screen may have gone out of date.
export function useOnArrival(act: () => void) {
  // The newest `act`, so the listener below never runs one that captured older state.
  const latest = useRef(act);
  useEffect(() => {
    latest.current = act;
  });

  useEffect(() => {
    function actIfVisible() {
      if (document.visibilityState === "visible") latest.current();
    }

    latest.current();
    document.addEventListener("visibilitychange", actIfVisible);
    return () => document.removeEventListener("visibilitychange", actIfVisible);
  }, []);
}
