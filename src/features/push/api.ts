import { createClient } from "@/lib/supabase/client";

// Push API: every call the browser makes for this feature. RLS in schema.sql decides what is allowed.

// PUT this device's push subscription. Upsert keyed by endpoint, so there's one row per device.
export async function savePushSubscription(subscription: PushSubscription) {
  const { error } = await createClient()
    .from("push_subscriptions")
    .upsert({ endpoint: subscription.endpoint, subscription: subscription.toJSON() });
  if (error) throw new Error(error.message);
}
