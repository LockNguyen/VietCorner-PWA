import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  src?: string; // the picture; without one, a grey area holding `placeholder`
  placeholder?: ReactNode; // an icon for the empty picture area
  title: string;
  badge?: ReactNode; // just before the title (a LiveDot)
  subtitle?: string;
};

const BASE =
  "flex w-full flex-col overflow-hidden rounded-control border border-line bg-surface text-start " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action";
const PICTURE = "flex aspect-video w-full items-center justify-center bg-fill text-subtle";
const BODY = "flex flex-col gap-1 px-4 py-3";

// A large tappable card: a picture across the top, then a title (with an optional badge before it), a grey
// line under it, and whatever the caller adds below (children). The picture is about 70% of the card.
export default function Card({ src, placeholder, title, badge, subtitle, children, ...button }: Props) {
  return (
    <button type="button" {...button} className={BASE}>
      <span className={PICTURE}>
        {src ? <img src={src} alt="" loading="lazy" className="size-full object-cover" /> : placeholder}
      </span>
      <span className={BODY}>
        <span className="flex items-center gap-2 text-body font-semibold text-ink">
          {badge}
          {title}
        </span>
        {subtitle && <span className="text-small text-subtle">{subtitle}</span>}
        {children}
      </span>
    </button>
  );
}
