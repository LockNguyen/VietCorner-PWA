import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement> & { value: number; max: number };

const TRACK = "h-2 w-full overflow-hidden rounded-full bg-fill";
const BAR = "h-full rounded-full bg-action motion-safe:transition-[width]";

// How far along a series of steps someone is: a track that fills from the left.
export default function ProgressBar({ value, max, ...div }: Props) {
  return (
    <div {...div} role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} className={TRACK}>
      <div className={BAR} style={{ width: `${(100 * value) / max}%` }} />
    </div>
  );
}
