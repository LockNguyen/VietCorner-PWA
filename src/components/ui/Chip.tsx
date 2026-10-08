import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { label: string; tone: keyof typeof TONES };

const BASE =
  "inline-flex size-touch shrink-0 items-center justify-center rounded-full border text-tile " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action";
const TONES = {
  pray: "border-pray bg-pray-soft text-pray",
  done: "border-success bg-success-soft text-success",
} as const;

// A round reaction beside a bubble: `pray` to give it, `done` once given. `label` is what a screen reader says.
export default function Chip({ label, tone, ...button }: Props) {
  return <button {...button} aria-label={label} className={`${BASE} ${TONES[tone]}`} />;
}
