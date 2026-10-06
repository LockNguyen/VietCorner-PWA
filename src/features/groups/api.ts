import { createClient } from "@/lib/supabase/client";

// Groups API: every call the browser makes for this feature. RLS in schema.sql decides what is allowed.
// - Managing groups and declining a request go straight to Supabase.
// - Asking to join and approving go through our API routes, because each notifies someone (needs secrets).

// POST a new group. RLS allows it only with the "groups.manage" permission.
export async function createGroup(name: string) {
  const { error } = await createClient().from("groups").insert({ name });
  if (error) throw new Error(error.message);
}

// PATCH a group's name. RLS allows it only with the "groups.manage" permission.
export async function renameGroup(groupId: string, name: string) {
  const { error } = await createClient().from("groups").update({ name }).eq("id", groupId);
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
