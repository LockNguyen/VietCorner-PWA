"use client";

import { ViewTransition, type ReactNode } from "react";

// The screen as one piece that slides when the address changes, the way an iPhone pushes and pops pages:
// forward, the new screen comes in from the right; back, the screen leaves to the right and uncovers the one
// under it (src/lib/slide.ts names the two; globals.css draws them). React's `<ViewTransition>` with the
// browser's View Transitions: the official way in this Next.js (its "View transitions" guide), no library.
// It sits in the root layout, which stays put, so the change is an "update" of this one element. Anything
// else (a refresh, a save) carries no type and does not move. A browser without the feature simply changes
// the screen.
export default function PageSlide({ children }: { children: ReactNode }) {
  return (
    <ViewTransition update={{ "go-forward": "slide-forward", "go-back": "slide-back", default: "none" }} default="none">
      {/* One element, so the old and the new screen are always one pair, whatever each page holds. White and
          at least a screen tall: the slide moves pictures of it, and a see-through one would show both screens.
          `pb-24` is the room under the last line for the tab bar, inside, so a short screen does not scroll;
          a column, so a screen can fill what is left (the signed-out frame). */}
      <div className="flex min-h-dvh flex-col bg-surface pb-24">{children}</div>
    </ViewTransition>
  );
}
