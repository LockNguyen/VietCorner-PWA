import type { SupabaseClient } from "@supabase/supabase-js";
import { getSubscribedUserIds } from "@/features/push/server/queries"; // PUSH

// Who is told about an event: the group's members for a group event, everyone with notifications on for a
// church-wide one. `admin` must be the service-role client: RLS hides other users' memberships.
export async function audienceOf(admin: SupabaseClient, groupId: string | null): Promise<string[]> {
  if (!groupId) return getSubscribedUserIds(admin);

  const { data: members } = await admin.from("group_members").select("user_id").eq("group_id", groupId);
  return (members ?? []).map((member) => member.user_id as string);
}
