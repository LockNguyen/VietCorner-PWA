import Link from "next/link";
import type { ComponentProps } from "react";

type Props = ComponentProps<typeof Link> & { title: string; src?: string };

// A large tile that opens an area of the app. Its children are the artwork above the title.
// With `src`, a photo fills the tile under a dark veil, so the white artwork and title stay readable on
// any photo; without one, a flat grey.
export default function PhotoTile({ title, src, children, ...link }: Props) {
  return (
    <Link
      {...link}
      className="relative flex h-30 flex-col items-center justify-center gap-2 overflow-hidden rounded-thumb bg-subtle text-on-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
    >
      {src && (
        <>
          <img src={src} alt="" className="absolute inset-0 size-full object-cover" />
          <span aria-hidden className="absolute inset-0 bg-ink/45" />
        </>
      )}
      <span className="relative flex flex-col items-center gap-2">
        {children}
        <span className="text-tile font-bold">{title}</span>
      </span>
    </Link>
  );
}
