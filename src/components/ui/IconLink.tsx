import Link from "next/link";
import type { ComponentProps } from "react";

type Props = ComponentProps<typeof Link> & { label: string };

// A link shown as an icon alone, on the top bar. `label` is what a screen reader says in place of the icon.
export default function IconLink({ label, ...link }: Props) {
  return (
    <Link
      {...link}
      aria-label={label}
      className="inline-flex size-touch items-center justify-center rounded-control text-on-action focus-visible:outline-2 focus-visible:outline-on-action"
    />
  );
}
