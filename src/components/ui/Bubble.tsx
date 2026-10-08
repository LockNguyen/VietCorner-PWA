import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement> & { tone: keyof typeof TONES };

const BASE = "w-fit max-w-7/10 rounded-bubble px-4 py-2 text-body wrap-anywhere whitespace-pre-wrap";
const TONES = {
  mine: "bg-action text-on-action",
  theirs: "bg-fill text-ink",
  failed: "bg-fill text-danger",
} as const;

// One message. Which side it sits on is its run's business (`BubbleRun`); its colour says whose it is.
export default function Bubble({ tone, ...bubble }: Props) {
  return <div {...bubble} className={`${BASE} ${TONES[tone]}`} />;
}
