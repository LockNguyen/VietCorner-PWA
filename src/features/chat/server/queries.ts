import type { SupabaseClient } from "@supabase/supabase-js";
import type { Message } from "../types";

// Chat reads for pages (Server Components). They run as the signed-in user, so RLS applies.
// The page creates `supabase` and passes it in, which keeps these functions free of Next.js.

// What the chat screen starts with. RLS returns no messages to someone who is not a member.
export async function getChatRoom(supabase: SupabaseClient, groupId: string) {
  const [messages, user] = await Promise.all([
    supabase.from("messages").select("*").eq("group_id", groupId)
      .order("created_at", { ascending: false }).limit(50),
    supabase.auth.getUser(),
  ]);

  return {
    messages: ((messages.data ?? []) as Message[]).reverse(), // newest 50, shown oldest first
    userId: user.data.user?.id ?? "",
  };
}
