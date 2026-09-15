import "server-only";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Message } from "../types";

// Sends a push notification about `message` to every device of every other group member.
// Uses the admin client because RLS (correctly) hides other users' subscriptions.
export async function notifyGroup(message: Message) {
  const admin = createAdminClient();

  const { data: members } = await admin
    .from("group_members")
    .select("user_id")
    .eq("group_id", message.group_id)
    .neq("user_id", message.sender_id);

  const userIds = (members ?? []).map((member) => member.user_id);
  if (userIds.length === 0) return;

  const [{ data: group }, { data: subscriptions }] = await Promise.all([
    admin.from("groups").select("name").eq("id", message.group_id).single(),
    admin.from("push_subscriptions").select("endpoint, subscription").in("user_id", userIds),
  ]);

  // Set here, not at import time, so a missing env var can't break the build.
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );

  // public/sw.js reads these fields in its "push" handler.
  const payload = JSON.stringify({
    title: group?.name ?? "New message",
    body: `${message.sender_email}: ${message.body}`,
    url: `/groups/${message.group_id}`,
  });

  await Promise.all(
    (subscriptions ?? []).map(async ({ endpoint, subscription }) => {
      try {
        await webpush.sendNotification(subscription, payload);
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        // 404/410 = the device unsubscribed or the subscription expired. Delete it so we stop trying.
        if (status === 404 || status === 410) {
          await admin.from("push_subscriptions").delete().eq("endpoint", endpoint);
        } else {
          console.error("Push failed", status, endpoint);
        }
      }
    }),
  );
}
