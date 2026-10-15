import type { SupabaseClient } from "@supabase/supabase-js";
import type { PersonSummary } from "../types";

// Server-side reads for this feature. The page creates the client and passes it in.

// Everyone, by name, with their roles and groups: `people_list()`, one trip. Empty for anyone without
// "users.manage", and before schema.sql has been run.
export async function getPeople(supabase: SupabaseClient): Promise<PersonSummary[]> {
  const { data, error } = await supabase.rpc("people_list");
  if (error) return [];
  return data;
}
