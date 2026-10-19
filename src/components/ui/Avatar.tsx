import { User } from "lucide-react";
import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLSpanElement> & {
  src?: string; // the person's own picture; without one, the default figure
  size?: keyof typeof SIZES;
};

const BASE = "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-fill text-subtle";
const SIZES = { small: "size-8", large: "size-24" } as const;
const FIGURES = { small: "size-5", large: "size-14" } as const;

// A person's picture, in a circle: their own, or the same default figure for everyone who has not chosen one.
// Decorative: their name is always beside it.
export default function Avatar({ src, size = "small", ...avatar }: Props) {
  return (
    <span aria-hidden {...avatar} className={`${BASE} ${SIZES[size]}`}>
      {src ? <img src={src} alt="" loading="lazy" className="size-full object-cover" /> : <User className={FIGURES[size]} />}
    </span>
  );
}
