"use client";

import { useEffect, useRef, useTransition } from "react";

// Starts a router change (a reload, a move to another screen) and resolves when its result is drawn.
// Why and how: src/lib/README.md.
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
