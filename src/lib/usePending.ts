"use client";

import { useRef, useState } from "react";

// Which of a component's actions is on its way to the server right now, if any.
//
// Why it exists: a request takes a moment, and a button that looks the same during that moment gets tapped
// again. Then the same thing is sent twice: two login codes, two identical events, or a false "could not
// save" for something that did save. Every button that starts a request goes through here.
//
//   const { pending, run } = usePending<"save" | "remove">();
//   <ActionButton pending={pending === "save"} disabled={pending !== null} onClick={() => run("save", save)}>
//
// - `run(action, work)` does the work unless something is already running, in which case the tap is ignored.
// - `pending` is the name of the running action, or null. The tapped button shows it is busy
//   (`pending === "save"`); its siblings are disabled meanwhile (`pending !== null`).
//
// One instance per row of a list, so a busy row never blocks the rows around it.
// It only tracks. `useSave` builds on it for the usual case: change, reload, say how it went.
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
