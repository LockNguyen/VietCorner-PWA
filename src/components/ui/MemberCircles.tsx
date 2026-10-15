import { User } from "lucide-react";
import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  initials: string[]; // the people who have the app, drawn first
  total: number; // how many circles in all; past `initials`, empty ones for people without the app
  max: number; // the most circles drawn; what is left is said as "+N"
  label: string; // what a screen reader says for the whole row ("12 members")
};

const CIRCLE = "inline-flex size-7 shrink-0 items-center justify-center rounded-full text-tab font-semibold";
const KNOWN = "bg-action text-on-action";
const EMPTY = "bg-fill text-subtle";
const MORE = "inline-flex h-7 shrink-0 items-center rounded-full bg-fill px-2 text-tab font-semibold text-subtle";

// A row of small circles, one per person: initials for those who have the app, an empty figure for the
// rest, and "+N" when there are more than fit.
export default function MemberCircles({ initials, total, max, label, ...row }: Props) {
  const count = Math.max(total, initials.length);
  const drawn = count > max ? max - 1 : count; // one place is kept for "+N"
  return (
    <div role="img" aria-label={label} {...row} className="flex flex-wrap gap-1">
      {Array.from({ length: drawn }, (_, index) =>
        index < initials.length ? (
          <span key={index} className={`${CIRCLE} ${KNOWN}`}>
            {initials[index]}
          </span>
        ) : (
          <span key={index} className={`${CIRCLE} ${EMPTY}`}>
            <User aria-hidden className="size-4" />
          </span>
        ),
      )}
      {count > drawn && <span className={MORE}>+{count - drawn}</span>}
    </div>
  );
}
