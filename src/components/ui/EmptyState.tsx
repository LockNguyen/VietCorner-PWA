import type { ReactNode } from "react";

type Props = { message: string; children?: ReactNode };

// What a screen shows when it has nothing to list: one sentence, and the next step as children if there is one.
export default function EmptyState({ message, children }: Props) {
  return (
    <div className="flex flex-col items-center gap-4 px-5 py-12 text-center">
      <p className="text-body text-subtle">{message}</p>
      {children}
    </div>
  );
}
