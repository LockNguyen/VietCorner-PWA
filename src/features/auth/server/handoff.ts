import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashOf } from "../handoff";

// The two halves of handing a sign-in from the browser that opened the email to the device that asked.
// Both use the admin client: `sign_in_links` is closed to every browser (schema.sql).
// Neither has a signed-in user to check: this is how one signs in. What protects it is in handoff.ts.

// Marks a link as tapped, for the device whose `attempt` it names. False when the key is not one we sent
// for that attempt today: a made-up link, a link from another day, or one already collected.
export async function leaveSignIn(attempt: string, linkKey: string): Promise<boolean> {
  const now = new Date().toISOString();
  const { data, error } = await createAdminClient()
    .from("sign_in_links")
    .update({ approved_at: now })
    .eq("key_hash", await hashOf(linkKey))
    .eq("attempt", attempt)
    .gt("expires_at", now)
    .select("key_hash");
  if (error) throw new Error(error.message);
  return data.length > 0;
}

// Collects a tapped link for the holder of `claimKey`, once: a fresh one-time token for its address, which
// the device trades for a session. Null while none of today's links has been tapped, which is the usual
// answer: the asking device calls this until there is one.
export async function collectSignIn(claimKey: string): Promise<string | null> {
  const admin = createAdminClient();
  const attempt = await hashOf(claimKey);
  const now = new Date().toISOString();

  // Deleted as it is read, so two calls at once cannot both collect it.
  const { data, error } = await admin
    .from("sign_in_links")
    .delete()
    .eq("attempt", attempt)
    .not("approved_at", "is", null)
    .gt("expires_at", now)
    .select("email");
  if (error) throw new Error(error.message);
  if (data.length === 0) return null;

  // The day's other links for this device are spent with it: one sign-in per tap.
  await admin.from("sign_in_links").delete().eq("attempt", attempt);

  // Made now, used within seconds: generating a token never sends an email.
  const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: "magiclink", email: data[0].email });
  if (linkError) throw new Error(linkError.message);
  return link.properties.hashed_token;
}
