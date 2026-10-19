import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement>;

const ROW = "sticky top-under-bar z-10 flex items-center justify-end gap-3 bg-surface px-3 py-2";

// A row of buttons at the right end of the screen, held just under the top bar while the list scrolls under it.
export default function Toolbar(row: Props) {
  return <div {...row} className={ROW} />;
}
