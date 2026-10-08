import Link from "next/link";
import type { ComponentProps } from "react";

type Props = ComponentProps<typeof Link> & {
  label: string;
  tone?: keyof typeof TONES;
};

const BASE = "inline-flex size-touch items-center justify-center rounded-control focus-visible:outline-2";
const TONES = {
  onAction: "text-on-action focus-visible:outline-on-action",
  ink: "text-ink focus-visible:outline-action",
} as const;

// A link shown as an icon alone. `label` is what a screen reader says where a sighted reader sees the icon.
export default function IconLink({ label, tone = "onAction", ...link }: Props) {
  return <Link {...link} aria-label={label} className={`${BASE} ${TONES[tone]}`} />;
}
