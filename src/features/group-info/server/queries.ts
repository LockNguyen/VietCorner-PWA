import type { SupabaseClient } from "@supabase/supabase-js";
import { photosPage } from "../photos";
import type { DirectoryGroup, Photo } from "../types";

// Server-side reads for this feature. The page creates the client and passes it in.

// Every active group with its size, its details and whether the signed-in person is in it, by name.
// One trip to the database: `group_directory()` (schema.sql). The browser makes the same call to refresh (api.ts).
export async function getGroupDirectory(supabase: SupabaseClient): Promise<DirectoryGroup[]> {
  const { data, error } = await supabase.rpc("group_directory");
  if (error) return []; // also the answer before schema.sql has been run
  return data;
}

// A group's first page of pictures, for its page and its editor: they arrive with the page instead of being
// asked for once it is on screen (the user, 2026-10-22: one request, not two after the page).
export async function getFirstPhotos(supabase: SupabaseClient, groupId: string): Promise<Photo[]> {
  try {
    return await photosPage(supabase, groupId);
  } catch {
    return []; // a hiccup: the page still opens, without pictures; adding one reads them again
  }
}
