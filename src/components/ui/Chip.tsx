import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { tone?: keyof typeof TONES };

const BASE =
  "inline-flex min-h-8 items-center rounded-full border bg-surface px-3 text-small whitespace-nowrap " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action";
const TONES = { idle: "border-line text-ink", done: "border-action text-action" } as const;

// A small pill button that hangs on the corner of a bubble: a reaction to it. `done` once it was given.
export default function Chip({ tone = "idle", ...button }: Props) {
  return <button {...button} className={`${BASE} ${TONES[tone]}`} />;
}
