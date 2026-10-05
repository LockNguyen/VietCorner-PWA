import { createClient } from "@/lib/supabase/client";

// Groups API: every call the browser makes for this feature. RLS in schema.sql decides what is allowed.

// POST a membership: the signed-in user joins a group. RLS only allows joining as yourself.
export async function joinGroup(groupId: string) {
  const { error } = await createClient().from("group_members").insert({ group_id: groupId });
  if (error) throw new Error(error.message);
}
