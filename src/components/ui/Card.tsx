import type { ButtonHTMLAttributes, ReactNode } from "react";
import Picture from "./Picture";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  src?: string; // the picture; without one, a grey area holding `placeholder`
  lazyPicture?: boolean; // fetched only near the screen: a card further down a long list (ui/Picture)
  placeholder?: ReactNode; // an icon for the empty picture area
  title: string;
  badge?: ReactNode; // just before the title (a LiveDot)
  subtitle?: string;
};

const BASE =
  "flex w-full flex-col overflow-hidden rounded-control border border-line bg-surface text-start " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action";
// why relative + absolute: an aspect-ratio box grows to fit a tall picture inside it; taken out of the flow, the
// picture can no longer stretch the box, so every card is the same height and the picture's overflow is cut.
const PICTURE = "relative flex aspect-video w-full shrink-0 items-center justify-center overflow-hidden bg-fill text-subtle";
const BODY = "flex flex-col gap-1 px-4 py-3";

// A large tappable card: a picture across the top, then a title (with an optional badge before it), a grey
// line under it, and whatever the caller adds below (children). The picture area is always 16:9: a taller or
// wider picture is centred and its edges are cut off.
export default function Card({ src, lazyPicture = false, placeholder, title, badge, subtitle, children, ...button }: Props) {
  return (
    <button type="button" {...button} className={BASE}>
      <span className={PICTURE}>
        {src ? <Picture src={src} lazy={lazyPicture} className="absolute inset-0 size-full object-cover object-center" /> : placeholder}
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
