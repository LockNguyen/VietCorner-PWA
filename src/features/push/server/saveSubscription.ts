import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Stores this device's push subscription under the signed-in user, taking it over from whoever had it.
//
// Why the server does it: a phone keeps its endpoint when someone else signs in on it. RLS (correctly)
// stops that person's browser from touching the previous owner's row, so the browser's own save failed
// with "Could not save" on every shared or re-used phone. `userId` comes from the verified session.
export async function saveSubscription(userId: string, subscription: { endpoint: string }) {
  const { error } = await createAdminClient()
    .from("push_subscriptions")
    .upsert({ endpoint: subscription.endpoint, user_id: userId, subscription });
  if (error) throw new Error(error.message);
}
