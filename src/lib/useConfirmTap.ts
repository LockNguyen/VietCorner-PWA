"use client";

import { useEffect, useState } from "react";

// why: long enough to read the new words and tap again, short enough that a stray tap later does nothing.
const ARMED_MS = 4000;

// "Tap again to confirm", without a pop-up: the first tap arms the button (its words change), the second,
// within a few seconds, does it. For what cannot be undone from the app, written as a small red line.
//
//   const { armed, tap } = useConfirmTap(removeGroup);
//   <Button variant="dangerText" onClick={tap}>{armed ? t(COMMON.tapAgain) : t(STRINGS.remove)}</Button>
export function useConfirmTap(action: () => void | Promise<unknown>) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), ARMED_MS);
    return () => clearTimeout(timer);
  }, [armed]);

  function tap() {
    if (!armed) return setArmed(true);
    setArmed(false);
    return action();
  }

  return { armed, tap };
}
