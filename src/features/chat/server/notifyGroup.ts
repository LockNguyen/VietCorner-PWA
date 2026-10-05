import "server-only";
import { sendPush } from "@/features/push/server/sendPush"; // PUSH
import { createAdminClient } from "@/lib/supabase/admin";
import type { Message } from "../types";

// Tells every other member of the group about `message`. This file decides who hears and what it says;
// delivering it is the push feature's job.
// Uses the admin client because RLS (correctly) hides other users' memberships.
export async function notifyGroup(message: Message) {
  const admin = createAdminClient();

  const [{ data: members }, { data: group }] = await Promise.all([
    admin.from("group_members").select("user_id").eq("group_id", message.group_id).neq("user_id", message.sender_id),
    admin.from("groups").select("name").eq("id", message.group_id).single(),
  ]);

  await sendPush(
    (members ?? []).map((member) => member.user_id),
    {
      title: group?.name ?? "New message",
      body: `${message.sender_email}: ${message.body}`,
      url: `/groups/${message.group_id}`,
    },
  );
}
