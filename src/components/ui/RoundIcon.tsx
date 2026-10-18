import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLSpanElement>;

const BASE = "inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-fill text-small font-semibold text-ink";

// An icon (or a short word) in a light grey circle, the way the iPhone draws its toolbar buttons, so an
// instruction can show the very button to look for. Decorative: the words beside it say what to tap.
export default function RoundIcon({ children, ...span }: Props) {
  return (
    <span aria-hidden {...span} className={BASE}>
      {children}
    </span>
  );
}
