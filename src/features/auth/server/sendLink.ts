import "server-only";
import { endOfChurchDay } from "@/lib/churchTime";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashOf, newSecret } from "../handoff";

export type LinkRequest = {
  email: string;
  attempt: string; // the asking device's (handoff.ts): the same for every link it asks for today
  name?: string; // only for a new account: the account is created, with this name
  origin: string; // the app's address, where the link leads back to
};

// Emails a sign-in link that works until the end of the church day, even after newer ones were sent.
// The email itself is Supabase's (its template, the README's Setup 5); the link inside it is ours: it carries
// a key made here, kept here only as a hash and never sent to the browser that asked. So the asker cannot
// approve their own link: only someone who reads the email can. Supabase's own token in the email, which
// a newer email would cancel, is not used.
// Throws Supabase's error as it is (status and code): errors.ts turns it into words for the person.
export async function sendSignInLink({ email, attempt, name, origin }: LinkRequest): Promise<void> {
  const admin = createAdminClient();
  const linkKey = newSecret();

  const { error } = await admin.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: name !== undefined, // signing in never makes an account
      data: name !== undefined ? { name } : undefined, // the profiles trigger makes it the person's name
      emailRedirectTo: `${origin}/login/confirm?attempt=${attempt}&key=${linkKey}`,
    },
  });
  if (error) throw error;

  // Tidy first: there is no scheduler, so each new link clears the links of days gone by.
  const now = new Date();
  await admin.from("sign_in_links").delete().lt("expires_at", now.toISOString());
  const { error: saveError } = await admin.from("sign_in_links").insert({
    key_hash: await hashOf(linkKey),
    attempt,
    email,
    expires_at: endOfChurchDay(now).toISOString(),
  });
  if (saveError) throw new Error(saveError.message);
}
