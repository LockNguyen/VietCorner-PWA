import { createClient } from "@/lib/supabase/client";

// Auth API: every call the browser makes for signing in and out lives in this file.
// A failure is thrown as Supabase gave it: errors.ts reads its status and code to say what went wrong.

// Whether an address has an account (`account_exists`, callable signed out), so a sign-in for an unknown
// address says "no account yet" at once instead of sending nothing.
export async function accountExists(email: string): Promise<boolean> {
  const { data, error } = await createClient().rpc("account_exists", { address: email });
  if (error) throw error;
  return data === true;
}

// Email a link that signs in (the README, "Hand-off"). `attempt` names this device's request in the link,
// so whichever browser opens the email can hand the sign-in back to this one. With `name` it may also
// create the account (sign-up). Through our server, which adds a key of its own to the link (server/sendLink.ts).
// A refusal is thrown with Supabase's status and code, as errors.ts expects; no connection, as status 0.
export async function sendSignInLink(email: string, attempt: string, name?: string): Promise<void> {
  const response = await post("/api/auth/link", { email, attempt, ...(name !== undefined && { name }) }).catch(() => {
    throw { status: 0 };
  });
  if (!response.ok) throw { status: response.status, code: (await response.json()).code };
}

// Trade the link's one-time token for a session. On success, Supabase stores it in cookies.
// Type "email" covers both a new account's link and a sign-in link.
export async function signInWithLink(tokenHash: string) {
  const { error } = await createClient().auth.verifyOtp({ token_hash: tokenHash, type: "email" });
  if (error) throw error;
}

// POST the link's key: it was tapped, so the device that asked may now collect the sign-in.
export async function leaveSignIn(attempt: string, linkKey: string): Promise<void> {
  const response = await post("/api/auth/handoff", { attempt, linkKey });
  if (!response.ok) throw new Error((await response.json()).error);
}

// POST my secret key to collect a tapped link's sign-in, as a one-time token. Null while none has been tapped.
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
