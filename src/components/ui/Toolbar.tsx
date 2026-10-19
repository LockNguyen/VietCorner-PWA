import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement>;

// `fixed`, not `sticky`: on the user's iPhone (2026-10-19) a sticky row under the sticky top bar scrolled away
// with the list. A fixed row cannot; the spacer keeps the first line of the list from starting under it.
const SPACER = "h-toolbar shrink-0";
const ROW =
  "fixed inset-x-0 top-under-bar z-10 mx-auto flex h-toolbar max-w-column items-center justify-end gap-3 bg-surface px-3";

// A row of buttons at the right end of the screen, held just under the top bar while the list scrolls under it.
export default function Toolbar(row: Props) {
  return (
    <>
      <div aria-hidden className={SPACER} />
      <div {...row} className={ROW} />
    </>
  );
}
