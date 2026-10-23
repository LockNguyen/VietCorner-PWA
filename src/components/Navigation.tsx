"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { nextTrail, pathOf, resumedTrail, type Trail } from "@/lib/navigation";
import { SCREEN_ID } from "./PageSlide";

// What the navigation rules (src/lib/navigation.ts) need to remember: the trail of screens opened since the last
// main one, and where each screen was scrolled to. Once, in the root layout, which stays while screens change under
// it. The trail is kept on the phone (localStorage, the user, 2026-10-23), so a reload or a reopened app still goes
// back the way it came; scroll positions are in memory only: after a reload every screen starts at its top.

type Navigation = {
  trail: Trail; // the screens opened since the last main one; the last is on show
  stepBack: (href: string) => void; // the next screen, `href`, is a step back: it pops the trail, lands where it was left
  restoreOnArrival: (href: string) => void; // the next screen, `href`, lands where it was left
};

const NavigationContext = createContext<Navigation>({ trail: [], stepBack: () => {}, restoreOnArrival: () => {} });

const TRAIL_KEY = "navigation-trail";

// Both wrapped: storage can be missing or refused (a private window), and the app must work the same without it.
function loadTrail(): Trail {
  try {
    const kept = JSON.parse(localStorage.getItem(TRAIL_KEY) ?? "[]");
    return Array.isArray(kept) && kept.every((path) => typeof path === "string") ? kept : [];
  } catch {
    return [];
  }
}

function saveTrail(trail: Trail) {
  try {
    localStorage.setItem(TRAIL_KEY, JSON.stringify(trail));
  } catch {
    // Not kept: the back arrows still work until the app is closed.
  }
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // The first screen alone until the kept trail is read after the first paint: the server cannot read it, and the
  // first paint must match what the server drew.
  const [trail, setTrail] = useState<Trail>(() => nextTrail([], pathname, "open"));
  const previous = useRef(pathname); // the screen before this one
  const steppingBack = useRef<string | null>(null); // the screen a back step is on its way to
  const positions = useRef(new Map<string, number>()); // the last scroll position of each screen, by path
  const restoring = useRef<string | null>(null); // the screen a back step is on its way to

  useEffect(() => {
    const screen = document.getElementById(SCREEN_ID)!; // the screen scrolls in its own box (PageSlide)
    const remember = () => positions.current.set(previous.current, screen.scrollTop);
    // The phone's or browser's own back (Android's back button) is a step back too, landing where it was left.
    const onHistoryBack = () => (restoring.current = steppingBack.current = pathOf(location.pathname));
    screen.addEventListener("scroll", remember, { passive: true });
    window.addEventListener("popstate", onHistoryBack);
    return () => {
      screen.removeEventListener("scroll", remember);
      window.removeEventListener("popstate", onHistoryBack);
    };
  }, []);

  useEffect(() => {
    setTrail(resumedTrail(loadTrail(), location.pathname));
  }, []);

  useEffect(() => {
    saveTrail(trail);
  }, [trail]);

  // A layout effect: the position is back before the screen is painted, so the slide shows it as it was left.
  // The links that restore pass `scroll={false}`, so Next.js does not move it to the top afterwards.
  useLayoutEffect(() => {
    if (previous.current === pathname) return; // the first screen: its trail is read from storage instead
    previous.current = pathname;
    const step = steppingBack.current === pathname ? "back" : "open";
    steppingBack.current = null;
    setTrail((current) => nextTrail(current, pathname, step));
    if (restoring.current !== pathname) return;
    restoring.current = null;
    document.getElementById(SCREEN_ID)?.scrollTo(0, positions.current.get(pathname) ?? 0);
  }, [pathname]);

  const restoreOnArrival = useCallback((href: string) => {
    restoring.current = pathOf(href);
  }, []);
  const stepBack = useCallback((href: string) => {
    restoring.current = steppingBack.current = pathOf(href);
  }, []);
  const navigation = useMemo(() => ({ trail, stepBack, restoreOnArrival }), [trail, stepBack, restoreOnArrival]);

  return <NavigationContext value={navigation}>{children}</NavigationContext>;
}

export function useNavigation(): Navigation {
  return useContext(NavigationContext);
}
