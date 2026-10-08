import type { SupabaseClient } from "@supabase/supabase-js";
import type { Names, Profile } from "../types";

// Server-side reads for this foundation. The page (or the root layout) creates the client and passes it in.

// The signed-in person's own profile. Null when it cannot be read (schema.sql not run yet): the caller
// then asks nothing, rather than locking everyone behind a question that cannot be saved.
export async function getMyProfile(supabase: SupabaseClient, userId: string): Promise<Profile | null> {
  const { data } = await supabase.from("profiles").select("name, named_at").eq("user_id", userId).maybeSingle();
  return data ? { name: data.name, named: data.named_at !== null } : null;
}

// The names of these people, in one read. Works with the user's client (any signed-in user may read names)
// and with the admin client (a notification written on the server).
export async function getNames(supabase: SupabaseClient, userIds: string[]): Promise<Names> {
  if (userIds.length === 0) return {};
  const { data } = await supabase.from("profiles").select("user_id, name").in("user_id", [...new Set(userIds)]);
  return Object.fromEntries((data ?? []).map((row) => [row.user_id, row.name]));
}
