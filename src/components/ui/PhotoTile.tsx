import Link from "next/link";
import type { ComponentProps } from "react";

type Props = ComponentProps<typeof Link> & { title: string };

// A large tile that opens an area of the app. Its children are the artwork above the title.
// A flat grey stands in for the photo until photos exist (backlog B32).
export default function PhotoTile({ title, children, ...link }: Props) {
  return (
    <Link
      {...link}
      className="flex h-30 flex-col items-center justify-center gap-2 rounded-thumb bg-subtle text-on-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
    >
      {children}
      <span className="text-tile font-bold">{title}</span>
    </Link>
  );
}
