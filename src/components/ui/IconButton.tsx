import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  tone?: keyof typeof TONES;
  size?: keyof typeof SIZES;
};

const BASE =
  "inline-flex shrink-0 items-center justify-center rounded-full " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action disabled:opacity-50";
const TONES = {
  action: "text-action",
  filled: "bg-action text-on-action",
  danger: "bg-danger text-on-action",
} as const;
const SIZES = { regular: "size-touch", large: "size-20" } as const;

// A button shown as an icon alone. `label` is what a screen reader says where a sighted reader sees the icon.
export default function IconButton({ label, tone = "action", size = "regular", ...button }: Props) {
  return <button {...button} aria-label={label} className={`${BASE} ${TONES[tone]} ${SIZES[size]}`} />;
}
