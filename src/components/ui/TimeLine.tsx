import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLParagraphElement>;

// A small centred label between messages: when a conversation resumed, or which week follows.
export default function TimeLine(line: Props) {
  return <p {...line} className="py-2 text-center text-small text-subtle" />;
}
