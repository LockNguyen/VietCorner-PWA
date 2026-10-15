import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLSpanElement> & { label: string }; // label: what a screen reader says ("3 prayers")

const BASE = "inline-flex h-8 shrink-0 items-center gap-1 rounded-full bg-fill px-3 text-small font-semibold text-subtle";

// A small grey pill beside a bubble with a number and an icon in it ("3 🙏"): the height and grey of the
// small `Chip`, so the two sit level side by side. Not a button: it only says.
export default function CountPill({ label, children, ...span }: Props) {
  return (
    <span role="img" aria-label={label} {...span} className={BASE}>
      {children}
    </span>
  );
}
