import type { SupabaseClient } from "@supabase/supabase-js";

// Server-side reads for this feature.

// Everyone with notifications on, on at least one device: the audience of a church-wide announcement.
// `admin` must be the service-role client: RLS shows a user only their own devices.
export async function getSubscribedUserIds(admin: SupabaseClient): Promise<string[]> {
  const { data } = await admin.from("push_subscriptions").select("user_id");
  return [...new Set((data ?? []).map((row) => row.user_id as string))];
}
