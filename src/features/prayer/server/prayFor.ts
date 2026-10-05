import type { SupabaseClient } from "@supabase/supabase-js";
import { notifyAuthor } from "./notifyAuthor";

// Counts one prayer as the signed-in user, then tells the author.
// Permission check: there is no `if` here on purpose. `supabase` is the user's own client, and the
// `pray_for_request` function in schema.sql decides whether this prayer counts: not your own request, not
// an answered one, not one from a group you never joined. It answers false for those, and nobody is told.
export async function prayFor(supabase: SupabaseClient, requestId: string): Promise<void> {
  const { data: counted, error } = await supabase.rpc("pray_for_request", { request_id: requestId });
  if (error) throw new Error(error.message);
  if (!counted) return;

  // The notification is best-effort. The prayer is already counted, so a push failure must not report
  // "praying failed", or the member taps again and is counted twice.
  try {
    await notifyAuthor(requestId);
  } catch (error) {
    console.error("notifyAuthor failed", error);
  }
}
