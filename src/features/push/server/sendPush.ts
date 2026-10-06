import "server-only";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PushNotification } from "../types";

// why: a lively group sends many messages a minute, and a phone that buzzes for each one gets its
// notifications switched off. The first message says "this group is talking"; the rest are found on opening it.
const PAUSE_SECONDS = 60;

// Sends one notification to every device of the given users. The caller decides WHO (a group's other
// members, the author of a prayer request); this file only knows HOW.
//
// A user who was notified about the same topic less than a minute ago is skipped. Nothing is sent later
// to make up for it: there is no scheduler, so what arrives during the pause is silent.
// Uses the admin client because RLS (correctly) hides other users' subscriptions.
export async function sendPush(userIds: string[], notification: PushNotification) {
  if (userIds.length === 0) return;

  const admin = createAdminClient();
  // The database decides and records in one step (schema.sql), so two sends at once cannot both win.
  const { data: dueUserIds, error } = await admin.rpc("claim_push_turns", {
    user_ids: userIds,
    topic: notification.topic,
    pause_seconds: PAUSE_SECONDS,
  });
  if (error) throw new Error(error.message);
  if (dueUserIds.length === 0) return;

  const { data: subscriptions } = await admin
    .from("push_subscriptions")
    .select("endpoint, subscription")
    .in("user_id", dueUserIds);

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
