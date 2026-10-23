import type { SupabaseClient } from "@supabase/supabase-js";
import { PHOTO_BUCKET, PHOTO_PAGE_SIZE, PHOTO_URL_SECONDS, photoPaths, type Photo } from "./types";

// A page of a group's pictures, newest first, each with its signed addresses: one read and one signing, both
// close to the database. The same for the group's page on the server (server/queries.ts: the first page comes
// with the page, 2026-10-22) and for the strip in the browser (api.ts: the pages after). The client decides who
// is asking; RLS and the bucket's policies decide what they get (schema.sql).
export async function photosPage(supabase: SupabaseClient, groupId: string, olderThan?: string): Promise<Photo[]> {
  let query = supabase
    .from("group_photos")
    .select("id, taken_on, caption, created_at")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .limit(PHOTO_PAGE_SIZE);
  if (olderThan) query = query.lt("created_at", olderThan);

  const { data: rows, error } = await query;
  if (error) throw new Error(error.message);
  if (rows.length === 0) return [];

  // The bucket is private, so a picture is shown through a signed address. Small then full, per picture.
  const paths = rows.flatMap((row) => [photoPaths(groupId, row.id).small, photoPaths(groupId, row.id).full]);
  const { data: signed, error: signError } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(paths, PHOTO_URL_SECONDS);
  if (signError) throw new Error(signError.message);

  return rows.map((row, index) => ({
    ...row,
    // Empty when a file is missing (an upload cut short): the picture then draws as its grey square.
    smallUrl: signed[index * 2].signedUrl ?? "",
    fullUrl: signed[index * 2 + 1].signedUrl ?? "",
  }));
}
