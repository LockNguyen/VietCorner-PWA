"use client";

import { useEffect, useState } from "react";
import { useOnArrival } from "./useOnArrival";

// The newest value each list has shown, by the function that reads it. It outlives leaving a screen and
// coming back; a full page load (signing out) empties it. Why it is needed: src/lib/README.md.
const lastShown = new WeakMap<() => Promise<unknown>, unknown>();

// What a list shows: at once, the newest thing known (what it last showed, else what the page loaded), then
// a fresh read swapped in quietly on arrival and on return to the app. Why not a reload: src/lib/README.md.
//
//   const events = useFresh(initialEvents, getSchedule);   // getSchedule: the same read, from api.ts
export function useFresh<Value>(loaded: Value, read: () => Promise<Value>): Value {
  const [value, setValue] = useState(() => (lastShown.has(read) ? (lastShown.get(read) as Value) : loaded));

  // The page loaded again while on screen (after a save): what it brought is newer than anything held here.
  const [adopted, setAdopted] = useState(loaded);
  if (loaded !== adopted) {
    setAdopted(loaded);
    setValue(loaded);
  }

  useEffect(() => {
    lastShown.set(read, value);
  }, [read, value]);

  useOnArrival(() => {
    read()
      .then(setValue)
      .catch(() => {}); // offline or a hiccup: what is on screen stays, and the next arrival tries again
  });

  return value;
}
