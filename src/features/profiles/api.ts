import { createClient } from "@/lib/supabase/client";
import { getNames as readNames } from "./server/queries";
import type { Names } from "./types";

// Every browser → backend call for this foundation. Both are simple, with no side effects, so they go
// straight to Supabase; RLS lets a user change only their own row.

// PATCH my own name. The row already exists (the database made it with the account).
export async function saveName(name: string): Promise<void> {
  const supabase = createClient();
  const myId = (await supabase.auth.getClaims()).data?.claims.sub ?? "";
  const { error } = await supabase
    .from("profiles")
    .update({ name, named_at: new Date().toISOString() })
    .eq("user_id", myId);
  if (error) throw new Error(error.message);
}

// GET the names of these people: for someone who appears on a screen after it loaded (a first chat message).
export function getNames(userIds: string[]): Promise<Names> {
  return readNames(createClient(), userIds); // the same read as the server's, with the browser's client
}
