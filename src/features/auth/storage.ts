// The sign-in this device asked for and is waiting on, kept on the device.
//
// Why on the device and not in memory: an iPhone often reloads the installed app when the person comes
// back from their email. Without this the app would return to "enter your email", and lose the secret key
// that collects the sign-in (handoff.ts).

// `claimKey`: the secret whose hash the email's link carries; whoever holds it collects the sign-in.
export type PendingSignIn = { claimKey: string; email: string; sentAt: number };

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
    // A wait saved in the password era (a new account, without a key) cannot be collected: ignored.
    return typeof pending?.claimKey === "string" && now - pending.sentAt < LINK_LIFETIME_MS ? pending : null;
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
