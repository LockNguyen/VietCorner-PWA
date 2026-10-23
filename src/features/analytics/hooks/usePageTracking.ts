"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, type RefObject } from "react";
import { record, sendAll, startNewVisit } from "../queue";
import { NEW_VISIT_AFTER_MS, TAP_OPENS_WITHIN_MS, type Usage } from "../types";
import type { Tap } from "./useTapTracking";

// The screen on show: since when, and how the person got there.
type Shown = { path: string; since: number; from: string | null; via: string | null; waitMs: number | null; resumed: boolean };

// Records each screen once it is left or the app is put away: how long it was on show, the screen before,
// the tap that opened it and how long that took, and what it asked of each service (`takeUsage`).
export function usePageTracking(lastTap: RefObject<Tap | null>, takeUsage: () => Usage) {
  const path = usePathname();
  const shown = useRef<Shown | null>(null);
  const hiddenAt = useRef(0);

  function recordShown() {
    const screen = shown.current;
    if (!screen) return;
    const detail: Record<string, unknown> = { usage: takeUsage() };
    if (screen.from) detail.from = screen.from;
    if (screen.via) detail.via = screen.via;
    if (screen.waitMs !== null) detail.wait_ms = Math.round(screen.waitMs);
    if (screen.resumed) detail.resumed = true;
    record("page", { path: screen.path, ms: performance.now() - screen.since, detail });
  }

  // A new screen. The first one's wait is the app's start (the clock starts at the page load); a later one's
  // is the tap that opened it, if it opened it (a link to this screen, or any control just before).
  useEffect(() => {
    const previous = shown.current;
    if (previous?.path === path) return; // React runs effects twice in development
    recordShown();
    const now = performance.now();
    const tap = lastTap.current;
    const opened = tap && now - tap.at < TAP_OPENS_WITHIN_MS && (tap.href === null || tap.href === path) ? tap : null;
    lastTap.current = null;
    shown.current = {
      path,
      since: now,
      from: previous?.path ?? null,
      via: opened?.label ?? null,
      waitMs: opened ? now - opened.at : previous ? null : now,
      resumed: false,
    };
  }, [path, lastTap]);

  // Put away: the screen's time so far is recorded and everything is sent, because the app may never come
  // back. Back: the same screen goes on, as a new visit after a long while away.
  useEffect(() => {
    function onVisibilityChange() {
      const now = performance.now();
      if (document.visibilityState === "hidden") {
        recordShown();
        shown.current = null;
        hiddenAt.current = now;
        sendAll();
        return;
      }
      if (now - hiddenAt.current > NEW_VISIT_AFTER_MS) startNewVisit();
      shown.current = { path: location.pathname, since: now, from: null, via: null, waitMs: null, resumed: true };
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);
}
