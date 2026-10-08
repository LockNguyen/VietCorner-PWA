"use client";

import { useEffect, useRef } from "react";

// Keeps the newest message in view, like any chat: put the returned ref on an empty element after the
// last message, and the page scrolls to it whenever `whenThisChanges` does.
export function useScrollToEnd(whenThisChanges: unknown) {
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView();
  }, [whenThisChanges]);

  return end;
}
