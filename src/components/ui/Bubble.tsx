import type { ReactNode } from "react";

type Props = { tone: keyof typeof TONES; onClick?: () => void; children: ReactNode };

const BASE = "w-fit max-w-7/10 rounded-bubble px-4 py-2 text-start text-body wrap-anywhere whitespace-pre-wrap";
const TONES = {
  mine: "bg-action text-on-action",
  theirs: "bg-fill text-ink",
  failed: "bg-fill text-danger",
} as const;

// One message. Which side it sits on is its run's business (`BubbleRun`); its colour says whose it is.
// With `onClick` it is a button.
export default function Bubble({ tone, onClick, children }: Props) {
  if (onClick) {
    return (
      <button onClick={onClick} className={`${BASE} ${TONES[tone]} focus-visible:outline-2 focus-visible:outline-action`}>
        {children}
      </button>
    );
  }

  return <div className={`${BASE} ${TONES[tone]}`}>{children}</div>;
}
