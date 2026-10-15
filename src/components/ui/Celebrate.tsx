import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLSpanElement> & { burst: string }; // burst: the few characters that float up ("+1")

const BOX = "relative inline-flex shrink-0";
const CHILD = "inline-flex motion-safe:animate-pop";
const RING = "pointer-events-none absolute inset-0 rounded-full border-2 border-pray motion-safe:animate-ring motion-reduce:hidden";
const BURST =
  "pointer-events-none absolute inset-x-0 -top-1 text-center text-small font-semibold text-pray " +
  "motion-safe:animate-float motion-reduce:hidden";

// A moment of thanks around whatever it wraps (the Pray chip's tick): it pops in, a ring spreads out of it and
// fades, and `burst` floats up and fades. Plays once, when rendered. With reduced motion only the child shows.
export default function Celebrate({ burst, children, ...span }: Props) {
  return (
    <span {...span} className={BOX}>
      <span className={CHILD}>{children}</span>
      <span aria-hidden className={RING} />
      <span aria-hidden className={BURST}>
        {burst}
      </span>
    </span>
  );
}
