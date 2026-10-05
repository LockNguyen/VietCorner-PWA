import type { SupabaseClient } from "@supabase/supabase-js";
import type { Group, GroupWithMembership } from "../types";

// Group reads for pages (Server Components). They run as the signed-in user, so RLS applies.
// The page creates `supabase` and passes it in, which keeps these functions free of Next.js.

// All groups, each marked with whether the signed-in user has joined.
export async function getGroups(supabase: SupabaseClient): Promise<GroupWithMembership[]> {
  const [groups, memberships] = await Promise.all([
    supabase.from("groups").select("id, name").order("name"),
    supabase.from("group_members").select("group_id"), // RLS returns only my memberships
  ]);
  if (groups.error) throw new Error(groups.error.message);

  const joinedGroupIds = new Set((memberships.data ?? []).map((membership) => membership.group_id));
  return groups.data.map((group) => ({ ...group, joined: joinedGroupIds.has(group.id) }));
}

// One group, or null if it does not exist.
export async function getGroup(supabase: SupabaseClient, groupId: string): Promise<Group | null> {
  const { data } = await supabase.from("groups").select("id, name").eq("id", groupId).maybeSingle();
  return data;
}
