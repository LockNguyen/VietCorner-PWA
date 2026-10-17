"use client";

import { useRef, type TouchEvent } from "react";

// why: long enough that a tap or a wobble is not a swipe, short enough for an elderly thumb's small flick.
const MIN_SWIPE_PX = 50;

// A sideways swipe on a touch screen: left (finger moves left) or right. A mostly vertical move is not a
// swipe, so scrolling still works. Spread the returned handlers onto the element that is swiped.
export function useSwipe(onSwipeLeft?: () => void, onSwipeRight?: () => void) {
  const start = useRef<{ x: number; y: number } | null>(null);

  return {
    onTouchStart: (event: TouchEvent) => {
      const touch = event.touches[0];
      start.current = { x: touch.clientX, y: touch.clientY };
    },
    onTouchEnd: (event: TouchEvent) => {
      if (!start.current) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - start.current.x;
      const dy = touch.clientY - start.current.y;
      start.current = null;
      if (Math.abs(dx) < MIN_SWIPE_PX || Math.abs(dx) < Math.abs(dy)) return;
      (dx < 0 ? onSwipeLeft : onSwipeRight)?.();
    },
  };
}
