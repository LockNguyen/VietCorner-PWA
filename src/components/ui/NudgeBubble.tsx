import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement>;

const BOX = "pointer-events-none absolute top-full right-0 z-10 w-max max-w-60 pt-2 motion-safe:animate-fade-in";
const BUBBLE = "relative rounded-bubble bg-action px-4 py-2 text-body text-on-action motion-safe:animate-nudge";
const TAIL = "absolute -top-1 right-4 size-3 rotate-45 bg-action";

// A small speech bubble under a button, its tail pointing up at it: it fades in, then sways gently sideways
// to draw the eye. Put it in a `relative` box around the button. It never takes a tap: the button does.
export default function NudgeBubble({ children, ...box }: Props) {
  return (
    <div {...box} role="status" className={BOX}>
      <div className={BUBBLE}>
        <span aria-hidden className={TAIL} />
        <span className="relative">{children}</span>
      </div>
    </div>
  );
}
