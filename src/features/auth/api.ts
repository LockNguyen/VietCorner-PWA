import { createClient } from "@/lib/supabase/client";

// Auth API: every call the browser makes for signing in and out lives in this file.
// A failure is thrown as Supabase gave it: errors.ts reads its status and code to say what went wrong.

// Sign in with what the phone's password manager filled in. The sign-in screen does not call this: it posts
// its form to `/api/auth/sign-in` (the README, "Saving the password"). The sign-up wait does, with the
// password it holds in memory.
export async function signIn(email: string, password: string) {
  const { error } = await createClient().auth.signInWithPassword({ email, password });
  if (error) throw error;
}

// New account: Supabase emails a link that proves the address. Opening it confirms the address at
// Supabase, then shows our "go back to the app" page; this device signs in with the password meanwhile.
// `name` rides along as the account's metadata; the profiles trigger makes it the person's name.
export async function signUp(name: string, email: string, password: string) {
  const { data, error } = await createClient().auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${window.location.origin}/login/confirmed`, data: { name } },
  });
  if (error) throw error;
  // why: for an address that already has an account Supabase answers "sent" and sends nothing; its only
  // sign is a user with no identities. Said out loud, or the person would wait for an email forever.
  if (data.user?.identities?.length === 0) throw { code: "user_already_exists" };
}

// A sign-up link opened in the browser that signed up: trade its `code` for a session right there.
// Works only in that browser, which holds the other half of the code (Supabase's PKCE): anywhere else it
// fails, and the browser that is waiting signs in by itself instead (hooks/useEmailLink.ts).
export async function signInWithConfirmLink(code: string) {
  const { error } = await createClient().auth.exchangeCodeForSession(code);
  if (error) throw error;
}

// Forgot password: email a link that signs in once, so a new password can be chosen.
// `attempt` names this device's request in the link (handoff.ts), so whichever browser opens the email
// can hand the sign-in back to this one.
export async function sendPasswordReset(email: string, attempt: string) {
  const redirectTo = `${window.location.origin}/login/confirm?attempt=${attempt}`;
  const { error } = await createClient().auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
}

// Trade a reset link's one-time token for a session. On success, Supabase stores it in cookies.
export async function signInWithResetLink(tokenHash: string) {
  const { error } = await createClient().auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
  if (error) throw error;
}

// POST the link's token for the device that asked: this browser is not the one signing in.
export async function leaveSignIn(attempt: string, tokenHash: string): Promise<void> {
  const response = await post("/api/auth/handoff", { attempt, tokenHash });
  if (!response.ok) throw new Error((await response.json()).error);
}

// POST my secret key to collect a sign-in left for this device. Null while nothing has been left yet.
export async function collectSignIn(claimKey: string): Promise<string | null> {
  const response = await post("/api/auth/claim", { claimKey });
  if (!response.ok) throw new Error((await response.json()).error);
  return (await response.json()).tokenHash;
}

export async function signOut() {
  const { error } = await createClient().auth.signOut();
  if (error) throw error;
}

function post(url: string, body: Record<string, string>) {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
