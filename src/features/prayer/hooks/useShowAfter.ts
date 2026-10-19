"use client";

import { useEffect, useState } from "react";

// Becomes true once the screen has been open for `ms`: for something that should appear only to someone who
// stays (the bubble suggesting music).
export function useShowAfter(ms: number) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShown(true), ms);
    return () => clearTimeout(timer);
  }, [ms]);

  return shown;
}
