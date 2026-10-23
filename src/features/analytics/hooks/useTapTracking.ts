"use client";

import { useEffect, useRef } from "react";
import { record } from "../queue";

export type Tap = { label: string; href: string | null; at: number };

// What counts as a tap on something: the app's controls are links, buttons, switches and labels.
const TAPPABLE = "a, button, [role='button'], [role='switch'], label, summary";

// What a person would call the thing: its screen-reader name, else its words, shortened.
function labelOf(element: Element): string {
  const words = element.getAttribute("aria-label") ?? element.textContent ?? "";
  return words.replace(/\s+/g, " ").trim().slice(0, 80) || element.tagName.toLowerCase();
}

// The screen a link opens, when it is one of ours.
function hrefOf(element: Element): string | null {
  if (!(element instanceof HTMLAnchorElement)) return null;
  const url = new URL(element.href);
  return url.origin === location.origin ? url.pathname : null;
}

// Records every tap on a control, and keeps the last one so the next screen can say what opened it. A control
// marked with `data-action="<name>"` (Pray, the music's buttons) is recorded as that `action` instead of a click, so
// its uses can be counted whatever its words say at the time (the user, 2026-10-22: how much people pray).
// Listens while capturing, so a control that stops the click from bubbling is still seen. Typed text is never read.
export function useTapTracking() {
  const lastTap = useRef<Tap | null>(null);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const element = event.target instanceof Element ? event.target.closest(TAPPABLE) : null;
      if (!element) return;
      const tap = { label: labelOf(element), href: hrefOf(element), at: performance.now() };
      lastTap.current = tap;
      const action = element.getAttribute("data-action");
      if (action) record("action", { target: action });
      else record("click", { target: tap.label, detail: tap.href ? { href: tap.href } : {} });
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return lastTap;
}
