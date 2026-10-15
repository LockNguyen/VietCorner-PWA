import type { SupabaseClient } from "@supabase/supabase-js";
import type { DirectoryGroup } from "../types";

// Server-side reads for this feature. The page creates the client and passes it in.

// Every active group with its size, its details and whether the signed-in person is in it, by name.
// One trip to the database: `group_directory()` (schema.sql). The browser makes the same call to refresh (api.ts).
export async function getGroupDirectory(supabase: SupabaseClient): Promise<DirectoryGroup[]> {
  const { data, error } = await supabase.rpc("group_directory");
  if (error) return []; // also the answer before schema.sql has been run
  return data;
}
