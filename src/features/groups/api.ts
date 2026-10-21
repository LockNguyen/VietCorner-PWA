import { shrinkUnder } from "@/lib/shrinkImage";
import { createClient } from "@/lib/supabase/client";
import { PICTURE_MAX_BYTES, PICTURE_SIDE, THUMBNAIL_BUCKET, type GroupWithMembership, type JoinRequest, type Person } from "./types";

// Groups API: every call the browser makes for this feature. RLS in schema.sql decides what is allowed.
// - Managing groups, putting people into them and declining a request go straight to Supabase.
// - Asking to join and approving go through our API routes, because each notifies someone (needs secrets).

// GET the group list again, as the page first read it (server/queries.ts): one call to `my_groups()`.
// For the list to refresh itself on arrival, without reloading the page.
export async function getMyGroups(): Promise<GroupWithMembership[]> {
  const { data, error } = await createClient().rpc("my_groups");
  if (error) throw new Error(error.message);
  return data;
}

// GET everyone who may use the app, with their email and groups, as the Admin page first read it
// (server/queries.ts): `group_people()`. For the admin's lists to refresh themselves on arrival.
export async function getGroupPeople(): Promise<Person[]> {
  const { data, error } = await createClient().rpc("group_people");
  if (error) throw new Error(error.message);
  return data;
}

// GET everyone waiting to join, as the Admin page first read it (server/queries.ts). RLS returns more than
// the caller's own only with "groups.manage". For the list to refresh itself on arrival.
export async function getJoinRequests(): Promise<JoinRequest[]> {
  const { data, error } = await createClient()
    .from("group_join_requests")
    .select("group_id, user_id, user_email, requested_at")
    .order("requested_at");
  if (error) throw new Error(error.message);
  return data;
}

// POST a new group. RLS allows it only with the "groups.manage" permission.
export async function createGroup(name: string): Promise<string> {
  const { data, error } = await createClient().from("groups").insert({ name }).select("id").single();
  if (error) throw new Error(error.message);
  return data.id; // the new group's editor opens next
}

// PUT a group's picture: shrunk on this device, stored under a new name, then recorded on the group.
// `replaces` is the picture it had, whose file is erased last. A new name each time, because a phone keeps
// a public file by its address: the same address would go on showing the old picture. Needs "groups.manage".
export async function setThumbnail(groupId: string, file: Blob, replaces: string | null) {
  const supabase = createClient();
  const bucket = supabase.storage.from(THUMBNAIL_BUCKET);
  const path = `${groupId}/${crypto.randomUUID()}.jpg`;

  const { error: uploadError } = await bucket.upload(path, await shrinkUnder(file, PICTURE_SIDE, PICTURE_MAX_BYTES), { contentType: "image/jpeg" });
  if (uploadError) throw new Error(uploadError.message);

  // RLS does not refuse an update it forbids, it matches no row: the row is asked back to tell.
  const { data, error } = await supabase.from("groups").update({ thumbnail_path: path }).eq("id", groupId).select("id");
  if (error) throw new Error(error.message);
  if (data.length === 0) throw new Error("No such group, or not allowed");

  if (replaces) await bucket.remove([replaces]); // best-effort: a file left behind is on no screen
}

// DELETE a group's picture: taken off the group, then its file erased. Needs "groups.manage".
export async function removeThumbnail(groupId: string, path: string) {
  const supabase = createClient();
  const { data, error } = await supabase.from("groups").update({ thumbnail_path: null }).eq("id", groupId).select("id");
  if (error) throw new Error(error.message);
  if (data.length === 0) throw new Error("No such group, or not allowed");

  await supabase.storage.from(THUMBNAIL_BUCKET).remove([path]); // best-effort, as above
}

// POST a person into a group. Needs "groups.manage". Nobody is told.
export async function addMember(groupId: string, userId: string) {
  const { error } = await createClient().from("group_members").insert({ group_id: groupId, user_id: userId });
  if (error) throw new Error(error.message);
}

// DELETE a person from a group. Needs "groups.manage". What they wrote there stays.
export async function removeMember(groupId: string, userId: string) {
  const { error } = await createClient().from("group_members").delete().eq("group_id", groupId).eq("user_id", userId);
  if (error) throw new Error(error.message);
}

// PATCH a group as removed. It disappears for everyone, with its chat, events and prayers; nothing is
// erased, and clearing `deleted_at` in the dashboard brings it all back.
export async function removeGroup(groupId: string) {
  const { error } = await createClient()
    .from("groups")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", groupId);
  if (error) throw new Error(error.message);
}

// POST a request to join a group. It opens nothing until a manager approves it; managers are told.
export function requestToJoin(groupId: string) {
  return post("/api/groups/join", { groupId });
}

// POST an approval: that person becomes a member, and is told.
export function approveJoinRequest(groupId: string, userId: string) {
  return post("/api/groups/approve", { groupId, userId });
}

// DELETE a request to join. Nobody is told; the person may ask again.
export async function declineJoinRequest(groupId: string, userId: string) {
  const { error } = await createClient()
    .from("group_join_requests")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

async function post(url: string, body: Record<string, string>) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error((await response.json()).error);
}
