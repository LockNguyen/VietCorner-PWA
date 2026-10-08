import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLHeadingElement>;

// The small grey heading above a group of rows.
export default function SectionHeading(heading: Props) {
  return <h2 {...heading} className="px-3 pt-5 pb-2 text-small font-semibold text-subtle" />;
}
