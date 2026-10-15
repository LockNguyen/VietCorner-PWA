"use client";

import { useEffect, useRef, useState } from "react";

// why: vaul's own slide-out time (its TRANSITIONS.DURATION). The sheet stays on screen this long, closing.
const SLIDE_OUT_MS = 500;

// A sheet that slides away before it is gone. However it is closed (the X, a swipe down, a tap outside,
// Escape, or the caller when an action is done), it slides out first, and only then does the caller's
// `onClose` run (which stops rendering it). Timed here because vaul reports the end of a slide only for the
// closes it starts itself, not for the X (found 2026-10-14: the sheet would not open a second time).
export function useClosingSheet(onClose: () => void) {
  const [open, setOpen] = useState(true);
  const latestOnClose = useRef(onClose);
  useEffect(() => {
    latestOnClose.current = onClose;
  });

  useEffect(() => {
    if (open) return;
    const timer = setTimeout(() => latestOnClose.current(), SLIDE_OUT_MS);
    return () => clearTimeout(timer);
  }, [open]);

  return { open, close: () => setOpen(false) };
}
