"use client";

import { useEffect } from "react";

// why each number: as on an iPhone, the swipe starts at the screen's left edge (so a swipe on a picture or a
// list is left alone) and must travel far enough, more sideways than down, to count.
const EDGE_PX = 30;
const MIN_SWIPE_PX = 80;

// A swipe from the left edge to the right calls `goBack`, the same step as the screen's back arrow (PageHeader).
// Only in the installed app: a browser tab has its own swipe back, and the two would both go back.
// The screen moves once the finger lets go; it does not follow the finger on the way (the README says why).
export function useSwipeBack(goBack: (() => void) | undefined) {
  useEffect(() => {
    if (!goBack || !window.matchMedia("(display-mode: standalone)").matches) return;
    const back = goBack; // narrowed here, for the listener below
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
      if (dx >= MIN_SWIPE_PX && dx > dy) back();
    }

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchend", onEnd);
    };
  }, [goBack]);
}
