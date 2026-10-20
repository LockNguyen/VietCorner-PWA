import type { ButtonHTMLAttributes } from "react";
import Spinner from "./Spinner";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof VARIANTS;
  pending?: boolean;
  pendingLabel?: string;
};

const BASE =
  "relative inline-flex min-h-touch shrink-0 items-center justify-center rounded-control text-body font-medium " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action disabled:opacity-50";
// The side padding is per variant, not in BASE: `inline` has none, and two padding classes on one element
// would leave which one wins to the order of Tailwind's stylesheet.
const VARIANTS = {
  primary: "bg-action text-on-action px-4",
  quiet: "border border-line bg-surface text-ink px-4",
  danger: "bg-danger text-on-action px-4",
  // Red but not alarming, for a plain choice like Sign out: solid red reads as an error banner.
  dangerOutline: "border border-danger bg-surface text-danger px-4",
  text: "text-action px-4",
  dangerText: "text-danger px-4", // the small red line under a sheet's button: remove, delete, call off
  // A tappable value lined up with the words around it (a phone number): no side padding, and the 48 px tap
  // area reaches above and below the line (`-my-3`) instead of pushing it down, so it sits level with an icon.
  inline: "-my-3 text-action",
  inlineOnDark: "-my-3 text-action-on-dark", // the same, over a dark photo (an event card)
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
