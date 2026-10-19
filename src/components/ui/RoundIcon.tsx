import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLSpanElement> & {
  tone?: keyof typeof TONES;
  size?: keyof typeof SIZES;
};

const BASE = "inline-flex shrink-0 items-center justify-center rounded-full text-small font-semibold";
const TONES = {
  fill: "bg-fill text-ink",
  // White on a colour: the icon at the start of a Settings row, the way Messenger colours its own (2026-10-19).
  action: "bg-action text-on-action",
  pray: "bg-pray text-on-action",
  caution: "bg-caution text-on-action",
  success: "bg-success text-on-action",
  subtle: "bg-subtle text-on-action",
} as const;
const SIZES = { regular: "size-12", small: "size-9 *:size-5" } as const;

// An icon (or a short word) in a circle: grey, the way the iPhone draws its toolbar buttons, so an instruction
// can show the very button to look for; or coloured, at the start of a Settings row. Decorative: words say what it is.
export default function RoundIcon({ tone = "fill", size = "regular", children, ...span }: Props) {
  return (
    <span aria-hidden {...span} className={`${BASE} ${TONES[tone]} ${SIZES[size]}`}>
      {children}
    </span>
  );
}
