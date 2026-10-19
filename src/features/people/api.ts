import { createClient } from "@/lib/supabase/client";
import type { PersonSummary } from "./types";

// People API: every call the browser makes for this feature. Each is a database function that checks the
// caller holds "users.manage" itself (schema.sql); nothing here needs a secret, so there is no route.

// GET everyone again, as the Admin page first read them (server/queries.ts).
export async function getPeople(): Promise<PersonSummary[]> {
  const { data, error } = await createClient().rpc("people_list");
  if (error) throw new Error(error.message);
  return data;
}

// Give or take one role. It takes effect at the person's next token refresh, within 15 minutes.
export async function setRole(userId: string, role: string, given: boolean): Promise<void> {
  const { error } = await createClient().rpc("set_person_role", { user_id: userId, role, given });
  if (error) throw new Error(error.message);
}

// Delete the account and everything that is only theirs. Cannot be undone.
export async function removePerson(userId: string): Promise<void> {
  const { error } = await createClient().rpc("remove_person", { user_id: userId });
  if (error) throw new Error(error.message);
}
