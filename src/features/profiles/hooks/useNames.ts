"use client";

import { useEffect, useState } from "react";
import { getNames } from "../api";
import type { Names } from "../types";

// The names of the people on a screen that keeps receiving new ones (a chat).
// Starts with what the page loaded, and fetches whoever turns up afterwards, once.
export function useNames(userIds: string[], initial: Names): Names {
  const [names, setNames] = useState(initial);
  // A string, so the effect below runs when the set of unknown people changes, not on every render.
  const unknown = [...new Set(userIds)].filter((id) => !(id in names)).join(",");

  useEffect(() => {
    if (unknown === "") return;
    let left = false;
    getNames(unknown.split(","))
      .then((found) => {
        if (!left) setNames((current) => ({ ...current, ...found }));
      })
      .catch(() => {}); // harmless: the message shows without a name until the next visit
    return () => {
      left = true;
    };
  }, [unknown]);

  return names;
}
