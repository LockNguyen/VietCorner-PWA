import "server-only";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PushNotification } from "../types";

// Sends one notification to every device of the given users. The caller decides WHO (a group's other
// members, the author of a prayer request); this file only knows HOW.
// Uses the admin client because RLS (correctly) hides other users' subscriptions.
export async function sendPush(userIds: string[], notification: PushNotification) {
  if (userIds.length === 0) return;

  const admin = createAdminClient();
  const { data: subscriptions } = await admin
    .from("push_subscriptions")
    .select("endpoint, subscription")
    .in("user_id", userIds);

  // Set here, not at import time, so a missing env var can't break the build.
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );

  const payload = JSON.stringify(notification);

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
