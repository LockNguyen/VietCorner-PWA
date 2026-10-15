import type { SupabaseClient } from "@supabase/supabase-js";
import type { WaitingAccount } from "../types";

// Server-side reads for this feature. The page creates the client and passes it in.

// Everyone waiting to be let in, longest wait first. Empty for anyone without the "accounts.manage"
// permission: the database function checks it (schema.sql).
export async function getWaitingAccounts(supabase: SupabaseClient): Promise<WaitingAccount[]> {
  const { data, error } = await supabase.rpc("waiting_accounts");
  if (error) return []; // also the answer before schema.sql has been run
  return data;
}
