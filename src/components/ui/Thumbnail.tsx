import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLSpanElement> & { src?: string };

// The picture at the start of a row: `src` cropped to fill the tile, or, without one, a tinted tile
// holding its children (an icon or a few characters). Decorative: the row's title says what it is.
export default function Thumbnail({ src, children, ...tile }: Props) {
  return (
    <span
      {...tile}
      className="flex h-15 w-22 shrink-0 items-center justify-center overflow-hidden rounded-thumb bg-fill text-body font-semibold text-subtle"
    >
      {src ? <img src={src} alt="" loading="lazy" className="size-full object-cover" /> : children}
    </span>
  );
}
