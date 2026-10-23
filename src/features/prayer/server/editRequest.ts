import type { SupabaseClient } from "@supabase/supabase-js";

// Changes the words of the signed-in user's own request, and answers whether it did. RLS ignores the call for
// anyone else's (false). The database clears the old translation in the same update (schema.sql 5d), so the
// caller translates the new words.
export async function editRequest(supabase: SupabaseClient, requestId: string, body: string): Promise<boolean> {
  const { data, error } = await supabase.from("prayer_requests").update({ body }).eq("id", requestId).select("id");
  if (error) throw new Error(error.message);
  return data.length > 0;
}
