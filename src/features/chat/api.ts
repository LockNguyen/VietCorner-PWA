import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "./types";

// Chat API: every call the browser makes for the chat feature lives in this file.
// - Reads and simple writes go straight to Supabase. RLS in schema.sql decides what is allowed.
// - Sending a message goes through our API route, because it also sends push notifications (needs secrets).

// GET the newest 50 messages of a group, oldest first.
export async function getLatestMessages(groupId: string): Promise<Message[]> {
  const { data, error } = await createClient()
    .from("messages")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data as Message[]).reverse();
}

// POST a message. Returns the saved message, or throws the server's error (e.g. "Not signed in").
export async function sendMessage(groupId: string, body: string): Promise<Message> {
  const response = await fetch("/api/chat/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ groupId, body }),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error);
  return json;
}

// PUT this device's push subscription. Upsert keyed by endpoint, so there's one row per device.
export async function savePushSubscription(subscription: PushSubscription) {
  const { error } = await createClient()
    .from("push_subscriptions")
    .upsert({ endpoint: subscription.endpoint, subscription: subscription.toJSON() });
  if (error) throw new Error(error.message);
}

// LIVE stream of new messages in a group. Returns a function that stops listening.
// `onConnected` fires on the first join and again after every reconnect.
export function subscribeToNewMessages(
  groupId: string,
  handlers: { onMessage: (message: Message) => void; onConnected: () => void },
) {
  const supabase = createClient();
  let channel: RealtimeChannel | undefined;
  let stopped = false;

  // Wait for the login token before joining. Why: on a cold start (e.g. opening the app from a notification)
  // the token loads asynchronously. Joining without it means joining as anonymous, and RLS then silently
  // hides every message.
  supabase.realtime.setAuth().then(() => {
    if (stopped) return;
    channel = supabase
      .channel(`group-${groupId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `group_id=eq.${groupId}` },
        (payload) => handlers.onMessage(payload.new as Message),
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") handlers.onConnected();
      });
  });

  return () => {
    stopped = true;
    if (channel) supabase.removeChannel(channel);
  };
}
