import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement>;

// `sticky` just under the top bar, inside the screen's scrolling box (PageSlide), like the top bar itself: held
// there while the list scrolls under it, and pulled down with the top bar when the page bounces at its top
// (the user, 2026-10-22: a `fixed` row stayed put while the bar and the list bounced away from it). It was
// `fixed` from 2026-10-19 because, when the whole page scrolled, a sticky row scrolled away on the user's iPhone.
const ROW =
  "sticky top-under-bar z-10 flex h-toolbar shrink-0 items-center justify-end gap-3 bg-surface px-3";

// A row of buttons at the right end of the screen, held just under the top bar while the list scrolls under it.
// It takes the screen's full width: put it outside a padded column, as the first thing under the top bar.
export default function Toolbar(row: Props) {
  return <div {...row} className={ROW} />;
}
