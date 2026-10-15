import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLSpanElement>;

const BOX = "relative inline-flex size-3 shrink-0";
const RING = "absolute inset-0 rounded-full bg-success opacity-40 motion-safe:animate-ping";
const DOT = "relative inline-flex size-3 rounded-full bg-success ring-3 ring-success-soft";

// A small green dot with a light green circle pulsing out of it: something lively here. Decorative.
export default function LiveDot(span: Props) {
  return (
    <span aria-hidden {...span} className={BOX}>
      <span className={RING} />
      <span className={DOT} />
    </span>
  );
}
