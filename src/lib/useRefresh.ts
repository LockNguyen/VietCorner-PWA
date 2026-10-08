"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";

// Reloads the page's server data, and tells the caller when the new data is on screen.
//
//   const refresh = useRefresh();
//   await save();
//   await refresh();   // resolves once the reloaded list has been drawn
//
// Why not just `router.refresh()`: it returns at once and the new data arrives a moment later. A button
// that stops looking busy in between shows its old label for that moment ("Cancel", then "Undo"), which
// reads as "nothing happened" and invites a second tap. Waiting here keeps the button busy until the
// screen has actually changed.
//
// How: React keeps a transition "pending" until the screen it leads to is drawn, so the refresh is started
// inside one, and the promise is resolved when that transition ends.
export function useRefresh() {
  const router = useRouter();
  const [refreshing, startTransition] = useTransition();
  // Everyone waiting for the screen to change. A list, because two rows can each ask for a refresh before
  // the first has been drawn; with a single slot the second would overwrite the first, whose button would
  // then stay busy for ever.
  const waiting = useRef<(() => void)[]>([]);

  useEffect(() => {
    if (refreshing) return;
    waiting.current.forEach((resolve) => resolve());
    waiting.current = [];
  }, [refreshing]);

  return () =>
    new Promise<void>((resolve) => {
      waiting.current.push(resolve);
      startTransition(() => router.refresh());
    });
}
