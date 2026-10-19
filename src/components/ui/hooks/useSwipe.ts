"use client";

import { useEffect, useRef, useState, type TouchEvent } from "react";

// why each number: as in the iPhone's Photos app, the picture follows the thumb, then either slides away or
// springs back. A slow drag must pass DISTANCE_PX; a quick flick counts after a short move.
const DISTANCE_PX = 60;
const FLICK_PX_PER_MS = 0.5;
const FLICK_MIN_PX = 20;
const DECIDE_PX = 8; // moved this far, the gesture is sideways (a swipe) or up and down (left alone)
const SLIDE_MS = 250; // one slide, out or in; the class Lightbox puts on the picture lasts the same
const PAINT_MS = 30; // lets the phone draw the new picture off screen before it slides in
const EDGE_RESISTANCE = 0.3; // nothing more that way: the picture moves a third as far, like a rubber band

type Start = { x: number; y: number; at: number };

// A sideways swipe that drags what it moves. `offset` is how far (in px) to move it now; `sliding` says the
// move should be animated (after the thumb lets go) rather than follow the thumb. A swipe left calls
// `onSwipeLeft` once the old picture has slid away, then the new one slides in from the other side.
export function useSwipe(onSwipeLeft?: () => void, onSwipeRight?: () => void) {
  const [offset, setOffset] = useState(0);
  const [sliding, setSliding] = useState(false);
  const start = useRef<Start | null>(null);
  const sideways = useRef<boolean | null>(null); // null until DECIDE_PX
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((timer) => clearTimeout(timer)), []);
  const later = (act: () => void, ms: number) => timers.current.push(window.setTimeout(act, ms));
  const slideTo = (x: number) => {
    setSliding(true);
    setOffset(x);
    later(() => setSliding(false), SLIDE_MS);
  };

  function onTouchStart(event: TouchEvent) {
    if (sliding) return; // the last slide is still running
    const touch = event.touches[0];
    start.current = { x: touch.clientX, y: touch.clientY, at: event.timeStamp };
    sideways.current = null;
  }

  function onTouchMove(event: TouchEvent) {
    if (!start.current) return;
    const touch = event.touches[0];
    const dx = touch.clientX - start.current.x;
    const dy = touch.clientY - start.current.y;
    if (sideways.current === null && Math.max(Math.abs(dx), Math.abs(dy)) > DECIDE_PX) {
      sideways.current = Math.abs(dx) > Math.abs(dy);
    }
    if (!sideways.current) return;
    const more = dx < 0 ? onSwipeLeft : onSwipeRight;
    setOffset(more ? dx : dx * EDGE_RESISTANCE);
  }

  function onTouchEnd(event: TouchEvent) {
    if (!start.current) return;
    const dx = event.changedTouches[0].clientX - start.current.x;
    const quick = Math.abs(dx) / Math.max(1, event.timeStamp - start.current.at) > FLICK_PX_PER_MS;
    const wasSideways = sideways.current;
    start.current = null;
    sideways.current = null;
    if (!wasSideways) return;

    const go = dx < 0 ? onSwipeLeft : onSwipeRight;
    const far = Math.abs(dx) > DISTANCE_PX || (quick && Math.abs(dx) > FLICK_MIN_PX);
    if (!go || !far) return slideTo(0); // spring back

    const away = (dx < 0 ? -1 : 1) * window.innerWidth;
    slideTo(away);
    later(() => {
      go();
      setSliding(false);
      setOffset(-away); // the new picture waits just off the other side
      later(() => slideTo(0), PAINT_MS);
    }, SLIDE_MS);
  }

  return { offset, sliding, handlers: { onTouchStart, onTouchMove, onTouchEnd } };
}
