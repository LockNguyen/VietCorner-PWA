import type { SupabaseClient } from "@supabase/supabase-js";
import { translateRequest } from "./translateRequest";

// A reviewer's Retry: puts the request's translation back on the waiting list, then asks the AI service again.
// Answers whether a new translation was written; if not, the old one (if any) is still there to approve or correct.
// Permission check: no `if` here on purpose. `supabase` is the reviewer's own client, and
// `reopen_prayer_translation` (schema.sql 5d) answers false to anyone without "prayer.translations".
export async function retranslateRequest(supabase: SupabaseClient, requestId: string): Promise<"translated" | "failed" | "refused"> {
  const { data: reopened, error } = await supabase.rpc("reopen_prayer_translation", { request_id: requestId });
  if (error) throw new Error(error.message);
  if (!reopened) return "refused";
  return (await translateRequest(requestId)) ? "translated" : "failed";
}
