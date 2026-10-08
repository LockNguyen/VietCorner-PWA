import { createClient } from "@/lib/supabase/client";

// Auth API: every call the browser makes for signing in and out lives in this file.
// A failure is thrown as Supabase gave it: errors.ts reads its status and code to say what went wrong.

// Sign-in step 1: email a one-time code. Creates the account if the email is new.
export async function sendLoginCode(email: string) {
  const { error } = await createClient().auth.signInWithOtp({ email });
  if (error) throw error;
}

// Sign-in step 2: check the code. On success, Supabase stores the session in cookies.
export async function verifyLoginCode(email: string, code: string) {
  const { error } = await createClient().auth.verifyOtp({ email, token: code, type: "email" });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await createClient().auth.signOut();
  if (error) throw error;
}
