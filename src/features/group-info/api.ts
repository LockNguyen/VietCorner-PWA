import { createClient } from "@/lib/supabase/client";
import { shrinkImage, shrinkUnder } from "@/lib/shrinkImage";
import {
  FULL_MAX_BYTES,
  FULL_SIDE,
  PHOTO_BUCKET,
  PHOTO_PAGE_SIZE,
  PHOTO_URL_SECONDS,
  photoPaths,
  SMALL_SIDE,
  type DirectoryGroup,
  type GroupInfoDraft,
  type NewPhoto,
  type Photo,
} from "./types";

// Group-info API: every call the browser makes for this feature. All go straight to Supabase; the
// policies in schema.sql (and, for a group's name and number of members, the groups feature's) decide what is allowed.

// GET the Groups page's list again, as the page first read it (server/queries.ts): `group_directory()`.
// For the list to refresh itself on arrival, without reloading the page.
export async function getGroupDirectory(): Promise<DirectoryGroup[]> {
  const { data, error } = await createClient().rpc("group_directory");
  if (error) throw new Error(error.message);
  return data;
}

// PUT everything the group editor shows, for its one Save (an empty field = "not said"). Two writes: the name
// and size live on the group itself (the groups feature's table and policy), when, where and notes on its
// `group_info` row, made the first time and changed after that. Both need the "groups.manage" permission.
// Not one transaction: if the second fails the banner says so, and Save again writes both (each is idempotent).
export async function saveGroupInfo(groupId: string, draft: GroupInfoDraft): Promise<void> {
  const supabase = createClient();
  const { error: groupError } = await supabase
    .from("groups")
    .update({ name: draft.name.trim(), name_en: draft.nameEn.trim() || null, member_count: draft.memberCount === "" ? null : Number(draft.memberCount) })
    .eq("id", groupId);
  if (groupError) throw new Error(groupError.message);

  const { error } = await supabase
    .from("group_info")
    .upsert(
      {
        group_id: groupId,
        meets_weekday: draft.meetsWeekday === "" ? null : Number(draft.meetsWeekday),
        meets_time: draft.meetsTime || null,
        location: draft.location.trim() || null,
        location_en: draft.locationEn.trim() || null,
        notes: draft.notes.trim() || null,
        contact_phone: draft.contactPhone.trim() || null,
      },
      { onConflict: "group_id" },
    );
  if (error) throw new Error(error.message);
}

// GET one page of a group's pictures, newest first, each with addresses that work for an hour. Pass the
// `created_at` of the oldest one on screen to get the page after it; pass nothing for the newest page.
// Two trips: the rows, then one request that signs every file of the page.
export async function getPhotos(groupId: string, olderThan?: string): Promise<Photo[]> {
  const supabase = createClient();
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

// POST a picture to a group: shrunk on this device, its two files stored, then its row. For someone in
// the group, or a group manager. The files go first: a row without files would draw as a broken picture,
// while files without a row are only unseen.
export async function addPhoto(groupId: string, photo: NewPhoto): Promise<void> {
  const supabase = createClient();
  const id = crypto.randomUUID(); // made here, because the files are named after it before the row exists
  const paths = photoPaths(groupId, id);
  const [small, full] = await Promise.all([shrinkImage(photo.file, SMALL_SIDE, 0.7), shrinkUnder(photo.file, FULL_SIDE, FULL_MAX_BYTES)]);

  const bucket = supabase.storage.from(PHOTO_BUCKET);
  const uploads = await Promise.all([
    bucket.upload(paths.small, small, { contentType: "image/jpeg" }),
    bucket.upload(paths.full, full, { contentType: "image/jpeg" }),
  ]);
  const failed = uploads.find((upload) => upload.error);
  if (failed?.error) throw new Error(failed.error.message);

  const { error } = await supabase
    .from("group_photos")
    .insert({ id, group_id: groupId, taken_on: photo.takenOn || null, caption: photo.caption.trim() || null });
  if (error) throw new Error(error.message);
}

// DELETE a picture, for good: its row, then its two files. Needs the "groups.manage" permission.
// RLS does not refuse a delete it forbids, it just matches no row, so the row is asked back to tell.
export async function removePhoto(groupId: string, photoId: string): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase.from("group_photos").delete().eq("id", photoId).select("id");
  if (error) throw new Error(error.message);
  if (data.length === 0) throw new Error("No such photo, or not allowed");

  // Best-effort: with the row gone the picture is on no screen; files left behind only take up room.
  const paths = photoPaths(groupId, photoId);
  await supabase.storage.from(PHOTO_BUCKET).remove([paths.small, paths.full]);
}
