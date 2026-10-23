"use client";

import { ViewTransition, type ReactNode } from "react";

// The id of the screen's scrolling box, for whoever must read or set where it is scrolled (Navigation.tsx).
export const SCREEN_ID = "screen";

// The screen as one piece that moves when the address changes (the user, 2026-10-22: one way, for every screen):
// into an inner screen or a detour a slide from the right, out of one a slide to the right; between two main
// screens no move at all, the new one simply there (src/lib/navigation.ts decides which, src/lib/slide.ts names
// them, globals.css draws them). React's `<ViewTransition>` with the browser's View Transitions: the official way
// in this Next.js. It sits in the root layout, which stays put, so the change is an "update" of this one element.
// Anything else (a refresh, a save) carries no type and does not move. A browser without the feature simply
// changes the screen.
//
// The screen scrolls inside this box, exactly one viewport tall, instead of the whole page scrolling. The move is
// drawn from a picture of this box, which is then just what was on screen, wherever a list was scrolled. When the
// page itself scrolled, the picture was a list's length tall and landed at the new screen's height: opening a
// card far down showed the list's top for a moment, and going back to it showed nothing (2026-10-22).
export default function PageSlide({ children }: { children: ReactNode }) {
  return (
    <ViewTransition
      update={{ "go-forward": "slide-forward", "go-back": "slide-back", default: "none" }}
      default="none"
    >
      {/* White: the move shows pictures of it, and a see-through one would show both screens. `pb-24` is the
          room under the last line for the tab bar, inside, so a short screen does not scroll; a column, so a
          screen can fill what is left (the signed-out frame). */}
      <div id={SCREEN_ID} className="flex h-dvh flex-col overflow-y-auto bg-surface pb-24">
        {children}
      </div>
    </ViewTransition>
  );
}
