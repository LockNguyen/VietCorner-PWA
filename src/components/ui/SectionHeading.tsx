import type { HTMLAttributes, ReactNode } from "react";

type Props = HTMLAttributes<HTMLHeadingElement> & {
  variant?: keyof typeof VARIANTS;
  icon?: ReactNode; // a lucide icon before the words, so the section is known at a glance
};

const BASE = "flex items-center gap-3 px-3 pb-2";
const VARIANTS = {
  small: "pt-5 text-small font-semibold text-subtle", // above a group of rows in a list
  large: "pt-6 text-tile font-bold text-ink", // a screen of separate settings: each is bigger than its options
} as const;

// The heading above a group of rows.
export default function SectionHeading({ variant = "small", icon, children, ...heading }: Props) {
  return (
    <h2 {...heading} className={`${BASE} ${VARIANTS[variant]}`}>
      {icon && (
        <span aria-hidden className="flex size-6 shrink-0 items-center justify-center text-action">
          {icon}
        </span>
      )}
      {children}
    </h2>
  );
}
