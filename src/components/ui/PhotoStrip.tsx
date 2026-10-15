import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLUListElement>;

// A row of pictures that scrolls sideways. Three fit, the next one shows its edge, and the row fades out at
// the right, which is what says "there is more this way". Its children are `PhotoThumb`s (and other <li>s).
export default function PhotoStrip(list: Props) {
  return (
    <div className="relative">
      <ul {...list} className="flex gap-2 overflow-x-auto pe-8" />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 end-0 w-8 bg-linear-to-l from-surface to-transparent" />
    </div>
  );
}
