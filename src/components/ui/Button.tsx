import type { ButtonHTMLAttributes } from "react";
import Spinner from "./Spinner";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof VARIANTS;
  pending?: boolean;
  pendingLabel?: string;
};

const BASE =
  "relative inline-flex min-h-touch justify-center rounded-control text-body font-medium " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action disabled:opacity-50";
// The side padding, `shrink-0` and the centring are per variant, not in BASE: `inline` has none of them, and two
// classes of one kind on one element would leave which one wins to the order of Tailwind's stylesheet.
const BOX = "shrink-0 items-center px-4";
// A tappable value lined up with the words around it (a phone number, an address): no side padding, and 12 px of
// tap area above and below the words (`py-3`) that reach out of the line (`-my-3`) instead of pushing it apart, so
// its first line sits level with a label or an icon beside it. Underlined, so it reads as something to tap (the
// user, 2026-10-22), and free to shrink: a long address wraps onto even lines from the left, like a card's title.
const INLINE = "-my-3 py-3 items-start text-start text-balance underline underline-offset-4";
const VARIANTS = {
  primary: `${BOX} bg-action text-on-action`,
  quiet: `${BOX} border border-line bg-surface text-ink`,
  danger: `${BOX} bg-danger text-on-action`,
  // Red but not alarming, for a plain choice like Sign out: solid red reads as an error banner.
  dangerOutline: `${BOX} border border-danger bg-surface text-danger`,
  text: `${BOX} text-action`,
  dangerText: `${BOX} text-danger`, // the small red line under a sheet's button: remove, delete, call off
  inline: `${INLINE} text-action`,
  inlineOnDark: `${INLINE} text-action-on-dark`, // the same, over a dark photo (an event card)
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
