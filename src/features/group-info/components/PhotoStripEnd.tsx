"use client";

import Spinner from "@/components/ui/Spinner";
import { useWhenVisible } from "@/lib/useWhenVisible";

type Props = { onReached: () => void; loadedSoFar: number };

// Sits after the last picture of a strip while older ones exist. Scrolling it into view loads the next
// ones, so there is no "more" button to find. The strip removes it when the last picture has arrived.
export default function PhotoStripEnd({ onReached, loadedSoFar }: Props) {
  const marker = useWhenVisible<HTMLLIElement>(onReached, loadedSoFar);

  return (
    <li ref={marker} className="flex w-3/10 shrink-0 items-center justify-center">
      <Spinner />
    </li>
  );
}
