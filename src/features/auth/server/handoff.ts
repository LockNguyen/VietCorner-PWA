import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { attemptOf } from "../handoff";

// The two halves of handing a sign-in from the browser that opened the email to the device that asked.
// Both use the admin client: `login_handoffs` is closed to every browser (schema.sql).
// Neither has a signed-in user to check: this is how one signs in. What protects it is in handoff.ts.

// why: Supabase honours an email link for an hour; a row older than that can sign nobody in.
const HANDOFF_LIFETIME_MS = 60 * 60 * 1000;

const cutoff = () => new Date(Date.now() - HANDOFF_LIFETIME_MS).toISOString();

// Leaves the link's token under `attempt`, for the device whose key hashes to it.
// The first one left wins: a second call for the same attempt changes nothing.
export async function leaveSignIn(attempt: string, tokenHash: string): Promise<void> {
  const admin = createAdminClient();
  // Tidy first: rows nobody collected would otherwise stay for good. There is no scheduler for this.
  await admin.from("login_handoffs").delete().lt("created_at", cutoff());

  const { error } = await admin
    .from("login_handoffs")
    .upsert({ attempt, token_hash: tokenHash }, { onConflict: "attempt", ignoreDuplicates: true });
  if (error) throw new Error(error.message);
}

// Collects what was left for the holder of `claimKey`, once: the row is deleted as it is read.
// Null while nothing has been left, which is the usual answer: the asking device calls this until there is.
export async function collectSignIn(claimKey: string): Promise<string | null> {
  const { data, error } = await createAdminClient()
    .from("login_handoffs")
    .delete()
    .eq("attempt", await attemptOf(claimKey))
    .gte("created_at", cutoff())
    .select("token_hash");
  if (error) throw new Error(error.message);
  return data[0]?.token_hash ?? null;
}
