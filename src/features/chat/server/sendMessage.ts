import type { SupabaseClient } from "@supabase/supabase-js";
import type { Message } from "../types";
import { notifyGroup } from "./notifyGroup";

// Saves a message as the signed-in user, then pushes it to the other group members.
// `supabase` must be the user's own client, so RLS rejects non-members.
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

  await notifyGroup(message);
  return message;
}
