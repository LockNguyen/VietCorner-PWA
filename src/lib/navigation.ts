// The app's one set of rules for moving between screens (the user, 2026-10-22). Pure, so it is tested without a
// screen; `src/components/Navigation.tsx` remembers what these rules need, and the tab bar, the Home tiles, the
// top bar's links and back arrow, and the swipe ask here instead of each deciding for itself.
//
// Three kinds of screen, and a trail (`nextTrail`): the screens opened since the last main one, so every back arrow
// returns to the screen it was opened from, however it got there.
// Kinds:
//   main      Home, Events, Prayer, Groups, Admin (the bottom bar) and Staff (a Home tile)
//   detours   the assistant, Settings: a step aside from the main use, and back to where it started
//   inner     everything else, opened from one of the two (an event's editor, a group's page, Settings → Name)
//
// The browser's history is not used: every link and every move replaces the current entry (`<Link replace>`,
// `router.replace`), so the trail is the only way back (the user, 2026-10-23). A history of every screen visited let
// the phone's own back gesture walk through them all (Prayer → Settings → Text size → … → Admin) where a main screen
// should only ever go back to Home, and Home to nothing. Trade-off: Android's back button leaves the app instead of
// stepping back; the back arrow and the swipe step back everywhere.
//
// How the screen moves (src/lib/slide.ts draws each):
//   switch    from one main screen to another: no move, the new screen simply there, as an iPhone's tab bar
//   forward   into an inner screen or a detour: it comes in from the right
//   back      out of one: it leaves to the right

export type Direction = "forward" | "back" | "switch";
export type Step = "open" | "back" | "tab"; // what was tapped: a link on the screen, the back arrow or swipe, the bar
// The screens opened since the last main one, oldest first, each by its path; the last is the screen on show.
export type Trail = string[];

// why: a trail only grows by opening screen after screen without ever reaching a main one (group → event → group …);
// twenty steps back is more than anyone takes, and the bound keeps what is stored small.
const MAX_TRAIL = 20;

// Must hold the bottom bar's tabs (src/components/AppTabs.tsx) and Staff.
export const MAIN_SCREENS = ["/", "/events", "/prayer", "/groups", "/admin", "/staff"];
export const DETOURS = ["/assistant", "/settings"];

// An address without its query ("/admin/analytics?days=7" → "/admin/analytics"): screens are told apart by path.
export function pathOf(href: string): string {
  return href.split("?")[0];
}

const under = (path: string, root: string) => path === root || path.startsWith(`${root}/`);

export function isMain(path: string): boolean {
  return MAIN_SCREENS.includes(pathOf(path));
}

// The detour a screen belongs to ("/settings/name" → "/settings"), or null for the main screens and theirs.
export function detourOf(path: string): string | null {
  return DETOURS.find((root) => under(pathOf(path), root)) ?? null;
}

// The trail once `path` is on show (the user, 2026-10-23: a stack that pushes and pops, reset by the main screens).
// - A main screen starts a new trail: it is where every way back ends.
// - The screen before the last one: a step back, whichever way it was taken (the arrow, the phone's back, or a
//   save that returns to the list), so it is popped.
// - A back step to a screen the trail does not hold (the screen was opened cold, from a notification or a link):
//   it takes the place of the last one, so the next back arrow does not return to where this one came from.
// - Anything else was opened from the last one: pushed.
export function nextTrail(trail: Trail, path: string, step: "open" | "back"): Trail {
  const p = pathOf(path);
  if (isMain(p)) return [p];
  if (trail.at(-1) === p) return trail; // the same screen again (a reload, another query)
  if (trail.at(-2) === p) return trail.slice(0, -1);
  if (step === "back") return [...trail.slice(0, -1), p];
  return [...trail, p].slice(-MAX_TRAIL);
}

// The trail an app launch starts with: the one it kept, when it opens on the screen that trail ended on (a reload,
// or the app reopened where it was); otherwise a new one from this screen, so a notification that opens an inner
// screen goes back to that screen's own list, never to wherever the app was last week.
export function resumedTrail(kept: Trail, path: string): Trail {
  return kept.at(-1) === pathOf(path) ? kept : nextTrail([], path, "open");
}

// How the screen moves when `step` goes from `from` to `to`, or null when it should not move at all.
// - Between two main screens, whatever was tapped: switch.
// - A link on the screen opens: forward. The back arrow or swipe: back.
// - The bottom bar: into a detour, forward; anywhere else it leaves an inner screen or a detour behind: back.
export function directionOf(from: string, to: string, step: Step): Direction | null {
  const [fromPath, toPath] = [pathOf(from), pathOf(to)];
  if (fromPath === toPath) return null;
  if (isMain(fromPath) && isMain(toPath)) return "switch";
  if (step === "open") return "forward";
  if (step === "back") return "back";
  const toDetour = detourOf(toPath);
  return toDetour && toDetour !== detourOf(fromPath) ? "forward" : "back";
}

// Where the back arrow of `path` leads: the screen it was opened from, when the trail knows it; otherwise the
// screen's own `backHref` (its list, or Home), for a screen opened cold.
export function backTarget(path: string, backHref: string, trail: Trail): string {
  return trail.length > 1 && trail.at(-1) === pathOf(path) ? trail.at(-2)! : backHref;
}

// Whether going to `to` should land where that screen was left, instead of at its top. The back arrow and the
// swipe always do. The bottom bar does only for the main screen the trail started from, when deeper in it (the
// tab it was on, the user, 2026-10-22); any other tab opens fresh, at its top.
export function restoresScroll(step: Step, to: string, trail: Trail): boolean {
  if (step === "back") return true;
  return step === "tab" && trail.length > 1 && trail[0] === pathOf(to);
}
