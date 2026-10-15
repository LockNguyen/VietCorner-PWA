// Why a sign-in step failed, in terms a person can act on. Pure, so the mapping is tested without Supabase.
//
// Keyed by cause, not by Supabase's message: its wording is English, technical, and changes between versions.
// strings.ts has the words for each cause.
const SIGN_IN_PROBLEMS = [
  "offline",
  "tooMany",
  "badEmail",
  "badLink",
  "wrongPassword",
  "noAccount", // never from Supabase: server/signIn.ts asks `account_exists` after a "wrongPassword"
  "weakPassword",
  "samePassword",
  "notConfirmed",
  "alreadyRegistered",
  "other",
] as const;

export type SignInProblem = (typeof SIGN_IN_PROBLEMS)[number];

// Whether a value read from the address (`/login?problem=…`, where the sign-in route sends a failure)
// is one of ours. Anything else is ignored rather than shown.
export function isSignInProblem(value: unknown): value is SignInProblem {
  return SIGN_IN_PROBLEMS.includes(value as SignInProblem);
}

// `error` is what supabase-js threw or returned: an AuthError carries `status` and `code`.
export function problemWith(error: unknown): SignInProblem {
  const { name, status, code } = (error ?? {}) as { name?: string; status?: number; code?: string };

  // The request never reached Supabase: no network, or the phone gave up waiting.
  if (name === "AuthRetryableFetchError" || status === 0) return "offline";
  // Supabase limits how often a link may be asked for, per address and per device.
  if (status === 429) return "tooMany";
  // One code for "too old", "already used" and "not a real link": Supabase does not say which, so neither do we.
  if (code === "otp_expired") return "badLink";
  if (code === "email_address_invalid" || code === "validation_failed") return "badEmail";
  // One code for "no such account" and "wrong password": Supabase will not say which, so a stranger cannot test addresses.
  if (code === "invalid_credentials") return "wrongPassword";
  if (code === "weak_password") return "weakPassword";
  if (code === "same_password") return "samePassword";
  // Signing in before tapping the link in the "confirm your account" email.
  if (code === "email_not_confirmed") return "notConfirmed";
  if (code === "user_already_exists" || code === "email_exists") return "alreadyRegistered";
  return "other";
}
