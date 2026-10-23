// The app's one set of rules for moving between screens (the user, 2026-10-22). Pure, so it is tested without a
// screen; `src/components/Navigation.tsx` remembers what these rules need, and the tab bar, the Home tiles, the
// top bar's links and back arrow, and the swipe ask here instead of each deciding for itself.
//
// Three kinds of screen, and a step aside (`isStepAside`): any screen opened from another section, which goes
// back to where it was opened from.
// Kinds:
//   main      Home, Events, Prayer, Groups, Admin (the bottom bar) and Staff (a Home tile)
//   detours   the assistant, Settings: a step aside from the main use, and back to where it started
//   inner     everything else, opened from one of the two (an event's editor, a group's page, Settings → Name)
//
// How the screen moves (src/lib/slide.ts draws each):
//   switch    from one main screen to another: no move, the new screen simply there, as an iPhone's tab bar
//   forward   into an inner screen or a detour: it comes in from the right
//   back      out of one: it leaves to the right

export type Direction = "forward" | "back" | "switch";
// A step aside: `to` was opened from `from`, a screen of another section; its back arrow returns there.
export type Aside = { from: string; to: string };
export type Step = "open" | "back" | "tab"; // what was tapped: a link on the screen, the back arrow or swipe, the bar

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

// The part of the app a screen belongs to: its detour, or the main screen it sits under ("/groups/7/about" →
// "/groups"); anything under no main screen belongs to Home.
export function sectionOf(path: string): string {
  const p = pathOf(path);
  return detourOf(p) ?? MAIN_SCREENS.find((root) => root !== "/" && under(p, root)) ?? "/";
}

// Whether opening `to` from `from` is a step aside: a screen that is not a main one, in another section (a group's
// page opened from the Events card, Settings opened from anywhere). Its back arrow then returns to `from`
// (the user, 2026-10-22), not to its own section.
export function isStepAside(from: string, to: string): boolean {
  return !isMain(to) && sectionOf(from) !== sectionOf(to);
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

// Where the back arrow of `path` leads: for the screen a step aside opened, back to where it was opened from;
// for every other screen its own `backHref` (opened cold, from a notification or a reload, too).
export function backTarget(path: string, backHref: string, aside: Aside | null): string {
  return aside !== null && pathOf(path) === aside.to ? aside.from : backHref;
}

// Whether going to `to` should land where that screen was left, instead of at its top. The back arrow and the
// swipe always do. The bottom bar does only when it leaves a step aside for the very screen it started from; any
// other tab opens fresh, at its top (the user, 2026-10-22).
export function restoresScroll(step: Step, from: string, to: string, aside: Aside | null): boolean {
  if (step === "back") return true;
  return step === "tab" && aside !== null && sectionOf(from) === sectionOf(aside.to) && pathOf(to) === pathOf(aside.from);
}
