import type { SupabaseClient } from "@supabase/supabase-js";
import type { Message } from "../types";
import { notifyGroup } from "./notifyGroup";

// Saves a message as the signed-in user, then pushes it to the other group members.
// Permission check: there is no `if (isMember)` here on purpose. `supabase` is the user's own client,
// so the database enforces the "Members post as themselves" policy in schema.sql. A non-member's insert
// fails with "violates row-level security policy". Don't swap in the admin client, which would skip that check.
export async function sendMessage(
  supabase: SupabaseClient,
  input: { groupId: string; body: string },
): Promise<Message> {
  const { data: message, error } = await supabase
    .from("messages")
    .insert({ group_id: input.groupId, body: input.body })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Push is best-effort. The message is already saved, so a push failure must not report "send failed".
  // Otherwise the user retries and posts a duplicate.
  try {
    await notifyGroup(message);
  } catch (error) {
    console.error("notifyGroup failed", error);
  }
  return message;
}
