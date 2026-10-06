import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PushNotification } from "../types";
import { sendPush } from "./sendPush";

// Sends a notification the first time it is asked to with this `key`, and never again.
//
// For anything worked out on a schedule (a reminder): the scheduler asks again on every run, runs can
// overlap, and a run after an outage catches up. The key says which send this is; the database remembers
// it (schema.sql), so "already sent" survives restarts. Answers whether this call was the one that sent.
//
// The key is claimed before sending, so a send that then fails is not retried: a missed reminder is better
// than one delivered twice.
export async function sendPushOnce(key: string, userIds: string[], notification: PushNotification): Promise<boolean> {
  const { data: first, error } = await createAdminClient().rpc("claim_push_once", { key });
  if (error) throw new Error(error.message);
  if (!first) return false;

  await sendPush(userIds, notification);
  return true;
}
