import type { SupabaseClient } from "@supabase/supabase-js";
import { notifyApproved } from "./notifyApproval";

// Lets one account in, as the signed-in admin, then tells the person.
// Permission check: there is no `if` here on purpose. `supabase` is the caller's own client, and the
// `approve_account` function in schema.sql checks their permission. It answers false for a member calling
// it, for a second tap and for an account already in, and then nobody is told.
export async function approveAccount(supabase: SupabaseClient, userId: string) {
  const { data: approved, error } = await supabase.rpc("approve_account", { user_id: userId });
  if (error) throw new Error(error.message);
  if (!approved) throw new Error("Already approved, or not allowed");

  // The approval is already saved, so a push failure must not report "it failed", or the admin taps again.
  try {
    await notifyApproved(userId);
  } catch (error) {
    console.error("notifyApproved failed", error);
  }
}
