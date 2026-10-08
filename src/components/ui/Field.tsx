import type { ReactNode } from "react";

type Props = { label: string; problem?: string; children: ReactNode };

// A label above one control and, once the form has been tried, what is wrong with it underneath.
export default function Field({ label, problem, children }: Props) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-small text-subtle">{label}</span>
      {children}
      {problem && <span className="text-small text-danger">{problem}</span>}
    </label>
  );
}
