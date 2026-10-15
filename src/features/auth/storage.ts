// The email this device asked for and is waiting on (confirm a new account, or reset a password), kept on the device.
//
// Why on the device and not in memory: an iPhone often reloads the installed app when the person comes
// back from their email. Without this the app would return to "enter your email", and a reset would lose
// the secret key that collects it.

export type PendingSignIn =
  // A new account: the link confirms the address at Supabase; the app then signs in with the password.
  | { purpose: "signup"; email: string; sentAt: number }
  // A reset: the link's sign-in is handed back to the holder of `claimKey` (handoff.ts).
  | { purpose: "recovery"; claimKey: string; email: string; sentAt: number };

// After a reset's link is used: choose the new password.
export const NEW_PASSWORD_PATH = "/settings/password";

const KEY = "vietcorner.signin";

// why: Supabase honours an email link for an hour. Past that, waiting is pointless and the form returns.
const LINK_LIFETIME_MS = 60 * 60 * 1000;

// Never throws: storage can be unavailable (private mode). Then the wait simply does not survive a reload.
export function savePendingSignIn(pending: PendingSignIn): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(pending));
  } catch {
    // Blocked or full: the sign-in still works while this screen stays open.
  }
}

// The sign-in being waited on, or null when there is none or its link has run out.
export function readPendingSignIn(now = Date.now()): PendingSignIn | null {
  try {
    const pending = JSON.parse(window.localStorage.getItem(KEY) ?? "null") as PendingSignIn | null;
    // A wait saved before passwords existed has no purpose: it was for a sign-in link that no longer exists.
    // sentAt is ms since 1970.
    return pending?.purpose && now - pending.sentAt < LINK_LIFETIME_MS ? pending : null;
  } catch {
    return null;
  }
}

export function clearPendingSignIn(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}
