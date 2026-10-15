import { X } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  kind: keyof typeof KINDS;
  message: string;
  more?: number;
  actionLabel?: string; // a way out, written as a link after the message ("Forgot password?")
  onAction?: () => void;
};

const BASE = "flex min-h-touch w-full items-center gap-3 rounded-control px-4 py-3 text-start text-body text-on-action";
const KINDS = { success: "bg-success", error: "bg-danger" } as const;
const ACTION = "font-bold underline underline-offset-2";
const CLOSE = "inline-flex size-touch shrink-0 items-center justify-center -me-3";

// A message about what just happened. It is a button: tapping it is how it is put away.
// `more` is how many others wait behind it; it then shows that number instead of the cross.
// With an action the message carries a link, and the cross becomes its own button, since a button cannot hold
// another; the native button props then go to the cross.
export default function Banner({ kind, message, more = 0, actionLabel, onAction, ...button }: Props) {
  const close = more > 0 ? <span className="shrink-0 font-bold">+{more}</span> : <X aria-hidden className="shrink-0" />;

  if (!actionLabel) {
    return (
      <button {...button} className={`${BASE} ${KINDS[kind]}`}>
        <span className="flex-1">{message}</span>
        {close}
      </button>
    );
  }
  return (
    <div className={`${BASE} ${KINDS[kind]}`}>
      <span className="flex-1">
        {message}{" "}
        <button type="button" onClick={onAction} className={ACTION}>
          {actionLabel}
        </button>
      </span>
      <button {...button} className={CLOSE}>
        {close}
      </button>
    </div>
  );
}
