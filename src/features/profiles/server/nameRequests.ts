import type { SupabaseClient } from "@supabase/supabase-js";
import type { NameOutcome } from "../types";
import { notifyManagersOfNameRequest, notifyOfApprovedName } from "./notifyName";

// The two steps of changing a name. Each records the step as the caller, then tells whoever is waiting on
// it. `supabase` is the caller's own client, so schema.sql decides what is allowed.

// Sets my name. The database decides which happens: saved at once (I am in no group, so nobody reads it
// yet), or kept as a request for a manager (I am in one, and a name must not change unseen).
export async function setMyName(supabase: SupabaseClient, name: string): Promise<NameOutcome> {
  const { data: outcome, error } = await supabase.rpc("set_my_name", { new_name: name });
  if (error) throw new Error(error.message); // not signed in, or a name the database refuses

  if (outcome === "requested") await bestEffort(notifyManagersOfNameRequest);
  return outcome;
}

// Makes a requested name the person's name. The database function checks the caller's permission and
// answers whether there was a request, so a member calling this, or a second tap, changes nothing.
export async function approveNameRequest(supabase: SupabaseClient, userId: string) {
  const { data: approved, error } = await supabase.rpc("approve_name_request", { user_id: userId });
  if (error) throw new Error(error.message);
  if (!approved) throw new Error("No such request, or not allowed");

  await bestEffort(() => notifyOfApprovedName(userId));
}

// The step is already saved, so a push failure must not report "it failed", or the person does it twice.
async function bestEffort(notify: () => Promise<void>) {
  try {
    await notify();
  } catch (error) {
    console.error("name notification failed", error);
  }
}
