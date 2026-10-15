import type { SupabaseClient } from "@supabase/supabase-js";
import type { Group, GroupWithMembership, JoinRequest, Person } from "../types";

// Group reads for pages (Server Components). They run as the signed-in user, so RLS applies.
// The page creates `supabase` and passes it in, which keeps these functions free of Next.js.

// All active groups, each marked with whether the signed-in user has joined, or is waiting to be let in.
// One trip to the database: `my_groups()` (schema.sql). The browser makes the same call to refresh (api.ts).
export async function getGroups(supabase: SupabaseClient): Promise<GroupWithMembership[]> {
  const { data, error } = await supabase.rpc("my_groups");
  if (error) throw new Error(error.message);
  return data;
}

// Everyone waiting to be let into a group, longest wait first. Returns more than the caller's own requests
// only to someone with the "groups.manage" permission.
export async function getJoinRequests(supabase: SupabaseClient): Promise<JoinRequest[]> {
  const { data } = await supabase
    .from("group_join_requests")
    .select("group_id, user_id, user_email, requested_at")
    .order("requested_at");
  return data ?? [];
}

// Everyone who may use the app, with their email and the groups they are in, by name: `group_people()`
// (schema.sql). Empty for anyone without the "groups.manage" permission: the function checks it.
export async function getGroupPeople(supabase: SupabaseClient): Promise<Person[]> {
  const { data, error } = await supabase.rpc("group_people");
  if (error) return []; // also the answer before section 2c of schema.sql has been run
  return data;
}

// One group, or null if it does not exist or was removed.
export async function getGroup(supabase: SupabaseClient, groupId: string): Promise<Group | null> {
  const { data } = await supabase
    .from("groups")
    .select("id, name, member_count, thumbnail_path")
    .eq("id", groupId)
    .is("deleted_at", null)
    .maybeSingle();
  return data;
}
