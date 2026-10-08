import { X } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  kind: keyof typeof KINDS;
  message: string;
  more?: number;
};

const BASE = "flex min-h-touch w-full items-center gap-3 rounded-control px-4 py-3 text-start text-body text-on-action";
const KINDS = { success: "bg-success", error: "bg-danger" } as const;

// A message about what just happened. It is a button: tapping it is how it is put away.
// `more` is how many others wait behind it; it then shows that number instead of the cross.
export default function Banner({ kind, message, more = 0, ...button }: Props) {
  return (
    <button {...button} className={`${BASE} ${KINDS[kind]}`}>
      <span className="flex-1">{message}</span>
      {more > 0 ? <span className="shrink-0 font-bold">+{more}</span> : <X aria-hidden className="shrink-0" />}
    </button>
  );
}
