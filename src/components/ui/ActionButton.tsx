import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  pending: boolean; // its request is on the way: show it, and take no more taps
  pendingLabel?: string; // words to show beside the circle while pending, e.g. "Saving…"
};

// A button that starts a request and shows that it has. Everything else about it (colour, size, what it
// does) comes from the caller, exactly as for a plain <button>.
//
// While `pending` it is disabled and shows a turning circle:
// - with a `pendingLabel`, the circle and those words replace the label ("Saving…");
// - without one, the circle sits on top of the hidden label, so the button keeps its width and the row
//   around it does not jump.
// When the caller disables it for another reason (a sibling is busy, the form is incomplete) it only dims.
//
// It knows how to LOOK busy. Whether it is busy is the caller's to say, usually from `usePending`.
export default function ActionButton({ pending, pendingLabel, disabled, className = "", children, ...button }: Props) {
  return (
    <button
      {...button}
      disabled={pending || disabled}
      aria-busy={pending}
      className={`relative disabled:opacity-50 ${className}`}
    >
      {pending && pendingLabel ? (
        <>
          <Circle /> {pendingLabel}
        </>
      ) : (
        <>
          <span className={pending ? "invisible" : undefined}>{children}</span>
          {pending && (
            <span className="absolute inset-0 flex items-center justify-center">
              <Circle />
            </span>
          )}
        </>
      )}
    </button>
  );
}

// Three quarters of a ring in the button's own text colour, turning. Decoration: `aria-busy` tells a
// screen reader the same thing.
function Circle() {
  return (
    <span
      aria-hidden
      className="inline-block h-[1em] w-[1em] animate-spin rounded-full border-2 border-current border-t-transparent align-[-0.125em]"
    />
  );
}
