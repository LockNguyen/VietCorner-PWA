import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLUListElement>;

// `*:last:border-b-0`: the rows' own rule under the last one would show against the rounded edge.
const BASE = "overflow-hidden rounded-control bg-fill *:last:border-b-0";

// A few `ListRow`s on one rounded grey panel, the way Settings groups them (Messenger's look, 2026-10-19).
export default function ListGroup(list: Props) {
  return <ul {...list} className={BASE} />;
}
