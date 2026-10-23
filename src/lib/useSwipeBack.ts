"use client";

import { useEffect } from "react";
import { pictureOf } from "./screenPictures";

// why each number: the swipe may start anywhere on the left 40% of the screen (the user, 2026-10-23: the 30 px edge
// was hard to find; 60% took too much), and must travel far enough to count, so a nudge springs back. The first
// 10 px decide what the finger is doing: more sideways than down is the swipe back, anything else a scroll.
const START_AREA = 0.4;
const MIN_SWIPE_PX = 80;
const DECIDE_PX = 10;
// The same length and curve as a screen's slide (globals.css `--slide`), so letting go looks like the back arrow.
const SETTLE_MS = 175;
const SETTLE = `transform ${SETTLE_MS}ms cubic-bezier(0.32, 0.72, 0, 1)`;
// A soft edge on the moving screen, so it reads as a page lifted off what is under it.
const LIFTED = "-8px 0 24px rgb(0 0 0 / 0.15)";

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

// A swipe to the right from the left part of the screen goes back, the same step as the screen's back arrow
// (PageHeader). The screen box (`screenId`) follows the finger (the user, 2026-10-23); let go far enough and it
// slides the rest of the way off while `goBack(true)` changes the screen without a second slide; not far enough and
// it springs back. Under it, a picture of `backPath` as it was left (src/lib/screenPictures.ts), since a browser
// draws one page at a time; a screen never left in this visit (opened cold) has none, and the background shows.
// With reduced motion nothing follows: let go and it goes back, slide and all.
// Only in the installed app: a browser tab has its own swipe back, and the two would both go back.
export function useSwipeBack(goBack: ((alreadySlid: boolean) => void) | undefined, backPath: string | undefined, screenId: string) {
  useEffect(() => {
    const screen = document.getElementById(screenId);
    if (!goBack || !screen || !window.matchMedia("(display-mode: standalone)").matches) return;
    const back = goBack; // narrowed here, for the listeners below
    const follows = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let start: { x: number; y: number } | null = null;
    let swiping: boolean | null = null; // null until the first moves say whether this is the swipe back
    let under: HTMLElement | null = null; // the picture shown under the screen while it is held

    // The picture goes exactly where the screen is, under it; the screen is lifted above it while held.
    function showPicture() {
      const picture = backPath ? pictureOf(backPath) : undefined;
      if (!picture) return;
      const { top, left, width, height } = screen!.getBoundingClientRect();
      Object.assign(picture.copy.style, { position: "fixed", top: `${top}px`, left: `${left}px`, width: `${width}px`, height: `${height}px` });
      Object.assign(screen!.style, { position: "relative", zIndex: "1" });
      document.body.appendChild(picture.copy);
      picture.copy.scrollTop = picture.scrollTop; // only once it is in the page can it scroll
      under = picture.copy;
    }
    function hidePicture() {
      under?.remove();
      under = null;
      Object.assign(screen!.style, { position: "", zIndex: "" });
    }

    function place(x: number, settle: boolean) {
      screen!.style.transition = settle ? SETTLE : "none";
      screen!.style.transform = x > 0 ? `translateX(${x}px)` : "";
      screen!.style.boxShadow = x > 0 ? LIFTED : "";
    }

    function onStart(event: TouchEvent) {
      const touch = event.touches[0];
      const inArea = touch.clientX <= window.innerWidth * START_AREA;
      start = inArea && !hasItsOwnSwipe(event.target) ? { x: touch.clientX, y: touch.clientY } : null;
      swiping = null;
    }

    function onMove(event: TouchEvent) {
      if (!start) return;
      const touch = event.touches[0];
      const dx = touch.clientX - start.x;
      const dy = Math.abs(touch.clientY - start.y);
      if (swiping === null) {
        if (Math.max(Math.abs(dx), dy) < DECIDE_PX) return;
        swiping = dx > dy;
        if (!swiping) start = null; // a scroll: left alone from here on
        else if (follows) showPicture();
      }
      if (!swiping) return;
      event.preventDefault(); // the list does not scroll while the screen is held
      if (follows) place(Math.max(0, dx), false);
    }

    function onEnd(event: TouchEvent) {
      if (!start || !swiping) return;
      const dx = event.changedTouches[0].clientX - start.x;
      start = null;
      if (dx < MIN_SWIPE_PX) {
        if (!follows) return;
        place(0, true);
        setTimeout(hidePicture, SETTLE_MS); // once the screen is back over it
        return;
      }
      if (!follows) return back(false);
      // Off it slides, and the screen behind is asked for at once rather than after the slide: waiting for it left
      // the box empty for most of a second (measured 2026-10-23). It lands in place when it arrives (cleanup).
      place(window.innerWidth, true);
      back(true);
    }

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: false }); // passive: false, or it may not stop the scroll
    document.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      place(0, false); // the next screen arrives in the same box, which must be back in its place
      hidePicture(); // and covers what the picture showed
    };
  }, [goBack, backPath, screenId]);
}
