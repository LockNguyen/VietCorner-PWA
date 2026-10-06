import type { SupabaseClient } from "@supabase/supabase-js";
import { notifyManagersOfRequest, notifyNewMember } from "./notifyJoin";

// The two steps of getting into a group. Each records the step as the caller, then tells whoever is
// waiting on it. `supabase` is the caller's own client, so schema.sql decides what is allowed.

// Asks to join. The request opens nothing; it waits for a manager.
export async function requestToJoin(supabase: SupabaseClient, groupId: string) {
  const { error } = await supabase.from("group_join_requests").insert({ group_id: groupId });
  if (error) throw new Error(error.message); // not signed in, a removed group, or already asked

  await bestEffort(() => notifyManagersOfRequest(groupId));
}

// Lets someone in. The database function checks the caller's permission and answers whether there was a
// request to approve, so a member calling this, or a second tap, changes nothing and notifies nobody.
export async function approveJoinRequest(supabase: SupabaseClient, groupId: string, userId: string) {
  const { data: approved, error } = await supabase.rpc("approve_join_request", { group_id: groupId, user_id: userId });
  if (error) throw new Error(error.message);
  if (!approved) throw new Error("No such request, or not allowed");

  await bestEffort(() => notifyNewMember(groupId, userId));
}

// The step is already saved, so a push failure must not report "it failed", or the person does it twice.
async function bestEffort(notify: () => Promise<void>) {
  try {
    await notify();
  } catch (error) {
    console.error("join notification failed", error);
  }
}
