import { createClient } from "@/lib/supabase/client";

// Groups API: every call the browser makes for this feature. RLS in schema.sql decides what is allowed.

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

// POST a membership: the signed-in user joins a group. RLS only allows joining as yourself.
export async function joinGroup(groupId: string) {
  const { error } = await createClient().from("group_members").insert({ group_id: groupId });
  if (error) throw new Error(error.message);
}
