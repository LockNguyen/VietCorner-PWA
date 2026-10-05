"use client";

import { useEffect, useRef } from "react";

// Calls `onVisible` when the element holding the returned ref scrolls into view. Used for "load more when
// the reader reaches the bottom": the marker at the end of the list becomes visible, the next page loads.
//
// `watchAgainAfter` restarts the watching whenever it changes. Without it, a page too short to push the
// marker off screen would leave it visible, and "became visible" would never happen a second time.
export function useWhenVisible<T extends Element>(onVisible: () => void, watchAgainAfter: unknown) {
  const element = useRef<T>(null);
  // The newest callback, so the observer below never calls one that captured an older list.
  const latest = useRef(onVisible);
  useEffect(() => {
    latest.current = onVisible;
  });

  useEffect(() => {
    if (!element.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) latest.current();
    });
    observer.observe(element.current);
    return () => observer.disconnect();
  }, [watchAgainAfter]);

  return element;
}
