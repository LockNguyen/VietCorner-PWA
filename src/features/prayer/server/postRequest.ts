import type { SupabaseClient } from "@supabase/supabase-js";

// Posts a request to the whole church as the signed-in user and answers its id, for the translation that follows
// (translateRequest.ts). `supabase` is the user's own client: the database takes the author from the login token,
// and the grants and policies in schema.sql decide whether the post is allowed.
export async function postRequest(supabase: SupabaseClient, body: string): Promise<string> {
  const { data, error } = await supabase
    .from("prayer_requests")
    .insert({ body }) // is_anonymous keeps its default, false
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}
