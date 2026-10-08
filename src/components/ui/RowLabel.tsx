import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLSpanElement>;

// A short bold label that starts a row, such as a time. Its box has one width, so whatever follows lines up on every row.
export default function RowLabel(label: Props) {
  return <span {...label} className="w-14 shrink-0 text-center text-body font-bold text-ink" />;
}
