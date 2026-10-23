"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
// Type only, gone at runtime: `router.prefetch` requires a `kind`, and Next.js does not export its type publicly.
import type { PrefetchKind } from "next/dist/client/components/router-reducer/router-reducer-types";

// "full": the whole page, its data too. Without it a page is loaded only up to its grey loading rows.
const WHOLE_PAGE = "full" as PrefetchKind;

// Loads these screens in the background, whole, so that opening one shows it at once instead of the grey loading
// rows (the user, 2026-10-22: the main screens only, not the rarely used ones). Next.js keeps such a copy for
// `staleTimes` (next.config.ts) and then, at the tap, waits on the network for a new one; so each is loaded again
// whenever the screen changes and whenever the app comes back to the foreground (a phone put away overnight), and a
// tap finds a fresh copy. No timer: a check sends nothing while the copy is fresh (measured 2026-10-22), and these
// two moments are when a tap can follow. Production only: the dev server never loads ahead.
export function useLoadAhead(hrefs: string[]) {
  const router = useRouter();
  const pathname = usePathname();
  const key = hrefs.join(" "); // a new list of addresses, not a new array, starts it over

  useEffect(() => {
    const loadAll = () => {
      if (document.visibilityState !== "visible") return; // put away: nothing to show, nothing to load
      for (const href of key.split(" ")) router.prefetch(href, { kind: WHOLE_PAGE });
    };
    loadAll(); // on opening, and again at every change of screen (`pathname`)
    document.addEventListener("visibilitychange", loadAll);
    return () => document.removeEventListener("visibilitychange", loadAll);
  }, [key, router, pathname]);
}
