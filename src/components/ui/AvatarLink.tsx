import { Camera } from "lucide-react";
import Link from "next/link";
import type { ComponentProps } from "react";
import { GO_FORWARD } from "@/lib/slide";

type Props = ComponentProps<typeof Link> & { label: string }; // label: what a screen reader says it opens

const BASE = "relative rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action";
const BADGE = "absolute right-0 bottom-0 flex size-9 items-center justify-center rounded-full border border-line bg-surface text-ink *:size-5";

// A large picture (an `Avatar`) with a small camera at its corner, opening the screen that changes it.
export default function AvatarLink({ label, children, ...link }: Props) {
  return (
    <Link replace transitionTypes={GO_FORWARD} {...link} aria-label={label} className={BASE}>
      {children}
      <span aria-hidden className={BADGE}>
        <Camera />
      </span>
    </Link>
  );
}
