import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLElement> & {
  as?: "p" | "span" | "h1" | "h2" | "h3";
  variant?: keyof typeof VARIANTS;
  tone?: keyof typeof TONES;
};

const VARIANTS = {
  tile: "text-tile font-bold",
  body: "text-body",
  small: "text-small",
} as const;
const TONES = { ink: "text-ink", subtle: "text-subtle", danger: "text-danger" } as const;

// Any text outside a control. `as` picks the element's meaning; `variant` and `tone` pick its look.
export default function Text({ as: Element = "p", variant = "body", tone = "ink", ...text }: Props) {
  return <Element {...text} className={`${VARIANTS[variant]} ${TONES[tone]}`} />;
}
