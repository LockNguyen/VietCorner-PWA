"use client";

import { useEffect, useRef, useState } from "react";

// A paragraph that shows a few lines until the reader asks for the rest.
//
// Whether there IS a rest is measured, not guessed: once the browser has laid the paragraph out, its full
// height (`scrollHeight`) is compared with the height it was clamped to (`clientHeight`). Counting
// characters would be wrong on every screen width but one.
export function useExpandableText<T extends HTMLElement>(text: string) {
  const paragraph = useRef<T>(null);
  const [expanded, setExpanded] = useState(false);
  const [isClipped, setIsClipped] = useState(false);

  // Measured only while collapsed: an expanded paragraph hides nothing, which would read as "nothing to
  // expand" and take the "less" link away. Runs again when the text is edited.
  useEffect(() => {
    const element = paragraph.current;
    if (element && !expanded) setIsClipped(element.scrollHeight > element.clientHeight);
  }, [text, expanded]);

  return { paragraph, expanded, isClipped, toggle: () => setExpanded(!expanded) };
}
