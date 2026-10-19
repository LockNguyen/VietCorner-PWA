// Why a sign-in step failed, in terms a person can act on. Pure, so the mapping is tested without Supabase.
//
// Keyed by cause, not by Supabase's message: its wording is English, technical, and changes between versions.
// strings.ts has the words for each cause.
export type SignInProblem = "offline" | "tooMany" | "badEmail" | "badLink" | "noAccount" | "other";

// `error` is what supabase-js threw or returned (an AuthError carries `status` and `code`), or our own
// `{ code: "no_account" }` when `account_exists` said no before any email was asked for (hooks/useEmailLink.ts).
export function problemWith(error: unknown): SignInProblem {
  const { name, status, code } = (error ?? {}) as { name?: string; status?: number; code?: string };

  // The request never reached Supabase: no network, or the phone gave up waiting.
  if (name === "AuthRetryableFetchError" || status === 0) return "offline";
  // Supabase limits how often a link may be asked for, per address and per device.
  if (status === 429) return "tooMany";
  // One code for "too old", "already used" and "not a real link": Supabase does not say which, so neither do we.
  if (code === "otp_expired") return "badLink";
  if (code === "email_address_invalid" || code === "validation_failed") return "badEmail";
  // Our own check, and Supabase's answer when a sign-in link is asked for an address it does not know.
  if (code === "no_account" || code === "otp_disabled" || code === "user_not_found") return "noAccount";
  return "other";
}
