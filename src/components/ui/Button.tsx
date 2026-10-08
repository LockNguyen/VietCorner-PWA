import type { ButtonHTMLAttributes } from "react";
import Spinner from "./Spinner";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof VARIANTS;
  pending?: boolean;
  pendingLabel?: string;
};

const BASE =
  "relative inline-flex min-h-touch shrink-0 items-center justify-center rounded-control px-4 text-body font-medium " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action disabled:opacity-50";
const VARIANTS = {
  primary: "bg-action text-on-action",
  quiet: "border border-line bg-surface text-ink",
  danger: "bg-danger text-on-action",
  text: "text-action",
} as const;

// A button. While `pending` it takes no taps and shows the circle, with `pendingLabel` beside it if given.
export default function Button({ variant = "primary", pending = false, pendingLabel, disabled, children, ...button }: Props) {
  return (
    <button {...button} disabled={pending || disabled} aria-busy={pending} className={`${BASE} ${VARIANTS[variant]}`}>
      {pending && pendingLabel ? (
        // One line of text with the circle in it, so the circle lines up with the letters, not the box.
        <span>
          <span className="pe-2">
            <Spinner />
          </span>
          {pendingLabel}
        </span>
      ) : (
        <>
          {/* Hidden, not removed: the button keeps its width while the circle sits on top. */}
          <span className={pending ? "invisible" : undefined}>{children}</span>
          {pending && (
            <span className="absolute inset-0 flex items-center justify-center">
              <Spinner />
            </span>
          )}
        </>
      )}
    </button>
  );
}
