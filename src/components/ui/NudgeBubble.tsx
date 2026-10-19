import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement>;

// The box fades in; the bubble inside sways. Two boxes, because one element runs one animation at a time.
// As wide as its words, at the row's right end, white space on its left (the user, 2026-10-19). A "\n" in the
// text breaks the line (`whitespace-pre-line`), so the caller decides the lines; more than 2 overflow the toolbar.
const BOX = "pointer-events-none flex min-w-0 flex-1 justify-end motion-safe:animate-fade-in";
const BUBBLE = "relative w-max max-w-full whitespace-pre-line rounded-bubble bg-action px-4 py-1.5 text-small text-on-action motion-safe:animate-nudge";
const TAIL = "absolute top-1/2 -right-1 size-3 -translate-y-1/2 rotate-45 bg-action";

// A small speech bubble in a row, just left of a button, its tail pointing right at it: it fades in,
// then sways towards the button to draw the eye. It never takes a tap: the button does.
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
