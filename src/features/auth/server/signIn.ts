import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { problemWith, type SignInProblem } from "../errors";

// Signs in with an email and password on the server; the client it is given writes the login cookie.
// Null when signed in, otherwise why not, with "no account with this email" told apart from "wrong
// password" (Supabase gives one answer for both; `account_exists` asks, schema.sql section 3).
export async function signInWithPassword(
  supabase: SupabaseClient,
  email: string,
  password: string,
): Promise<SignInProblem | null> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (!error) return null;

  const cause = problemWith(error);
  if (cause !== "wrongPassword") return cause;
  // If the question itself fails, "wrong password" stays: its message also leads somewhere useful.
  const { data: exists } = await supabase.rpc("account_exists", { address: email });
  return exists === false ? "noAccount" : "wrongPassword";
}

// Replaces the signed-in person's password. Null when saved, otherwise why not (too short, the same one…).
export async function setNewPassword(supabase: SupabaseClient, password: string): Promise<SignInProblem | null> {
  const { error } = await supabase.auth.updateUser({ password });
  return error ? problemWith(error) : null;
}
