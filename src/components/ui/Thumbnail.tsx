import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLSpanElement>;

// The picture at the start of a row. Until photos exist (B32): a tinted tile holding an icon or a few characters.
export default function Thumbnail(tile: Props) {
  return (
    <span
      {...tile}
      className="flex h-15 w-22 shrink-0 items-center justify-center rounded-thumb bg-fill text-body font-semibold text-subtle"
    />
  );
}
