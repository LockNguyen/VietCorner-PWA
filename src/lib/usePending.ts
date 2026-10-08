"use client";

import { useRef, useState } from "react";

// Which of a component's actions is on its way to the server, if any; a second tap meanwhile is ignored.
// One instance per row of a list. `useSave` builds on it for the usual case. More: src/lib/README.md.
export function usePending<Action extends string>() {
  const [pending, setPending] = useState<Action | null>(null);
  // A ref as well as state: state only changes on the next render, and a second tap can land before that.
  // The ref is read and written in the same instant, so the second tap always sees the first.
  const inFlight = useRef(false);

  // Resolves to what the work resolved to, or to undefined for a tap that was ignored.
  async function run<Result>(action: Action, work: () => Promise<Result>): Promise<Result | undefined> {
    if (inFlight.current) return undefined;

    inFlight.current = true;
    setPending(action);
    try {
      return await work();
    } finally {
      inFlight.current = false;
      setPending(null);
    }
  }

  return { pending, run };
}
