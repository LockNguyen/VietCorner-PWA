import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  tone: keyof typeof TONES;
  size?: keyof typeof SIZES;
};

const BASE =
  "inline-flex shrink-0 items-center justify-center rounded-full border text-tile " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action";
const TONES = {
  pray: "border-pray bg-pray-soft text-pray",
  done: "border-success bg-success-soft text-success",
  quiet: "border-fill bg-fill text-subtle",
} as const;
const SIZES = { regular: "size-touch", small: "size-8" } as const;

// A round button beside a bubble: `pray` to give a prayer, `done` once given, `quiet` for the author's own.
// `label` is what a screen reader says in place of the icon.
export default function Chip({ label, tone, size = "regular", ...button }: Props) {
  return <button {...button} aria-label={label} className={`${BASE} ${TONES[tone]} ${SIZES[size]}`} />;
}
