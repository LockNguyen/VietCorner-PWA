"use client";

import { useEffect } from "react";

// why each number: the swipe may start anywhere on the left 60% of the screen (the user, 2026-10-23: the 30 px
// edge was hard to find), and must travel far enough, more sideways than down, to count, so a scroll is never
// taken for it. The right 40% stays free for whatever is there.
const START_AREA = 0.6;
const MIN_SWIPE_PX = 80;

// What keeps its own sideways swipe, so a swipe that starts on it is not a step back: a field (moving the caret,
// selecting words), anything marked `data-own-swipe` (the picture viewer, the picture cropper), and anything that
// scrolls sideways (a strip of pictures).
const OWN_SWIPE = "input, textarea, select, [contenteditable], [data-own-swipe]";

function hasItsOwnSwipe(target: EventTarget | null): boolean {
  for (let element = target instanceof Element ? target : null; element; element = element.parentElement) {
    if (element.matches(OWN_SWIPE)) return true;
    const sideways = getComputedStyle(element).overflowX;
    if ((sideways === "auto" || sideways === "scroll") && element.scrollWidth > element.clientWidth) return true;
  }
  return false;
}

// A swipe to the right from the left part of the screen calls `goBack`, the same step as the screen's back arrow
// (PageHeader). Only in the installed app: a browser tab has its own swipe back, and the two would both go back.
// The screen moves once the finger lets go; it does not follow the finger on the way (the README says why).
export function useSwipeBack(goBack: (() => void) | undefined) {
  useEffect(() => {
    if (!goBack || !window.matchMedia("(display-mode: standalone)").matches) return;
    const back = goBack; // narrowed here, for the listener below
    let start: { x: number; y: number } | null = null;

    function onStart(event: TouchEvent) {
      const touch = event.touches[0];
      const inArea = touch.clientX <= window.innerWidth * START_AREA;
      start = inArea && !hasItsOwnSwipe(event.target) ? { x: touch.clientX, y: touch.clientY } : null;
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
