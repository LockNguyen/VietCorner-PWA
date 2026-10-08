import { User } from "lucide-react";

// A person's picture. Everyone has the same default one until pictures can be set.
export default function Avatar() {
  return (
    <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-fill text-subtle">
      <User className="size-5" />
    </span>
  );
}
