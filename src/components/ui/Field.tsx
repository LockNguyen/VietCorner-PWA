import type { ReactNode } from "react";

type Props = { label: string; hint?: string; problem?: string; children: ReactNode };

// A label above one control; under it a quiet hint (where the value shows) and, once the form has been tried,
// what is wrong with it.
export default function Field({ label, hint, problem, children }: Props) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-small text-subtle">{label}</span>
      {children}
      {hint && <span className="text-small text-subtle">{hint}</span>}
      {problem && <span className="text-small text-danger">{problem}</span>}
    </label>
  );
}
