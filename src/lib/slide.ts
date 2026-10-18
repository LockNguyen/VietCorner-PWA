import { addTransitionType, startTransition } from "react";

// The two directions a screen can move, as React transition types (`<Link transitionTypes>`,
// `router.push(href, { transitionTypes })`). `src/components/PageSlide.tsx` turns them into the slides in
// globals.css. A navigation with neither (a refresh, a save) changes the screen without moving. Back is for
// going home or out of an inner screen; in the tab bar only Home goes back, every other tab forward (AppTabs).
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
