"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

export type BannerKind = "success" | "error";
export type Banner = { id: number; kind: BannerKind; message: string };
type NewBanner = { kind: BannerKind; message: string; seconds?: number };

// why: "Saved" needs a glance; an error has to be read, and one that vanishes mid-sentence is worse than one that lingers.
const SECONDS: Record<BannerKind, number> = { success: 2, error: 8 };

// Two contexts, so a component that only raises banners is not redrawn each time the list changes.
const ShowBanner = createContext<(banner: NewBanner) => void>(() => {});
const Banners = createContext<{ banners: Banner[]; dismiss: (id: number) => void }>({ banners: [], dismiss: () => {} });

// Holds the banners on screen and takes each one away when its time is up. Wraps the whole app, once.
export function BannerProvider({ children }: { children: ReactNode }) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setBanners((current) => current.filter((banner) => banner.id !== id));
  }, []);

  const show = useCallback(
    ({ kind, message, seconds = SECONDS[kind] }: NewBanner) => {
      const id = nextId.current++;
      setBanners((current) => [...current, { id, kind, message }]);
      timers.current.set(id, setTimeout(() => dismiss(id), seconds * 1000));
    },
    [dismiss],
  );

  // Leaving the app's shell cancels what is still counting down.
  useEffect(() => {
    const running = timers.current;
    return () => running.forEach(clearTimeout);
  }, []);

  return (
    <ShowBanner value={show}>
      <Banners value={{ banners, dismiss }}>{children}</Banners>
    </ShowBanner>
  );
}

// Raises a banner: `showBanner({ kind: "error", message })`. `seconds` overrides how long it stays.
export function useBanner() {
  return useContext(ShowBanner);
}

// The banners on screen and how to put one away. For the one component that draws them.
export function useBanners() {
  return useContext(Banners);
}
