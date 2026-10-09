"use client";

import { useEffect, useState } from "react";

// What a list shows: first what the page loaded (so it appears at once, even from a kept copy of the page),
// then a fresh read swapped in quietly on arrival and whenever the app returns to the foreground.
//
//   const events = useFresh(initialEvents, getSchedule);   // getSchedule: the same read, from api.ts
//
// Why here and not `router.refresh()`: that reload throws away every kept page, not only this one
// (measured 2026-10-09), so the next tab would wait again. `read` must not change between renders.
export function useFresh<Value>(loaded: Value, read: () => Promise<Value>): Value {
  const [value, setValue] = useState(loaded);

  // The page loaded again (after a save): what it brought is newer than anything held here.
  const [adopted, setAdopted] = useState(loaded);
  if (loaded !== adopted) {
    setAdopted(loaded);
    setValue(loaded);
  }

  useEffect(() => {
    let left = false;

    function refresh() {
      read()
        .then((fresh) => {
          if (!left) setValue(fresh);
        })
        .catch(() => {}); // offline or a hiccup: what is on screen stays, and the next arrival tries again
    }
    function refreshIfVisible() {
      if (document.visibilityState === "visible") refresh();
    }

    refresh();
    document.addEventListener("visibilitychange", refreshIfVisible);
    return () => {
      left = true;
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [read]);

  return value;
}
