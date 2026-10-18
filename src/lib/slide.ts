// The two directions a screen can move, as React transition types (`<Link transitionTypes>`,
// `router.push(href, { transitionTypes })`). `src/components/PageSlide.tsx` turns them into the slides in
// globals.css. A navigation with neither (a tab in the tab bar, a refresh) changes the screen without moving.
//
//   <Link href="/events" transitionTypes={GO_FORWARD}>   the new screen comes in from the right
//   <Link href="/" transitionTypes={GO_BACK}>            this screen leaves to the right, uncovering the one under it
export const GO_FORWARD = ["go-forward"];
export const GO_BACK = ["go-back"];
