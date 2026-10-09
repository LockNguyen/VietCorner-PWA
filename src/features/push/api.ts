import { createClient } from "@/lib/supabase/client";

// Push API: every call the browser makes for this feature.

// POST this device's push subscription. Through our API route, not straight to Supabase: on a phone someone
// else was signed in on, the row belongs to them, and only the server may hand the device over.
export async function savePushSubscription(subscription: PushSubscription) {
  const response = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription: subscription.toJSON() }),
  });
  if (!response.ok) throw new Error((await response.json()).error);
}

// DELETE this device's push subscription. Straight to Supabase: RLS lets a user remove only their own row.
export async function removePushSubscription(endpoint: string) {
  const { error } = await createClient().from("push_subscriptions").delete().eq("endpoint", endpoint);
  if (error) throw new Error(error.message);
}
