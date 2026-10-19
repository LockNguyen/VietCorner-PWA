// The two text sizes a member can choose (the user, 2026-10-17): the app as it was, or every text bigger.
export type TextSize = "compact" | "big";

// Where this phone keeps the choice. A cookie, so the server draws the first screen in the right size and
// nothing jumps after loading; on this device only, since it belongs to the eyes holding this phone.
export const TEXT_SIZE_COOKIE = "text-size";

// Read on the server from the cookie's value; anything else is the default, compact.
export function textSizeOf(value: string | undefined): TextSize {
  return value === "big" ? "big" : "compact";
}
