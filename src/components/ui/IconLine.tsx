import type { HTMLAttributes, ReactNode } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  icon: ReactNode; // a lucide icon: a clock, a map pin, a phone
  label: string; // what the icon stands for, read by screen readers ("Time")
};

const ROW = "flex items-start gap-3";
const ICON = "flex size-6 shrink-0 items-center justify-center pt-0.5 text-subtle";
const BODY = "flex min-w-0 flex-1 flex-col text-body text-ink wrap-anywhere";

// One fact with an icon at its left instead of a word: time, place, contact. The icon says what it is, so
// the line holds only the fact, which is easier to take in at a glance.
export default function IconLine({ icon, label, children, ...row }: Props) {
  return (
    <div {...row} className={ROW}>
      <span role="img" aria-label={label} className={ICON}>
        {icon}
      </span>
      <div className={BODY}>{children}</div>
    </div>
  );
}
