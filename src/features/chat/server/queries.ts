import type { SupabaseClient } from "@supabase/supabase-js";
import type { Group, GroupWithMembership, Message } from "../types";

// Chat reads for pages (Server Components). They run as the signed-in user, so RLS applies.
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

// Everything the chat screen needs, or null if the group doesn't exist.
export async function getChatRoom(supabase: SupabaseClient, groupId: string) {
  const [group, messages, user] = await Promise.all([
    supabase.from("groups").select("id, name").eq("id", groupId).maybeSingle(),
    supabase.from("messages").select("*").eq("group_id", groupId)
      .order("created_at", { ascending: false }).limit(50),
    supabase.auth.getUser(),
  ]);
  if (!group.data) return null;

  return {
    group: group.data as Group,
    messages: ((messages.data ?? []) as Message[]).reverse(), // newest 50, shown oldest first
    userId: user.data.user?.id ?? "",
  };
}
