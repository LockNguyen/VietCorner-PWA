"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { isStepAside, pathOf, sectionOf, type Aside } from "@/lib/navigation";
import { SCREEN_ID } from "./PageSlide";

// What the navigation rules (src/lib/navigation.ts) need to remember while the app is open: the current step
// aside (which screen was opened from where), and where each screen was scrolled to. Once, in the root layout, which stays while screens
// change under it. In memory only: after a reload every screen starts at its top, which is what a reload means.

type Navigation = {
  aside: Aside | null; // the screen opened from another section, and where from (a group's page from Events)
  restoreOnArrival: (href: string) => void; // the next screen, `href`, lands where it was left
};

const NavigationContext = createContext<Navigation>({ aside: null, restoreOnArrival: () => {} });

export function NavigationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [aside, setAside] = useState<Aside | null>(null);
  const previous = useRef(pathname); // the screen before this one
  const positions = useRef(new Map<string, number>()); // the last scroll position of each screen, by path
  const restoring = useRef<string | null>(null); // the screen a back step is on its way to

  useEffect(() => {
    const screen = document.getElementById(SCREEN_ID)!; // the screen scrolls in its own box (PageSlide)
    const remember = () => positions.current.set(previous.current, screen.scrollTop);
    // The phone's or browser's own back (Android's back button) lands the screen where it was left too.
    const onHistoryBack = () => (restoring.current = pathOf(location.pathname));
    screen.addEventListener("scroll", remember, { passive: true });
    window.addEventListener("popstate", onHistoryBack);
    return () => {
      screen.removeEventListener("scroll", remember);
      window.removeEventListener("popstate", onHistoryBack);
    };
  }, []);

  // A layout effect: the position is back before the screen is painted, so the slide shows it as it was left.
  // The links that restore pass `scroll={false}`, so Next.js does not move it to the top afterwards.
  useLayoutEffect(() => {
    const from = previous.current;
    previous.current = pathname;
    // A step aside starts here; it lasts while the screens stay in its section (deeper in a detour), and ends when
    // they leave it.
    if (isStepAside(from, pathname)) setAside({ from, to: pathname });
    else setAside((current) => (current && sectionOf(pathname) === sectionOf(current.to) ? current : null));
    if (restoring.current !== pathname) return;
    restoring.current = null;
    document.getElementById(SCREEN_ID)?.scrollTo(0, positions.current.get(pathname) ?? 0);
  }, [pathname]);

  const restoreOnArrival = useCallback((href: string) => {
    restoring.current = pathOf(href);
  }, []);
  const navigation = useMemo(() => ({ aside, restoreOnArrival }), [aside, restoreOnArrival]);

  return <NavigationContext value={navigation}>{children}</NavigationContext>;
}

export function useNavigation(): Navigation {
  return useContext(NavigationContext);
}
