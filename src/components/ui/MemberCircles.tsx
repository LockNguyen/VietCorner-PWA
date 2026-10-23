import { User } from "lucide-react";
import type { HTMLAttributes } from "react";
import Picture from "./Picture";

type Props = HTMLAttributes<HTMLSpanElement> & {
  people: { initials: string; src?: string }[]; // those who have the app, drawn first: a picture, else initials
  total: number; // how many circles in all; past `people`, empty ones for people without the app
  max: number; // the most circles drawn; what is left is said as "+N"
  label: string; // what a screen reader says for the whole row ("12 members")
};

const CIRCLE =
  "inline-flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full text-tab font-semibold";
const KNOWN = "bg-action text-on-action";
const EMPTY = "bg-fill text-subtle";
const MORE = "inline-flex h-7 shrink-0 items-center rounded-full bg-fill px-2 text-tab font-semibold text-subtle";

// A row of small circles, one per person: for those who have the app their own picture, or their initials while
// they have none (2026-10-22); an empty figure for the rest, and "+N" when there are more than fit.
export default function MemberCircles({ people, total, max, label, ...row }: Props) {
  const count = Math.max(total, people.length);
  const drawn = count > max ? max - 1 : count; // one place is kept for "+N"
  return (
    <span role="img" aria-label={label} {...row} className="flex flex-wrap gap-1">
      {Array.from({ length: drawn }, (_, index) =>
        index < people.length ? (
          <span key={index} className={`${CIRCLE} ${KNOWN}`}>
            {people[index].src ? (
              <Picture src={people[index].src} className="size-full object-cover" />
            ) : (
              people[index].initials
            )}
          </span>
        ) : (
          <span key={index} className={`${CIRCLE} ${EMPTY}`}>
            <User aria-hidden className="size-4" />
          </span>
        ),
      )}
      {count > drawn && <span className={MORE}>+{count - drawn}</span>}
    </span>
  );
}
