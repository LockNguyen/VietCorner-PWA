import { addTransitionType, startTransition } from "react";
import type { Direction } from "./navigation";

// The two directions a screen can move, as React transition types (`<Link transitionTypes>`,
// `router.push(href, { transitionTypes })`). `src/components/PageSlide.tsx` turns them into the moves in
// globals.css. A navigation with neither (a refresh, a save) changes the screen without moving. Back is for
// going home or out of an inner screen; the tab bar slides only to and from Home, or out of an inner screen
// to its own tab, never between two tabs (AppTabs).
//
//   <Link href="/events" transitionTypes={GO_FORWARD}>   the new screen comes in from the right
//   <Link href="/" transitionTypes={GO_BACK}>            this screen leaves to the right, uncovering the one under it
export const GO_FORWARD = ["go-forward"];
export const GO_BACK = ["go-back"];

// The same slide for a screen that changes without changing address (the steps of signing up, one page):
// the state change runs as a transition carrying the direction, which is what `PageSlide` listens to.
//
//   slide(GO_FORWARD, () => setScreen("name"))
export function slide(direction: string[], change: () => void) {
  startTransition(() => {
    direction.forEach(addTransitionType);
    change();
  });
}

// The transition types for a direction from the navigation rules (src/lib/navigation.ts); none: no movement.
// A switch between two main screens does not move either, as an iPhone's tab bar (the user, 2026-10-22): a move is
// drawn from a picture of the old screen, and on the user's iPhone that picture lost its top bar, the pulsing dots
// and the grey placeholders for a frame. With no move there is no picture, and the new screen is there at once.
export function slideOf(direction: Direction | null): string[] | undefined {
  if (direction === "forward") return GO_FORWARD;
  if (direction === "back") return GO_BACK;
  return undefined;
}
