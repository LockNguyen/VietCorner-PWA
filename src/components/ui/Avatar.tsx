import { User } from "lucide-react";

type Props = { size?: keyof typeof SIZES };

const BASE = "flex shrink-0 items-center justify-center rounded-full bg-fill text-subtle";
const SIZES = { regular: "size-10", small: "size-8" } as const;

// A person's picture. Everyone has the same default one until pictures can be set.
export default function Avatar({ size = "regular" }: Props) {
  return (
    <span aria-hidden className={`${BASE} ${SIZES[size]}`}>
      <User className="size-5" />
    </span>
  );
}
