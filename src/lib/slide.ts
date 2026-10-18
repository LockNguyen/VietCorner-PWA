// The two directions a screen can move, as React transition types (`<Link transitionTypes>`,
// `router.push(href, { transitionTypes })`). `src/components/PageSlide.tsx` turns them into the slides in
// globals.css. A navigation with neither (a refresh, a save) changes the screen without moving. The tab bar
// slides by position: a tab to the right goes forward, one to the left goes back (AppTabs).
//
//   <Link href="/events" transitionTypes={GO_FORWARD}>   the new screen comes in from the right
//   <Link href="/" transitionTypes={GO_BACK}>            this screen leaves to the right, uncovering the one under it
export const GO_FORWARD = ["go-forward"];
export const GO_BACK = ["go-back"];
