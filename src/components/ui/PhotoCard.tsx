import Link from "next/link";
import type { ComponentProps } from "react";

type Props = ComponentProps<typeof Link> & {
  src: string;
  title: string;
  subtitle: string; // the line read first after the title: when
  details: string[]; // the quieter lines under it: where, whom to call
};

const CARD =
  "relative flex min-h-44 flex-col justify-end overflow-hidden rounded-control bg-ink text-on-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action";
// Darkest at the bottom, where the words are, so white text passes contrast on any photo.
const VEIL = "absolute inset-0 bg-linear-to-t from-ink/90 via-ink/65 to-ink/35";

// A large card that opens one thing: a photo under a dark veil, and over it, in white, a bold title, a
// semibold line, and plainer lines under that.
export default function PhotoCard({ src, title, subtitle, details, ...link }: Props) {
  return (
    <Link {...link} className={CARD}>
      <img src={src} alt="" className="absolute inset-0 size-full object-cover" />
      <span aria-hidden className={VEIL} />
      <span className="relative flex flex-col gap-1 p-5">
        <span className="text-tile font-bold">{title}</span>
        <span className="text-body font-semibold">{subtitle}</span>
        {details.map((detail) => (
          <span key={detail} className="text-body">
            {detail}
          </span>
        ))}
      </span>
    </Link>
  );
}
