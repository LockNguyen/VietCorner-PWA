"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { nextTrail, pathOf, resumedTrail, type Trail } from "@/lib/navigation";
import { copyOf, keepPicture, keepPicturesOf, type ScreenPicture } from "@/lib/screenPictures";
import { SCREEN_ID } from "./PageSlide";

// What the navigation rules (src/lib/navigation.ts) need to remember: the trail of screens opened since the last
// main one, and where each screen was scrolled to. Once, in the root layout, which stays while screens change under
// it. The trail is kept on the phone (localStorage, the user, 2026-10-23), so a reload or a reopened app still goes
// back the way it came; scroll positions are in memory only: after a reload every screen starts at its top. It also
// keeps a picture of each screen left (src/lib/screenPictures.ts), for the swipe back to show under the screen.
//
// The phone's own back (the iPhone's swipe from the very edge, Android's back button) is the browser's back button,
// and it would walk into whatever the browser holds before the app: an older address, a page that cannot load (the
// user, 2026-10-23, from Home). So one spare history entry always sits on top of the screen. When the phone's back
// uses it up, the screen's own back step runs instead (`useBackGesture`, registered by PageHeader), the same as the
// arrow: the trail, Home from a main screen, nothing on Home; then a new spare goes on top.

type Navigation = {
  trail: Trail; // the screens opened since the last main one; the last is on show
  setBackGesture: (goBack: (() => void) | null) => void; // what the phone's own back does on this screen (PageHeader)
  stepBack: (href: string) => void; // the next screen, `href`, is a step back (the arrow, the swipe): pops the trail, lands where it was left
  restoreOnArrival: (href: string) => void; // the next screen, `href`, lands where it was left
};

const NavigationContext = createContext<Navigation>({
  trail: [],
  setBackGesture: () => {},
  stepBack: () => {},
  restoreOnArrival: () => {},
});

// The spare entry: the same address, marked, so the phone's back has something of the app's own to take.
function addSpareEntry() {
  history.pushState({ spare: true }, "", location.href);
}

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
  const lastTap = useRef<ScreenPicture | null>(null); // the screen as it was at the last tap, in case that tap left it
  const backGesture = useRef<(() => void) | null>(null); // the screen's own back step; none on Home

  useEffect(() => {
    const screen = document.getElementById(SCREEN_ID)!; // the screen scrolls in its own box (PageSlide)
    const remember = () => positions.current.set(previous.current, screen.scrollTop);
    // On the way down (capture), before the tap's own link or button changes the screen.
    const copy = () => (lastTap.current = copyOf(screen));
    screen.addEventListener("scroll", remember, { passive: true });
    document.addEventListener("click", copy, { capture: true });
    return () => {
      screen.removeEventListener("scroll", remember);
      document.removeEventListener("click", copy, { capture: true });
    };
  }, []);

  useEffect(() => {
    setTrail(resumedTrail(loadTrail(), location.pathname));
  }, []);

  // The phone's back took the spare entry: the screen's own back step instead (it brings a new spare with the next
  // screen, below), or on Home, where there is none, just a new spare. A moment later, not at once: Next.js answers
  // the same event by restoring the entry it landed on, which would cancel a step started alongside it (measured).
  useEffect(() => {
    const onPhoneBack = () => setTimeout(() => (backGesture.current ? backGesture.current() : addSpareEntry()));
    window.addEventListener("popstate", onPhoneBack);
    return () => window.removeEventListener("popstate", onPhoneBack);
  }, []);

  // A spare on top of every screen, the first one included: a move replaces the entry it lands on (the spare), so
  // each new screen needs its own.
  useEffect(() => {
    addSpareEntry();
  }, [pathname]);

  useEffect(() => {
    saveTrail(trail);
    keepPicturesOf([...trail, "/"]); // Home too: every main screen goes back to it
  }, [trail]);

  // A layout effect: the position is back before the screen is painted, so the slide shows it as it was left.
  // The links that restore pass `scroll={false}`, so Next.js does not move it to the top afterwards.
  useLayoutEffect(() => {
    if (previous.current === pathname) return; // the first screen: its trail is read from storage instead
    const from = previous.current;
    previous.current = pathname;
    const step = steppingBack.current === pathname ? "back" : "open";
    if (step === "open" && lastTap.current) keepPicture(from, lastTap.current); // the screen this tap left
    lastTap.current = null;
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
  const setBackGesture = useCallback((goBack: (() => void) | null) => {
    backGesture.current = goBack;
  }, []);
  const navigation = useMemo(
    () => ({ trail, setBackGesture, stepBack, restoreOnArrival }),
    [trail, setBackGesture, stepBack, restoreOnArrival],
  );

  return <NavigationContext value={navigation}>{children}</NavigationContext>;
}

export function useNavigation(): Navigation {
  return useContext(NavigationContext);
}

// Makes `goBack` what the phone's own back does while this screen is on show (none: the phone's back does nothing).
export function useBackGesture(goBack: (() => void) | null) {
  const { setBackGesture } = useNavigation();
  useEffect(() => {
    setBackGesture(goBack);
    return () => setBackGesture(null);
  }, [goBack, setBackGesture]);
}
