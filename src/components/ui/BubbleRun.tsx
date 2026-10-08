import type { ReactNode } from "react";

type Props = {
  side: keyof typeof SIDES;
  name?: string;
  avatar?: ReactNode;
  children: ReactNode;
};

const SIDES = { mine: "items-end", theirs: "items-start" } as const;

// One speaker's messages in a row: 4 apart, the name above the first, the avatar beside the last.
// The gap to the next run (16) is the parent's.
export default function BubbleRun({ side, name, avatar, children }: Props) {
  return (
    <div className="flex items-end gap-2">
      {avatar}
      <div className={`flex min-w-0 flex-1 flex-col gap-1 ${SIDES[side]}`}>
        {name && <span className="px-4 text-small text-subtle">{name}</span>}
        {children}
      </div>
    </div>
  );
}
