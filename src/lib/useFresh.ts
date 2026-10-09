"use client";

import { useState } from "react";
import { useOnArrival } from "./useOnArrival";

// What a list shows: first what the page loaded (so it appears at once, even from a kept copy of the page),
// then a fresh read swapped in quietly on arrival and on return to the app. Why not a reload: src/lib/README.md.
//
//   const events = useFresh(initialEvents, getSchedule);   // getSchedule: the same read, from api.ts
export function useFresh<Value>(loaded: Value, read: () => Promise<Value>): Value {
  const [value, setValue] = useState(loaded);

  // The page loaded again (after a save): what it brought is newer than anything held here.
  const [adopted, setAdopted] = useState(loaded);
  if (loaded !== adopted) {
    setAdopted(loaded);
    setValue(loaded);
  }

  useOnArrival(() => {
    read()
      .then(setValue)
      .catch(() => {}); // offline or a hiccup: what is on screen stays, and the next arrival tries again
  });

  return value;
}
