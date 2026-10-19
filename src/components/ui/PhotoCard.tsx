import Link from "next/link";
import { GO_FORWARD } from "@/lib/slide";
import type { ReactNode } from "react";

type Props = {
  href?: string; // what a tap opens; without one the card is not a button at all (only `extra` takes taps)
  src: string;
  title: string;
  subtitle: string; // the line read first after the title: when
  details: string[]; // the quieter lines under it: where
  extra?: ReactNode; // a last line with its own tap, like a phone number: it sits above the card's link
};

const CARD = "relative flex min-h-52 flex-col justify-end overflow-hidden rounded-control bg-ink text-on-action";
// Darkest at the bottom, where the words are, so white text passes contrast on any photo.
const VEIL = "absolute inset-0 bg-linear-to-t from-ink/90 via-ink/65 to-ink/35";
// The link covers the whole card but holds no words: a button (the phone number) cannot sit inside a link.
const LINK =
  "absolute inset-0 rounded-control focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-on-action";

// A large card that may open one thing: a photo under a dark veil, and over it, in white, a bold title, a
// semibold line, plainer lines under that, and maybe one line that can be tapped by itself.
export default function PhotoCard({ href, src, title, subtitle, details, extra }: Props) {
  return (
    <div className={CARD}>
      <img src={src} alt="" className="absolute inset-0 size-full object-cover" />
      <span aria-hidden className={VEIL} />
      {href && <Link href={href} transitionTypes={GO_FORWARD} aria-label={title} className={LINK} />}
      {/* Taps go through the words to the link; only `extra` takes its own. */}
      <span className="pointer-events-none relative flex flex-col gap-1 p-5">
        <span className="text-tile font-bold">{title}</span>
        <span className="text-body font-semibold">{subtitle}</span>
        {details.map((detail) => (
          <span key={detail} className="text-body">
            {detail}
          </span>
        ))}
        {extra && <span className="pointer-events-auto text-body">{extra}</span>}
      </span>
    </div>
  );
}
