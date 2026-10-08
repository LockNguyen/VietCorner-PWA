import type { ReactNode } from "react";

type Props = {
  tone: keyof typeof TONES;
  onClick?: () => void;
  corner?: ReactNode;
  children: ReactNode;
};

const BASE = "relative w-fit max-w-7/10 rounded-bubble px-4 py-2 text-start text-body wrap-anywhere whitespace-pre-wrap";
const TONES = {
  mine: "bg-action text-on-action",
  theirs: "bg-fill text-ink",
  failed: "bg-fill text-danger",
} as const;

// One message. Which side it sits on is its run's business (`BubbleRun`); its colour says whose it is.
// With `onClick` it is a button. `corner` hangs from its bottom edge, over the padding only: leave 24 under it.
export default function Bubble({ tone, onClick, corner, children }: Props) {
  if (onClick) {
    return (
      <button onClick={onClick} className={`${BASE} ${TONES[tone]} focus-visible:outline-2 focus-visible:outline-action`}>
        {children}
      </button>
    );
  }

  return (
    <div className={`${BASE} ${TONES[tone]}`}>
      {children}
      {corner && <span className="absolute -bottom-6 left-4">{corner}</span>}
    </div>
  );
}
