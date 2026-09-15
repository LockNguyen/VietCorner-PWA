"use client";

import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "../types";

type Props = { groupId: string; myUserId: string; initialMessages: Message[] };

// Shows messages live and sends new ones.
// Messages can arrive from 4 places: initial load, Realtime, refetch, and our own send response.
// All of them go through mergeMessages, which removes duplicates by id.
export default function ChatRoom({ groupId, myUserId, initialMessages }: Props) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Live updates: subscribe to new rows in this group's messages. RLS still decides what we receive.
  useEffect(() => {
    const supabase = createClient();
    let channel: RealtimeChannel | undefined;
    let cancelled = false;

    // Pull the newest messages from the database to fill any gap Realtime missed.
    async function loadLatest() {
      const { data } = await supabase.from("messages").select("*").eq("group_id", groupId)
        .order("created_at", { ascending: false }).limit(50);
      if (data) setMessages((prev) => mergeMessages(prev, data as Message[]));
    }

    async function connect() {
      // Wait until Realtime has the user's login token. Why: on a cold start (e.g. opening the app from
      // a notification) the token loads asynchronously. Subscribing first would join as an anonymous
      // user, and RLS would then silently hide every message.
      await supabase.realtime.setAuth();
      if (cancelled) return;

      channel = supabase
        .channel(`group-${groupId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `group_id=eq.${groupId}` },
          (payload) => setMessages((prev) => mergeMessages(prev, [payload.new as Message])),
        )
        .subscribe((status) => {
          // Fires on the first join and again after every reconnect. Realtime doesn't replay, so refetch.
          if (status === "SUBSCRIBED") loadLatest();
        });
    }

    // App came back to the foreground (phone woke, user switched back). The WebSocket may have died while
    // hidden, so refetch right away instead of waiting for it to reconnect.
    function onVisibilityChange() {
      if (document.visibilityState === "visible") loadLatest();
    }

    connect();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (channel) supabase.removeChannel(channel);
    };
  }, [groupId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, [messages]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    setError("");

    // Goes through our API (not straight to Supabase) because sending also triggers push notifications.
    try {
      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId, body }),
      });
      if (!response.ok) throw new Error((await response.json()).error);
      // Show our message right away, even if Realtime is slow or disconnected. Realtime's copy is merged as a duplicate.
      const message: Message = await response.json();
      setMessages((prev) => mergeMessages(prev, [message]));
    } catch (error) {
      // Covers server errors (401/403) and no network (fetch throws). Put the text back so nothing is lost.
      setError((error as Error).message);
      setDraft(body);
    }
  }

  return (
    <div className="p-4">
      <ul className="space-y-3">
        {messages.map((message) => {
          const mine = message.sender_id === myUserId;
          return (
            <li key={message.id} className={mine ? "text-right" : ""}>
              <div className="text-xs text-gray-500">{message.sender_email}</div>
              <div className={`inline-block rounded-lg px-3 py-2 text-lg ${mine ? "bg-blue-500 text-white" : "bg-gray-100"}`}>
                {message.body}
              </div>
            </li>
          );
        })}
      </ul>
      <div ref={bottomRef} />

      <form onSubmit={send} className="mt-4 flex gap-2">
        <input value={draft} onChange={(e) => setDraft(e.target.value)}
          className="flex-1 rounded border p-3 text-lg" placeholder="Message" />
        <button className="rounded bg-blue-500 px-4 text-lg text-white">Send</button>
      </form>
      {error && <p className="mt-2 text-red-600">{error}</p>}
    </div>
  );
}

// Adds messages we don't have yet (same id = same message) and keeps them in send order.
// Message ids come from an identity column, so a higher id means a later message.
function mergeMessages(current: Message[], incoming: Message[]) {
  const byId = new Map(current.map((message) => [message.id, message]));
  incoming.forEach((message) => byId.set(message.id, message));
  return [...byId.values()].sort((a, b) => a.id - b.id);
}
