"use client";

import { useEffect, useRef, useTransition } from "react";

// Starts a router change (a reload, a move to another screen) and tells the caller when its result is drawn.
//
// Why: `router.refresh()` and `router.push()` return at once and the new screen arrives a moment later. A
// button that stops looking busy in between shows its old label for that moment, which reads as "nothing
// happened" and invites a second tap.
//
// How: React keeps a transition "pending" until the screen it leads to is drawn, so the change is started
// inside one, and the promise is resolved when that transition ends. If the change takes this component
// off the screen, the promise never resolves, and whatever waited on it stays busy until it is gone.
export function useWhenDrawn() {
  const [changing, startTransition] = useTransition();
  // Everyone waiting for the screen to change. A list, because two rows can each ask before the first has
  // been drawn; with a single slot the second would overwrite the first, whose button would stay busy.
  const waiting = useRef<(() => void)[]>([]);

  useEffect(() => {
    if (changing) return;
    waiting.current.forEach((resolve) => resolve());
    waiting.current = [];
  }, [changing]);

  return (change: () => void) =>
    new Promise<void>((resolve) => {
      waiting.current.push(resolve);
      startTransition(change);
    });
}
