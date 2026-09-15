import type { SupabaseClient } from "@supabase/supabase-js";

// Auth reads for pages (Server Components). The page creates `supabase` and passes it in.

// The signed-in user, or null.
export async function getCurrentUser(supabase: SupabaseClient) {
  const { data } = await supabase.auth.getUser();
  return data.user;
}
