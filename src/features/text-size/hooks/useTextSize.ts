"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TEXT_SIZE_COOKIE, type TextSize } from "../types";

// why: the longest a browser keeps a cookie (400 days); choosing again renews it.
const KEEP_SECONDS = 400 * 24 * 60 * 60;

// The text size of this phone, and changing it. The change shows at once (the `data-text-size` the root
// layout puts on <html>, which globals.css reads), is kept in a cookie for the next visit, and reloads the
// page's server parts so the tab bar can shorten its labels (src/components/AppTabs.tsx).
export function useTextSize() {
  const router = useRouter();
  const [size, setSize] = useState<TextSize>("compact");
  // Read after the first draw, which must match the server's (it cannot see the page).
  useEffect(() => {
    if (document.documentElement.dataset.textSize === "big") setSize("big");
  }, []);

  function choose(next: TextSize) {
    document.cookie = `${TEXT_SIZE_COOKIE}=${next}; path=/; max-age=${KEEP_SECONDS}; samesite=lax`;
    document.documentElement.dataset.textSize = next;
    setSize(next);
    router.refresh();
  }

  return { size, choose };
}
