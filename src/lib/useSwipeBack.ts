"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { GO_BACK } from "./slide";

// why each number: as on an iPhone, the swipe starts at the screen's left edge (so a swipe on a picture or a
// list is left alone) and must travel far enough, more sideways than down, to count.
const EDGE_PX = 30;
const MIN_SWIPE_PX = 80;

// A swipe from the left edge to the right goes back to `backHref`, sliding this screen away (src/lib/slide.ts).
// Only in the installed app: a browser tab has its own swipe back, and the two would both go back.
// The screen moves once the finger lets go; it does not follow the finger on the way (the README says why).
export function useSwipeBack(backHref: string | undefined) {
  const router = useRouter();

  useEffect(() => {
    if (!backHref || !window.matchMedia("(display-mode: standalone)").matches) return;
    let start: { x: number; y: number } | null = null;

    function onStart(event: TouchEvent) {
      const touch = event.touches[0];
      start = touch.clientX <= EDGE_PX ? { x: touch.clientX, y: touch.clientY } : null;
    }
    function onEnd(event: TouchEvent) {
      if (!start) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - start.x;
      const dy = Math.abs(touch.clientY - start.y);
      start = null;
      if (dx >= MIN_SWIPE_PX && dx > dy) router.push(backHref!, { transitionTypes: GO_BACK });
    }

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchend", onEnd);
    };
  }, [backHref, router]);
}
