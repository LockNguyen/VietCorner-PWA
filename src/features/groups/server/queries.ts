import type { SupabaseClient } from "@supabase/supabase-js";
import type { Group, GroupWithMembership, JoinRequest } from "../types";

// Group reads for pages (Server Components). They run as the signed-in user, so RLS applies.
// The page creates `supabase` and passes it in, which keeps these functions free of Next.js.

// All groups, each marked with whether the signed-in user has joined, or is waiting to be let in.
export async function getGroups(supabase: SupabaseClient): Promise<GroupWithMembership[]> {
  // My own id, from the login token. Members only ever receive their own requests (RLS), but a manager
  // receives everyone's, so "mine" has to be asked for by name.
  const myId = (await supabase.auth.getClaims()).data?.claims.sub ?? "";

  const [groups, memberships, requests] = await Promise.all([
    // Members never receive removed groups (RLS). A manager would, so the filter is spelled out.
    supabase.from("groups").select("id, name").is("deleted_at", null).order("name"),
    supabase.from("group_members").select("group_id"), // RLS returns only my memberships
    supabase.from("group_join_requests").select("group_id").eq("user_id", myId),
  ]);
  if (groups.error) throw new Error(groups.error.message);

  const joined = new Set((memberships.data ?? []).map((membership) => membership.group_id));
  const pending = new Set((requests.data ?? []).map((request) => request.group_id));
  return groups.data.map((group) => ({ ...group, joined: joined.has(group.id), pending: pending.has(group.id) }));
}

// Everyone waiting to be let into a group, longest wait first. Returns more than the caller's own requests
// only to someone with the "groups.manage" permission.
export async function getJoinRequests(supabase: SupabaseClient): Promise<JoinRequest[]> {
  const { data } = await supabase
    .from("group_join_requests")
    .select("group_id, user_id, requested_at")
    .order("requested_at");
  return data ?? [];
}

// One group, or null if it does not exist or was removed.
export async function getGroup(supabase: SupabaseClient, groupId: string): Promise<Group | null> {
  const { data } = await supabase
    .from("groups")
    .select("id, name")
    .eq("id", groupId)
    .is("deleted_at", null)
    .maybeSingle();
  return data;
}
