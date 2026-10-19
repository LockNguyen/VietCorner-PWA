import { isoDate } from "@/lib/churchTime";
import { newSecret } from "./handoff";

// The sign-in this device asked for and is waiting on, kept on the device.
//
// Why on the device and not in memory: an iPhone often reloads the installed app when the person comes
// back from their email. Without this the app would return to "enter your email", and lose the secret key
// that collects the sign-in (handoff.ts).

// `claimKey`: the secret whose hash the email's link carries; whoever holds it collects the sign-in.
export type PendingSignIn = { claimKey: string; email: string; sentAt: number };

const KEY = "vietcorner.signin";
const DAY_KEY = "vietcorner.signin.today";

// Never throws: storage can be unavailable (private mode). Then the wait simply does not survive a reload.
export function savePendingSignIn(pending: PendingSignIn): void {
  write(KEY, pending);
}

// The sign-in being waited on, or null when there is none or it was asked for on an earlier church day
// (its links have run out: server/sendLink.ts).
export function readPendingSignIn(now = new Date()): PendingSignIn | null {
  const pending = read<PendingSignIn>(KEY);
  return typeof pending?.claimKey === "string" && isoDate(new Date(pending.sentAt)) === isoDate(now) ? pending : null;
}

export function clearPendingSignIn(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}

// This device's claim key for today, made on first use. One per church day, not one per email: every link
// asked for today carries the same attempt, so whichever email is opened, even an older one, this device
// collects it (the user, 2026-10-19). Kept apart from the wait, so going back and asking again keeps it.
export function todaysClaimKey(now = new Date()): string {
  const kept = readTodaysClaimKey(now);
  if (kept) return kept;
  const claimKey = newSecret();
  write(DAY_KEY, { claimKey, day: isoDate(now) });
  return claimKey;
}

// Today's claim key if this device has asked for a link today, else null. For the link's page, to tell
// whether it was opened on the device that asked.
export function readTodaysClaimKey(now = new Date()): string | null {
  const kept = read<{ claimKey: string; day: string }>(DAY_KEY);
  return kept?.day === isoDate(now) ? kept.claimKey : null;
}

function read<Value>(key: string): Value | null {
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? "null");
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Blocked or full: the sign-in still works while this screen stays open.
  }
}
